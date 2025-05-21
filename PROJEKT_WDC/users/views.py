import base64
from datetime import timedelta
from io import BytesIO

import pyotp
import pytz
import qrcode
from django.contrib.auth import get_user_model
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework import generics
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import TwoFactorAuthSerializer
from .serializers import UserRegisterSerializer, UserSerializer

from django.utils import timezone
from django.utils.timezone import localtime

warsaw_tz = pytz.timezone('Europe/Warsaw')

User = get_user_model()

class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        user = User.objects.filter(username=username).first()

        if user and user.is_locked_out():
            return Response({
                'detail': f'Konto zablokowane do {localtime(user.lockout_until).strftime("%Y-%m-%d %H:%M:%S")}'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            if user:
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= 5:
                    user.lockout_until = timezone.now() + timedelta(minutes=30)
                user.save()
            return Response({'detail': 'Nieprawidłowe dane logowania.'}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.user
        user.reset_failed_attempts()

        refresh = RefreshToken.for_user(user)

        response_data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }

        requires_2fa = user.is_2fa_enabled
        requires_setup = not TOTPDevice.objects.filter(user=user, confirmed=True).exists()

        if requires_2fa or requires_setup:
            response_data.update({
                'requires_2fa_verification': requires_2fa,
                'requires_2fa_setup': requires_setup,
                'temp_token': str(refresh.access_token)
            })
            return Response(response_data, status=status.HTTP_202_ACCEPTED)

        return Response(response_data, status=status.HTTP_200_OK)

class TwoFactorStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'is_2fa_enabled': request.user.is_2fa_enabled
        })

class TwoFactorSetupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            device, created = TOTPDevice.objects.get_or_create(
                user=request.user,
                defaults={'name': 'default', 'confirmed': False}
            )

            if created or not device.key:
                device.key = pyotp.random_base32()
                device.save()

            totp = pyotp.TOTP(device.key)
            uri = totp.provisioning_uri(
                name=request.user.email,
                issuer_name="TwoFA App"
            )

            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(uri)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()

            return Response({
                'qr_code': f"data:image/png;base64,{img_str}",
                'manual_code': device.key,
                'email': request.user.email
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TwoFactorVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TwoFactorAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            device = TOTPDevice.objects.get(user=request.user)
            totp = pyotp.TOTP(device.key)

            if not totp.verify(serializer.validated_data['code'], valid_window=1):
                return Response(
                    {"error": "Nieprawidłowy kod weryfikacyjny"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            refresh = RefreshToken.for_user(request.user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            })

        except TOTPDevice.DoesNotExist:
            return Response(
                {"error": "Urządzenie 2FA nie skonfigurowane"},
                status=status.HTTP_400_BAD_REQUEST
            )
class TwoFactorResendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            device = TOTPDevice.objects.get(user=request.user)
            return Response({"status": "New code sent"})
        except TOTPDevice.DoesNotExist:
            return Response(
                {"error": "2FA not configured"},
                status=status.HTTP_400_BAD_REQUEST
            )