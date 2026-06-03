from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base

class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)

    property_id = Column(
        Integer,
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False
    )

    image_url = Column(String, nullable=False)

    is_main = Column(Boolean, default=False)