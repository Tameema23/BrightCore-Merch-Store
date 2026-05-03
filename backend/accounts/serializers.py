from rest_framework import serializers
from .models import Employee, FulfillmentAdmin, ProductAdmin


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['employee_id', 'name', 'email', 'department']


class FulfillmentAdminSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)

    class Meta:
        model = FulfillmentAdmin
        fields = [
            'fulfillment_admin_id', 'employee',
            'fulfillment_role', 'location'
        ]


class ProductAdminSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)

    class Meta:
        model = ProductAdmin
        fields = [
            'product_admin_id', 'employee',
            'catalog_role', 'catalog_review_cycle'
        ]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class CreateEmployeeSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=100)
    password = serializers.CharField(max_length=255)
    department = serializers.CharField(max_length=50)


class CreateFulfillmentAdminSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField()
    fulfillment_role = serializers.CharField(max_length=50)
    location = serializers.CharField(max_length=100)


class CreateProductAdminSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField()
    catalog_role = serializers.CharField(max_length=50)
    catalog_review_cycle = serializers.CharField(max_length=50)