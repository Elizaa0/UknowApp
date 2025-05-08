import os
import django
import pytest

# Konfiguracja Django - musi być przed importami modeli
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoProject1.settings')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User

# Fixtures dla testów
@pytest.fixture
def user_data():
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'StrongPassword123!'
    }

@pytest.fixture
def create_user(user_data):
    def make_user(**kwargs):
        data = user_data.copy()
        data.update(kwargs)
        return User.objects.create_user(**data)
    return make_user

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def authenticated_client(api_client, create_user):
    user = create_user()
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client