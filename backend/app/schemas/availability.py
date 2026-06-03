from pydantic import BaseModel
from datetime import date

class AvailabilityItem(BaseModel):
    booking_id: int
    check_in_date: date
    check_out_date: date
    status: str

class PropertyAvailabilityResponse(BaseModel):
    property_id: int
    unavailable_ranges: list[AvailabilityItem]

class PropertyCalendarResponse(BaseModel):
    property_id: int
    unavailable_dates: list[date]