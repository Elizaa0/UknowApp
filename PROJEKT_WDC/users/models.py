from django.db import models
from django.contrib.auth.models import AbstractUser
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.utils import timezone


class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_2fa_enabled = models.BooleanField(default=True)
    otp_secret = models.CharField(max_length=32, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    lockout_until = models.DateTimeField(null=True, blank=True)

    def setup_2fa(self):
        if not self.otp_secret:
            device, created = TOTPDevice.objects.get_or_create(
                user=self,
                defaults={'name': 'default', 'confirmed': False}
            )
            self.otp_secret = device.key
            self.save()
        return self.otp_secret

    def is_locked_out(self):
        return self.lockout_until and self.lockout_until > timezone.now()

    def reset_failed_attempts(self):
        self.failed_login_attempts = 0
        self.lockout_until = None
        self.save()