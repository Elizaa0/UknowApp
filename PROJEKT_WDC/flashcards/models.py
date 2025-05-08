from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class FlashcardSet(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcard_sets')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} ({self.owner.username})'


class Flashcard(models.Model):
    question = models.TextField()
    answer = models.TextField()
    flashcard_set = models.ForeignKey(FlashcardSet, on_delete=models.CASCADE, related_name='flashcards')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Q: {self.question[:30]}...'
