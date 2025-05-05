from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class PasswordValidator:
    def validate(self, password, user=None):
        if not any(c.isupper() for c in password):
            raise ValidationError(_("Hasło musi zawierać co najmniej jedną wielką literę."), code='password_no_upper')

        if not any(c.isdigit() for c in password):
            raise ValidationError(_("Hasło musi zawierać co najmniej jedną cyfrę."), code='password_no_digit')

        special_characters = "!@#$%^&*()_+-=[]{}|;:'\",.<>?/\\`~"
        if not any(c in special_characters for c in password):
            raise ValidationError(_("Hasło musi zawierać znak specjalny."), code='password_no_special')

    def get_help_text(self):
        return _("Hasło musi zawierać co najmniej jedną wielką literę, cyfrę oraz znak specjalny.")
