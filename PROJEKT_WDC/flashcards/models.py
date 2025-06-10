from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinLengthValidator
import uuid

User = get_user_model()


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#6c757d')

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
    share_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
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
        validators=[MinLengthValidator(2, "Pytanie musi mieć co najmniej 2 znaki")]
    )
    answer = models.TextField(
        validators=[MinLengthValidator(2, "Odpowiedź musi mieć co najmniej 2 znaki")]
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

    # SM-2 Algorithm fields
    repetitions = models.IntegerField(default=0)  # Number of successful repetitions
    easiness = models.FloatField(default=2.5)  # Easiness factor
    interval = models.IntegerField(default=1)  # Current interval in days

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

    def update_sm2(self, quality):
        """
        Update flashcard using SM-2 algorithm
        quality: 0-5 rating of how well the user remembered the answer
        """
        from datetime import datetime, timedelta

        # Update easiness factor
        self.easiness = max(1.3, self.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

        # Update repetitions and interval
        if quality >= 3:  # Successful recall
            if self.repetitions == 0:
                self.interval = 1
            elif self.repetitions == 1:
                self.interval = 6
            else:
                self.interval = round(self.interval * self.easiness)
            self.repetitions += 1
            self.status = 'learning'
        else:  # Failed recall
            self.repetitions = 0
            self.interval = 1
            self.status = 'learning'

        # Update review dates
        self.last_reviewed = datetime.now()
        self.next_review = self.last_reviewed + timedelta(days=self.interval)

        # Update due date
        self.due_date = self.next_review

        # If interval is very long, mark as mastered
        if self.interval > 30:
            self.status = 'mastered'
            self.due_date = None

        self.save()

    def save(self, *args, **kwargs):
        if self.status == 'mastered' and self.due_date is not None:
            self.due_date = None
        elif self.status == 'learning' and self.due_date is None:
            from datetime import datetime, timedelta
            self.due_date = datetime.now() + timedelta(days=1)
        super().save(*args, **kwargs)