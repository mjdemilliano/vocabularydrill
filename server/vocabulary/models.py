from django.db import models

class Vocabulary(models.Model):
    language = models.CharField(max_length=30)
    title = models.CharField(max_length=100)

    class Meta:
        unique_together = ('language', 'title')

class Lesson(models.Model):
    vocabulary = models.ForeignKey(Vocabulary)
    title = models.CharField(max_length=100)

class Word(models.Model):
    lesson = models.ForeignKey(Lesson)
    lang1 = models.CharField(max_length=30)
    lang2 = models.CharField(max_length=30)


