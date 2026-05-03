from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.authentication import EmployeeJWTAuthentication
from accounts.models import ProductAdmin
from .models import Category, Product, Size, Color, Variant, ProductImage
from .serializers import (
    CategorySerializer, ProductSerializer, ProductWriteSerializer,
    SizeSerializer, ColorSerializer, VariantSerializer,
    ProductImageSerializer
)


class CategoryListView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetailView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]

    def get_object(self, pk):
        try:
            return Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def resolve_product_admin_id(employee_id):
    """Resolve the ProductAdmin pk from an employee_id."""
    try:
        return ProductAdmin.objects.get(employee_id=employee_id).pk
    except ProductAdmin.DoesNotExist:
        return None


class ProductListView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        pa_id = resolve_product_admin_id(data.get('product_admin_id'))
        if pa_id is None:
            return Response({'error': 'ProductAdmin not found for given employee'}, status=status.HTTP_400_BAD_REQUEST)
        data['product_admin_id'] = pa_id
        serializer = ProductWriteSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]

    def get_object(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProductSerializer(product)
        return Response(serializer.data)

    def put(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        data = request.data.copy()
        pa_id = resolve_product_admin_id(data.get('product_admin_id'))
        if pa_id is None:
            return Response({'error': 'ProductAdmin not found for given employee'}, status=status.HTTP_400_BAD_REQUEST)
        data['product_admin_id'] = pa_id
        serializer = ProductWriteSerializer(product, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SizeListView(APIView):
    def get(self, request):
        sizes = Size.objects.all()
        serializer = SizeSerializer(sizes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SizeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ColorListView(APIView):
    def get(self, request):
        colors = Color.objects.all()
        serializer = ColorSerializer(colors, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ColorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VariantListView(APIView):
    def get(self, request):
        product_id = request.query_params.get('product_id')
        if product_id:
            variants = Variant.objects.filter(product_id=product_id)
        else:
            variants = Variant.objects.all()
        serializer = VariantSerializer(variants, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = VariantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VariantDetailView(APIView):
    authentication_classes = [EmployeeJWTAuthentication]

    def get_object(self, pk):
        try:
            return Variant.objects.get(pk=pk)
        except Variant.DoesNotExist:
            return None

    def put(self, request, pk):
        variant = self.get_object(pk)
        if not variant:
            return Response(
                {'error': 'Variant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = VariantSerializer(variant, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)