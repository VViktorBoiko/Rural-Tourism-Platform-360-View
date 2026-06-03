from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, text
from app.database import Base

class PropertyTour(Base):
    __tablename__ = "property_tours"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=True)
    panorama_url = Column(Text, nullable=False)
    preview_image_url = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))