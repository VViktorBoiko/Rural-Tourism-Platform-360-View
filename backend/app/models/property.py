from sqlalchemy import Column, Integer, String, Text, Numeric, TIMESTAMP, ForeignKey, text
from app.database import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(150), nullable=False)
    short_description = Column(String(255), nullable=True)
    full_description = Column(Text, nullable=False)
    property_type = Column(String(50), nullable=False)

    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    postal_code = Column(String(20), nullable=True)

    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)

    price_per_night = Column(Numeric(10, 2), nullable=False)
    max_guests = Column(Integer, nullable=False)

    rules = Column(Text, nullable=True)
    cancellation_policy = Column(Text, nullable=True)

    status = Column(String(20), nullable=False, server_default=text("'pending'"))

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))