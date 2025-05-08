from rest_framework import serializers
from .models import Flashcard, FlashcardSet, Category, Tag


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
    # Dodaj pola do zapisu ID zamiast pełnych obiektów
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
        if len(data.get('question', '').strip()) < 5:
            raise serializers.ValidationError({
                'question': 'Pytanie musi mieć minimum 5 znaków'
            })

        if len(data.get('answer', '').strip()) < 3:
            raise serializers.ValidationError({
                'answer': 'Odpowiedź musi mieć minimum 3 znaki'
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