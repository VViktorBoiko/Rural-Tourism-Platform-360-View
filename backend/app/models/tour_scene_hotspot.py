from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Numeric, text
from app.database import Base


class TourSceneHotspot(Base):
    __tablename__ = "tour_scene_hotspots"

    id = Column(Integer, primary_key=True, index=True)

    scene_id = Column(
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

    pitch = Column(Numeric(8, 4), nullable=False)
    yaw = Column(Numeric(8, 4), nullable=False)

    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))