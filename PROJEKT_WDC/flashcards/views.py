from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from .models import FlashcardSet, Flashcard, Category
from .serializers import FlashcardSetSerializer, FlashcardSerializer, FlashcardStatusSerializer
from django.shortcuts import get_object_or_404
import PyPDF2
from docx import Document
import io
import re
from rest_framework.views import APIView
import uuid


# Twoje istniejące klasy views pozostają bez zmian
class FlashcardSetListCreateView(generics.ListCreateAPIView):
    serializer_class = FlashcardSetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FlashcardSet.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class FlashcardSetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FlashcardSetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FlashcardSet.objects.filter(owner=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset, pk=self.kwargs['pk'])
        return obj


class FlashcardListCreateView(generics.ListCreateAPIView):
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Flashcard.objects.filter(flashcard_set__owner=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        flashcard_set_id = serializer.validated_data.get('flashcard_set').id
        if not FlashcardSet.objects.filter(id=flashcard_set_id, owner=request.user).exists():
            return Response(
                {"detail": "Nie masz uprawnień do dodawania fiszek do tego zestawu."},
                status=status.HTTP_403_FORBIDDEN
            )

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class FlashcardDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Flashcard.objects.filter(flashcard_set__owner=self.request.user)

    def get_object(self):
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset, pk=self.kwargs['pk'])
        return obj


class FlashcardsBySetView(generics.ListCreateAPIView):
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        set_id = self.kwargs['set_id']
        return Flashcard.objects.filter(
            flashcard_set_id=set_id,
            flashcard_set__owner=self.request.user
        )

    def perform_create(self, serializer):
        set_id = self.kwargs['set_id']
        flashcard_set = get_object_or_404(
            FlashcardSet,
            id=set_id,
            owner=self.request.user
        )
        serializer.save(flashcard_set=flashcard_set)

    def create(self, request, *args, **kwargs):
        try:
            flashcard_set = FlashcardSet.objects.get(
                id=self.kwargs['set_id'],
                owner=request.user
            )
        except FlashcardSet.DoesNotExist:
            return Response(
                {"detail": "Zestaw nie istnieje lub nie masz do niego dostępu."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_flashcard_status(request, pk):
    try:
        flashcard = Flashcard.objects.get(
            pk=pk,
            flashcard_set__owner=request.user
        )
    except Flashcard.DoesNotExist:
        return Response(
            {'message': 'Fiszka nie znaleziona'},
            status=status.HTTP_404_NOT_FOUND
        )

    quality = request.data.get('quality')
    if quality is not None:
        try:
            quality = int(quality)
            flashcard.update_sm2(quality)
        except Exception as e:
            return Response({'message': f'Błąd podczas aktualizacji SM-2: {str(e)}'}, status=400)

    serializer = FlashcardStatusSerializer(flashcard)
    return Response(serializer.data)


# Funkcje pomocnicze do ekstrakcji tekstu
def extract_text_from_pdf(file):
    """Ekstraktuje tekst z pliku PDF"""
    try:
        # Zapisz zawartość pliku do bufora
        file_content = file.read()
        print(f"Rozmiar pliku PDF: {len(file_content)} bajtów")

        # Utwórz bufor z zawartością pliku
        pdf_buffer = io.BytesIO(file_content)

        # Wczytaj PDF
        pdf_reader = PyPDF2.PdfReader(pdf_buffer)
        print(f"Liczba stron w PDF: {len(pdf_reader.pages)}")

        # Ekstraktuj tekst ze wszystkich stron
        text = ""
        for i, page in enumerate(pdf_reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    print(f"Strona {i + 1}, długość tekstu: {len(page_text)} znaków")
                    text += page_text + "\n"
                else:
                    print(f"Strona {i + 1}: Brak tekstu")
            except Exception as page_error:
                print(f"Błąd podczas przetwarzania strony {i + 1}: {str(page_error)}")
                continue

        # Wyświetl przykładowy fragment tekstu
        print("\nPrzykładowy fragment tekstu z PDF:")
        print("-" * 50)
        print(text[:500])
        print("-" * 50)

        # Jeśli nie udało się wyekstraktować tekstu, spróbuj innej metody
        if not text.strip():
            print("Próba alternatywnej metody ekstrakcji tekstu...")
            text = ""
            for i, page in enumerate(pdf_reader.pages):
                try:
                    # Próba pobrania tekstu z obiektu strony
                    page_text = page.get_text()
                    if page_text:
                        print(f"Strona {i + 1} (metoda alternatywna), długość tekstu: {len(page_text)} znaków")
                        text += page_text + "\n"
                except Exception as page_error:
                    print(f"Błąd podczas alternatywnego przetwarzania strony {i + 1}: {str(page_error)}")
                    continue

        if not text.strip():
            raise Exception("Nie udało się wyekstraktować tekstu z pliku PDF")

        return text.strip()
    except Exception as e:
        print(f"Błąd podczas czytania PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Błąd podczas czytania PDF: {str(e)}")


def extract_text_from_docx(file):
    """Ekstraktuje tekst z pliku DOCX"""
    try:
        doc = Document(io.BytesIO(file.read()))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Błąd podczas czytania DOCX: {str(e)}")


def universal_flashcard_parser(text):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    flashcards = []
    question_lines = []
    answer_lines = []
    in_question = False

    for line in lines:
        # Nowe pytanie zaczyna się od numeru
        match = re.match(r'^\d+\.?\s*(.*)', line)
        if match:
            # Zapisz poprzednią fiszkę
            if question_lines and answer_lines:
                question = ' '.join(question_lines).strip()
                answer = ' '.join(answer_lines).strip()
                flashcards.append({'question': question, 'answer': answer})
            # Rozpocznij nowe pytanie
            question_lines = [match.group(1)]
            answer_lines = []
            in_question = True
        elif in_question:
            # Jeśli pytanie nie skończyło się znakiem zapytania, kontynuuj zbieranie pytania
            question_lines.append(line)
            if '?' in line:
                in_question = False
        else:
            # Zbieraj odpowiedź
            answer_lines.append(line)

    # Dodaj ostatnią fiszkę
    if question_lines and answer_lines:
        question = ' '.join(question_lines).strip()
        answer = ' '.join(answer_lines).strip()
        flashcards.append({'question': question, 'answer': answer})

    return flashcards


def generate_flashcards_from_text(text):
    print("\n=== ROZPOCZYNAM GENEROWANIE FISZEK (UNIWERSALNY PARSER) ===")
    print("Otrzymany tekst:")
    print("-" * 50)
    print(text)
    print("-" * 50)
    flashcards = universal_flashcard_parser(text)
    print(f"\nWygenerowano {len(flashcards)} fiszek")
    if flashcards:
        print("\nPrzykładowe wygenerowane fiszki:")
        for i, card in enumerate(flashcards[:3], 1):
            print(f"\nFiszka {i}:")
            print(f"Pytanie: {card['question']}")
            print(f"Odpowiedź: {card['answer']}")
    if not flashcards:
        print("UWAGA: Nie wygenerowano żadnych fiszek!")
        print("Sprawdź format tekstu wejściowego.")
    return flashcards


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def generate_flashcards_from_file(request):
    """Generuje fiszki z przesłanego pliku"""
    try:
        print("\n=== ROZPOCZYNAM PRZETWARZANIE PLIKU ===")
        print(f"Request FILES: {list(request.FILES.keys())}")
        print(f"Request method: {request.method}")
        print(f"Request headers: {request.headers}")

        if 'file' not in request.FILES:
            print("Błąd: Brak pliku w żądaniu")
            return Response(
                {'error': 'Nie przesłano pliku'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']
        file_type = file.name.split('.')[-1].lower()
        print(f"Typ pliku: {file_type}, Nazwa pliku: {file.name}")

        # Ekstraktuj tekst z pliku
        try:
            if file_type == 'txt':
                content = file.read().decode('utf-8')
                print(f"Wczytano plik TXT, długość: {len(content)} znaków")
                print("Zawartość pliku:")
                print("-" * 50)
                print(content)
                print("-" * 50)
            elif file_type == 'pdf':
                content = extract_text_from_pdf(file)
                print(f"Wczytano plik PDF, długość: {len(content)} znaków")
                print("Zawartość pliku:")
                print("-" * 50)
                print(content)
                print("-" * 50)
            elif file_type == 'docx':
                content = extract_text_from_docx(file)
                print(f"Wczytano plik DOCX, długość: {len(content)} znaków")
            else:
                print(f"Błąd: Nieobsługiwany typ pliku: {file_type}")
                return Response(
                    {'error': 'Nieobsługiwany typ pliku. Obsługiwane formaty: TXT, PDF, DOCX'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            print(f"Błąd podczas ekstrakcji tekstu: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Błąd podczas odczytu pliku: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not content.strip():
            print("Błąd: Plik jest pusty lub nie udało się wyekstraktować tekstu")
            return Response(
                {'error': 'Plik jest pusty lub nie udało się wyekstraktować tekstu'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generuj fiszki z tekstu
        try:
            flashcards = generate_flashcards_from_text(content)
            print(f"\nWygenerowano {len(flashcards)} fiszek")

            if not flashcards:
                print("Błąd: Nie wygenerowano żadnych fiszek")
                return Response(
                    {'error': 'Nie udało się wygenerować fiszek z tego tekstu'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Pobierz kategorię i trudność z requesta
            req_category = request.data.get('category') or request.POST.get('category')
            req_difficulty = request.data.get('difficulty') or request.POST.get('difficulty')
            if not req_category or req_category.strip() == '':
                req_category = 'Bez kategorii'
            if not req_difficulty or req_difficulty.strip() == '':
                req_difficulty = 'medium'
            # Pobierz lub utwórz obiekt Category
            category_obj, _ = Category.objects.get_or_create(name=req_category)

            # Zapisz fiszki do wybranego zestawu, jeśli podano flashcard_set_id
            flashcard_set_id = request.data.get('flashcard_set_id') or request.POST.get('flashcard_set_id')
            created_flashcards = []
            if flashcard_set_id:
                try:
                    flashcard_set = FlashcardSet.objects.get(id=flashcard_set_id, owner=request.user)
                    for card in flashcards:
                        flashcard = Flashcard.objects.create(
                            flashcard_set=flashcard_set,
                            question=card['question'],
                            answer=card['answer'],
                            status='new',
                            category=category_obj,
                            difficulty=req_difficulty
                        )
                        created_flashcards.append({
                            'id': flashcard.id,
                            'question': flashcard.question,
                            'answer': flashcard.answer,
                            'status': flashcard.status,
                            'category': flashcard.category.name if flashcard.category else None,
                            'difficulty': flashcard.difficulty
                        })
                    print(f"Zapisano {len(created_flashcards)} fiszek w zestawie {flashcard_set_id}")
                except FlashcardSet.DoesNotExist:
                    print("Nie znaleziono zestawu fiszek do zapisu!")
                    return Response({'error': 'Nie znaleziono zestawu fiszek do zapisu!'}, status=404)
            else:
                # Jeśli nie podano zestawu, zwróć tylko wygenerowane fiszki (bez id)
                for card in flashcards:
                    card['category'] = req_category
                    card['difficulty'] = req_difficulty
                created_flashcards = flashcards

            return Response({'flashcards': created_flashcards})
        except Exception as e:
            print(f"Błąd podczas generowania fiszek: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Błąd podczas generowania fiszek: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        print(f"Nieoczekiwany błąd: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Błąd podczas przetwarzania pliku: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def generate_flashcards_from_text_endpoint(request):
    """Generuje fiszki z tekstu przesłanego w JSON"""
    try:
        # Debug
        print(f"generate_flashcards_from_text_endpoint called with method: {request.method}")

        if request.method == 'GET':
            return Response({'message': 'Endpoint działa! Użyj POST z content w body.'})

        content = request.data.get('content', '').strip()
        flashcard_set_id = request.data.get('flashcard_set_id')
        req_category = request.data.get('category')
        req_difficulty = request.data.get('difficulty')
        if not req_category or req_category.strip() == '':
            req_category = 'Bez kategorii'
        if not req_difficulty or req_difficulty.strip() == '':
            req_difficulty = 'medium'
        print(f"Received content length: {len(content)} characters")
        print(f"Flashcard set ID: {flashcard_set_id}")

        if not content:
            return Response(
                {'error': 'Nie podano tekstu do przetworzenia'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not flashcard_set_id:
            return Response(
                {'error': 'Nie podano ID zestawu fiszek'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            flashcard_set = FlashcardSet.objects.get(id=flashcard_set_id, owner=request.user)
        except FlashcardSet.DoesNotExist:
            return Response(
                {'error': 'Zestaw fiszek nie istnieje lub nie masz do niego dostępu'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generuj fiszki z tekstu
        flashcards = generate_flashcards_from_text(content)

        if not flashcards:
            return Response(
                {'error': 'Nie udało się wygenerować fiszek z tego tekstu'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Zapisz fiszki w bazie danych
        created_flashcards = []
        for card in flashcards:
            flashcard = Flashcard.objects.create(
                flashcard_set=flashcard_set,
                question=card['question'],
                answer=card['answer'],
                status='new',
                category=category_obj,
                difficulty=req_difficulty
            )
            created_flashcards.append({
                'id': flashcard.id,
                'question': flashcard.question,
                'answer': flashcard.answer,
                'status': flashcard.status,
                'category': flashcard.category.name if flashcard.category else None,
                'difficulty': flashcard.difficulty
            })

        print(f"Generated and saved {len(created_flashcards)} flashcards")

        return Response({
            'flashcards': created_flashcards,
            'message': f'Wygenerowano i zapisano {len(created_flashcards)} fiszek'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error in generate_flashcards_from_text_endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Błąd podczas przetwarzania tekstu: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def public_flashcard_set(request, uuid):
    try:
        flashcard_set = FlashcardSet.objects.get(share_uuid=uuid)
    except FlashcardSet.DoesNotExist:
        return Response({'detail': 'Zestaw nie istnieje.'}, status=404)
    serializer = FlashcardSetSerializer(flashcard_set)
    return Response(serializer.data)


class PDFExtractView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, format=None):
        pdf_file = request.FILES.get('file')
        if not pdf_file:
            return Response({'error': 'Nie przesłano pliku PDF.'}, status=400)
        try:
            text = extract_text_from_pdf(pdf_file)
            return Response({'text': text})
        except Exception as e:
            return Response({'error': f'Błąd podczas ekstrakcji tekstu: {str(e)}'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_share_link(request, setId):
    try:
        flashcard_set = FlashcardSet.objects.get(id=setId, owner=request.user)
        # Generate a new UUID if it doesn't exist
        if not flashcard_set.share_uuid:
            flashcard_set.share_uuid = uuid.uuid4()
            flashcard_set.save()

        share_link = f"http://localhost:3000/public/{flashcard_set.share_uuid}"
        return Response({
            'share_link': share_link,
            'share_uuid': str(flashcard_set.share_uuid)
        })
    except FlashcardSet.DoesNotExist:
        return Response(
            {'detail': 'Zestaw nie istnieje lub nie masz do niego dostępu.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )