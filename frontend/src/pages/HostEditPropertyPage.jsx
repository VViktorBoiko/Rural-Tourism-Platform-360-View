import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import HotspotEditor from "../components/HotspotEditor";

function HostEditPropertyPage() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState(null);

  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [allAmenities, setAllAmenities] = useState([]);
  const [tour, setTour] = useState(null);

  const [imageForm, setImageForm] = useState({
    image_url: "",
    is_main: false,
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploadAsMain, setUploadAsMain] = useState(false);

  const [tourForm, setTourForm] = useState({
    title: "",
    panorama_url: "",
    preview_image_url: "",
  });

  const [tourFile, setTourFile] = useState(null);
  const [tourUploadTitle, setTourUploadTitle] = useState("360° Virtual Tour");

  const [selectedAmenityId, setSelectedAmenityId] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tourScenes, setTourScenes] = useState([]);
  const [sceneTitle, setSceneTitle] = useState("");
  const [sceneFile, setSceneFile] = useState(null);
  const [sceneUploading, setSceneUploading] = useState(false);
  const [customAmenityName, setCustomAmenityName] = useState("");
  const routeCanvasRef = useRef(null);
  const [draggingSceneId, setDraggingSceneId] = useState(null);

  const [sceneConnections, setSceneConnections] = useState([]);
  const [connectionForm, setConnectionForm] = useState({
    source_scene_id: "",
    target_scene_id: "",
    label: "",
  });

  const [selectedHotspotSceneId, setSelectedHotspotSceneId] = useState("");
  const [sceneHotspots, setSceneHotspots] = useState([]);

  const loadData = async () => {
    setError("");

    try {
      const [
        propertyResponse,
        imagesResponse,
        amenitiesResponse,
        allAmenitiesResponse,
      ] = await Promise.all([
        api.get(`/properties/${id}`),
        api.get(`/properties/${id}/images`).catch(() => ({ data: [] })),
        api.get(`/properties/${id}/amenities`).catch(() => ({ data: [] })),
        api.get("/amenities").catch(() => ({ data: [] })),
      ]);

      setProperty(propertyResponse.data);
      setImages(imagesResponse.data || []);
      setAmenities(amenitiesResponse.data || []);
      setAllAmenities(allAmenitiesResponse.data || []);

      setFormData({
        title: propertyResponse.data.title || "",
        short_description: propertyResponse.data.short_description || "",
        full_description: propertyResponse.data.full_description || "",
        property_type: propertyResponse.data.property_type || "glamping",
        country: propertyResponse.data.country || "Lithuania",
        city: propertyResponse.data.city || "",
        address: propertyResponse.data.address || "",
        postal_code: propertyResponse.data.postal_code || "",
        latitude: propertyResponse.data.latitude || "",
        longitude: propertyResponse.data.longitude || "",
        price_per_night: propertyResponse.data.price_per_night || "",
        max_guests: propertyResponse.data.max_guests || 1,
        rules: propertyResponse.data.rules || "",
        cancellation_policy: propertyResponse.data.cancellation_policy || "",
      });

      try {
        const tourResponse = await api.get(`/properties/${id}/tour`);
        setTour(tourResponse.data);
      } catch {
        setTour(null);
      }
    } catch (err) {
      console.error("Host edit property load error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load property management page."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTourScenes = async () => {
    try {
      const response = await api.get(`/properties/${id}/tour-scenes`);
      setTourScenes(response.data || []);
    } catch (err) {
      console.error("Failed to load tour scenes", err);
    }
  };

  const fetchSceneConnections = async () => {
    try {
      const response = await api.get(`/properties/${id}/tour-scene-connections`);
      setSceneConnections(response.data || []);
    } catch (err) {
      console.error("Failed to load scene connections", err);
    }
  };

  const fetchSceneHotspots = async (sceneId) => {
    if (!sceneId) {
      setSceneHotspots([]);
      return;
    }

    try {
      const response = await api.get(`/tour-scenes/${sceneId}/hotspots`);
      setSceneHotspots(response.data || []);
    } catch (err) {
      console.error("Failed to load scene hotspots", err);
      setSceneHotspots([]);
    }
  };

  useEffect(() => {
    loadData();
    fetchTourScenes();
    fetchSceneConnections();
  }, [id]);

  useEffect(() => {
    if (selectedHotspotSceneId) {
      fetchSceneHotspots(selectedHotspotSceneId);
    }
  }, [selectedHotspotSceneId]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setActionLoading("property");

    try {
      const response = await api.patch(`/properties/${id}`, {
        ...formData,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        price_per_night: Number(formData.price_per_night),
        max_guests: Number(formData.max_guests),
      });

      setProperty(response.data);
      setMessage("Property details updated successfully.");
    } catch (err) {
      console.error("Update property error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update property."
      );
    } finally {
      setActionLoading("");
    }
  };

  const updateScenePosition = async (sceneId, x, y) => {
    try {
      await api.patch(`/tour-scenes/${sceneId}/position`, {
        position_x: Math.round(x),
        position_y: Math.round(y),
      });
    } catch (error) {
      console.error("Failed to update scene position:", error);
      alert("Failed to save scene position.");
    }
  };

  const handleSceneMouseDown = (sceneId) => {
    setDraggingSceneId(sceneId);
  };

  const handleSceneMouseMove = (event) => {
    if (!draggingSceneId || !routeCanvasRef.current) return;

    const rect = routeCanvasRef.current.getBoundingClientRect();

    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = ((event.clientY - rect.top) / rect.height) * 100;

    x = Math.max(3, Math.min(97, x));
    y = Math.max(3, Math.min(97, y));

    setTourScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === draggingSceneId
          ? {
              ...scene,
              position_x: Math.round(x),
              position_y: Math.round(y),
            }
          : scene
      )
    );
  };

  const handleSceneMouseUp = () => {
    if (!draggingSceneId) return;

    const draggedScene = tourScenes.find((scene) => scene.id === draggingSceneId);

    if (draggedScene) {
      updateScenePosition(
        draggedScene.id,
        draggedScene.position_x || 50,
        draggedScene.position_y || 50
      );
    }

    setDraggingSceneId(null);
  };

  const handleAddImage = async (e) => {
    e.preventDefault();

    if (!imageForm.image_url.trim()) {
      setError("Please enter image URL.");
      return;
    }

    setMessage("");
    setError("");
    setActionLoading("image");

    try {
      await api.post(`/properties/${id}/images`, imageForm);

      setImageForm({
        image_url: "",
        is_main: false,
      });

      const response = await api.get(`/properties/${id}/images`);
      setImages(response.data || []);
      setMessage("Image added successfully.");
    } catch (err) {
      console.error("Add image error:", err);
      setError(
        err.response?.data?.detail || err.message || "Failed to add image."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleUploadImageFile = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      setError("Please select an image file.");
      return;
    }

    setMessage("");
    setError("");
    setActionLoading("image-upload");

    try {
      const uploadData = new FormData();
      uploadData.append("file", imageFile);

      await api.post(
        `/properties/${id}/images/upload?is_main=${uploadAsMain}`,
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setImageFile(null);
      setUploadAsMain(false);

      const response = await api.get(`/properties/${id}/images`);
      setImages(response.data || []);

      setMessage("Image uploaded successfully.");
    } catch (err) {
      console.error("Upload image error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to upload image."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteImage = async (imageId) => {
    setMessage("");
    setError("");
    setActionLoading(`delete-image-${imageId}`);

    try {
      await api.delete(`/images/${imageId}`);
      setImages((prev) => prev.filter((image) => image.id !== imageId));
      setMessage("Image deleted successfully.");
    } catch (err) {
      console.error("Delete image error:", err);
      setError(
        err.response?.data?.detail || err.message || "Failed to delete image."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleAddAmenity = async (e) => {
    e.preventDefault();

    console.log("Add amenity clicked");
    console.log("selectedAmenityId:", selectedAmenityId);
    console.log("customAmenityName:", customAmenityName);

    if (!selectedAmenityId && !customAmenityName.trim()) {
      setError("Please select an amenity or enter a custom amenity name.");
      return;
    }

    setMessage("");
    setError("");
    setActionLoading("amenity");

    try {
      let amenityId = selectedAmenityId ? Number(selectedAmenityId) : null;

      if (!amenityId && customAmenityName.trim()) {
        const amenityResponse = await api.post("/amenities", {
          name: customAmenityName.trim(),
        });

        amenityId = amenityResponse.data.id;
      }

      await api.post(`/properties/${id}/amenities`, {
        amenity_id: amenityId,
      });

      setSelectedAmenityId("");
      setCustomAmenityName("");

      const [propertyAmenitiesResponse, allAmenitiesResponse] =
        await Promise.all([
          api.get(`/properties/${id}/amenities`),
          api.get("/amenities"),
        ]);

      setAmenities(propertyAmenitiesResponse.data || []);
      setAllAmenities(allAmenitiesResponse.data || []);

      setMessage("Amenity added successfully.");
    } catch (err) {
      console.error("Add amenity error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to add amenity."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteAmenity = async (amenityId) => {
    setMessage("");
    setError("");
    setActionLoading(`delete-amenity-${amenityId}`);

    try {
      await api.delete(`/properties/${id}/amenities/${amenityId}`);
      setAmenities((prev) => prev.filter((amenity) => amenity.id !== amenityId));
      setMessage("Amenity removed successfully.");
    } catch (err) {
      console.error("Delete amenity error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to remove amenity."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleTourFormChange = (e) => {
    const { name, value } = e.target;

    setTourForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTour = async (e) => {
    e.preventDefault();

    if (!tourForm.panorama_url.trim()) {
      setError("Please enter panorama URL.");
      return;
    }

    setMessage("");
    setError("");
    setActionLoading("tour");

    try {
      await api.post(`/properties/${id}/tour`, {
        title: tourForm.title || null,
        panorama_url: tourForm.panorama_url,
        preview_image_url: tourForm.preview_image_url || null,
      });

      setTourForm({
        title: "",
        panorama_url: "",
        preview_image_url: "",
      });

      const response = await api.get(`/properties/${id}/tour`);
      setTour(response.data);
      setMessage("360° tour added successfully.");
    } catch (err) {
      console.error("Add tour error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to add 360° tour."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleUploadTourFile = async (e) => {
    e.preventDefault();

    if (!tourFile) {
      setError("Please select a panorama image file.");
      return;
    }

    setMessage("");
    setError("");
    setActionLoading("tour-upload");

    try {
      const uploadData = new FormData();
      uploadData.append("file", tourFile);

      await api.post(
        `/properties/${id}/tour/upload?title=${encodeURIComponent(
          tourUploadTitle || "360° Virtual Tour"
        )}`,
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setTourFile(null);
      setTourUploadTitle("360° Virtual Tour");

      const response = await api.get(`/properties/${id}/tour`);
      setTour(response.data);

      setMessage("360° panorama uploaded successfully.");
    } catch (err) {
      console.error("Upload tour error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to upload 360° panorama."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteTour = async () => {
    if (!tour) return;

    setMessage("");
    setError("");
    setActionLoading("delete-tour");

    try {
      await api.delete(`/tours/${tour.id}`);
      setTour(null);
      setMessage("360° tour deleted successfully.");
    } catch (err) {
      console.error("Delete tour error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to delete 360° tour."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleUploadScene = async () => {
    if (!sceneFile) return;

    try {
      setSceneUploading(true);

      const formData = new FormData();

      formData.append("file", sceneFile);
      formData.append("title", sceneTitle || "360 Scene");

      await api.post(
        `/properties/${id}/tour-scenes/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSceneTitle("");
      setSceneFile(null);

      const response = await api.get(`/properties/${id}/tour-scenes`);
      setTourScenes(response.data || []);

    } catch (err) {
      console.error("Scene upload error:", err);
    } finally {
      setSceneUploading(false);
    }
  };

  const handleDeleteScene = async (sceneId) => {
    try {
      await api.delete(`/tour-scenes/${sceneId}`);

      setTourScenes((prev) => 
        prev.filter((scene) => scene.id !== sceneId)
      );
    } catch (err) {
      console.error("Delete scene error:", err);
    }
  };

  if (loading) {
    return <LoadingState message="Loading property management..." />;
  }

  if (error && !property) {
    return <ErrorState message={error} />;
  }

  const availableAmenities = allAmenities.filter(
    (amenity) => !amenities.some((item) => item.id === amenity.id)
  );

  const handleAddSceneConnection = async (e) => {
    e.preventDefault();

    if (!connectionForm.source_scene_id || !connectionForm.target_scene_id) {
      setError("Please select source and target scenes.");
      return;
    }

    if (connectionForm.source_scene_id === connectionForm.target_scene_id) {
      setError("Source and target scenes must be different.");
      return;
    }

    setMessage("");
    setError("");
    setActionLoading("scene-connection");

    try {
      await api.post(`/properties/${id}/tour-scene-connections`, {
        source_scene_id: Number(connectionForm.source_scene_id),
        target_scene_id: Number(connectionForm.target_scene_id),
        label: connectionForm.label || null,
      });

      setConnectionForm({
        source_scene_id: "",
        target_scene_id: "",
        label: "",
      });

      await fetchSceneConnections();

      setMessage("Scene connection added successfully.");
    } catch (err) {
      console.error("Add scene connection error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to add scene connection."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteSceneConnection = async (connectionId) => {
    setMessage("");
    setError("");
    setActionLoading(`delete-scene-connection-${connectionId}`);

    try {
      await api.delete(`/tour-scene-connections/${connectionId}`);

      setSceneConnections((prev) =>
        prev.filter((connection) => connection.id !== connectionId)
      );

      setMessage("Scene connection deleted successfully.");
    } catch (err) {
      console.error("Delete scene connection error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to delete scene connection."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleSaveHotspot = async (hotspotData) => {
    if (!selectedHotspotSceneId) {
      setError("Please select source scene.");
      return;
    }

    setMessage("");
    setError("");
    setActionLoading("hotspot");

    try {
      await api.post(
        `/tour-scenes/${selectedHotspotSceneId}/hotspots`,
        hotspotData
      );

      await fetchSceneHotspots(selectedHotspotSceneId);

      setMessage("Hotspot created successfully.");
    } catch (err) {
      console.error("Create hotspot error:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to create hotspot."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteHotspot = async (hotspotId) => {
    try {
      await api.delete(`/tour-hotspots/${hotspotId}`);

      setSceneHotspots((prev) =>
        prev.filter((spot) => spot.id !== hotspotId)
      );
    } catch (err) {
      console.error("Delete hotspot error:", err);
    }
  };

  return (
    <div>
      <Link to="/host/properties" style={styles.backLink}>
        ← Back to my properties
      </Link>

      <section style={styles.header}>
        <div>
          <span style={styles.badge}>Host management</span>
          <h1 style={styles.title}>{property?.title || "Edit Property"}</h1>
          <p style={styles.subtitle}>
            Update listing information, images, amenities and 360° virtual tour.
          </p>
        </div>

        <Link to={`/properties/${id}`} style={styles.previewButton}>
          View public page
        </Link>
      </section>

      {message ? <p style={styles.success}>{message}</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}

      <div style={styles.layout}>
        <div style={styles.leftColumn}>
          <form onSubmit={handleSaveProperty} style={styles.card}>
          <h2 style={styles.sectionTitle}>Property details</h2>

          <div style={styles.grid}>
            <label style={styles.label}>
              Title
              <input
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Property type
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleFormChange}
                required
                style={styles.input}
              >
                <option value="glamping">Glamping</option>
                <option value="cottage">Cottage</option>
                <option value="farmstay">Farmstay</option>
                <option value="guesthouse">Guesthouse</option>
                <option value="villa">Villa</option>
              </select>
            </label>

            <label style={styles.label}>
              Country
              <input
                name="country"
                value={formData.country}
                onChange={handleFormChange}
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              City
              <input
                name="city"
                value={formData.city}
                onChange={handleFormChange}
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Address
              <input
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Postal code
              <input
                name="postal_code"
                value={formData.postal_code}
                onChange={handleFormChange}
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Latitude
              <input
                type="number"
                step="0.000001"
                name="latitude"
                value={formData.latitude}
                onChange={handleFormChange}
                style={styles.input}
                placeholder="Example: 54.6872"
              />
            </label>

            <label style={styles.label}>
              Longitude
              <input
                type="number"
                step="0.000001"
                name="longitude"
                value={formData.longitude}
                onChange={handleFormChange}
                style={styles.input}
                placeholder="Example: 25.2797"
              />
            </label>

            <label style={styles.label}>
              Price per night (€)
              <input
                type="number"
                name="price_per_night"
                value={formData.price_per_night}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Max guests
              <input
                type="number"
                name="max_guests"
                value={formData.max_guests}
                onChange={handleFormChange}
                min="1"
                required
                style={styles.input}
              />
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Short description
              <textarea
                name="short_description"
                value={formData.short_description}
                onChange={handleFormChange}
                required
                style={styles.textarea}
              />
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Full description
              <textarea
                name="full_description"
                value={formData.full_description}
                onChange={handleFormChange}
                required
                style={styles.largeTextarea}
              />
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Rules
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleFormChange}
                style={styles.textarea}
              />
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Cancellation policy
              <textarea
                name="cancellation_policy"
                value={formData.cancellation_policy}
                onChange={handleFormChange}
                style={styles.textarea}
              />
            </label>
          </div>

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={actionLoading === "property"}
          >
            {actionLoading === "property" ? "Saving..." : "Save property"}
          </button>
        </form>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Amenities</h2>

            <form onSubmit={handleAddAmenity} style={styles.smallForm}>
              <select
                value={selectedAmenityId}
                onChange={(e) => {
                  setSelectedAmenityId(e.target.value);
                  if (e.target.value) setCustomAmenityName("");
                }}
                style={styles.input}
              >
                <option value="">Select existing amenity</option>
                {availableAmenities.map((amenity) => (
                  <option key={amenity.id} value={amenity.id}>
                    {amenity.name}
                  </option>
                ))}
              </select>

              <p style={styles.orText}>or write your own amenity</p>

              <input
                type="text"
                value={customAmenityName}
                onChange={(e) => {
                  setCustomAmenityName(e.target.value);
                  if (e.target.value.trim()) setSelectedAmenityId("");
                }}
                placeholder="Example: Private sauna, Kayak rental"
                style={styles.input}
              />

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={actionLoading === "amenity"}
              >
                {actionLoading === "amenity" ? "Adding..." : "Add amenity"}
              </button>
            </form>

            <div style={styles.tags}>
              {amenities.map((amenity) => (
                <div key={amenity.id} style={styles.tag}>
                  <span>{amenity.name}</span>
                  <button
                    onClick={() => handleDeleteAmenity(amenity.id)}
                    style={styles.tagButton}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={styles.sideColumn}>
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Images</h2>

            <form onSubmit={handleUploadImageFile} style={styles.smallForm}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={styles.fileInput}
              />

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={uploadAsMain}
                  onChange={(e) => setUploadAsMain(e.target.checked)}
                />
                Set as main image
              </label>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={actionLoading === "image-upload"}
              >
                {actionLoading === "image-upload" ? "Uploading..." : "Upload image"}
              </button>
            </form>

            <p style={styles.orText}>or add image by URL</p>

            <form onSubmit={handleAddImage} style={styles.smallForm}>
              <input
                type="url"
                value={imageForm.image_url}
                onChange={(e) =>
                  setImageForm((prev) => ({
                    ...prev,
                    image_url: e.target.value,
                  }))
                }
                placeholder="Image URL"
                style={styles.input}
              />

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={imageForm.is_main}
                  onChange={(e) =>
                    setImageForm((prev) => ({
                      ...prev,
                      is_main: e.target.checked,
                    }))
                  }
                />
                Main image
              </label>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={actionLoading === "image"}
              >
                {actionLoading === "image" ? "Adding..." : "Add image"}
              </button>
            </form>

            <div style={styles.imageGrid}>
              {images.map((image) => (
                <div key={image.id} style={styles.imageCard}>
                  <img
                    src={getImageUrl(image.image_url)}
                    alt="Property"
                    style={styles.image}
                  />

                  <div style={styles.imageFooter}>
                    <span>{image.is_main ? "Main" : "Image"}</span>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      style={styles.smallDeleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>360° Tour</h2>

            {tour ? (
              <div>
                <p style={styles.text}>
                  <strong>{tour.title || "Virtual tour"}</strong>
                </p>

                <a
                  href={getImageUrl(tour.panorama_url)}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.link}
                >
                  Open tour
                </a>

                {tour.preview_image_url ? (
                  <img
                    src={getImageUrl(tour.preview_image_url)}
                    alt="Tour preview"
                    style={styles.tourPreview}
                  />
                ) : null}

                <button
                  onClick={handleDeleteTour}
                  style={styles.deleteButton}
                  disabled={actionLoading === "delete-tour"}
                >
                  {actionLoading === "delete-tour" ? "Deleting..." : "Delete tour"}
                </button>
              </div>
            ) : (
              <div style={styles.tourOptions}>

                <form onSubmit={handleAddTour} style={styles.smallForm}>
                  <h3 style={styles.smallSectionTitle}>
                    Add external / Google virtual tour link
                  </h3>

                  <p style={styles.helpText}>
                    Paste a Google Maps, Street View, Kuula, Matterport or other virtual
                    tour link.
                  </p>

                  <input
                    name="title"
                    value={tourForm.title}
                    onChange={handleTourFormChange}
                    placeholder="Tour title"
                    style={styles.input}
                  />

                  <input
                    name="panorama_url"
                    value={tourForm.panorama_url}
                    onChange={handleTourFormChange}
                    placeholder="External tour or Google Street View URL"
                    style={styles.input}
                    required
                  />

                  <input
                    name="preview_image_url"
                    value={tourForm.preview_image_url}
                    onChange={handleTourFormChange}
                    placeholder="Preview image URL optional"
                    style={styles.input}
                  />

                  <button
                    type="submit"
                    style={styles.primaryButton}
                    disabled={actionLoading === "tour"}
                  >
                    {actionLoading === "tour" ? "Adding..." : "Add external tour"}
                  </button>
                </form>
              </div>
            )}
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Visual 360° Tour Builder</h2>

            <p style={styles.sectionDescription}>
              Upload panorama scenes and arrange them on the route canvas. These points
              will later define how guests navigate through the virtual tour.
            </p>

            <div style={styles.sceneUploadBox}>
              <input
                type="text"
                placeholder="Scene title"
                value={sceneTitle}
                onChange={(e) => setSceneTitle(e.target.value)}
                style={styles.input}
              />

              <label style={styles.fileUploadLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSceneFile(e.target.files[0])}
                  style={{ display: "none" }}
                />

                {sceneFile ? sceneFile.name : "Choose panorama file"}
              </label>

              <button
                type="button"
                onClick={handleUploadScene}
                disabled={sceneUploading}
                style={styles.uploadButton}
              >
                {sceneUploading ? "Uploading..." : "Upload Scene"}
              </button>
            </div>

            <div style={styles.hotspotEditorWrapper}>
              <h3 style={styles.smallSectionTitle}>
                Panorama Hotspot Navigation
              </h3>

              <p style={styles.helpText}>
                Select a panorama scene, click inside the panorama and create navigation
                points between scenes.
              </p>

              <select
                value={selectedHotspotSceneId}
                onChange={(e) => setSelectedHotspotSceneId(e.target.value)}
                style={styles.input}
              >
                <option value="">Select panorama scene</option>

                {tourScenes.map((scene) => (
                  <option key={scene.id} value={scene.id}>
                    {scene.title}
                  </option>
                ))}
              </select>

              {selectedHotspotSceneId ? (
                <>
                  <HotspotEditor
                    imageUrl={getImageUrl(
                      tourScenes.find(
                        (scene) =>
                          scene.id === Number(selectedHotspotSceneId)
                      )?.panorama_url
                    )}
                    targetScenes={tourScenes.filter(
                      (scene) =>
                        scene.id !== Number(selectedHotspotSceneId)
                    )}
                    onSaveHotspot={handleSaveHotspot}
                  />

                  <div style={styles.hotspotList}>
                    {sceneHotspots.map((spot) => {
                      const targetScene = tourScenes.find(
                        (scene) => scene.id === spot.target_scene_id
                      );

                      return (
                        <div key={spot.id} style={styles.hotspotItem}>
                          <div>
                            <strong>
                              {targetScene?.title || "Unknown scene"}
                            </strong>

                            <p style={styles.hotspotCoords}>
                              Pitch: {Number(spot.pitch).toFixed(2)}
                              {" | "}
                              Yaw: {Number(spot.yaw).toFixed(2)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteHotspot(spot.id)}
                            style={styles.smallDeleteButton}
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>

            <h3 style={styles.smallSectionTitle}>Uploaded Panorama Scenes</h3>

            <div style={styles.sceneGrid}>
              {tourScenes.map((scene) => (
                <div key={scene.id} style={styles.sceneCard}>
                  {scene.preview_image_url || scene.panorama_url ? (
                    <img
                      src={getImageUrl(scene.preview_image_url || scene.panorama_url)}
                      alt={scene.title}
                      style={styles.scenePreview}
                    />
                  ) : null}

                  <div style={styles.sceneInfo}>
                    <div>
                      <strong>{scene.title}</strong>
                      <p style={styles.scenePositionText}>
                        X: {scene.position_x || 50}% / Y: {scene.position_y || 50}%
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteScene(scene.id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:8000${url}`;
}

const styles = {
  backLink: {
    display: "inline-block",
    marginBottom: "20px",
    textDecoration: "none",
    color: "#263526",
    fontWeight: "800",
  },

  header: {
    backgroundColor: "#dfe8d3",
    borderRadius: "24px",
    padding: "28px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  badge: {
    backgroundColor: "#fff",
    color: "#384a35",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "13px",
  },

  title: {
    margin: "14px 0 8px 0",
    fontSize: "40px",
    fontWeight: "950",
    color: "#fff",
  },

  subtitle: {
    margin: 0,
    color: "#3d4738",
    fontSize: "16px",
    fontWeight: "600",
  },

  previewButton: {
    textDecoration: "none",
    backgroundColor: "#111",
    color: "#fff",
    padding: "14px 20px",
    borderRadius: "14px",
    fontWeight: "900",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "24px",
    alignItems: "start",
  },

  sideColumn: {
    display: "grid",
    gap: "24px",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: "22px",
    padding: "24px",
    border: "1px solid #e2e2dc",
    boxShadow: "0 12px 30px rgba(31, 47, 31, 0.08)",
  },

  sectionTitle: {
    margin: "0 0 18px 0",
    fontSize: "24px",
    fontWeight: "950",
    color: "#1f1f1f",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
    gap: "16px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontWeight: "800",
    color: "#263526",
    fontSize: "14px",
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

  textarea: {
    minHeight: "92px",
    borderRadius: "12px",
    border: "1px solid #d0d0c8",
    padding: "14px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },

  largeTextarea: {
    minHeight: "140px",
    borderRadius: "12px",
    border: "1px solid #d0d0c8",
    padding: "14px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },

  primaryButton: {
    marginTop: "18px",
    padding: "13px 20px",
    borderRadius: "14px",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },

  deleteButton: {
    marginTop: "18px",
    padding: "13px 20px",
    borderRadius: "14px",
    border: "none",
    backgroundColor: "#b42318",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },

  smallForm: {
    display: "grid",
    gap: "12px",
  },

  checkboxLabel: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    fontWeight: "800",
    color: "#263526",
  },

  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginTop: "18px",
  },

  imageCard: {
    border: "1px solid #ddd",
    borderRadius: "14px",
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  image: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    display: "block",
  },

  imageFooter: {
    padding: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    fontWeight: "800",
  },

  smallDeleteButton: {
    border: "none",
    backgroundColor: "#b42318",
    color: "#fff",
    borderRadius: "8px",
    padding: "6px 9px",
    cursor: "pointer",
    fontWeight: "800",
  },

  tags: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
  },

  tag: {
    backgroundColor: "#edf4e7",
    color: "#263526",
    borderRadius: "999px",
    padding: "8px 10px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    fontWeight: "800",
  },

  tagButton: {
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "16px",
    color: "#263526",
  },

  text: {
    color: "#444",
  },

  link: {
    color: "#e74c3c",
    fontWeight: "900",
  },

  tourPreview: {
    width: "100%",
    marginTop: "14px",
    borderRadius: "14px",
  },

  success: {
    color: "green",
    fontWeight: "900",
    marginBottom: "16px",
  },

  error: {
    color: "#c0392b",
    fontWeight: "900",
    marginBottom: "16px",
  },
  fileInput: {
    border: "1px solid #d0d0c8",
    borderRadius: "12px",
    padding: "12px",
    backgroundColor: "#fff",
  },

  orText: {
    margin: "16px 0",
    color: "#65705f",
    fontWeight: "800",
    textAlign: "center",
  },
  fileInput: {
    border: "1px solid #d0d0c8",
    borderRadius: "12px",
    padding: "12px",
    backgroundColor: "#fff",
  },

  tourOptions: {
    display: "grid",
    gap: "18px",
  },

  smallSectionTitle: {
    margin: "0 0 4px 0",
    fontSize: "18px",
    fontWeight: "950",
    color: "#172117",
  },

  helpText: {
    margin: "0 0 8px 0",
    color: "#65705f",
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: "650",
  },

  divider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#65705f",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  sectionDescription: {
    color: "#65705f",
    fontSize: "15px",
    lineHeight: 1.6,
    marginBottom: "22px",
    fontWeight: "600",
  },

  sceneUploadBox: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "28px",
  },

  sceneGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },

  sceneCard: {
    backgroundColor: "#f8faf6",
    border: "1px solid #e0e4da",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "0 8px 18px rgba(31, 47, 31, 0.06)",
  },

  scenePreview: {
    width: "100%",
    height: "190px",
    objectFit: "cover",
    display: "block",
  },

  sceneInfo: {
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  uploadButton: {
    height: "54px",
    border: "none",
    borderRadius: "18px",
    backgroundColor: "#172117",
    color: "#fff",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    transition: "0.2s",
  },

  deleteButton: {
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "800",
  },
  fileUploadLabel: {
    height: "54px",
    border: "1px solid #d8ded1",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    padding: "0 18px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    color: "#4f5c4b",
  },
  instructionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  instructionCard: {
    backgroundColor: "#f8faf6",
    border: "1px solid #e0e4da",
    borderRadius: "18px",
    padding: "18px",
  },

  instructionNumber: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#172117",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "950",
    marginBottom: "12px",
  },

  instructionTitle: {
    margin: "0 0 8px 0",
    color: "#172117",
    fontSize: "17px",
    fontWeight: "950",
  },

  instructionText: {
    margin: 0,
    color: "#4f5c4b",
    fontSize: "14px",
    lineHeight: 1.6,
    fontWeight: "600",
  },

  tipBox: {
    marginTop: "18px",
    backgroundColor: "#edf4e7",
    borderRadius: "18px",
    padding: "16px",
    display: "grid",
    gap: "6px",
    color: "#263526",
    fontWeight: "700",
  },

  leftColumn: {
    display: "grid",
    gap: "24px",
    alignItems: "start",
  },

  routeCanvas: {
    position: "relative",
    width: "100%",
    height: "360px",
    background:
      "linear-gradient(135deg, #edf4e7 0%, #f8faf6 50%, #dfe8d3 100%)",
    border: "2px dashed #9cad8f",
    borderRadius: "22px",
    overflow: "hidden",
    marginBottom: "24px",
  },

  routeCanvasHint: {
    position: "absolute",
    top: "16px",
    left: "16px",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    color: "#4f5c4b",
    padding: "8px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "800",
    zIndex: 1,
  },

  emptyCanvasText: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#65705f",
    fontWeight: "800",
  },

  routeScenePoint: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    minWidth: "90px",
    maxWidth: "150px",
    padding: "10px 14px",
    color: "#fff",
    borderRadius: "999px",
    boxShadow: "0 8px 18px rgba(31, 47, 31, 0.24)",
    fontSize: "13px",
    fontWeight: "900",
    textAlign: "center",
    userSelect: "none",
  },

  scenePositionText: {
    margin: "6px 0 0 0",
    color: "#65705f",
    fontSize: "13px",
    fontWeight: "700",
  },
  routeConnectionLayer: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 1,
  },
  connectionManager: {
    marginBottom: "24px",
    padding: "18px",
    backgroundColor: "#f8faf6",
    border: "1px solid #e0e4da",
    borderRadius: "18px",
  },

  connectionForm: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    marginBottom: "16px",
  },

  connectionList: {
    display: "grid",
    gap: "10px",
  },

  connectionItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    backgroundColor: "#fff",
    border: "1px solid #e0e4da",
    borderRadius: "14px",
    padding: "12px",
    color: "#263526",
    fontWeight: "700",
  },
  hotspotEditorWrapper: {
    marginBottom: "24px",
    display: "grid",
    gap: "16px",
  },

  hotspotList: {
    display: "grid",
    gap: "12px",
  },

  hotspotItem: {
    backgroundColor: "#f8faf6",
    border: "1px solid #e0e4da",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hotspotCoords: {
    margin: "6px 0 0 0",
    color: "#65705f",
    fontSize: "13px",
    fontWeight: "700",
  },
};

export default HostEditPropertyPage;