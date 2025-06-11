from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('description', models.TextField(blank=True)),
                ('color', models.CharField(default='#6c757d', max_length=7)),
            ],
            options={
                'verbose_name_plural': 'categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=30, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='FlashcardSet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, validators=[django.core.validators.MinLengthValidator(3, 'Nazwa musi mieć co najmniej 3 znaki')])),
                ('description', models.TextField(blank=True)),
                ('is_public', models.BooleanField(default=False)),
                ('share_uuid', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('categories', models.ManyToManyField(blank=True, related_name='flashcard_sets', to='flashcards.category')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='flashcard_sets', to='auth.user')),
            ],
            options={
                'ordering': ['-updated_at'],
                'unique_together': {('name', 'owner')},
            },
        ),
        migrations.CreateModel(
            name='Flashcard',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question', models.TextField(validators=[django.core.validators.MinLengthValidator(2, 'Pytanie musi mieć co najmniej 2 znaki')])),
                ('answer', models.TextField(validators=[django.core.validators.MinLengthValidator(2, 'Odpowiedź musi mieć co najmniej 2 znaki')])),
                ('difficulty', models.CharField(choices=[('easy', 'Łatwy'), ('medium', 'Średni'), ('hard', 'Trudny')], default='medium', max_length=6)),
                ('status', models.CharField(choices=[('learning', 'W trakcie nauki'), ('mastered', 'Opanowane'), ('new', 'Nowa')], default='new', max_length=8)),
                ('due_date', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_reviewed', models.DateTimeField(blank=True, null=True)),
                ('next_review', models.DateTimeField(blank=True, null=True)),
                ('repetitions', models.IntegerField(default=0)),
                ('easiness', models.FloatField(default=2.5)),
                ('interval', models.IntegerField(default=1)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='flashcards.category')),
                ('flashcard_set', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='flashcards', to='flashcards.flashcardset')),
                ('tags', models.ManyToManyField(blank=True, related_name='flashcards', to='flashcards.tag')),
            ],
            options={
                'ordering': ['-updated_at'],
                'indexes': [
                    models.Index(fields=['difficulty'], name='flashcards__difficu_7c7c5c_idx'),
                    models.Index(fields=['last_reviewed'], name='flashcards__last_r_3c4c5c_idx'),
                    models.Index(fields=['status'], name='flashcards__status_8c7c5c_idx'),
                    models.Index(fields=['due_date'], name='flashcards__due_dat_9c7c5c_idx'),
                ],
            },
        ),
    ] 