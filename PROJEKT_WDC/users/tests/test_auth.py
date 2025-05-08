import pytest
from django.urls import reverse
from rest_framework import status
from users.models import User 

@pytest.mark.django_db
def test_user_registration(api_client, user_data):
    register_url = reverse('register')
    response = api_client.post(register_url, user_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert User._default_manager.count() == 1
    assert User._default_manager.first().username == 'testuser'

@pytest.mark.django_db
def test_user_login(api_client, create_user, user_data):
    create_user()
    login_url = reverse('token_obtain_pair')
    response = api_client.post(login_url, {
        'username': user_data['username'],
        'password': user_data['password']
    })
    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data
    assert 'refresh' in response.data

@pytest.mark.django_db
def test_get_current_user_authenticated(authenticated_client):
    me_url = reverse('current-user')
    response = authenticated_client.get(me_url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['username'] == 'testuser'

@pytest.mark.django_db
def test_get_current_user_unauthenticated(api_client):
    me_url = reverse('current-user')
    response = api_client.get(me_url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED