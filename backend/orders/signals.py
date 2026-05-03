from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Order
from notifications.models import EmailLog


@receiver(pre_save, sender=Order)
def create_email_log_on_status_change(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        previous = Order.objects.get(pk=instance.pk)
    except Order.DoesNotExist:
        return

    if previous.status == instance.status:
        return

    to_email = instance.employee.email
    name = instance.employee.name

    subject = f"Your order #{instance.order_id} status update"
    body = (
        f"Hi {name}, your order #{instance.order_id} "
        f"has been updated to: {instance.status}."
    )

    if instance.status == "Ready_for_Pickup":
        body += f" Please pick up from your nearest warehouse."

    if instance.status == "Fulfilled":
        body += f" Your order has been fulfilled. Thank you!"

    EmailLog.objects.create(
        order=instance,
        to_email=to_email,
        subject=subject,
        body=body
    )