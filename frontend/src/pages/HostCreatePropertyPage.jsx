import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import HotspotEditor from "../components/HotspotEditor";

function HostCreatePropertyPage() {
  const navigate = useNavigate();
  const routeCanvasRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    short_description: "",
    full_description: "",
    property_type: "glamping",
    country: "Lithuania",
    city: "",
    address: "",
    postal_code: "",
    latitude: "",
    longitude: "",
    price_per_night: "",
    max_guests: 1,
    rules: "",
    cancellation_policy: "",
  });

  const [allAmenities, setAllAmenities] = useState([]);
  const [selectedAmenityId, setSelectedAmenityId] = useState("");
  const [customAmenityName, setCustomAmenityName] = useState("");
  const [pendingAmenities, setPendingAmenities] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageIsMain, setImageIsMain] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);

  const [tourForm, setTourForm] = useState({
    title: "",
    panorama_url: "",
    preview_image_url: "",
  });

  const [pendingExternalTour, setPendingExternalTour] = useState(null);
  const [sceneTitle, setSceneTitle] = useState("");
  const [sceneFile, setSceneFile] = useState(null);
  const [pendingScenes, setPendingScenes] = useState([]);
  const [draggingSceneId, setDraggingSceneId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [createdPropertyId, setCreatedPropertyId] = useState(null);
  const [createdTourScenes, setCreatedTourScenes] = useState([]);
  const [selectedHotspotSceneId, setSelectedHotspotSceneId] = useState("");
  const [sceneHotspots, setSceneHotspots] = useState([]);

  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const response = await api.get("/amenities");
        setAllAmenities(response.data || []);
      } catch (err) {
        console.error("Load amenities error:", err);
      }
    };

    fetchAmenities();
  }, []);

  useEffect(() => {
    if (selectedHotspotSceneId) {
      fetchSceneHotspots(selectedHotspotSceneId);
    } else {
      setSceneHotspots([]);
    }
  }, [selectedHotspotSceneId]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTourFormChange = (e) => {
    const { name, value } = e.target;

    setTourForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPendingExternalTour = () => {
    if (!tourForm.panorama_url.trim()) {
      setError("Please enter external virtual tour URL.");
      return;
    }

    setPendingExternalTour({
      title: tourForm.title || "External virtual tour",
      panorama_url: tourForm.panorama_url.trim(),
      preview_image_url: tourForm.preview_image_url.trim() || null,
    });

    setTourForm({
      title: "",
      panorama_url: "",
      preview_image_url: "",
    });

    setError("");
  };

  const handleRemovePendingExternalTour = () => {
    setPendingExternalTour(null);
  };

  const handleAddPendingImageFile = (e) => {
    e.preventDefault();

    if (!imageFile) {
      setError("Please select an image file.");
      return;
    }

    setPendingImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "file",
        file: imageFile,
        preview: URL.createObjectURL(imageFile),
        is_main: imageIsMain,
      },
    ]);

    setImageFile(null);
    setImageIsMain(false);
    setError("");
  };

  const handleAddPendingImageUrl = (e) => {
    e.preventDefault();

    if (!imageUrl.trim()) {
      setError("Please enter image URL.");
      return;
    }

    setPendingImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "url",
        image_url: imageUrl.trim(),
        preview: imageUrl.trim(),
        is_main: imageIsMain,
      },
    ]);

    setImageUrl("");
    setImageIsMain(false);
    setError("");
  };

  const handleRemovePendingImage = (imageId) => {
    setPendingImages((prev) => prev.filter((image) => image.id !== imageId));
  };

  const handleAddPendingAmenity = (e) => {
    e.preventDefault();

    if (!selectedAmenityId && !customAmenityName.trim()) {
      setError("Please select an amenity or enter a custom amenity name.");
      return;
    }

    if (selectedAmenityId) {
      const amenity = allAmenities.find(
        (item) => item.id === Number(selectedAmenityId)
      );

      if (!amenity) return;

      const alreadyAdded = pendingAmenities.some(
        (item) => item.id === amenity.id
      );

      if (alreadyAdded) {
        setError("This amenity is already added.");
        return;
      }

      setPendingAmenities((prev) => [
        ...prev,
        {
          id: amenity.id,
          name: amenity.name,
          type: "existing",
        },
      ]);

      setSelectedAmenityId("");
      setError("");
      return;
    }

    const cleanName = customAmenityName.trim();

    const alreadyAdded = pendingAmenities.some(
      (item) => item.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (alreadyAdded) {
      setError("This amenity is already added.");
      return;
    }

    setPendingAmenities((prev) => [
      ...prev,
      {
        local_id: crypto.randomUUID(),
        name: cleanName,
        type: "custom",
      },
    ]);

    setCustomAmenityName("");
    setError("");
  };

  const handleRemovePendingAmenity = (amenity) => {
    setPendingAmenities((prev) =>
      prev.filter((item) => {
        if (amenity.id) return item.id !== amenity.id;
        return item.local_id !== amenity.local_id;
      })
    );
  };

  const handleAddPendingScene = (e) => {
    e.preventDefault();

    if (!sceneFile) {
      setError("Please select a panorama scene file.");
      return;
    }

    setPendingScenes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: sceneTitle || `Scene ${prev.length + 1}`,
        file: sceneFile,
        preview: URL.createObjectURL(sceneFile),
        sort_order: prev.length + 1,
        position_x: 50,
        position_y: 50,
      },
    ]);

    setSceneTitle("");
    setSceneFile(null);
    setError("");
  };

  const handleRemovePendingScene = (sceneId) => {
    setPendingScenes((prev) => prev.filter((scene) => scene.id !== sceneId));
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

    setPendingScenes((prevScenes) =>
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
    setDraggingSceneId(null);
  };

  const uploadImages = async (propertyId) => {
    for (const image of pendingImages) {
      if (image.type === "file") {
        const uploadData = new FormData();
        uploadData.append("file", image.file);

        await api.post(
          `/properties/${propertyId}/images/upload?is_main=${image.is_main}`,
          uploadData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      if (image.type === "url") {
        await api.post(`/properties/${propertyId}/images`, {
          image_url: image.image_url,
          is_main: image.is_main,
        });
      }
    }
  };

  const attachAmenities = async (propertyId) => {
    for (const amenity of pendingAmenities) {
      let amenityId = amenity.id || null;

      if (!amenityId && amenity.type === "custom") {
        const amenityResponse = await api.post("/amenities", {
          name: amenity.name,
        });

        amenityId = amenityResponse.data.id;
      }

      await api.post(`/properties/${propertyId}/amenities`, {
        amenity_id: amenityId,
      });
    }
  };

  const uploadExternalTour = async (propertyId) => {
    if (!pendingExternalTour) return;

    await api.post(`/properties/${propertyId}/tour`, {
      title: pendingExternalTour.title || null,
      panorama_url: pendingExternalTour.panorama_url,
      preview_image_url: pendingExternalTour.preview_image_url || null,
    });
  };

  const uploadTourScenes = async (propertyId) => {
    for (const scene of pendingScenes) {
      const uploadData = new FormData();

      uploadData.append("file", scene.file);
      uploadData.append("title", scene.title);
      uploadData.append("sort_order", scene.sort_order);
      uploadData.append("position_x", scene.position_x || 50);
      uploadData.append("position_y", scene.position_y || 50);

      await api.post(`/properties/${propertyId}/tour-scenes/upload`, uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
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

  const handleSaveHotspot = async (hotspotData) => {
    if (!selectedHotspotSceneId) {
      setError("Please select source scene.");
      return;
    }

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

  const handleCreateProperty = async (e) => {
    e.preventDefault();

    setLoading(true);
    setActionLoading("create");
    setMessage("");
    setError("");

    try {
      const response = await api.post("/properties", {
        ...formData,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        price_per_night: Number(formData.price_per_night),
        max_guests: Number(formData.max_guests),
      });

      const propertyId = response.data.id;

      await uploadImages(propertyId);
      await attachAmenities(propertyId);
      await uploadExternalTour(propertyId);
      await uploadTourScenes(propertyId);

      const scenesResponse = await api.get(`/properties/${propertyId}/tour-scenes`);

      setCreatedPropertyId(propertyId);
      setCreatedTourScenes(scenesResponse.data || []);

      setMessage(
        "Property created successfully. You can now add panorama hotspot navigation."
      );
    } catch (err) {
      console.error("Create property error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to create property."
      );
    } finally {
      setLoading(false);
      setActionLoading("");
    }
  };

  const availableAmenities = allAmenities.filter(
    (amenity) => !pendingAmenities.some((item) => item.id === amenity.id)
  );

  return (
    <div>
      <Link to="/host/properties" style={styles.backLink}>
        ← Back to my properties
      </Link>

      <section style={styles.header}>
        <div>
          <span style={styles.badge}>Host management</span>
          <h1 style={styles.title}>Create New Property</h1>
          <p style={styles.subtitle}>
            Add listing information, images, amenities and 360° virtual tour.
          </p>
        </div>
      </section>

      {message ? <p style={styles.success}>{message}</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}

      <div style={styles.layout}>
        <div style={styles.leftColumn}>
          <form onSubmit={handleCreateProperty} style={styles.card}>
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
              disabled={actionLoading === "create" || loading}
            >
              {actionLoading === "create" ? "Creating..." : "Create property"}
            </button>
          </form>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Amenities</h2>

            <form onSubmit={handleAddPendingAmenity} style={styles.smallForm}>
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

              <button type="submit" style={styles.primaryButton}>
                Add amenity
              </button>
            </form>

            <div style={styles.tags}>
              {pendingAmenities.map((amenity) => (
                <div key={amenity.id || amenity.local_id} style={styles.tag}>
                  <span>{amenity.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingAmenity(amenity)}
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

            <form onSubmit={handleAddPendingImageFile} style={styles.smallForm}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={styles.fileInput}
              />

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={imageIsMain}
                  onChange={(e) => setImageIsMain(e.target.checked)}
                />
                Set as main image
              </label>

              <button type="submit" style={styles.primaryButton}>
                Add image file
              </button>
            </form>

            <p style={styles.orText}>or add image by URL</p>

            <form onSubmit={handleAddPendingImageUrl} style={styles.smallForm}>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL"
                style={styles.input}
              />

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={imageIsMain}
                  onChange={(e) => setImageIsMain(e.target.checked)}
                />
                Main image
              </label>

              <button type="submit" style={styles.primaryButton}>
                Add image
              </button>
            </form>

            <div style={styles.imageGrid}>
              {pendingImages.map((image) => (
                <div key={image.id} style={styles.imageCard}>
                  <img src={image.preview} alt="Property" style={styles.image} />

                  <div style={styles.imageFooter}>
                    <span>{image.is_main ? "Main" : "Image"}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingImage(image.id)}
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

            <div style={styles.smallForm}>
              <h3 style={styles.smallSectionTitle}>
                Add external / Google virtual tour link
              </h3>

              <p style={styles.helpText}>
                Optional: paste a Google Maps, Street View, Kuula, Matterport or
                other virtual tour link.
              </p>

              {!pendingExternalTour ? (
                <>
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
                  />

                  <input
                    name="preview_image_url"
                    value={tourForm.preview_image_url}
                    onChange={handleTourFormChange}
                    placeholder="Preview image URL optional"
                    style={styles.input}
                  />

                  <button
                    type="button"
                    onClick={handleAddPendingExternalTour}
                    style={styles.primaryButton}
                  >
                    Add external tour
                  </button>
                </>
              ) : (
                <div style={styles.pendingTourCard}>
                  <div>
                    <strong>{pendingExternalTour.title}</strong>
                    <p style={styles.pendingTourUrl}>
                      {pendingExternalTour.panorama_url}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemovePendingExternalTour}
                    style={styles.smallDeleteButton}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Visual 360° Tour Builder</h2>

            <p style={styles.sectionDescription}>
              Upload panorama scenes and arrange them on the route canvas. These
              points will later define how guests navigate through the virtual tour.
            </p>

            <form onSubmit={handleAddPendingScene} style={styles.sceneUploadBox}>
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

              <button type="submit" style={styles.uploadButton}>
                Add Scene
              </button>
            </form>

            {createdPropertyId && createdTourScenes.length > 0 ? (
              <div style={styles.hotspotEditorWrapper}>
                <h2 style={styles.sectionTitle}>Panorama Hotspot Navigation</h2>

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

                  {createdTourScenes.map((scene) => (
                    <option key={scene.id} value={scene.id}>
                      {scene.title}
                    </option>
                  ))}
                </select>
              

                {selectedHotspotSceneId ? (
                  <>
                    <HotspotEditor
                      imageUrl={getImageUrl(
                        createdTourScenes.find(
                          (scene) => scene.id === Number(selectedHotspotSceneId)
                        )?.panorama_url
                      )}
                      targetScenes={createdTourScenes.filter(
                        (scene) => scene.id !== Number(selectedHotspotSceneId)
                      )}
                      onSaveHotspot={handleSaveHotspot}
                    />

                    <div style={styles.hotspotList}>
                      {sceneHotspots.map((spot) => {
                        const targetScene = createdTourScenes.find(
                          (scene) => scene.id === spot.target_scene_id
                        );

                        return (
                          <div key={spot.id} style={styles.hotspotItem}>
                            <div>
                              <strong>{targetScene?.title || "Unknown scene"}</strong>

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

                    <div style={styles.postCreateActions}>
                      <button
                        type="button"
                        onClick={() => navigate(`/host/properties/${createdPropertyId}/edit`)}
                        style={styles.primaryButton}
                      >
                        Continue editing property
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/properties/${createdPropertyId}`)}
                        style={styles.secondaryButton}
                      >
                        View public page
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            <h3 style={styles.smallSectionTitle}>Pending Panorama Scenes</h3>

            {!createdPropertyId ? (
              <p style={styles.helpText}>
                Hotspot navigation will become available after the property and panorama
                scenes are created.
              </p>
            ) : null}

            <div style={styles.sceneGrid}>
              {pendingScenes.map((scene) => (
                <div key={scene.id} style={styles.sceneCard}>
                  <img
                    src={scene.preview}
                    alt={scene.title}
                    style={styles.scenePreview}
                  />

                  <div style={styles.sceneInfo}>
                    <div>
                      <strong>{scene.title}</strong>
                      <p style={styles.scenePositionText}>
                        X: {scene.position_x || 50}% / Y:{" "}
                        {scene.position_y || 50}%
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePendingScene(scene.id)}
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

  layout: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "24px",
    alignItems: "start",
  },

  leftColumn: {
    display: "grid",
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

  smallSectionTitle: {
    margin: "0 0 12px 0",
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

  sectionDescription: {
    color: "#65705f",
    fontSize: "15px",
    lineHeight: 1.6,
    marginBottom: "22px",
    fontWeight: "600",
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

  sceneUploadBox: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
  },

  routeCanvas: {
    position: "relative",
    width: "100%",
    height: "320px",
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

  sceneGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
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
    height: "150px",
    objectFit: "cover",
    display: "block",
  },

  sceneInfo: {
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  scenePositionText: {
    margin: "6px 0 0 0",
    color: "#65705f",
    fontSize: "13px",
    fontWeight: "700",
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
  pendingTourCard: {
    backgroundColor: "#f8faf6",
    border: "1px solid #e0e4da",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  pendingTourUrl: {
    margin: "6px 0 0 0",
    color: "#65705f",
    fontSize: "13px",
    fontWeight: "700",
    wordBreak: "break-word",
  },
  hotspotList: {
    display: "grid",
    gap: "12px",
    marginTop: "16px",
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

  postCreateActions: {
    display: "grid",
    gap: "10px",
    marginTop: "16px",
  },

  secondaryButton: {
    padding: "13px 20px",
    borderRadius: "14px",
    border: "1px solid #172117",
    backgroundColor: "#fff",
    color: "#172117",
    fontWeight: "900",
    cursor: "pointer",
  },
};

export default HostCreatePropertyPage;