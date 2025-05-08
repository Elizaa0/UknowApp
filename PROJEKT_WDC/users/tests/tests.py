from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken


class UserAuthTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.register_url = reverse('register')
        cls.login_url = reverse('token_obtain_pair')
        cls.me_url = reverse('current-user')
        cls.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPassword123!'
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.first().username, 'testuser')

    def test_user_login(self):
        # Najpierw tworzymy użytkownika
        User.objects.create_user(**self.user_data)

        # Test logowania
        response = self.client.post(self.login_url, {
            'username': self.user_data['username'],
            'password': self.user_data['password']
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_get_current_user_authenticated(self):
        # Tworzenie i logowanie użytkownika
        user = User.objects.create_user(**self.user_data)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Ustawienie nagłówka autoryzacji
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # Test endpointu /me/
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_get_current_user_unauthenticated(self):
        # Test bez autentykacji
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)