from django.db import models
from django.contrib.auth.models import AbstractUser
from django_otp.plugins.otp_totp.models import TOTPDevice

class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_2fa_enabled = models.BooleanField(default=True)
    otp_secret = models.CharField(max_length=32, blank=True)

    def setup_2fa(self):
        if not self.otp_secret:
            device, created = TOTPDevice.objects.get_or_create(
                user=self,
                defaults={'name': 'default', 'confirmed': False}
            )
            self.otp_secret = device.key
            self.save()
        return self.otp_secret