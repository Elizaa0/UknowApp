# Generated by Django 5.2 on 2025-05-08 20:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('flashcards', '0002_category_tag_alter_flashcard_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='flashcard',
            name='due_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='flashcard',
            name='status',
            field=models.CharField(choices=[('learning', 'W trakcie nauki'), ('mastered', 'Opanowane'), ('new', 'Nowa')], default='new', max_length=8),
        ),
        migrations.AddIndex(
            model_name='flashcard',
            index=models.Index(fields=['status'], name='flashcards__status_b7ef80_idx'),
        ),
        migrations.AddIndex(
            model_name='flashcard',
            index=models.Index(fields=['due_date'], name='flashcards__due_dat_ba0364_idx'),
        ),
    ]
