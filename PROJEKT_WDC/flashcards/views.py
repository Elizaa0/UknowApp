from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from .models import FlashcardSet, Flashcard
from .serializers import FlashcardSetSerializer, FlashcardSerializer, FlashcardStatusSerializer
from django.shortcuts import get_object_or_404
import PyPDF2
from docx import Document
import io
import re


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

    serializer = FlashcardStatusSerializer(
        flashcard,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )