from sqlalchemy import Column, Integer, Text, Boolean, TIMESTAMP, ForeignKey, text
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    is_visible = Column(Boolean, nullable=False, server_default=text("TRUE"))

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))