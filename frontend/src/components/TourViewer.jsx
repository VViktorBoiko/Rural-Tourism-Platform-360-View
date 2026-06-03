import { useEffect, useRef } from "react";
import "pannellum/build/pannellum.css";
import "pannellum";

function TourViewer({ imageUrl, hotSpots = [], onHotspotClick }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!imageUrl || !containerRef.current || !window.pannellum) return;

    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }

    viewerRef.current = window.pannellum.viewer(containerRef.current, {
      type: "equirectangular",
      panorama: imageUrl,
      autoLoad: true,
      showControls: true,
      compass: false,
      mouseZoom: true,
      draggable: true,
      keyboardZoom: true,
      crossOrigin: "anonymous",
      hotSpots: hotSpots.map((spot) => ({
        pitch: Number(spot.pitch),
        yaw: Number(spot.yaw),
        type: "info",
        text: spot.label || "Go to next view",
        clickHandlerFunc: () => {
          if (onHotspotClick) {
            onHotspotClick(spot.target_scene_id);
          }
        },
      })),
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [imageUrl, hotSpots, onHotspotClick]);

  return <div ref={containerRef} style={styles.viewer} />;
}

const styles = {
  viewer: {
    width: "100%",
    height: "460px",
    borderRadius: "24px",
    overflow: "hidden",
    backgroundColor: "#172117",
  },
};

export default TourViewer;