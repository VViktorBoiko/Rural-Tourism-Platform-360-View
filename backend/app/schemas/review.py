from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    property_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None
    is_visible: bool
    created_at: datetime

    class Config:
        from_attributes = True