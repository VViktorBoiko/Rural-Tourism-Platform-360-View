from pydantic import BaseModel

class AmenityResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class PropertyAmenityCreate(BaseModel):
    amenity_id: int