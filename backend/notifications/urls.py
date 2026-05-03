from django.urls import path
from .views import EmailLogListView, EmailLogByOrderView, CreateEmailLogView

urlpatterns = [
    path('', EmailLogListView.as_view(), name='emaillog-list'),
    path('create/', CreateEmailLogView.as_view(), name='emaillog-create'),
    path('order/<int:order_id>/', EmailLogByOrderView.as_view(), name='emaillog-by-order'),
]