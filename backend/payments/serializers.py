from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'payment_id', 'payment_method', 'payment_date',
            'amount', 'transaction_reference', 'payment_status',
            'order', 'fulfillment_admin'
        ]


class RecordPaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    fulfillment_admin_id = serializers.IntegerField(
        required=False, allow_null=True, default=None
    )
    payment_method = serializers.CharField(max_length=50)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    transaction_reference = serializers.CharField(max_length=150)