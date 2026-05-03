from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from datetime import date
from .models import Order, OrderLine
from .serializers import OrderSerializer, PlaceOrderSerializer
from catalog.models import Variant
from accounts.models import Employee, FulfillmentAdmin
from accounts.authentication import EmployeeJWTAuthentication


class PlaceOrderView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # Employee is resolved from the JWT token, not the request body
        employee = request.user
        items = serializer.validated_data['items']

        # Check stock for all items before creating anything
        for item in items:
            try:
                variant = Variant.objects.select_for_update().get(
                    pk=item['variant_id']
                )
            except Variant.DoesNotExist:
                return Response(
                    {'error': f"Variant {item['variant_id']} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if variant.stock_quantity < item['quantity']:
                return Response(
                    {
                        'error': f"Insufficient stock for variant "
                                 f"{item['variant_id']}. "
                                 f"Available: {variant.stock_quantity}"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # All stock checks passed -- create the order
        order = Order.objects.create(
            order_date=date.today(),
            total_amount=0,
            status='Pending',
            employee=employee
        )

        total = 0
        for item in items:
            variant = Variant.objects.select_for_update().get(
                pk=item['variant_id']
            )
            unit_price = variant.product.price
            line_total = unit_price * item['quantity']
            total += line_total

            OrderLine.objects.create(
                order=order,
                variant=variant,
                quantity=item['quantity'],
                unit_price=unit_price,
                line_total=line_total
            )

            # Decrement stock
            variant.stock_quantity -= item['quantity']
            variant.save()

        order.total_amount = total
        order.save()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )


class MyOrdersView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, employee_id):
        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        orders = Order.objects.filter(employee=employee).order_by('-order_date', '-order_id')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class OrderListView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.all().order_by('-order_date', '-order_id')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class OrderDetailView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return None

    def get(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    def patch(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        allowed_fields = [
            'status', 'pickup_status',
            'pickup_ready_date', 'tracking_number',
            'fulfillment_admin'
        ]
        data = {
            k: v for k, v in request.data.items()
            if k in allowed_fields
        }

        serializer = OrderSerializer(order, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )