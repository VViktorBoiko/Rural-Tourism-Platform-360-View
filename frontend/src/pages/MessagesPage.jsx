import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";

function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await api.get("/conversations");
        setConversations(response.data || []);
      } catch (err) {
        console.error("Load conversations error:", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load conversations."
        );
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  if (loading) return <LoadingState message="Loading messages..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <section style={styles.header}>
        <span style={styles.badge}>Messages</span>
        <h1 style={styles.title}>Conversations</h1>
        <p style={styles.subtitle}>
          Communicate with hosts or guests after a booking request.
        </p>
      </section>

      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Conversations will appear here after a booking-related chat is created."
        />
      ) : (
        <div style={styles.list}>
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/messages/${conversation.id}`}
              style={styles.card}
            >
                <Link
                    to={`/users/${conversation.other_user?.id}`}
                    style={styles.avatarLink}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={styles.avatar}>
                        {conversation.other_user?.avatar_url ? (
                            <img
                                src={getImageUrl(conversation.other_user.avatar_url)}
                                alt={conversation.other_user.full_name}
                                style={styles.avatarImage}
                            />
                        ) : (
                            conversation.other_user?.full_name?.charAt(0)?.toUpperCase() || "U"
                        )}
                    </div>
                </Link>

              <div style={styles.content}>
                <div style={styles.topRow}>
                  <strong>
                    {conversation.other_user?.full_name || "User"}
                  </strong>
                  <span style={styles.status}>
                    {conversation.booking_status || "booking"}
                  </span>
                </div>

                <p style={styles.property}>{conversation.property_title}</p>

                <p style={styles.preview}>
                  {conversation.last_message || "No messages yet."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:8000${url}`;
}

const styles = {
  header: {
    backgroundColor: "#dfe8d3",
    borderRadius: "24px",
    padding: "28px",
    marginBottom: "24px",
    border: "1px solid #cfd8c3",
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
    fontSize: "42px",
    fontWeight: "950",
    color: "#fff",
  },

  subtitle: {
    margin: 0,
    color: "#3d4738",
    fontWeight: "650",
  },

  list: {
    display: "grid",
    gap: "16px",
  },

  card: {
    textDecoration: "none",
    backgroundColor: "#fff",
    border: "1px solid #e2e2dc",
    borderRadius: "22px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "64px 1fr",
    gap: "16px",
    alignItems: "center",
    color: "#172117",
    boxShadow: "0 12px 30px rgba(31, 47, 31, 0.08)",
  },

  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "#172117",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "950",
    fontSize: "24px",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  content: {
    minWidth: 0,
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },

  status: {
    backgroundColor: "#edf4e7",
    color: "#263526",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "capitalize",
  },

  property: {
    margin: "6px 0",
    color: "#65705f",
    fontWeight: "800",
  },

  preview: {
    margin: 0,
    color: "#4f5c4b",
    fontWeight: "650",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
avatarLink: {
  textDecoration: "none",
  display: "block",
},
};

export default MessagesPage;