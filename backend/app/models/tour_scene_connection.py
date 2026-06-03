from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, text
from app.database import Base


class TourSceneConnection(Base):
    __tablename__ = "tour_scene_connections"

    id = Column(Integer, primary_key=True, index=True)

    property_id = Column(
        Integer,
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False
    )

    source_scene_id = Column(
        Integer,
        ForeignKey("property_tour_scenes.id", ondelete="CASCADE"),
        nullable=False
    )

    target_scene_id = Column(
        Integer,
        ForeignKey("property_tour_scenes.id", ondelete="CASCADE"),
        nullable=False
    )

    label = Column(String(150), nullable=True)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))