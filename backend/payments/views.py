from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import date
import stripe
from django.conf import settings
from .models import Payment
from .serializers import PaymentSerializer, RecordPaymentSerializer
from orders.models import Order
from accounts.models import FulfillmentAdmin
from accounts.authentication import EmployeeJWTAuthentication


class PaymentListView(APIView):
    def get(self, request):
        payments = Payment.objects.all()
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


class RecordPaymentView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RecordPaymentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        order_id = serializer.validated_data['order_id']
        fulfillment_admin_id = serializer.validated_data.get(
            'fulfillment_admin_id'
        )
        payment_method = serializer.validated_data['payment_method']
        amount = serializer.validated_data['amount']
        transaction_reference = serializer.validated_data['transaction_reference']

        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        fulfillment_admin = None
        if fulfillment_admin_id is not None:
            try:
                fulfillment_admin = FulfillmentAdmin.objects.get(
                    pk=fulfillment_admin_id
                )
            except FulfillmentAdmin.DoesNotExist:
                return Response(
                    {'error': 'FulfillmentAdmin not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        if Payment.objects.filter(order=order).exists():
            return Response(
                {'error': 'Payment already recorded for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Payment.objects.filter(
            transaction_reference=transaction_reference
        ).exists():
            return Response(
                {'error': 'Transaction reference already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment = Payment.objects.create(
            order=order,
            fulfillment_admin=fulfillment_admin,
            payment_method=payment_method,
            payment_date=date.today(),
            amount=amount,
            transaction_reference=transaction_reference,
            payment_status='Completed'
        )

        order.status = 'Processing'
        if fulfillment_admin is not None:
            order.fulfillment_admin = fulfillment_admin
        order.save()

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED
        )


class PaymentDetailView(APIView):
    def get(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)


class CreateCheckoutSessionView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        amount = request.data.get('amount')

        if not order_id or amount is None:
            return Response(
                {'error': 'order_id and amount are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            amount_cents = int(float(amount) * 100)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY
        frontend_url = settings.FRONTEND_URL

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'cad',
                        'product_data': {'name': f'Order #{order_id}'},
                        'unit_amount': amount_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'{frontend_url}/order-confirmation?order_id={order_id}&payment_intent={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{frontend_url}/checkout?order_id={order_id}',
            )
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e.user_message)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'url': session.url})