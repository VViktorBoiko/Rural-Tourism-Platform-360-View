import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:8000${url}`;
}

function HostPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [propertyImages, setPropertyImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fallbackImage =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

  const fetchPropertyImages = async (propertyList) => {
    const imagesMap = {};

    await Promise.all(
      propertyList.map(async (property) => {
        try {
          const response = await api.get(`/properties/${property.id}/images`);
          const images = response.data || [];

          const mainImage =
            images.find((image) => image.is_main)?.image_url ||
            images[0]?.image_url ||
            null;

          imagesMap[property.id] = mainImage;
        } catch (err) {
          console.error(`Failed to load images for property ${property.id}`, err);
          imagesMap[property.id] = null;
        }
      })
    );

    setPropertyImages(imagesMap);
  };

  const fetchProperties = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/host/properties");
      const propertyList = response.data || [];

      setProperties(propertyList);
      await fetchPropertyImages(propertyList);
    } catch (err) {
      console.error("Host properties error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load your properties."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDeleteProperty = async (propertyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");
    setActionLoadingId(propertyId);

    try {
      await api.delete(`/properties/${propertyId}`);

      setProperties((prev) =>
        prev.filter((property) => property.id !== propertyId)
      );

      setPropertyImages((prev) => {
        const next = { ...prev };
        delete next[propertyId];
        return next;
      });

      setMessage("Property deleted successfully.");
    } catch (err) {
      console.error("Delete property error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to delete property."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your properties..." />;
  }

  if (error && properties.length === 0) {
    return <ErrorState message={error} />;
  }

  return (
    <div>
      <section style={styles.header}>
        <div>
          <span style={styles.badge}>Host dashboard</span>
          <h1 style={styles.title}>My Properties</h1>
          <p style={styles.subtitle}>
            Manage your rural tourism listings, images, amenities and 360°
            virtual tours.
          </p>
        </div>

        <Link to="/host/properties/create" style={styles.createButton}>
          + Add New Property
        </Link>
      </section>

      {message ? <p style={styles.success}>{message}</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}

      {properties.length === 0 ? (
        <EmptyState
          title="No properties yet"
          description="Create your first rural stay and start building your host profile."
        />
      ) : (
        <div style={styles.grid}>
          {properties.map((property) => {
            const mainImage =
              propertyImages[property.id] ||
              property.main_image_url ||
              property.image_url ||
              fallbackImage;

            return (
              <article key={property.id} style={styles.card}>
                <div style={styles.imageWrapper}>
                  <img
                    src={getImageUrl(mainImage)}
                    alt={property.title}
                    style={styles.image}
                  />

                  <div style={styles.imageGradient} />

                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(property.status),
                    }}
                  >
                    {property.status || "pending"}
                  </span>

                  <span style={styles.typeBadge}>
                    {property.property_type || "rural stay"}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h2 style={styles.cardTitle}>{property.title}</h2>
                      <p style={styles.location}>
                        📍 {property.city || "Unknown city"}
                        {property.country ? `, ${property.country}` : ""}
                      </p>
                    </div>

                    <div style={styles.priceBox}>
                      <strong>
                        €{property.price_per_night || property.price || 0}
                      </strong>
                      <span>/ night</span>
                    </div>
                  </div>

                  <p style={styles.description}>
                    {property.short_description ||
                      property.description ||
                      "No short description added yet."}
                  </p>

                  <div style={styles.metaRow}>
                    <span style={styles.metaItem}>
                      🏡 {property.property_type || "rural stay"}
                    </span>
                    <span style={styles.metaItem}>
                      👥 {property.max_guests || 1} guests
                    </span>
                    <span style={styles.metaItem}>ID: {property.id}</span>
                  </div>

                  <div style={styles.actions}>
                    <Link
                      to={`/properties/${property.id}`}
                      style={styles.viewButton}
                    >
                      View
                    </Link>

                    <Link
                      to={`/host/properties/${property.id}/edit`}
                      style={styles.editButton}
                    >
                      Edit / Manage
                    </Link>

                    <button
                      onClick={() => handleDeleteProperty(property.id)}
                      style={styles.deleteButton}
                      disabled={actionLoadingId === property.id}
                    >
                      {actionLoadingId === property.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getStatusStyle(status) {
  if (status === "approved") {
    return {
      backgroundColor: "#e8f7ea",
      color: "#1f7a33",
    };
  }

  if (status === "rejected") {
    return {
      backgroundColor: "#fdecec",
      color: "#b42318",
    };
  }

  if (status === "inactive") {
    return {
      backgroundColor: "#eef2f6",
      color: "#44546a",
    };
  }

  return {
    backgroundColor: "#fff4e5",
    color: "#b26b00",
  };
}

const styles = {
  header: {
    backgroundColor: "#dfe8d3",
    borderRadius: "24px",
    padding: "28px",
    marginBottom: "26px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap",
    border: "1px solid #cfd8c3",
  },

  badge: {
    display: "inline-block",
    backgroundColor: "#fff",
    color: "#384a35",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "13px",
    marginBottom: "12px",
  },

  title: {
    margin: 0,
    fontSize: "42px",
    fontWeight: "950",
    color: "#fff",
    lineHeight: 1,
  },

  subtitle: {
    margin: "12px 0 0 0",
    color: "#3d4738",
    fontSize: "16px",
    fontWeight: "600",
    maxWidth: "680px",
    lineHeight: 1.5,
  },

  createButton: {
    textDecoration: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "14px 20px",
    borderRadius: "14px",
    fontWeight: "900",
    boxShadow: "0 8px 18px rgba(231, 76, 60, 0.25)",
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

  grid: {
    display: "grid",
    gap: "22px",
  },

  card: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    backgroundColor: "#fff",
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid #e2e2dc",
    boxShadow: "0 12px 30px rgba(31, 47, 31, 0.08)",
    height: "300px",
  },

  imageWrapper: {
    position: "relative",
    height: "100%",
    backgroundColor: "#d8dfd1",
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  imageGradient: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.38))",
    pointerEvents: "none",
  },

  statusBadge: {
    position: "absolute",
    top: "14px",
    left: "14px",
    padding: "8px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "950",
    textTransform: "capitalize",
    boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
  },

  typeBadge: {
    position: "absolute",
    bottom: "14px",
    left: "14px",
    padding: "8px 13px",
    backgroundColor: "rgba(255,255,255,0.94)",
    color: "#263526",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "950",
    textTransform: "capitalize",
  },

  cardBody: {
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "18px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },

  cardTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "950",
    color: "#1f1f1f",
    lineHeight: 1.15,
  },

  location: {
    margin: "8px 0 0 0",
    color: "#65705f",
    fontSize: "15px",
    fontWeight: "700",
  },

  priceBox: {
    backgroundColor: "#f4f7ef",
    borderRadius: "16px",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    color: "#263526",
    minWidth: "90px",
  },

  description: {
    margin: 0,
    color: "#555",
    fontSize: "15px",
    lineHeight: 1.55,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  metaRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  metaItem: {
    backgroundColor: "#edf4e7",
    color: "#384a35",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "capitalize",
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "4px",
  },

  viewButton: {
    textDecoration: "none",
    backgroundColor: "#111",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: "12px",
    fontWeight: "900",
  },

  editButton: {
    textDecoration: "none",
    backgroundColor: "#fff",
    color: "#222",
    border: "1px solid #bbb",
    padding: "11px 16px",
    borderRadius: "12px",
    fontWeight: "900",
  },

  deleteButton: {
    backgroundColor: "#b42318",
    color: "#fff",
    border: "none",
    padding: "11px 16px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },
};

export default HostPropertiesPage;