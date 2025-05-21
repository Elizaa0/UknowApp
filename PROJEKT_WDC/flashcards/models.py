from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinLengthValidator

User = get_user_model()


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#6c757d')  # Kod koloru HEX

    class Meta:
        verbose_name_plural = "categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=30, unique=True)

    def __str__(self):
        return f'#{self.name}'


class FlashcardSet(models.Model):
    name = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(3, "Nazwa musi mieć co najmniej 3 znaki")]
    )
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='flashcard_sets'
    )
    categories = models.ManyToManyField(
        Category,
        related_name='flashcard_sets',
        blank=True
    )
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ['name', 'owner']

    def __str__(self):
        return f'{self.name} ({self.owner.username})'


class Flashcard(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Łatwy'),
        ('medium', 'Średni'),
        ('hard', 'Trudny'),
    ]

    STATUS_CHOICES = [
        ('learning', 'W trakcie nauki'),
        ('mastered', 'Opanowane'),
        ('new', 'Nowa'),
    ]

    question = models.TextField(
        validators=[MinLengthValidator(10, "Pytanie musi mieć co najmniej 10 znaków")]
    )
    answer = models.TextField(
        validators=[MinLengthValidator(5, "Odpowiedź musi mieć co najmniej 5 znaków")]
    )
    flashcard_set = models.ForeignKey(
        FlashcardSet,
        on_delete=models.CASCADE,
        related_name='flashcards'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    difficulty = models.CharField(
        max_length=6,
        choices=DIFFICULTY_CHOICES,
        default='medium'
    )
    status = models.CharField(
        max_length=8,
        choices=STATUS_CHOICES,
        default='new'
    )
    due_date = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(
        Tag,
        related_name='flashcards',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_reviewed = models.DateTimeField(null=True, blank=True)
    next_review = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['difficulty']),
            models.Index(fields=['last_reviewed']),
            models.Index(fields=['status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f'Q: {self.question[:30]}... (A: {self.answer[:30]}...)'

    def save(self, *args, **kwargs):
        if self.status == 'mastered' and self.due_date is not None:
            self.due_date = None
        elif self.status == 'learning' and self.due_date is None:
            from datetime import datetime, timedelta
            self.due_date = datetime.now() + timedelta(days=1)
        super().save(*args, **kwargs)