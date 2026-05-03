from django.urls import path
from .views import (
    LoginView, RegisterView,
    EmployeeListView, EmployeeDetailView,
    FulfillmentAdminListView, FulfillmentAdminDetailView,
    ProductAdminListView, ProductAdminDetailView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('employees/', EmployeeListView.as_view(), name='employee-list'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('fulfillment-admins/', FulfillmentAdminListView.as_view(), name='fulfillmentadmin-list'),
    path('fulfillment-admins/<int:pk>/', FulfillmentAdminDetailView.as_view(), name='fulfillmentadmin-detail'),
    path('product-admins/', ProductAdminListView.as_view(), name='productadmin-list'),
    path('product-admins/<int:pk>/', ProductAdminDetailView.as_view(), name='productadmin-detail'),
]