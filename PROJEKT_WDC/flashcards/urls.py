from django.urls import path
from .views import (
    FlashcardSetListCreateView,
    FlashcardSetDetailView,
    FlashcardListCreateView,
    FlashcardDetailView,
    FlashcardsBySetView,
    update_flashcard_status,
    public_flashcard_set
)

urlpatterns = [
    path('sets/', FlashcardSetListCreateView.as_view(), name='flashcardset-list'),
    path('sets/<int:pk>/', FlashcardSetDetailView.as_view(), name='flashcardset-detail'),
    path('', FlashcardListCreateView.as_view(), name='flashcard-list'),
    path('<int:pk>/', FlashcardDetailView.as_view(), name='flashcard-detail'),
    path('sets/<int:set_id>/cards/', FlashcardsBySetView.as_view(), name='flashcards-by-set'),
    path('<int:pk>/update-status/', update_flashcard_status, name='update-flashcard-status'),
    path('<int:pk>/status/', update_flashcard_status, name='update-flashcard-status-alt'),
    path('share/<uuid:uuid>/', public_flashcard_set, name='public-flashcard-set'),
]
