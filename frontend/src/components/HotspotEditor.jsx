import { useEffect, useRef, useState } from "react";
import "pannellum/build/pannellum.css";
import "pannellum";

function HotspotEditor({
  imageUrl,
  targetScenes = [],
  onSaveHotspot,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  const [selectedCoords, setSelectedCoords] = useState(null);

  const [formData, setFormData] = useState({
    target_scene_id: "",
    label: "",
  });

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
    });

    viewerRef.current.on("mousedown", (event) => {
      const coords = viewerRef.current.mouseEventToCoords(event);

      if (!coords) return;

      setSelectedCoords({
        pitch: coords[0],
        yaw: coords[1],
      });
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [imageUrl]);

  const handleSave = () => {
    if (!selectedCoords) {
      alert("Please click inside panorama first.");
      return;
    }

    if (!formData.target_scene_id) {
      alert("Please select target scene.");
      return;
    }

    onSaveHotspot({
      target_scene_id: Number(formData.target_scene_id),
      label: formData.label,
      pitch: selectedCoords.pitch,
      yaw: selectedCoords.yaw,
    });

    setFormData({
      target_scene_id: "",
      label: "",
    });
  };

  return (
    <div style={styles.wrapper}>
      <div ref={containerRef} style={styles.viewer} />

      <div style={styles.panel}>
        <h3 style={styles.title}>Hotspot Navigation Editor</h3>

        <p style={styles.help}>
          Click inside the panorama to place a navigation hotspot.
        </p>

        <div style={styles.coordsBox}>
          <strong>Pitch:</strong>{" "}
          {selectedCoords ? selectedCoords.pitch.toFixed(2) : "-"}
          <br />
          <strong>Yaw:</strong>{" "}
          {selectedCoords ? selectedCoords.yaw.toFixed(2) : "-"}
        </div>

        <select
          value={formData.target_scene_id}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              target_scene_id: e.target.value,
            }))
          }
          style={styles.input}
        >
          <option value="">Select target scene</option>

          {targetScenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.title}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Hotspot label"
          value={formData.label}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              label: e.target.value,
            }))
          }
          style={styles.input}
        />

        <button onClick={handleSave} style={styles.button}>
          Save hotspot
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: "18px",
  },

  viewer: {
    width: "100%",
    height: "420px",
    borderRadius: "22px",
    overflow: "hidden",
    backgroundColor: "#172117",
  },

  panel: {
    backgroundColor: "#f8faf6",
    border: "1px solid #e0e4da",
    borderRadius: "18px",
    padding: "18px",
    display: "grid",
    gap: "14px",
  },

  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "950",
    color: "#172117",
  },

  help: {
    margin: 0,
    color: "#65705f",
    fontWeight: "600",
    lineHeight: 1.6,
  },

  coordsBox: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "12px",
    border: "1px solid #e0e4da",
    color: "#263526",
    fontWeight: "700",
  },

  input: {
    height: "48px",
    borderRadius: "12px",
    border: "1px solid #d0d0c8",
    padding: "0 14px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#fff",
  },

  button: {
    height: "52px",
    border: "none",
    borderRadius: "16px",
    backgroundColor: "#172117",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },
};

export default HotspotEditor;