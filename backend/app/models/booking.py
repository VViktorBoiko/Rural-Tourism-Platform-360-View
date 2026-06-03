from sqlalchemy import Column, Integer, Date, Numeric, String, TIMESTAMP, ForeignKey, text
from app.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    guests_count = Column(Integer, nullable=False)
    nights = Column(Integer, nullable=False)

    subtotal = Column(Numeric(10, 2), nullable=False)
    taxes = Column(Numeric(10, 2), nullable=False, server_default=text("0"))
    total_price = Column(Numeric(10, 2), nullable=False)

    status = Column(String(20), nullable=False, server_default=text("'pending'"))
    payment_status = Column(String(20), nullable=False, server_default=text("'unpaid'"))

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))