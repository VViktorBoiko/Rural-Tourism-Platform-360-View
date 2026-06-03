import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://127.0.0.1:8000${url}`;
}

function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get("/admin/properties");
        setProperties(response.data || []);
      } catch (err) {
        console.error("Admin properties error:", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load properties."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const updatePropertyStatus = async (propertyId, status) => {
    setMessage("");
    setError("");
    setActionLoadingId(propertyId);

    try {
      const response = await api.patch(`/admin/properties/${propertyId}/status`, {
        status,
      });

      setProperties((prev) =>
        prev.map((property) =>
          property.id === propertyId ? response.data : property
        )
      );

      setMessage(`Property status changed to ${status}.`);
    } catch (err) {
      console.error("Update property status error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update property status."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) return <LoadingState message="Loading moderation center..." />;
  if (error && properties.length === 0) return <ErrorState message={error} />;

  const totalCount = properties.length;
  const pendingCount = properties.filter((p) => p.status === "pending").length;
  const approvedCount = properties.filter((p) => p.status === "approved").length;
  const rejectedCount = properties.filter((p) => p.status === "rejected").length;
  const inactiveCount = properties.filter((p) => p.status === "inactive").length;

  return (
    <div style={styles.page}>
      <section style={styles.controlHeader}>
        <div>
          <span style={styles.eyebrow}>Platform moderation</span>
          <h1 style={styles.title}>Property Control Center</h1>
          <p style={styles.subtitle}>
            Review rural tourism listings, verify host content and manage the
            publication status of every property on the platform.
          </p>
        </div>

        <div style={styles.statusPanel}>
          <div style={styles.statusCard}>
            <span>Total</span>
            <strong>{totalCount}</strong>
          </div>
          <div style={styles.statusCard}>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
          <div style={styles.statusCard}>
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
          <div style={styles.statusCard}>
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
          </div>
          <div style={styles.statusCard}>
            <span>Inactive</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
      </section>

      {message ? <p style={styles.success}>{message}</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}

      {properties.length === 0 ? (
        <EmptyState title="No properties found" />
      ) : (
        <section style={styles.board}>
          <div style={styles.boardHeader}>
            <div>
              <h2 style={styles.boardTitle}>Moderation queue</h2>
              <p style={styles.boardSubtitle}>
                Select a property and assign the correct publication status.
              </p>
            </div>
          </div>

          <div style={styles.list}>
            {properties.map((property) => {
              const imageUrl =
                property.main_image_url ||
                property.image_url ||
                property.images?.[0]?.image_url ||
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

              return (
                <article key={property.id} style={styles.row}>
                  <div style={styles.imageBox}>
                    <img src={getImageUrl(imageUrl)} alt={property.title} style={styles.image} />

                    <span
                      style={{
                        ...styles.floatingStatus,
                        ...getStatusStyle(property.status),
                      }}
                    >
                      {property.status || "pending"}
                    </span>
                  </div>

                  <div style={styles.content}>
                    <div style={styles.topLine}>
                      <div>
                        <h3 style={styles.propertyTitle}>{property.title}</h3>
                        <p style={styles.location}>
                          {property.city || "Unknown city"}
                          {property.country ? `, ${property.country}` : ""}
                        </p>
                      </div>

                      <Link to={`/properties/${property.id}`} style={styles.viewButton}>
                        Open public page
                      </Link>
                    </div>

                    <p style={styles.description}>
                      {property.short_description ||
                        property.description ||
                        "No short description has been added for this property yet."}
                    </p>

                    <div style={styles.metaGrid}>
                      <div style={styles.metaItem}>
                        <span>ID</span>
                        <strong>{property.id}</strong>
                      </div>

                      <div style={styles.metaItem}>
                        <span>Host</span>
                        <strong>{property.host_id}</strong>
                      </div>

                      <div style={styles.metaItem}>
                        <span>Type</span>
                        <strong>{property.property_type || "rural stay"}</strong>
                      </div>

                      <div style={styles.metaItem}>
                        <span>Price</span>
                        <strong>
                          €{property.price_per_night || property.price || 0}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.moderationBar}>
                      {["pending", "approved", "rejected", "inactive"].map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() =>
                              updatePropertyStatus(property.id, status)
                            }
                            disabled={actionLoadingId === property.id}
                            style={
                              property.status === status
                                ? {
                                    ...styles.statusButton,
                                    ...styles.statusButtonActive,
                                    ...getButtonAccent(status),
                                  }
                                : styles.statusButton
                            }
                          >
                            {actionLoadingId === property.id
                              ? "Updating..."
                              : status}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function getStatusStyle(status) {
  if (status === "approved") {
    return {
      backgroundColor: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "rejected") {
    return {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    };
  }

  if (status === "inactive") {
    return {
      backgroundColor: "#e5e7eb",
      color: "#374151",
    };
  }

  return {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  };
}

function getButtonAccent(status) {
  if (status === "approved") {
    return {
      backgroundColor: "#16a34a",
      borderColor: "#16a34a",
      color: "#fff",
    };
  }

  if (status === "rejected") {
    return {
      backgroundColor: "#dc2626",
      borderColor: "#dc2626",
      color: "#fff",
    };
  }

  if (status === "inactive") {
    return {
      backgroundColor: "#4b5563",
      borderColor: "#4b5563",
      color: "#fff",
    };
  }

  return {
    backgroundColor: "#f59e0b",
    borderColor: "#f59e0b",
    color: "#111827",
  };
}

const styles = {
  page: {
    display: "grid",
    gap: "24px",
  },

  controlHeader: {
    background:
      "linear-gradient(135deg, #111827 0%, #1f2937 45%, #334155 100%)",
    color: "#fff",
    borderRadius: "28px",
    padding: "34px",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "28px",
    alignItems: "center",
    boxShadow: "0 22px 50px rgba(17, 24, 39, 0.22)",
  },

  eyebrow: {
    display: "inline-block",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    fontWeight: "900",
    color: "#a7f3d0",
    marginBottom: "14px",
  },

  title: {
    margin: 0,
    fontSize: "46px",
    lineHeight: 1,
    fontWeight: "950",
  },

  subtitle: {
    margin: "16px 0 0 0",
    maxWidth: "680px",
    color: "#d1d5db",
    fontSize: "16px",
    lineHeight: 1.6,
    fontWeight: "600",
  },

  statusPanel: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "10px",
  },

  statusCard: {
    backgroundColor: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "18px",
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },

  success: {
    margin: 0,
    padding: "14px 18px",
    borderRadius: "16px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontWeight: "900",
  },

  error: {
    margin: 0,
    padding: "14px 18px",
    borderRadius: "16px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontWeight: "900",
  },

  board: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
  },

  boardHeader: {
    marginBottom: "20px",
  },

  boardTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "28px",
    fontWeight: "950",
  },

  boardSubtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontWeight: "700",
  },

  list: {
    display: "grid",
    gap: "16px",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },

  imageBox: {
    position: "relative",
    minHeight: "230px",
    backgroundColor: "#e5e7eb",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  floatingStatus: {
    position: "absolute",
    top: "14px",
    left: "14px",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "950",
    textTransform: "capitalize",
    boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
  },

  content: {
    padding: "22px",
    display: "grid",
    gap: "16px",
  },

  topLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },

  propertyTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "25px",
    fontWeight: "950",
  },

  location: {
    margin: "7px 0 0 0",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "800",
  },

  viewButton: {
    textDecoration: "none",
    backgroundColor: "#111827",
    color: "#fff",
    padding: "11px 15px",
    borderRadius: "12px",
    fontWeight: "900",
    fontSize: "14px",
  },

  description: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.55,
    fontSize: "15px",
    fontWeight: "600",
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: "10px",
  },

  metaItem: {
    backgroundColor: "#f1f5f9",
    borderRadius: "15px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  moderationBar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    paddingTop: "4px",
  },

  statusButton: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#334155",
    padding: "10px 14px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
    textTransform: "capitalize",
  },

  statusButtonActive: {
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)",
  },
};

export default AdminPropertiesPage;