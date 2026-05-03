from rest_framework import serializers
from .models import Order, OrderLine
from catalog.models import Variant, Product
from catalog.serializers import SizeSerializer, ColorSerializer


class OrderProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['product_id', 'product_name', 'price']


class OrderVariantSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    color = ColorSerializer(read_only=True)
    product = OrderProductSerializer(read_only=True)

    class Meta:
        model = Variant
        fields = ['variant_id', 'size', 'color', 'stock_quantity', 'product']


class OrderLineSerializer(serializers.ModelSerializer):
    variant = OrderVariantSerializer(read_only=True)

    class Meta:
        model = OrderLine
        fields = [
            'orderline_id', 'quantity',
            'unit_price', 'line_total', 'variant'
        ]


class OrderSerializer(serializers.ModelSerializer):
    orderline_set = OrderLineSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_id', 'order_date', 'total_amount', 'status',
            'pickup_status', 'pickup_ready_date', 'tracking_number',
            'employee', 'fulfillment_admin', 'orderline_set'
        ]


class PlaceOrderItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class PlaceOrderSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField(required=False)
    items = PlaceOrderItemSerializer(many=True)