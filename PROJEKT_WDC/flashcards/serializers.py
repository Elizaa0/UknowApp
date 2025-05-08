from rest_framework import serializers
from .models import FlashcardSet, Flashcard

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ['id', 'question', 'answer', 'flashcard_set', 'created_at']
        read_only_fields = ['id', 'created_at']


class FlashcardSetSerializer(serializers.ModelSerializer):
    flashcards = FlashcardSerializer(many=True, read_only=True)

    class Meta:
        model = FlashcardSet
        fields = ['id', 'name', 'description', 'owner', 'created_at', 'flashcards']
        read_only_fields = ['id', 'created_at', 'owner']
