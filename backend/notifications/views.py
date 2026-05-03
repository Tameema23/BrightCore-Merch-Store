from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import EmailLog
from .serializers import EmailLogSerializer
from orders.models import Order


class EmailLogListView(APIView):
    def get(self, request):
        logs = EmailLog.objects.all().order_by('-sent_at')
        serializer = EmailLogSerializer(logs, many=True)
        return Response(serializer.data)


class EmailLogByOrderView(APIView):
    def get(self, request, order_id):
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        logs = EmailLog.objects.filter(order=order).order_by('-sent_at')
        serializer = EmailLogSerializer(logs, many=True)
        return Response(serializer.data)


class CreateEmailLogView(APIView):
    def post(self, request):
        order_id = request.data.get('order_id')
        to_email = request.data.get('to_email')
        subject = request.data.get('subject')
        body = request.data.get('body')

        if not all([order_id, to_email, subject, body]):
            return Response(
                {'error': 'order_id, to_email, subject and body are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        log = EmailLog.objects.create(
            order=order,
            to_email=to_email,
            subject=subject,
            body=body
        )

        return Response(
            EmailLogSerializer(log).data,
            status=status.HTTP_201_CREATED
        )