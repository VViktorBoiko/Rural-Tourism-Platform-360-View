from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class PropertyImageCreate(BaseModel):
    image_url: HttpUrl
    is_main: bool = False

class PropertyImageResponse(BaseModel):
    id: int
    property_id: int
    image_url: str
    is_main: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PropertyTourCreate(BaseModel):
    title: Optional[str] = None
    panorama_url: HttpUrl
    preview_image_url: Optional[HttpUrl] = None

class PropertyTourResponse(BaseModel):
    id: int
    property_id: int
    title: Optional[str] = None
    panorama_url: str
    preview_image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True