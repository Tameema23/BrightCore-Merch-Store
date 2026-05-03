from django.urls import path
from .views import (
    PlaceOrderView,
    MyOrdersView,
    OrderListView,
    OrderDetailView
)

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('place/', PlaceOrderView.as_view(), name='place-order'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('my-orders/<int:employee_id>/', MyOrdersView.as_view(), name='my-orders'),
]