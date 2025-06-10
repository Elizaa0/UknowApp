from django.contrib.auth.hashers import Argon2PasswordHasher

class LessMemoryArgon2(Argon2PasswordHasher):
    time_cost = 1
    memory_cost = 7000