from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from .models import Employee


class EmployeeJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that resolves the Employee model
    instead of Django's built-in User model.

    Our tokens store 'employee_id' as a custom claim (not the default
    'user_id'), and Employee does not extend AbstractUser, so the
    default JWTAuthentication cannot look up the user.
    """

    def get_user(self, validated_token):
        employee_id = validated_token.get('employee_id')
        if employee_id is None:
            raise InvalidToken('Token contained no employee_id claim')

        try:
            return Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            raise InvalidToken('Employee not found')
