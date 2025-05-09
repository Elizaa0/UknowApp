from rest_framework import generics
from .serializers import UserRegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_otp.plugins.otp_totp.models import TOTPDevice
from .serializers import TwoFactorAuthSerializer, TwoFactorSetupSerializer
import pyotp
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_otp.plugins.otp_totp.models import TOTPDevice
import qrcode
import base64
from io import BytesIO


User = get_user_model()

class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class TwoFactorSetupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        secret = request.user.setup_2fa()
        serializer = TwoFactorSetupSerializer(request.user)
        return Response(serializer.data)


class TwoFactorVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TwoFactorAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        device = TOTPDevice.objects.get(user=request.user)
        totp = pyotp.TOTP(device.key)

        if totp.verify(serializer.validated_data['code']):
            device.confirmed = True
            device.save()
            request.user.is_2fa_enabled = True
            request.user.save()

            # Zwróć dodatkowy token do weryfikacji 2FA
            return Response({"status": "2FA verified"}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            user = User.objects.get(username=request.data.get('username'))
            requires_2fa = user.is_2fa_enabled
            requires_setup = not TOTPDevice.objects.filter(user=user, confirmed=True).exists()

            if requires_2fa or requires_setup:
                response.data.update({
                    'requires_2fa_verification': requires_2fa,
                    'requires_2fa_setup': requires_setup,
                    'temp_token': response.data['access']  # Tymczasowy token
                })
                response.status_code = 202  # Accepted

        return response

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
            # Sprawdź czy użytkownik już ma skonfigurowane 2FA
            device, created = TOTPDevice.objects.get_or_create(
                user=request.user,
                defaults={'name': 'default', 'confirmed': False}
            )

            if created or not device.key:
                device.key = pyotp.random_base32()
                device.save()

            # Generuj URI dla Authenticatora
            totp = pyotp.TOTP(device.key)
            uri = totp.provisioning_uri(
                name=request.user.email,
                issuer_name="TwoFA App"
            )

            # Generuj QR code
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

            # Generuj nowy token JWT
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
            # Tutaj dodaj kod do wysłania nowego kodu (email/SMS)
            return Response({"status": "New code sent"})
        except TOTPDevice.DoesNotExist:
            return Response(
                {"error": "2FA not configured"},
                status=status.HTTP_400_BAD_REQUEST
            )