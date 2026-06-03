import { useEffect, useState } from "react";
import api from "../services/api";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/admin/users");
        setUsers(response.data || []);
      } catch (err) {
        console.error("Admin users error:", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load users."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const updateUserStatus = async (userId, isActive) => {
    setMessage("");
    setError("");
    setActionLoadingId(userId);

    try {
      const endpoint = isActive
        ? `/admin/users/${userId}/deactivate`
        : `/admin/users/${userId}/activate`;

      const response = await api.patch(endpoint);

      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? response.data : user))
      );

      setMessage(isActive ? "User deactivated." : "User activated.");
    } catch (err) {
      console.error("Update user status error:", err);
      setError(
        err.response?.data?.detail || err.message || "Failed to update user."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) return <LoadingState message="Loading users..." />;
  if (error && users.length === 0) return <ErrorState message={error} />;

  const activeCount = users.filter((user) => user.is_active).length;
  const inactiveCount = users.filter((user) => !user.is_active).length;
  const hostCount = users.filter((user) => user.role === "host").length;

  return (
    <div>
      <section style={styles.header}>
        <div>
          <span style={styles.badge}>Admin dashboard</span>
          <h1 style={styles.title}>Users Management</h1>
          <p style={styles.subtitle}>
            Review registered users, manage account activity and support safe
            platform moderation.
          </p>
        </div>

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <strong>{activeCount}</strong>
            <span>Active</span>
          </div>
          <div style={styles.statCard}>
            <strong>{inactiveCount}</strong>
            <span>Inactive</span>
          </div>
          <div style={styles.statCard}>
            <strong>{hostCount}</strong>
            <span>Hosts</span>
          </div>
        </div>
      </section>

      {message ? <p style={styles.success}>{message}</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}

      {users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div style={styles.grid}>
          {users.map((user) => (
            <article key={user.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.avatar}>
                  {(user.full_name || user.name || user.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div style={styles.userInfo}>
                  <h2 style={styles.cardTitle}>
                    {user.full_name || user.name || "Unnamed user"}
                  </h2>
                  <p style={styles.email}>{user.email}</p>
                </div>

                <span
                  style={{
                    ...styles.statusBadge,
                    ...(user.is_active ? styles.activeBadge : styles.inactiveBadge),
                  }}
                >
                  {user.is_active ? "active" : "inactive"}
                </span>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <span>User ID</span>
                  <strong>{user.id}</strong>
                </div>

                <div style={styles.infoBox}>
                  <span>Role</span>
                  <strong>{user.role}</strong>
                </div>

                <div style={styles.infoBox}>
                  <span>Status</span>
                  <strong>{user.is_active ? "Enabled" : "Disabled"}</strong>
                </div>
              </div>

              <div style={styles.actions}>
                <button
                  onClick={() => updateUserStatus(user.id, user.is_active)}
                  style={user.is_active ? styles.deactivateButton : styles.activateButton}
                  disabled={actionLoadingId === user.id}
                >
                  {actionLoadingId === user.id
                    ? "Updating..."
                    : user.is_active
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: "#dfe8d3",
    borderRadius: "24px",
    padding: "28px",
    marginBottom: "26px",
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
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
  stats: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  statCard: {
    minWidth: "98px",
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    alignItems: "center",
    boxShadow: "0 8px 18px rgba(31, 47, 31, 0.08)",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
    gap: "22px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "22px",
    padding: "24px",
    border: "1px solid #e2e2dc",
    boxShadow: "0 12px 30px rgba(31, 47, 31, 0.08)",
  },
  cardTop: {
    display: "grid",
    gridTemplateColumns: "52px 1fr auto",
    gap: "14px",
    alignItems: "center",
    marginBottom: "20px",
  },
  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    backgroundColor: "#263526",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "950",
    fontSize: "20px",
  },
  userInfo: {
    minWidth: 0,
  },
  cardTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "950",
    color: "#1f1f1f",
  },
  email: {
    margin: "6px 0 0 0",
    color: "#65705f",
    fontSize: "14px",
    fontWeight: "700",
    wordBreak: "break-word",
  },
  statusBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "capitalize",
  },
  activeBadge: {
    backgroundColor: "#e8f7ea",
    color: "#1f7a33",
  },
  inactiveBadge: {
    backgroundColor: "#fdecec",
    color: "#b42318",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  infoBox: {
    backgroundColor: "#f4f7ef",
    borderRadius: "16px",
    padding: "13px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "14px",
  },
  actions: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "flex-end",
  },
  activateButton: {
    border: "none",
    backgroundColor: "#2f6b3b",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },
  deactivateButton: {
    border: "none",
    backgroundColor: "#b42318",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },
};

export default AdminUsersPage;