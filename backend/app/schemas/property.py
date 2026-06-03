from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class PropertyCreate(BaseModel):
    title: str
    short_description: Optional[str] = None
    full_description: str
    property_type: str
    country: str
    city: str
    address: str
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: Decimal
    max_guests: int
    rules: Optional[str] = None
    cancellation_policy: Optional[str] = None

class PropertyResponse(BaseModel):
    id: int
    host_id: int
    title: str
    short_description: Optional[str] = None
    full_description: str
    property_type: str
    country: str
    city: str
    address: str
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: Decimal
    max_guests: int
    rules: Optional[str] = None
    cancellation_policy: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    property_type: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: Optional[Decimal] = None
    max_guests: Optional[int] = None
    rules: Optional[str] = None
    cancellation_policy: Optional[str] = None

class PropertyStatusUpdate(BaseModel):
    status: str