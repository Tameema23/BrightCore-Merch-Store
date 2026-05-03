from django.db import models
from orders.models import Order


class EmailLog(models.Model):
    email_log_id = models.AutoField(primary_key=True)
    to_email = models.EmailField(max_length=100)
    subject = models.CharField(max_length=200)
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, db_column='Order_ID'
    )

    class Meta:
        db_table = 'EMAILLOG'