import os
import uuid
import stripe
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.responses import FileResponse

app = FastAPI()

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers_to_all_responses(request, call_next):
    response = await call_next(request)

    origin = request.headers.get("origin")

    if origin in ["http://localhost:5173", "http://127.0.0.1:5173"]:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"

    return response

from app.deps import get_db
from datetime import date
from datetime import timedelta
from app.schemas.user import UserCreate, TokenResponse, UserResponse, UserStatusResponse, UserProfileUpdate
from app.models import User, Property, Booking, Review, PropertyImage, PropertyTour, Amenity, PropertyAmenity, PropertyTourScene, TourSceneConnection, TourSceneHotspot, Conversation, Message
from app.schemas.property import PropertyCreate, PropertyResponse, PropertyUpdate, PropertyStatusUpdate
from app.schemas.booking import BookingCreate, BookingResponse, BookingStatusUpdate
from app.schemas.review import ReviewCreate, ReviewResponse
from app.schemas.amenity import AmenityResponse, PropertyAmenityCreate
from app.schemas.property_media import (
    PropertyImageCreate,
    PropertyImageResponse,
    PropertyTourCreate,
    PropertyTourResponse
)
from app.schemas.availability import (
    AvailabilityItem,
    PropertyAvailabilityResponse,
    PropertyCalendarResponse
)
from app.security import hash_password, verify_password, create_access_token
from app.auth import get_current_user
from decimal import Decimal

class TourScenePositionUpdate(BaseModel):
    position_x: int
    position_y: int

class TourSceneConnectionCreate(BaseModel):
    source_scene_id: int
    target_scene_id: int
    label: str | None = None

class TourSceneHotspotCreate(BaseModel):
    target_scene_id: int
    label: str | None = None
    pitch: float
    yaw: float

class MessageCreate(BaseModel):
    message_text: str

@app.get("/")
def root():
    return {"message": "Rural Tourism Platform API is running"}

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"message": "Database connection is successful"}

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        if user.role not in ["user", "host", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role")

        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        new_user = User(
            full_name=user.full_name,
            email=user.email,
            password_hash=hash_password(user.password),
            phone=user.phone,
            avatar_url=None,
            role=user.role
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "User registered successfully",
            "user": {
                "id": new_user.id,
                "full_name": new_user.full_name,
                "email": new_user.email,
                "role": new_user.role
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is deactivated")

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/users/{user_id}", response_model=UserResponse)
def get_public_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@app.patch("/profile", response_model=UserResponse)
def update_my_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_data = profile_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@app.post("/profile/avatar", response_model=UserResponse)
def upload_profile_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_extension = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed: jpg, jpeg, png, webp"
        )

    unique_filename = f"avatar_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    current_user.avatar_url = f"/uploads/{unique_filename}"

    db.commit()
    db.refresh(current_user)

    return current_user

@app.post("/properties", response_model=PropertyResponse)
def create_property(
    property_data: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("USER ROLE:", current_user.role)

    if current_user.role != "host":
        raise HTTPException(
            status_code=403,
            detail=f"Only hosts can create properties. Your role is: {current_user.role}"
        )

    new_property = Property(
        host_id=current_user.id,
        title=property_data.title,
        short_description=property_data.short_description,
        full_description=property_data.full_description,
        property_type=property_data.property_type,
        country=property_data.country,
        city=property_data.city,
        address=property_data.address,
        postal_code=property_data.postal_code,
        latitude=property_data.latitude,
        longitude=property_data.longitude,
        price_per_night=property_data.price_per_night,
        max_guests=property_data.max_guests,
        rules=property_data.rules,
        cancellation_policy=property_data.cancellation_policy
    )

    db.add(new_property)
    db.commit()
    db.refresh(new_property)

    return new_property

@app.get("/properties/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    return property_item

from typing import Optional

@app.post("/properties", response_model=PropertyResponse)
def create_property(
    property_data: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("USER ROLE:", current_user.role)

    if current_user.role != "host":
        raise HTTPException(
            status_code=403,
            detail=f"Only hosts can create properties. Your role is: {current_user.role}"
        )

    new_property = Property(
        host_id=current_user.id,
        title=property_data.title,
        short_description=property_data.short_description,
        full_description=property_data.full_description,
        property_type=property_data.property_type,
        country=property_data.country,
        city=property_data.city,
        address=property_data.address,
        postal_code=property_data.postal_code,
        latitude=property_data.latitude,
        longitude=property_data.longitude,
        price_per_night=property_data.price_per_night,
        max_guests=property_data.max_guests,
        rules=property_data.rules,
        cancellation_policy=property_data.cancellation_policy
    )

    db.add(new_property)
    db.commit()
    db.refresh(new_property)

    return new_property

@app.get("/properties", response_model=list[PropertyResponse])
def get_properties(
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Property)

    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))

    if property_type:
        query = query.filter(Property.property_type.ilike(f"%{property_type}%"))

    if max_price is not None:
        query = query.filter(Property.price_per_night <= max_price)

    return query.all()

@app.get("/properties/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    return property_item

@app.get("/host/properties", response_model=list[PropertyResponse])
def get_host_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can view their properties")

    properties = db.query(Property).filter(Property.host_id == current_user.id).all()
    return properties

@app.get("/users/{user_id}/properties", response_model=list[PropertyResponse])
def get_public_host_properties(
    user_id: int,
    db: Session = Depends(get_db)
):
    host = db.query(User).filter(
        User.id == user_id,
        User.role == "host",
        User.is_active == True
    ).first()

    if not host:
        raise HTTPException(status_code=404, detail="Host not found")

    properties = db.query(Property).filter(
        Property.host_id == user_id,
        Property.status == "approved"
    ).all()

    return properties

@app.delete("/properties/{property_id}")
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can delete properties")

    if property_item.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can delete only your own properties")

    db.delete(property_item)
    db.commit()

    return {"message": "Property deleted successfully"}

@app.patch("/properties/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    property_data: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can edit properties")

    if property_item.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can edit only your own properties")

    update_data = property_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(property_item, field, value)

    db.commit()
    db.refresh(property_item)

    return property_item

@app.post("/properties/{property_id}/images", response_model=PropertyImageResponse)
def add_property_image(
    property_id: int,
    image_data: PropertyImageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can add property images")

    if property_item.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can add images only to your own properties")

    if image_data.is_main:
        existing_main = db.query(PropertyImage).filter(
            PropertyImage.property_id == property_id,
            PropertyImage.is_main == True
        ).first()

        if existing_main:
            existing_main.is_main = False

    new_image = PropertyImage(
        property_id=property_id,
        image_url=str(image_data.image_url),
        is_main=image_data.is_main
    )

    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return new_image

@app.get("/properties/{property_id}/images")
def get_property_images(property_id: int, db: Session = Depends(get_db)):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    images = db.query(PropertyImage).filter(PropertyImage.property_id == property_id).all()

    return [
        {
            "id": image.id,
            "property_id": image.property_id,
            "image_url": image.image_url,
            "is_main": image.is_main
        }
        for image in images
    ]

@app.delete("/images/{image_id}")
def delete_property_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    image = db.query(PropertyImage).filter(PropertyImage.id == image_id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    property_item = db.query(Property).filter(Property.id == image.property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can delete property images")

    if property_item.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can delete images only from your own properties")

    db.delete(image)
    db.commit()

    return {"message": "Property image deleted successfully"}

@app.post("/properties/{property_id}/tour", response_model=PropertyTourResponse)
def add_property_tour(
    property_id: int,
    tour_data: PropertyTourCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can add 360 tours")

    if property_item.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can add a tour only to your own property")

    existing_tour = db.query(PropertyTour).filter(PropertyTour.property_id == property_id).first()
    if existing_tour:
        raise HTTPException(status_code=400, detail="This property already has a 360° tour")

    new_tour = PropertyTour(
        property_id=property_id,
        title=tour_data.title,
        panorama_url=str(tour_data.panorama_url),
        preview_image_url=str(tour_data.preview_image_url) if tour_data.preview_image_url else None
    )

    db.add(new_tour)
    db.commit()
    db.refresh(new_tour)

    return new_tour

@app.get("/properties/{property_id}/tour", response_model=PropertyTourResponse)
def get_property_tour(property_id: int, db: Session = Depends(get_db)):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    tour = db.query(PropertyTour).filter(PropertyTour.property_id == property_id).first()

    if not tour:
        raise HTTPException(status_code=404, detail="360° tour not found for this property")

    return tour

@app.delete("/tours/{tour_id}")
def delete_property_tour(
    tour_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tour = db.query(PropertyTour).filter(PropertyTour.id == tour_id).first()

    if not tour:
        raise HTTPException(status_code=404, detail="360° tour not found")

    property_item = db.query(Property).filter(Property.id == tour.property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can delete 360° tours")

    if property_item.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can delete tours only from your own properties")

    db.delete(tour)
    db.commit()

    return {"message": "360° tour deleted successfully"}

@app.post("/bookings", response_model=BookingResponse)
def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only users can create bookings")

    property_item = db.query(Property).filter(Property.id == booking_data.property_id).first()
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if property_item.host_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot book your own property")

    if booking_data.check_out_date <= booking_data.check_in_date:
        raise HTTPException(status_code=400, detail="Check-out date must be later than check-in date")

    if booking_data.guests_count > property_item.max_guests:
        raise HTTPException(status_code=400, detail="Guests count exceeds property capacity")

    overlapping_booking = db.query(Booking).filter(
        Booking.property_id == booking_data.property_id,
        Booking.status.in_(["pending", "confirmed"]),
        Booking.check_in_date < booking_data.check_out_date,
        Booking.check_out_date > booking_data.check_in_date
    ).first()

    if overlapping_booking:
        raise HTTPException(status_code=400, detail="Selected dates are not available")

    nights = (booking_data.check_out_date - booking_data.check_in_date).days
    subtotal = property_item.price_per_night * nights
    taxes = Decimal("0.00")
    total_price = subtotal + taxes

    new_booking = Booking(
        property_id=booking_data.property_id,
        user_id=current_user.id,
        check_in_date=booking_data.check_in_date,
        check_out_date=booking_data.check_out_date,
        guests_count=booking_data.guests_count,
        nights=nights,
        subtotal=subtotal,
        taxes=taxes,
        total_price=total_price,
        status="pending",
        payment_status="unpaid"
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return new_booking

@app.get("/my-bookings", response_model=list[BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    return bookings

@app.get("/host/bookings", response_model=list[BookingResponse])
def get_host_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can view host bookings")

    bookings = (
        db.query(Booking)
        .join(Property, Booking.property_id == Property.id)
        .filter(Property.host_id == current_user.id)
        .all()
    )

    return bookings

@app.patch("/bookings/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    status_data: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can manage bookings")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    property_item = db.query(Property).filter(Property.id == booking.property_id).first()
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if property_item.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can manage bookings only for your own properties")

    if status_data.status not in ["awaiting_payment", "cancelled", "completed"]:
        raise HTTPException(status_code=400, detail="Status must be either 'awaiting_payment', 'cancelled', or 'completed'")

    booking.status = status_data.status

    if status_data.status in ["cancelled", "completed"]:
        conversation = db.query(Conversation).filter(
            Conversation.booking_id == booking.id
        ).first()

        if conversation:
            db.delete(conversation)

    db.commit()
    db.refresh(booking)

    return booking

@app.patch("/bookings/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only users can cancel bookings")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can cancel only your own bookings")

    if booking.status not in ["pending", "confirmed"]:
        raise HTTPException(status_code=400, detail="This booking cannot be cancelled")

    booking.status = "cancelled"

    conversation = db.query(Conversation).filter(
        Conversation.booking_id == booking.id
    ).first()

    if conversation:
        db.delete(conversation)

    db.commit()
    db.refresh(booking)

    return booking

@app.post("/bookings/{booking_id}/create-checkout-session")
def create_checkout_session(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can pay only for your own booking"
        )

    if booking.status != "awaiting_payment":
        raise HTTPException(
            status_code=400,
            detail="This booking is not awaiting payment"
        )

    if booking.payment_status == "paid":
        raise HTTPException(
            status_code=400,
            detail="This booking is already paid"
        )

    property_item = db.query(Property).filter(
        Property.id == booking.property_id
    ).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if not stripe.api_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe secret key is not configured"
        )

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": f"Booking for {property_item.title}",
                            "description": (
                                f"{booking.check_in_date} to "
                                f"{booking.check_out_date}, "
                                f"{booking.nights} nights"
                            ),
                        },
                        "unit_amount": int(float(booking.total_price) * 100),
                    },
                    "quantity": 1,
                }
            ],
            metadata={
                "booking_id": str(booking.id),
                "property_id": str(property_item.id),
                "user_id": str(current_user.id),
            },
            success_url=(
                f"{FRONTEND_URL}/payment/success"
                f"?booking_id={booking.id}"
                f"&session_id={{CHECKOUT_SESSION_ID}}"
            ),
            cancel_url=f"{FRONTEND_URL}/payment/cancel?booking_id={booking.id}",
        )

        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/bookings/{booking_id}/confirm-payment")
def confirm_booking_payment(
    booking_id: int,
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can confirm payment only for your own booking")

    if booking.status == "confirmed" and booking.payment_status == "paid":
        return {
            "message": "Payment already confirmed",
            "booking_id": booking.id,
            "status": booking.status,
            "payment_status": booking.payment_status,
        }

    if booking.status != "awaiting_payment":
        raise HTTPException(status_code=400, detail=f"This booking is not awaiting payment. Current status: {booking.status}")

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != "paid":
            raise HTTPException(status_code=400, detail=f"Stripe payment status is: {session.payment_status}")

        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != "paid":
            raise HTTPException(
                status_code=400,
                detail=f"Stripe payment status is: {session.payment_status}"
            )

        booking.status = "confirmed"
        booking.payment_status = "paid"

        db.commit()
        db.refresh(booking)

        return {
            "message": "Payment confirmed successfully",
            "booking_id": booking.id,
            "status": booking.status,
            "payment_status": booking.payment_status,
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print("STRIPE CONFIRM PAYMENT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reviews", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only users can leave reviews")

    booking = db.query(Booking).filter(Booking.id == review_data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can review only your own booking")

    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="You can leave a review only for completed bookings")

    existing_review = db.query(Review).filter(Review.booking_id == review_data.booking_id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="Review for this booking already exists")

    new_review = Review(
        booking_id=booking.id,
        property_id=booking.property_id,
        user_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review

@app.get("/properties/{property_id}/reviews", response_model=list[ReviewResponse])
def get_property_reviews(property_id: int, db: Session = Depends(get_db)):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    reviews = db.query(Review).filter(
        Review.property_id == property_id,
        Review.is_visible == True
    ).all()

    return reviews

class AmenityCreate(BaseModel):
    name: str


@app.post("/amenities", response_model=AmenityResponse)
def create_amenity(
    amenity_data: AmenityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["host", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only hosts or admins can create amenities"
        )

    clean_name = amenity_data.name.strip()

    if not clean_name:
        raise HTTPException(
            status_code=400,
            detail="Amenity name cannot be empty"
        )

    existing_amenity = db.query(Amenity).filter(
        Amenity.name.ilike(clean_name)
    ).first()

    if existing_amenity:
        return existing_amenity

    new_amenity = Amenity(
        name=clean_name
    )

    db.add(new_amenity)
    db.commit()
    db.refresh(new_amenity)

    return new_amenity

@app.get("/amenities", response_model=list[AmenityResponse])
def get_amenities(db: Session = Depends(get_db)):
    amenities = db.query(Amenity).all()
    return amenities

@app.get("/properties/{property_id}/amenities", response_model=list[AmenityResponse])
def get_property_amenities(property_id: int, db: Session = Depends(get_db)):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    amenities = (
        db.query(Amenity)
        .join(PropertyAmenity, Amenity.id == PropertyAmenity.amenity_id)
        .filter(PropertyAmenity.property_id == property_id)
        .all()
    )

    return amenities

class AmenityCreate(BaseModel):
    name: str


@app.post("/amenities", response_model=AmenityResponse)
def create_amenity(
    amenity_data: AmenityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["host", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only hosts or admins can create amenities"
        )

    clean_name = amenity_data.name.strip()

    if not clean_name:
        raise HTTPException(status_code=400, detail="Amenity name cannot be empty")

    existing_amenity = db.query(Amenity).filter(
        Amenity.name.ilike(clean_name)
    ).first()

    if existing_amenity:
        return existing_amenity

    new_amenity = Amenity(
        name=clean_name
    )

    db.add(new_amenity)
    db.commit()
    db.refresh(new_amenity)

    return new_amenity

@app.post("/properties/{property_id}/amenities", response_model=AmenityResponse)
def add_amenity_to_property(
    property_id: int,
    amenity_data: PropertyAmenityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can add amenities")

    if property_item.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can manage amenities only for your own properties")

    amenity = db.query(Amenity).filter(Amenity.id == amenity_data.amenity_id).first()

    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")

    existing_link = db.query(PropertyAmenity).filter(
        PropertyAmenity.property_id == property_id,
        PropertyAmenity.amenity_id == amenity_data.amenity_id
    ).first()

    if existing_link:
        raise HTTPException(status_code=400, detail="Amenity already added to this property")

    property_amenity = PropertyAmenity(
        property_id=property_id,
        amenity_id=amenity_data.amenity_id
    )

    db.add(property_amenity)
    db.commit()

    return amenity

@app.delete("/properties/{property_id}/amenities/{amenity_id}")
def remove_amenity_from_property(
    property_id: int,
    amenity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can remove amenities")

    if property_item.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can manage amenities only for your own properties")

    property_amenity = db.query(PropertyAmenity).filter(
        PropertyAmenity.property_id == property_id,
        PropertyAmenity.amenity_id == amenity_id
    ).first()

    if not property_amenity:
        raise HTTPException(status_code=404, detail="Amenity is not attached to this property")

    db.delete(property_amenity)
    db.commit()

    return {"message": "Amenity removed from property successfully"}

@app.get("/properties/{property_id}/availability", response_model=PropertyAvailabilityResponse)
def get_property_availability(property_id: int, db: Session = Depends(get_db)):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    bookings = db.query(Booking).filter(
        Booking.property_id == property_id,
        Booking.status.in_(["pending", "confirmed"])
    ).all()

    unavailable_ranges = [
        AvailabilityItem(
            booking_id=booking.id,
            check_in_date=booking.check_in_date,
            check_out_date=booking.check_out_date,
            status=booking.status
        )
        for booking in bookings
    ]

    return PropertyAvailabilityResponse(
        property_id=property_id,
        unavailable_ranges=unavailable_ranges
    )

@app.get("/properties/{property_id}/calendar", response_model=PropertyCalendarResponse)
def get_property_calendar(property_id: int, db: Session = Depends(get_db)):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    bookings = db.query(Booking).filter(
        Booking.property_id == property_id,
        Booking.status.in_(["pending", "confirmed"])
    ).all()

    unavailable_dates = []

    for booking in bookings:
        current_date = booking.check_in_date
        while current_date < booking.check_out_date:
            unavailable_dates.append(current_date)
            current_date += timedelta(days=1)

    return PropertyCalendarResponse(
        property_id=property_id,
        unavailable_dates=sorted(list(set(unavailable_dates)))
    )

def require_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this endpoint")
    
@app.get("/admin/users", response_model=list[UserStatusResponse])
def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    users = db.query(User).all()
    return users

@app.patch("/admin/users/{user_id}/deactivate", response_model=UserStatusResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()
    db.refresh(user)

    return user

@app.patch("/admin/users/{user_id}/activate", response_model=UserStatusResponse)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    db.commit()
    db.refresh(user)

    return user

@app.get("/admin/properties", response_model=list[PropertyResponse])
def get_admin_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    properties = db.query(Property).all()
    return properties

@app.patch("/admin/properties/{property_id}/status", response_model=PropertyResponse)
def update_property_status(
    property_id: int,
    status_data: PropertyStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    property_item = db.query(Property).filter(Property.id == property_id).first()
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if status_data.status not in ["pending", "approved", "rejected", "inactive"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be one of: pending, approved, rejected, inactive"
        )

    property_item.status = status_data.status
    db.commit()
    db.refresh(property_item)

    return property_item

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/properties/{property_id}/images/upload")
def upload_property_image(
    property_id: int,
    file: UploadFile = File(...),
    is_main: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    property = db.query(Property).filter(Property.id == property_id).first()

    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    if property.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    image_url = f"/uploads/{unique_filename}"

    if is_main:
        db.query(PropertyImage).filter(
            PropertyImage.property_id == property_id
        ).update({"is_main": False})

    new_image = PropertyImage(
        property_id=property_id,
        image_url=image_url,
        is_main=is_main
    )

    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return {
        "id": new_image.id,
        "property_id": new_image.property_id,
        "image_url": new_image.image_url,
        "is_main": new_image.is_main
    }

@app.post("/properties/{property_id}/tour/upload")
def upload_property_tour(
        property_id: int,
        file: UploadFile = File(...),
        title: str = "360° Virtual Tour",
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ):
        property_item = db.query(Property).filter(Property.id == property_id).first()

        if not property_item:
            raise HTTPException(status_code=404, detail="Property not found")

        if current_user.role != "host":
            raise HTTPException(status_code=403, detail="Only hosts can upload 360° tours")

        if property_item.host_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can upload a tour only to your own property"
            )

        existing_tour = db.query(PropertyTour).filter(
            PropertyTour.property_id == property_id
        ).first()

        if existing_tour:
            raise HTTPException(
                status_code=400,
                detail="This property already has a 360° tour. Delete it first."
            )

        file_extension = os.path.splitext(file.filename)[1].lower()

        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]

        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail="Only image files are allowed: jpg, jpeg, png, webp"
            )

        unique_filename = f"tour_{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

        panorama_url = f"/uploads/{unique_filename}"

        new_tour = PropertyTour(
            property_id=property_id,
            title=title,
            panorama_url=panorama_url,
            preview_image_url=panorama_url
        )

        db.add(new_tour)
        db.commit()
        db.refresh(new_tour)

        return {
            "id": new_tour.id,
            "property_id": new_tour.property_id,
            "title": new_tour.title,
            "panorama_url": new_tour.panorama_url,
            "preview_image_url": new_tour.preview_image_url
        }

@app.post("/properties/{property_id}/tour-scenes/upload")
def upload_property_tour_scene(
    property_id: int,
    file: UploadFile = File(...),
    title: str = Form("360° Tour Scene"),
    sort_order: int = Form(1),
    position_x: int = Form(50),
    position_y: int = Form(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can upload tour scenes")

    if property_item.host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can upload tour scenes only to your own property"
        )

    file_extension = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed: jpg, jpeg, png, webp"
        )

    unique_filename = f"scene_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    panorama_url = f"/uploads/{unique_filename}"

    new_scene = PropertyTourScene(
        property_id=property_id,
        title=title,
        panorama_url=panorama_url,
        preview_image_url=panorama_url,
        sort_order=sort_order,
        position_x=position_x,
        position_y=position_y
    )

    db.add(new_scene)
    db.commit()
    db.refresh(new_scene)

    return {
        "id": new_scene.id,
        "property_id": new_scene.property_id,
        "title": new_scene.title,
        "panorama_url": new_scene.panorama_url,
        "preview_image_url": new_scene.preview_image_url,
        "sort_order": new_scene.sort_order,
        "position_x": new_scene.position_x,
        "position_y": new_scene.position_y
    }


@app.get("/properties/{property_id}/tour-scenes")
def get_property_tour_scenes(
    property_id: int,
    db: Session = Depends(get_db)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    scenes = (
        db.query(PropertyTourScene)
        .filter(PropertyTourScene.property_id == property_id)
        .order_by(PropertyTourScene.sort_order.asc(), PropertyTourScene.id.asc())
        .all()
    )

    return [
        {
            "id": scene.id,
            "property_id": scene.property_id,
            "title": scene.title,
            "panorama_url": scene.panorama_url,
            "preview_image_url": scene.preview_image_url,
            "sort_order": scene.sort_order,
            "position_x": scene.position_x,
            "position_y": scene.position_y
        }
        for scene in scenes
    ]

@app.patch("/tour-scenes/{scene_id}/position")
def update_tour_scene_position(
    scene_id: int,
    position_data: TourScenePositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scene = db.query(PropertyTourScene).filter(PropertyTourScene.id == scene_id).first()

    if not scene:
        raise HTTPException(status_code=404, detail="Tour scene not found")

    property_item = db.query(Property).filter(Property.id == scene.property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can update tour scene positions")

    if property_item.host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can update positions only for your own property scenes"
        )

    if position_data.position_x < 0 or position_data.position_x > 100:
        raise HTTPException(status_code=400, detail="position_x must be between 0 and 100")

    if position_data.position_y < 0 or position_data.position_y > 100:
        raise HTTPException(status_code=400, detail="position_y must be between 0 and 100")

    scene.position_x = position_data.position_x
    scene.position_y = position_data.position_y

    db.commit()
    db.refresh(scene)

    return {
        "id": scene.id,
        "property_id": scene.property_id,
        "title": scene.title,
        "panorama_url": scene.panorama_url,
        "preview_image_url": scene.preview_image_url,
        "sort_order": scene.sort_order,
        "position_x": scene.position_x,
        "position_y": scene.position_y
    }

@app.delete("/tour-scenes/{scene_id}")
def delete_property_tour_scene(
    scene_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scene = db.query(PropertyTourScene).filter(PropertyTourScene.id == scene_id).first()

    if not scene:
        raise HTTPException(status_code=404, detail="Tour scene not found")

    property_item = db.query(Property).filter(Property.id == scene.property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can delete tour scenes")

    if property_item.host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can delete scenes only from your own property"
        )

    db.delete(scene)
    db.commit()

    return {"message": "Tour scene deleted successfully"}

@app.get("/properties/{property_id}/tour-scene-connections")
def get_tour_scene_connections(
    property_id: int,
    db: Session = Depends(get_db)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    connections = (
        db.query(TourSceneConnection)
        .filter(TourSceneConnection.property_id == property_id)
        .order_by(TourSceneConnection.id.asc())
        .all()
    )

    return [
        {
            "id": connection.id,
            "property_id": connection.property_id,
            "source_scene_id": connection.source_scene_id,
            "target_scene_id": connection.target_scene_id,
            "label": connection.label,
        }
        for connection in connections
    ]


@app.post("/properties/{property_id}/tour-scene-connections")
def create_tour_scene_connection(
    property_id: int,
    connection_data: TourSceneConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    property_item = db.query(Property).filter(Property.id == property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can create scene connections")

    if property_item.host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can create connections only for your own property"
        )

    if connection_data.source_scene_id == connection_data.target_scene_id:
        raise HTTPException(
            status_code=400,
            detail="Source scene and target scene must be different"
        )

    source_scene = db.query(PropertyTourScene).filter(
        PropertyTourScene.id == connection_data.source_scene_id,
        PropertyTourScene.property_id == property_id
    ).first()

    target_scene = db.query(PropertyTourScene).filter(
        PropertyTourScene.id == connection_data.target_scene_id,
        PropertyTourScene.property_id == property_id
    ).first()

    if not source_scene or not target_scene:
        raise HTTPException(
            status_code=400,
            detail="Both source and target scenes must belong to this property"
        )

    existing_connection = db.query(TourSceneConnection).filter(
        TourSceneConnection.source_scene_id == connection_data.source_scene_id,
        TourSceneConnection.target_scene_id == connection_data.target_scene_id
    ).first()

    if existing_connection:
        raise HTTPException(
            status_code=400,
            detail="This scene connection already exists"
        )

    new_connection = TourSceneConnection(
        property_id=property_id,
        source_scene_id=connection_data.source_scene_id,
        target_scene_id=connection_data.target_scene_id,
        label=connection_data.label
    )

    db.add(new_connection)
    db.commit()
    db.refresh(new_connection)

    return {
        "id": new_connection.id,
        "property_id": new_connection.property_id,
        "source_scene_id": new_connection.source_scene_id,
        "target_scene_id": new_connection.target_scene_id,
        "label": new_connection.label,
    }


@app.delete("/tour-scene-connections/{connection_id}")
def delete_tour_scene_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    connection = db.query(TourSceneConnection).filter(
        TourSceneConnection.id == connection_id
    ).first()

    if not connection:
        raise HTTPException(status_code=404, detail="Scene connection not found")

    property_item = db.query(Property).filter(
        Property.id == connection.property_id
    ).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can delete scene connections")

    if property_item.host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can delete connections only for your own property"
        )

    db.delete(connection)
    db.commit()

    return {"message": "Scene connection deleted successfully"}

@app.get("/tour-scenes/{scene_id}/hotspots")
def get_tour_scene_hotspots(
    scene_id: int,
    db: Session = Depends(get_db)
):
    scene = db.query(PropertyTourScene).filter(
        PropertyTourScene.id == scene_id
    ).first()

    if not scene:
        raise HTTPException(status_code=404, detail="Tour scene not found")

    hotspots = db.query(TourSceneHotspot).filter(
        TourSceneHotspot.scene_id == scene_id
    ).all()

    return [
        {
            "id": hotspot.id,
            "scene_id": hotspot.scene_id,
            "target_scene_id": hotspot.target_scene_id,
            "label": hotspot.label,
            "pitch": float(hotspot.pitch),
            "yaw": float(hotspot.yaw),
        }
        for hotspot in hotspots
    ]


@app.post("/tour-scenes/{scene_id}/hotspots")
def create_tour_scene_hotspot(
    scene_id: int,
    hotspot_data: TourSceneHotspotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scene = db.query(PropertyTourScene).filter(
        PropertyTourScene.id == scene_id
    ).first()

    if not scene:
        raise HTTPException(status_code=404, detail="Source scene not found")

    property_item = db.query(Property).filter(
        Property.id == scene.property_id
    ).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can create hotspots")

    if property_item.host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can create hotspots only for your own property"
        )

    target_scene = db.query(PropertyTourScene).filter(
        PropertyTourScene.id == hotspot_data.target_scene_id,
        PropertyTourScene.property_id == scene.property_id
    ).first()

    if not target_scene:
        raise HTTPException(
            status_code=400,
            detail="Target scene must belong to the same property"
        )

    if scene.id == target_scene.id:
        raise HTTPException(
            status_code=400,
            detail="Target scene must be different from source scene"
        )

    new_hotspot = TourSceneHotspot(
        scene_id=scene_id,
        target_scene_id=hotspot_data.target_scene_id,
        label=hotspot_data.label,
        pitch=hotspot_data.pitch,
        yaw=hotspot_data.yaw
    )

    db.add(new_hotspot)
    db.commit()
    db.refresh(new_hotspot)

    return {
        "id": new_hotspot.id,
        "scene_id": new_hotspot.scene_id,
        "target_scene_id": new_hotspot.target_scene_id,
        "label": new_hotspot.label,
        "pitch": float(new_hotspot.pitch),
        "yaw": float(new_hotspot.yaw),
    }


@app.delete("/tour-hotspots/{hotspot_id}")
def delete_tour_scene_hotspot(
    hotspot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hotspot = db.query(TourSceneHotspot).filter(
        TourSceneHotspot.id == hotspot_id
    ).first()

    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found")

    scene = db.query(PropertyTourScene).filter(
        PropertyTourScene.id == hotspot.scene_id
    ).first()

    if not scene:
        raise HTTPException(status_code=404, detail="Source scene not found")

    property_item = db.query(Property).filter(
        Property.id == scene.property_id
    ).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can delete hotspots")

    if property_item.host_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can delete hotspots only for your own property"
        )

    db.delete(hotspot)
    db.commit()

    return {"message": "Hotspot deleted successfully"}

@app.post("/bookings/{booking_id}/conversation")
def create_or_get_conversation(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    property_item = db.query(Property).filter(Property.id == booking.property_id).first()

    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    is_booking_user = booking.user_id == current_user.id
    is_property_host = property_item.host_id == current_user.id

    if not is_booking_user and not is_property_host:
        raise HTTPException(status_code=403, detail="You are not allowed to access this conversation")

    existing_conversation = db.query(Conversation).filter(
        Conversation.booking_id == booking_id
    ).first()

    if existing_conversation:
        return existing_conversation

    new_conversation = Conversation(
        booking_id=booking.id,
        user_id=booking.user_id,
        host_id=property_item.host_id,
        property_id=property_item.id
    )

    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)

    return new_conversation


@app.get("/conversations")
def get_my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = db.query(Conversation).filter(
        (Conversation.user_id == current_user.id) |
        (Conversation.host_id == current_user.id)
    ).order_by(Conversation.updated_at.desc()).all()

    result = []

    for conversation in conversations:
        property_item = db.query(Property).filter(Property.id == conversation.property_id).first()
        booking = db.query(Booking).filter(Booking.id == conversation.booking_id).first()
        other_user_id = conversation.host_id if conversation.user_id == current_user.id else conversation.user_id
        other_user = db.query(User).filter(User.id == other_user_id).first()

        last_message = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.created_at.desc()).first()

        result.append({
            "id": conversation.id,
            "booking_id": conversation.booking_id,
            "property_id": conversation.property_id,
            "property_title": property_item.title if property_item else "Property",
            "booking_status": booking.status if booking else None,
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "role": other_user.role,
                "avatar_url": other_user.avatar_url
            } if other_user else None,
            "last_message": last_message.message_text if last_message else None,
            "last_message_at": last_message.created_at if last_message else None,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at
        })

    return result


@app.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in [conversation.user_id, conversation.host_id]:
        raise HTTPException(status_code=403, detail="You are not allowed to view this conversation")

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()

    return [
        {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "message_text": message.message_text,
            "is_read": message.is_read,
            "created_at": message.created_at
        }
        for message in messages
    ]


@app.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in [conversation.user_id, conversation.host_id]:
        raise HTTPException(status_code=403, detail="You are not allowed to send messages in this conversation")

    clean_text = message_data.message_text.strip()

    if not clean_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    new_message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        message_text=clean_text
    )

    conversation.updated_at = text("CURRENT_TIMESTAMP")

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {
        "id": new_message.id,
        "conversation_id": new_message.conversation_id,
        "sender_id": new_message.sender_id,
        "message_text": new_message.message_text,
        "is_read": new_message.is_read,
        "created_at": new_message.created_at
    }