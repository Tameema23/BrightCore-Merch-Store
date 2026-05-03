from django.urls import path
from .views import PaymentListView, RecordPaymentView, PaymentDetailView, CreateCheckoutSessionView

urlpatterns = [
    path('', PaymentListView.as_view(), name='payment-list'),
    path('record/', RecordPaymentView.as_view(), name='record-payment'),
    path('<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('create-checkout-session/', CreateCheckoutSessionView.as_view(), name='create-checkout-session'),
]