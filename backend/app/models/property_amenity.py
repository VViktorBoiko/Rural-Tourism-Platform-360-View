from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from app.database import Base

class PropertyAmenity(Base):
    __tablename__ = "property_amenities"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    amenity_id = Column(Integer, ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("property_id", "amenity_id", name="unique_property_amenity"),
    )