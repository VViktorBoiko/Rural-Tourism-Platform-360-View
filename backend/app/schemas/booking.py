from pydantic import BaseModel
from datetime import date
from decimal import Decimal

class BookingCreate(BaseModel):
    property_id: int
    check_in_date: date
    check_out_date: date
    guests_count: int

class BookingResponse(BaseModel):
    id: int
    property_id: int
    user_id: int
    check_in_date: date
    check_out_date: date
    guests_count: int
    nights: int
    subtotal: Decimal
    taxes: Decimal
    total_price: Decimal
    status: str
    payment_status: str

    class Config:
        from_attributes = True

class BookingStatusUpdate(BaseModel):
    status: str