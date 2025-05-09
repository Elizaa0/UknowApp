from django.urls import path
from .views import UserRegisterView, CurrentUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import TwoFactorSetupView, TwoFactorVerifyView, CustomTokenObtainPairView, TwoFactorResendView


urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='2fa-setup'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa-verify'),
    path('2fa/resend/', TwoFactorResendView.as_view(), name='2fa-resend'),

]
