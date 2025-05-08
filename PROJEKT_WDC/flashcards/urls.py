from django.urls import path
from .views import (
    FlashcardSetListCreateView,
    FlashcardSetDetailView,
    FlashcardListCreateView,
    FlashcardDetailView,
    FlashcardsBySetView
)

urlpatterns = [
    path('sets/', FlashcardSetListCreateView.as_view(), name='flashcard-set-list'),
    path('sets/<int:pk>/', FlashcardSetDetailView.as_view(), name='flashcard-set-detail'),

    path('flashcards/', FlashcardListCreateView.as_view(), name='flashcard-list'),
    path('flashcards/<int:pk>/', FlashcardDetailView.as_view(), name='flashcard-detail'),
    path('sets/<int:set_id>/cards/', FlashcardsBySetView.as_view(), name='flashcards-by-set'),

]
