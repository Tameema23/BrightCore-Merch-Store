from django.db import models
from accounts.models import ProductAdmin


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=100, unique=True)
    category_description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'CATEGORY'

    def __str__(self):
        return self.category_name


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    product_name = models.CharField(max_length=150)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(
        Category, on_delete=models.RESTRICT, db_column='Category_ID'
    )
    product_admin = models.ForeignKey(
        ProductAdmin, on_delete=models.RESTRICT, db_column='Product_Admin_ID'
    )

    class Meta:
        db_table = 'PRODUCT'

    def __str__(self):
        return self.product_name


class Size(models.Model):
    size_id = models.AutoField(primary_key=True)
    size_name = models.CharField(max_length=50)
    size_code = models.CharField(max_length=10, unique=True)

    class Meta:
        db_table = 'SIZE'

    def __str__(self):
        return self.size_code


class Color(models.Model):
    color_id = models.AutoField(primary_key=True)
    color_name = models.CharField(max_length=50)
    color_code = models.CharField(max_length=7, unique=True)

    class Meta:
        db_table = 'COLOR'

    def __str__(self):
        return self.color_name


class Variant(models.Model):
    variant_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, db_column='Product_ID'
    )
    size = models.ForeignKey(
        Size, on_delete=models.RESTRICT, db_column='Size_ID'
    )
    color = models.ForeignKey(
        Color, on_delete=models.RESTRICT, db_column='Color_ID'
    )
    stock_quantity = models.IntegerField(default=0)

    class Meta:
        db_table = 'VARIANT'
        unique_together = ('product', 'size', 'color')

    def __str__(self):
        return f"{self.product.product_name} - {self.size.size_code} - {self.color.color_name}"


class ProductImage(models.Model):
    image_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, db_column='Product_ID'
    )
    color = models.ForeignKey(
        Color, on_delete=models.SET_NULL,
        null=True, blank=True, db_column='Color_ID'
    )
    image_url = models.CharField(max_length=500)
    alt_text = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = 'PRODUCTIMAGE'