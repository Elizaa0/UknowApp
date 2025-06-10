from rest_framework import serializers
from .models import Flashcard, FlashcardSet, Category, Tag
import re


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'color']


class FlashcardStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ['id', 'status', 'due_date']
        read_only_fields = ['id']


class FlashcardSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, required=False, read_only=True)
    category = CategorySerializer(required=False, read_only=True)
    tags_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        source='tags',
        write_only=True,
        required=False
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )

    class Meta:
        model = Flashcard
        fields = '__all__'
        extra_kwargs = {
            'flashcard_set': {'write_only': True, 'required': False}
        }

    def validate(self, data):
        if len(data.get('question', '').strip()) < 2:
            raise serializers.ValidationError({
                'question': 'Pytanie musi mieć minimum 2 znaki'
            })

        if len(data.get('answer', '').strip()) < 2:
            raise serializers.ValidationError({
                'answer': 'Odpowiedź musi mieć minimum 2 znaki'
            })

        return data

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        category_data = validated_data.pop('category', None)

        flashcard = Flashcard.objects.create(**validated_data)

        for tag_data in tags_data:
            tag, _ = Tag.objects.get_or_create(**tag_data)
            flashcard.tags.add(tag)

        return flashcard


class FlashcardSetSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, required=False)
    flashcards = FlashcardSerializer(many=True, read_only=True)

    class Meta:
        model = FlashcardSet
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'owner')

    def validate_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "Nazwa zestawu musi mieć minimum 3 znaki"
            )
        return value

def merge_pdf_lines(text):
    # Łącz linie, aż napotkasz pustą linię lub numer pytania
    lines = [line.strip() for line in text.split('\n')]
    merged = []
    buffer = []
    for line in lines:
        if not line or line.strip().isdigit() or re.match(r'^\\d+\\.', line.strip()):
            if buffer:
                merged.append(' '.join(buffer).strip())
                buffer = []
            if line.strip():
                merged.append(line.strip())
        else:
            buffer.append(line)
    if buffer:
        merged.append(' '.join(buffer).strip())
    return '\n'.join(merged)

def universal_flashcard_parser(text):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    flashcards = []
    question = None
    answer_lines = []

    for line in lines:
        # 1. Numerowane pytania
        match_num = re.match(r'^\\d+\\.?\\s*(.+\\?)$', line)
        if match_num:
            if question and answer_lines:
                flashcards.append({
                    'question': question,
                    'answer': ' '.join(answer_lines).strip()
                })
            question = match_num.group(1).strip()
            answer_lines = []
            continue

        # 2. Pytanie z dwukropkiem
        match_colon = re.match(r'^(.*\\?)\\s*[:：]\\s*(.+)$', line)
        if match_colon:
            if question and answer_lines:
                flashcards.append({
                    'question': question,
                    'answer': ' '.join(answer_lines).strip()
                })
            question = match_colon.group(1).strip()
            answer_lines = [match_colon.group(2).strip()]
            continue

        # 3. Pytanie z Answer:
        match_answer = re.match(r'^(.*\\?)\\s*Answer[:：]?\\s*(.+)$', line, re.IGNORECASE)
        if match_answer:
            if question and answer_lines:
                flashcards.append({
                    'question': question,
                    'answer': ' '.join(answer_lines).strip()
                })
            question = match_answer.group(1).strip()
            answer_lines = [match_answer.group(2).strip()]
            continue

        # 4. Linia z pytajnikiem (nowe pytanie)
        if '?' in line and len(line) < 120:
            if question and answer_lines:
                flashcards.append({
                    'question': question,
                    'answer': ' '.join(answer_lines).strip()
                })
            question = line
            answer_lines = []
            continue

        # 5. Domyślnie: linia to część odpowiedzi
        if question:
            answer_lines.append(line)

    # Dodaj ostatnią fiszkę
    if question and answer_lines:
        flashcards.append({
            'question': question,
            'answer': ' '.join(answer_lines).strip()
        })

    return flashcards