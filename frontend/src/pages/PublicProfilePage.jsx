import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";

function PublicProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [hostProperties, setHostProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwnProfile = user && Number(user.id) === Number(id);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/users/${id}`);
        setProfile(response.data);

        if (response.data.role === "host" && !isOwnProfile) {
          const propertiesResponse = await api
            .get(`/users/${id}/properties`)
            .catch(() => ({ data: [] }));

          setHostProperties(propertiesResponse.data || []);
        }
      } catch (err) {
        console.error("Public profile load error:", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load user profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  if (loading) return <LoadingState message="Loading profile..." />;
  if (error) return <ErrorState message={error} />;
  if (!profile) return <ErrorState message="Profile not found." />;

  const name = profile.full_name || "Glamporia user";
  const initials =
    name.charAt(0)?.toUpperCase() ||
    profile.email?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.avatarWrap}>
          {profile.avatar_url ? (
            <img
              src={getImageUrl(profile.avatar_url)}
              alt={name}
              style={styles.avatarImage}
            />
          ) : (
            <div style={styles.avatar}>{initials}</div>
          )}
        </div>

        <div>
          <span style={styles.badge}>{profile.role} profile</span>
          <h1 style={styles.title}>{name}</h1>

          <p style={styles.subtitle}>
            {profile.city || profile.country
              ? `${profile.city || ""}${profile.city && profile.country ? ", " : ""}${
                  profile.country || ""
                }`
              : "Location not provided"}
          </p>

          {profile.bio ? (
            <p style={styles.bio}>{profile.bio}</p>
          ) : (
            <p style={styles.bioMuted}>This user has not added a bio yet.</p>
          )}

          <div style={styles.actions}>
            {isOwnProfile ? (
              <Link to="/profile" style={styles.primaryButton}>
                Edit my profile
              </Link>
            ) : (
              <button type="button" style={styles.primaryButton}>
                Message user
              </button>
            )}

            <Link to="/listings" style={styles.secondaryButton}>
              Explore listings
            </Link>
          </div>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Profile information</h2>

          <InfoRow label="Full name" value={profile.full_name || "Not provided"} />
          <InfoRow label="Role" value={profile.role || "user"} />
          <InfoRow label="Phone" value={profile.phone || "Not provided"} />
          <InfoRow label="Email" value="Hidden for privacy" />
        </div>

      </section>

      {profile.role === "host" && !isOwnProfile ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Other stays from this host</h2>

          {hostProperties.length > 0 ? (
            <div style={styles.hostProperties}>
              {hostProperties.map((property) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  style={styles.propertyMiniCard}
                >
                  <strong>{property.title}</strong>
                  <span>
                    {property.city}, €{property.price_per_night}/night
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p style={styles.text}>No public listings available from this host yet.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:8000${url}`;
}

const styles = {
  page: {
    display: "grid",
    gap: "24px",
    maxWidth: "1060px",
    margin: "0 auto",
  },

  hero: {
    background:
      "linear-gradient(135deg, #dfe8d3 0%, #f8faf6 60%, #ffffff 100%)",
    borderRadius: "32px",
    padding: "34px",
    display: "grid",
    gridTemplateColumns: "170px 1fr",
    gap: "28px",
    alignItems: "center",
    border: "1px solid #cfd8c3",
    boxShadow: "0 14px 34px rgba(31, 47, 31, 0.08)",
  },

  avatarWrap: {
    width: "140px",
    height: "140px",
  },

  avatar: {
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    backgroundColor: "#172117",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "54px",
    fontWeight: "950",
  },

  avatarImage: {
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
    border: "4px solid #fff",
    boxShadow: "0 14px 30px rgba(31,47,31,0.18)",
  },

  badge: {
    display: "inline-block",
    backgroundColor: "#fff",
    color: "#384a35",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "950",
    fontSize: "13px",
    textTransform: "capitalize",
    marginBottom: "12px",
  },

  title: {
    margin: 0,
    fontSize: "44px",
    fontWeight: "950",
    color: "#172117",
  },

  subtitle: {
    margin: "8px 0 0 0",
    color: "#4f5c4b",
    fontWeight: "800",
  },

  bio: {
    margin: "16px 0 0 0",
    color: "#4f5c4b",
    lineHeight: 1.6,
    fontWeight: "650",
  },

  bioMuted: {
    margin: "16px 0 0 0",
    color: "#7a8375",
    fontWeight: "650",
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "20px",
  },

  primaryButton: {
    textDecoration: "none",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "13px 18px",
    borderRadius: "14px",
    fontWeight: "950",
    cursor: "pointer",
  },

  secondaryButton: {
    textDecoration: "none",
    backgroundColor: "#172117",
    color: "#fff",
    padding: "13px 18px",
    borderRadius: "14px",
    fontWeight: "950",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: "24px",
    padding: "24px",
    border: "1px solid #e2e2dc",
    boxShadow: "0 12px 30px rgba(31, 47, 31, 0.08)",
  },

  sectionTitle: {
    margin: "0 0 18px 0",
    fontSize: "24px",
    fontWeight: "950",
    color: "#172117",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "14px 0",
    borderBottom: "1px solid #edf0e8",
    color: "#4f5c4b",
    fontWeight: "700",
  },

  text: {
    color: "#4f5c4b",
    lineHeight: 1.6,
    fontWeight: "650",
  },

  hostProperties: {
    display: "grid",
    gap: "12px",
  },

  propertyMiniCard: {
    textDecoration: "none",
    backgroundColor: "#f8faf6",
    border: "1px solid #e0e4da",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "6px",
    color: "#172117",
  },
};

export default PublicProfilePage;