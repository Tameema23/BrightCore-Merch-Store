import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'brightcore.settings')
django.setup()

from accounts.models import Employee, FulfillmentAdmin, ProductAdmin
from catalog.models import Category, Product, Size, Color, Variant, ProductImage
from orders.models import Order, OrderLine
from payments.models import Payment
from notifications.models import EmailLog
from datetime import date

print("Seeding database...")

# ── EMPLOYEES ──────────────────────────────────────────────
alice = Employee.objects.create(name="Alice Johnson", email="alice@brightcore.com", password="test123", department="Engineering")
bob   = Employee.objects.create(name="Bob Smith",     email="bob@brightcore.com",   password="test123", department="Marketing")
carol = Employee.objects.create(name="Carol White",   email="carol@brightcore.com", password="test123", department="Operations")
david = Employee.objects.create(name="David Lee",     email="david@brightcore.com", password="test123", department="HR")
emma  = Employee.objects.create(name="Emma Davis",    email="emma@brightcore.com",  password="test123", department="Operations")
print("Employees created")

# ── ADMINS ─────────────────────────────────────────────────
fa  = FulfillmentAdmin.objects.create(employee=carol, fulfillment_role="Senior Fulfillment", location="Warehouse A")
fa2 = FulfillmentAdmin.objects.create(employee=emma,  fulfillment_role="Fulfillment Staff",  location="Warehouse B")
pa  = ProductAdmin.objects.create(employee=david, catalog_role="Catalog Manager", catalog_review_cycle="Monthly")
print("Admins created")

# ── CATEGORIES ─────────────────────────────────────────────
tops        = Category.objects.create(category_name="Tops",        category_description="T-shirts, hoodies, and polo shirts")
accessories = Category.objects.create(category_name="Accessories", category_description="Hats, bags, and other accessories")
bottoms     = Category.objects.create(category_name="Bottoms",     category_description="Pants, shorts, and joggers")
print("Categories created")

# ── SIZES ──────────────────────────────────────────────────
xs = Size.objects.create(size_name="Extra Small", size_code="XS")
s  = Size.objects.create(size_name="Small",       size_code="S")
m  = Size.objects.create(size_name="Medium",      size_code="M")
l  = Size.objects.create(size_name="Large",       size_code="L")
xl = Size.objects.create(size_name="Extra Large", size_code="XL")
print("Sizes created")

# ── COLORS ─────────────────────────────────────────────────
black = Color.objects.create(color_name="Black",     color_code="#000000")
white = Color.objects.create(color_name="White",     color_code="#FFFFFF")
navy  = Color.objects.create(color_name="Navy Blue", color_code="#001F5B")
grey  = Color.objects.create(color_name="Grey",      color_code="#808080")
print("Colors created")

# ── PRODUCTS ───────────────────────────────────────────────
tee = Product.objects.create(
    product_name="BrightCore Classic Tee",
    description="Comfortable cotton t-shirt with BrightCore logo.",
    price=24.99, category=tops, product_admin=pa
)
hoodie = Product.objects.create(
    product_name="BrightCore Hoodie",
    description="Warm pullover hoodie with embroidered logo and full graphic back print.",
    price=59.99, category=tops, product_admin=pa
)
cap = Product.objects.create(
    product_name="BrightCore Cap",
    description="Adjustable snapback cap with embroidered BrightCore wordmark.",
    price=19.99, category=accessories, product_admin=pa
)
joggers = Product.objects.create(
    product_name="BrightCore Joggers",
    description="Comfortable fleece joggers with zip pockets and BrightCore branding.",
    price=49.99, category=bottoms, product_admin=pa
)
print("Products created")

# ── VARIANTS ───────────────────────────────────────────────
# Tee: Black (S, M, L) + White (S, M, L)
v1  = Variant.objects.create(product=tee, size=s, color=black, stock_quantity=30)
v2  = Variant.objects.create(product=tee, size=m, color=black, stock_quantity=50)
v3  = Variant.objects.create(product=tee, size=l, color=black, stock_quantity=35)
v4  = Variant.objects.create(product=tee, size=s, color=white, stock_quantity=20)
v5  = Variant.objects.create(product=tee, size=m, color=white, stock_quantity=40)
v6  = Variant.objects.create(product=tee, size=l, color=white, stock_quantity=25)

# Hoodie: Navy (M, L, XL) + Grey (M, L, XL)
v7  = Variant.objects.create(product=hoodie, size=m,  color=navy, stock_quantity=20)
v8  = Variant.objects.create(product=hoodie, size=l,  color=navy, stock_quantity=15)
v9  = Variant.objects.create(product=hoodie, size=xl, color=navy, stock_quantity=10)
v10 = Variant.objects.create(product=hoodie, size=m,  color=grey, stock_quantity=18)
v11 = Variant.objects.create(product=hoodie, size=l,  color=grey, stock_quantity=12)
v12 = Variant.objects.create(product=hoodie, size=xl, color=grey, stock_quantity=8)

# Cap: Black + Navy (one-size fits all, using M)
v13 = Variant.objects.create(product=cap, size=m, color=black, stock_quantity=60)
v14 = Variant.objects.create(product=cap, size=m, color=navy,  stock_quantity=45)

# Joggers: Grey (S, M, L) + Black (S, M, L)
v15 = Variant.objects.create(product=joggers, size=s, color=grey,  stock_quantity=20)
v16 = Variant.objects.create(product=joggers, size=m, color=grey,  stock_quantity=30)
v17 = Variant.objects.create(product=joggers, size=l, color=grey,  stock_quantity=25)
v18 = Variant.objects.create(product=joggers, size=s, color=black, stock_quantity=15)
v19 = Variant.objects.create(product=joggers, size=m, color=black, stock_quantity=28)
v20 = Variant.objects.create(product=joggers, size=l, color=black, stock_quantity=22)
print("Variants created")

# ── PRODUCT IMAGES ─────────────────────────────────────────
# Tee
ProductImage.objects.create(product=tee, color=black, image_url="/media/products/tee-black.png", alt_text="Classic Tee in Black")
ProductImage.objects.create(product=tee, color=white, image_url="/media/products/tee-white.png", alt_text="Classic Tee in White")

# Hoodie Navy — front first, then back (order matters for gallery)
ProductImage.objects.create(product=hoodie, color=navy, image_url="/media/products/hoodie-navy-front.png", alt_text="Hoodie Navy Front")
ProductImage.objects.create(product=hoodie, color=navy, image_url="/media/products/hoodie-navy-back.png",  alt_text="Hoodie Navy Back")

# Hoodie Grey — front first, then back
ProductImage.objects.create(product=hoodie, color=grey, image_url="/media/products/hoodie-grey-front.png", alt_text="Hoodie Grey Front")
ProductImage.objects.create(product=hoodie, color=grey, image_url="/media/products/hoodie-grey-back.png",  alt_text="Hoodie Grey Back")

# Cap
ProductImage.objects.create(product=cap, color=black, image_url="/media/products/cap-black.png", alt_text="Cap in Black")
ProductImage.objects.create(product=cap, color=navy,  image_url="/media/products/cap-navy.png",  alt_text="Cap in Navy Blue")

# Joggers
ProductImage.objects.create(product=joggers, color=grey,  image_url="/media/products/joggers-grey.png",  alt_text="Joggers in Grey")
ProductImage.objects.create(product=joggers, color=black, image_url="/media/products/joggers-black.png", alt_text="Joggers in Black")
print("Product images created")

# ── ORDERS ─────────────────────────────────────────────────
order1 = Order.objects.create(order_date=date(2025, 3, 1),  total_amount=24.99, status="Fulfilled",  employee=alice, fulfillment_admin=fa)
order2 = Order.objects.create(order_date=date(2025, 3, 5),  total_amount=79.98, status="Processing", employee=bob,   fulfillment_admin=None)
order3 = Order.objects.create(order_date=date(2025, 3, 10), total_amount=59.99, status="Pending",    employee=alice, fulfillment_admin=None)

OrderLine.objects.create(order=order1, variant=v2,  quantity=1, unit_price=24.99, line_total=24.99)
OrderLine.objects.create(order=order2, variant=v7,  quantity=1, unit_price=59.99, line_total=59.99)
OrderLine.objects.create(order=order2, variant=v13, quantity=1, unit_price=19.99, line_total=19.99)
OrderLine.objects.create(order=order3, variant=v8,  quantity=1, unit_price=59.99, line_total=59.99)
print("Orders created")

# ── PAYMENTS ───────────────────────────────────────────────
Payment.objects.create(order=order1, fulfillment_admin=fa,   payment_method="Credit Card",      payment_date=date(2025, 3, 1), amount=24.99, transaction_reference="TXN-001-20250301", payment_status="Completed")
Payment.objects.create(order=order2, fulfillment_admin=None, payment_method="Payroll Deduction", payment_date=date(2025, 3, 5), amount=79.98, transaction_reference="TXN-002-20250305", payment_status="Pending")
print("Payments created")

# ── EMAIL LOGS ─────────────────────────────────────────────
EmailLog.objects.create(order=order1, to_email="alice@brightcore.com", subject="Your order is ready for pickup",  body="Hi Alice, your order #1 is ready. Please pick up from Warehouse A.")
EmailLog.objects.create(order=order2, to_email="bob@brightcore.com",   subject="Your order is being processed",  body="Hi Bob, your order #2 is currently being processed.")
print("Email logs created")

print("Seeding complete.")