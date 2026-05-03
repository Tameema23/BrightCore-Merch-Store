from rest_framework import serializers
from .models import Category, Product, Size, Color, Variant, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['category_id', 'category_name', 'category_description']


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['size_id', 'size_name', 'size_code']


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['color_id', 'color_name', 'color_code']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['image_id', 'image_url', 'alt_text', 'color']


class VariantSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    color = ColorSerializer(read_only=True)

    class Meta:
        model = Variant
        fields = [
            'variant_id', 'size', 'color', 'stock_quantity'
        ]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    variants = VariantSerializer(many=True, read_only=True, source='variant_set')
    images = ProductImageSerializer(many=True, read_only=True, source='productimage_set')

    class Meta:
        model = Product
        fields = [
            'product_id', 'product_name', 'description',
            'price', 'category', 'variants', 'images'
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField()
    product_admin_id = serializers.IntegerField()

    class Meta:
        model = Product
        fields = [
            'product_name', 'description', 'price',
            'category_id', 'product_admin_id'
        ]