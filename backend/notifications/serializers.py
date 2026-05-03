from rest_framework import serializers
from .models import EmailLog


class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = [
            'email_log_id', 'to_email', 'subject',
            'body', 'sent_at', 'order'
        ]