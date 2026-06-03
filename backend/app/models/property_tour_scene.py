from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, text
from app.database import Base

class PropertyTourScene(Base):
    __tablename__ = "property_tour_scenes"

    id = Column(Integer, primary_key=True, index=True)

    property_id = Column(
        Integer,
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False
    )

    title = Column(String(150), nullable=False)
    panorama_url = Column(String, nullable=False)
    preview_image_url = Column(String, nullable=True)
    sort_order = Column(Integer, nullable=False, server_default=text("1"))

    position_x = Column(Integer, nullable=False, server_default=text("50"))
    position_y = Column(Integer, nullable=False, server_default=text("50"))

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))