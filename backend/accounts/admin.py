from django.contrib import admin
from .models import Employee, FulfillmentAdmin, ProductAdmin

admin.site.register(Employee)
admin.site.register(FulfillmentAdmin)
admin.site.register(ProductAdmin)
