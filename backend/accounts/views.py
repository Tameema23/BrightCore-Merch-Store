from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Employee, FulfillmentAdmin, ProductAdmin
from .serializers import (
    LoginSerializer, EmployeeSerializer,
    FulfillmentAdminSerializer, ProductAdminSerializer,
    CreateEmployeeSerializer, CreateFulfillmentAdminSerializer,
    CreateProductAdminSerializer
)


def get_tokens_for_user(employee):
    refresh = RefreshToken()
    refresh['employee_id'] = employee.employee_id
    refresh['email'] = employee.email
    refresh['name'] = employee.name

    role = 'employee'
    try:
        FulfillmentAdmin.objects.get(employee=employee)
        role = 'fulfillment_admin'
    except FulfillmentAdmin.DoesNotExist:
        pass

    try:
        ProductAdmin.objects.get(employee=employee)
        role = 'product_admin'
    except ProductAdmin.DoesNotExist:
        pass

    refresh['role'] = role

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'role': role,
        'employee': EmployeeSerializer(employee).data
    }


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            employee = Employee.objects.get(email=email)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if employee.password != password:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tokens = get_tokens_for_user(employee)
        return Response(tokens, status=status.HTTP_200_OK)


class RegisterView(APIView):
    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        department = request.data.get('department')

        if not all([name, email, password, department]):
            return Response(
                {'error': 'All fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Employee.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )

        employee = Employee.objects.create(
            name=name,
            email=email,
            password=password,
            department=department
        )

        tokens = get_tokens_for_user(employee)
        return Response(tokens, status=status.HTTP_201_CREATED)


class EmployeeListView(APIView):
    def get(self, request):
        employees = Employee.objects.all()
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)


class EmployeeDetailView(APIView):
    def get_object(self, pk):
        try:
            return Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return None

    def get(self, request, pk):
        employee = self.get_object(pk)
        if not employee:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = EmployeeSerializer(employee)
        return Response(serializer.data)

    def put(self, request, pk):
        employee = self.get_object(pk)
        if not employee:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = EmployeeSerializer(employee, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        employee = self.get_object(pk)
        if not employee:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        employee.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FulfillmentAdminListView(APIView):
    def get(self, request):
        admins = FulfillmentAdmin.objects.all()
        serializer = FulfillmentAdminSerializer(admins, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateFulfillmentAdminSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        employee_id = serializer.validated_data['employee_id']
        fulfillment_role = serializer.validated_data['fulfillment_role']
        location = serializer.validated_data['location']

        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if FulfillmentAdmin.objects.filter(employee=employee).exists():
            return Response(
                {'error': 'Employee is already a FulfillmentAdmin'},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin = FulfillmentAdmin.objects.create(
            employee=employee,
            fulfillment_role=fulfillment_role,
            location=location
        )

        return Response(
            FulfillmentAdminSerializer(admin).data,
            status=status.HTTP_201_CREATED
        )


class ProductAdminListView(APIView):
    def get(self, request):
        admins = ProductAdmin.objects.all()
        serializer = ProductAdminSerializer(admins, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateProductAdminSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        employee_id = serializer.validated_data['employee_id']
        catalog_role = serializer.validated_data['catalog_role']
        catalog_review_cycle = serializer.validated_data['catalog_review_cycle']

        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if ProductAdmin.objects.filter(employee=employee).exists():
            return Response(
                {'error': 'Employee is already a ProductAdmin'},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin = ProductAdmin.objects.create(
            employee=employee,
            catalog_role=catalog_role,
            catalog_review_cycle=catalog_review_cycle
        )

        return Response(
            ProductAdminSerializer(admin).data,
            status=status.HTTP_201_CREATED
        )


class FulfillmentAdminDetailView(APIView):
    def get_object(self, pk):
        try:
            return FulfillmentAdmin.objects.get(pk=pk)
        except FulfillmentAdmin.DoesNotExist:
            return None

    def delete(self, request, pk):
        admin = self.get_object(pk)
        if not admin:
            return Response(
                {'error': 'FulfillmentAdmin not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        admin.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductAdminDetailView(APIView):
    def get_object(self, pk):
        try:
            return ProductAdmin.objects.get(pk=pk)
        except ProductAdmin.DoesNotExist:
            return None

    def delete(self, request, pk):
        admin = self.get_object(pk)
        if not admin:
            return Response(
                {'error': 'ProductAdmin not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        admin.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)