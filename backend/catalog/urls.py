from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView,
    ProductListView, ProductDetailView,
    SizeListView, ColorListView,
    VariantListView, VariantDetailView
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('sizes/', SizeListView.as_view(), name='size-list'),
    path('colors/', ColorListView.as_view(), name='color-list'),
    path('variants/', VariantListView.as_view(), name='variant-list'),
    path('variants/<int:pk>/', VariantDetailView.as_view(), name='variant-detail'),
]