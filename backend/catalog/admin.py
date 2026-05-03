from django.contrib import admin
from .models import Category, Product, Size, Color, Variant, ProductImage

# Register your models here.
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Size)
admin.site.register(Color)
admin.site.register(Variant)
admin.site.register(ProductImage)