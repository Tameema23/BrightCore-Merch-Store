from django.db import models
from accounts.models import Employee, FulfillmentAdmin
from catalog.models import Variant


class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Ready_for_Pickup', 'Ready for Pickup'),
        ('Fulfilled', 'Fulfilled'),
        ('Cancelled', 'Cancelled'),
    ]

    order_id = models.AutoField(primary_key=True)
    order_date = models.DateField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='Pending'
    )
    pickup_status = models.CharField(max_length=50, null=True, blank=True)
    pickup_ready_date = models.DateField(null=True, blank=True)
    tracking_number = models.CharField(max_length=100, null=True, blank=True)
    employee = models.ForeignKey(
        Employee, on_delete=models.RESTRICT, db_column='Employee_ID'
    )
    fulfillment_admin = models.ForeignKey(
        FulfillmentAdmin, on_delete=models.SET_NULL,
        null=True, blank=True, db_column='Fulfillment_Admin_ID'
    )

    class Meta:
        db_table = 'ORDER'

    def __str__(self):
        return f"Order #{self.order_id} - {self.employee.name}"


class OrderLine(models.Model):
    orderline_id = models.AutoField(primary_key=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, db_column='Order_ID'
    )
    variant = models.ForeignKey(
        Variant, on_delete=models.RESTRICT, db_column='Variant_ID'
    )

    class Meta:
        db_table = 'ORDERLINE'