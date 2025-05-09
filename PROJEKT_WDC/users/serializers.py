from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from django_otp.plugins.otp_totp.models import TOTPDevice
import pyotp
import qrcode
import base64
from io import BytesIO

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class TwoFactorAuthSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)


class TwoFactorSetupSerializer(serializers.ModelSerializer):
    qr_code = serializers.SerializerMethodField()
    manual_code = serializers.SerializerMethodField()
    provisioning_uri = serializers.SerializerMethodField()  # Dodajemy to

    class Meta:
        model = User
        fields = ['qr_code', 'manual_code', 'provisioning_uri']

    def get_provisioning_uri(self, obj):
        device = TOTPDevice.objects.get(user=obj)
        return pyotp.totp.TOTP(device.key).provisioning_uri(
            name=obj.email,
            issuer_name="TwoFA App"
        )

    def get_manual_code(self, obj):
        device = TOTPDevice.objects.get(user=obj)
        return device.key

    def get_qr_code(self, obj):
        try:
            uri = self.get_provisioning_uri(obj)

            # Poprawione generowanie QR
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=8,
                border=2,
            )
            qr.add_data(uri)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            # Zwiększona jakość obrazu
            buffered = BytesIO()
            img.save(buffered, format="PNG", quality=100)
            img_str = base64.b64encode(buffered.getvalue()).decode()
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            print(f"Błąd generowania QR: {e}")
            return None