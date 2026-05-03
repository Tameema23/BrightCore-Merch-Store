from django.db import models


class Employee(models.Model):
    employee_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    department = models.CharField(max_length=50)
    password = models.CharField(max_length=255)

    class Meta:
        db_table = 'EMPLOYEE'

    def __str__(self):
        return self.name

    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True


class FulfillmentAdmin(models.Model):
    fulfillment_admin_id = models.AutoField(primary_key=True)
    employee = models.OneToOneField(
        Employee, on_delete=models.CASCADE, db_column='Employee_ID'
    )
    fulfillment_role = models.CharField(max_length=50)
    location = models.CharField(max_length=100)

    class Meta:
        db_table = 'FULFILLMENTADMIN'

    def __str__(self):
        return f"FulfillmentAdmin: {self.employee.name}"


class ProductAdmin(models.Model):
    product_admin_id = models.AutoField(primary_key=True)
    employee = models.OneToOneField(
        Employee, on_delete=models.CASCADE, db_column='Employee_ID'
    )
    catalog_role = models.CharField(max_length=50)
    catalog_review_cycle = models.CharField(max_length=50)

    class Meta:
        db_table = 'PRODUCTADMIN'

    def __str__(self):
        return f"ProductAdmin: {self.employee.name}"