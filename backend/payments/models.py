from django.db import models
from orders.models import Order
from accounts.models import FulfillmentAdmin


class Payment(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
        ('Refunded', 'Refunded'),
    ]

    payment_id = models.AutoField(primary_key=True)
    payment_method = models.CharField(max_length=50)
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_reference = models.CharField(max_length=150, unique=True)
    payment_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='Pending'
    )
    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, db_column='Order_ID'
    )
    fulfillment_admin = models.ForeignKey(
        FulfillmentAdmin, on_delete=models.SET_NULL,
        null=True, blank=True, db_column='Fulfillment_Admin_ID'
    )

    class Meta:
        db_table = 'PAYMENT'