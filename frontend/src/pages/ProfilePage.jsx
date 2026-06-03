import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";

function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    bio: "",
    city: "",
    country: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/me");
      setProfile(response.data);

      setFormData({
        full_name: response.data.full_name || "",
        phone: response.data.phone || "",
        bio: response.data.bio || "",
        city: response.data.city || "",
        country: response.data.country || "",
      });
    } catch (err) {
      console.error("Profile load error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setActionLoading("profile");

    try {
      const response = await api.patch("/profile", {
        full_name: formData.full_name,
        phone: formData.phone || null,
        bio: formData.bio || null,
        city: formData.city || null,
        country: formData.country || null,
      });

      setProfile(response.data);
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update profile."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleUploadAvatar = async (e) => {
    e.preventDefault();

    if (!avatarFile) {
      setError("Please select an avatar image.");
      return;
    }

    setMessage("");
    setError("");
    setActionLoading("avatar");

    try {
      const uploadData = new FormData();
      uploadData.append("file", avatarFile);

      const response = await api.post("/profile/avatar", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile(response.data);
      setAvatarFile(null);
      setMessage("Avatar uploaded successfully.");
    } catch (err) {
      console.error("Avatar upload error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to upload avatar."
      );
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (error && !profile) {
    return <ErrorState message={error} />;
  }

  if (!profile) {
    return <ErrorState message="Profile not found." />;
  }

  const name = profile.full_name || "Glamporia User";
  const initials =
    name.charAt(0)?.toUpperCase() ||
    profile.email?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.avatarColumn}>
          {profile.avatar_url ? (
            <img
              src={getImageUrl(profile.avatar_url)}
              alt={name}
              style={styles.avatarImage}
            />
          ) : (
            <div style={styles.avatar}>{initials}</div>
          )}

          <form onSubmit={handleUploadAvatar} style={styles.avatarForm}>
            <label style={styles.fileLabel}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              {avatarFile ? avatarFile.name : "Choose avatar"}
            </label>

            <button
              type="submit"
              style={styles.smallButton}
              disabled={actionLoading === "avatar"}
            >
              {actionLoading === "avatar" ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>

        <div style={styles.heroInfo}>
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
            <p style={styles.bioMuted}>
              Add a short bio to tell guests or hosts more about yourself.
            </p>
          )}

          <div style={styles.heroActions}>
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              style={styles.primaryButton}
            >
              {editing ? "Close editor" : "Edit profile"}
            </button>

            {profile?.id ? (
                <Link
                    to={`/users/${profile.id}`}
                    style={styles.secondaryButton}
                >
                    View public profile
                </Link>
            ) : null}
          </div>
        </div>
      </section>

      {message ? <p style={styles.success}>{message}</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}

      {editing ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Edit profile</h2>

          <form onSubmit={handleSaveProfile} style={styles.formGrid}>
            <label style={styles.label}>
              Full name
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Phone
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+370..."
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              City
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Kaunas"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Country
              <input
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Lithuania"
                style={styles.input}
              />
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Bio
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Write a short introduction about yourself..."
                style={styles.textarea}
              />
            </label>

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={actionLoading === "profile"}
            >
              {actionLoading === "profile" ? "Saving..." : "Save profile"}
            </button>
          </form>
        </section>
      ) : null}

      <section style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Account information</h2>

          <InfoRow label="Full name" value={profile.full_name || "Not provided"} />
          <InfoRow label="Email" value={profile.email || "Not provided"} />
          <InfoRow label="Phone" value={profile.phone || "Not provided"} />
          <InfoRow label="Role" value={profile.role || "user"} />
        </div>
      </section>
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
    gridTemplateColumns: "190px 1fr",
    gap: "28px",
    alignItems: "center",
    border: "1px solid #cfd8c3",
    boxShadow: "0 14px 34px rgba(31, 47, 31, 0.08)",
  },

  avatarColumn: {
    display: "grid",
    gap: "14px",
    justifyItems: "center",
  },

  avatar: {
    width: "145px",
    height: "145px",
    borderRadius: "50%",
    backgroundColor: "#172117",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "56px",
    fontWeight: "950",
  },

  avatarImage: {
    width: "145px",
    height: "145px",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
    border: "4px solid #fff",
    boxShadow: "0 14px 30px rgba(31,47,31,0.18)",
  },

  avatarForm: {
    display: "grid",
    gap: "8px",
    width: "100%",
  },

  fileLabel: {
    backgroundColor: "#fff",
    border: "1px solid #d0d0c8",
    borderRadius: "12px",
    padding: "10px",
    textAlign: "center",
    fontWeight: "800",
    color: "#4f5c4b",
    cursor: "pointer",
    fontSize: "13px",
  },

  smallButton: {
    border: "none",
    backgroundColor: "#172117",
    color: "#fff",
    borderRadius: "12px",
    padding: "10px",
    fontWeight: "900",
    cursor: "pointer",
  },

  heroInfo: {
    display: "grid",
    gap: "8px",
  },

  badge: {
    width: "fit-content",
    backgroundColor: "#fff",
    color: "#384a35",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "950",
    fontSize: "13px",
    textTransform: "capitalize",
  },

  title: {
    margin: 0,
    fontSize: "44px",
    fontWeight: "950",
    color: "#172117",
  },

  subtitle: {
    margin: 0,
    color: "#4f5c4b",
    fontWeight: "800",
  },

  bio: {
    margin: "8px 0 0 0",
    color: "#4f5c4b",
    lineHeight: 1.6,
    fontWeight: "650",
  },

  bioMuted: {
    margin: "8px 0 0 0",
    color: "#7a8375",
    fontWeight: "650",
  },

  heroActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "14px",
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

  success: {
    color: "green",
    fontWeight: "900",
    margin: 0,
  },

  error: {
    color: "#c0392b",
    fontWeight: "900",
    margin: 0,
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

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
    minHeight: "120px",
    borderRadius: "12px",
    border: "1px solid #d0d0c8",
    padding: "14px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
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

  actionButton: {
    display: "block",
    textDecoration: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: "14px",
    fontWeight: "950",
    marginBottom: "12px",
    textAlign: "center",
  },

  secondaryActionButton: {
    display: "block",
    textDecoration: "none",
    backgroundColor: "#172117",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: "14px",
    fontWeight: "950",
    marginBottom: "12px",
    textAlign: "center",
  },

  text: {
    color: "#4f5c4b",
    lineHeight: 1.6,
    fontWeight: "650",
  },
};

export default ProfilePage;