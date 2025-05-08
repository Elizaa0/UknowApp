from rest_framework import generics, permissions
from .models import FlashcardSet, Flashcard
from .serializers import FlashcardSetSerializer, FlashcardSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response


# Zestawy fiszek
class FlashcardSetListCreateView(generics.ListCreateAPIView):
    queryset = FlashcardSet.objects.all()
    serializer_class = FlashcardSetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        return self.queryset.filter(owner=self.request.user)


class FlashcardSetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FlashcardSet.objects.all()
    serializer_class = FlashcardSetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(owner=self.request.user)


# Fiszki
class FlashcardListCreateView(generics.ListCreateAPIView):
    queryset = Flashcard.objects.all()
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(flashcard_set__owner=self.request.user)


class FlashcardDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Flashcard.objects.all()
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(flashcard_set__owner=self.request.user)
class FlashcardsBySetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, set_id):
        cards = Flashcard.objects.filter(flashcard_set__id=set_id, flashcard_set__owner=request.user)
        serializer = FlashcardSerializer(cards, many=True)
        return Response(serializer.data)