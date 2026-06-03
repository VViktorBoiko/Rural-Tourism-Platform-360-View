import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";

function ConversationPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/conversations/${conversationId}/messages`);
      setMessages(response.data || []);
    } catch (err) {
      console.error("Load messages error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load conversation."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) return;

    setSending(true);
    setError("");

    try {
      await api.post(`/conversations/${conversationId}/messages`, {
        message_text: messageText.trim(),
      });

      setMessageText("");
      await loadMessages();
    } catch (err) {
      console.error("Send message error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingState message="Loading conversation..." />;
  if (error && messages.length === 0) return <ErrorState message={error} />;

  return (
    <div style={styles.page}>
      <Link to="/messages" style={styles.backLink}>
        ← Back to conversations
      </Link>

      <section style={styles.chatCard}>
        <div style={styles.chatHeader}>
          <div>
            <span style={styles.badge}>Booking conversation</span>
            <h1 style={styles.title}>Messages</h1>
          </div>
        </div>

        {error ? <p style={styles.error}>{error}</p> : null}

        <div style={styles.messagesBox}>
          {messages.length === 0 ? (
            <p style={styles.emptyText}>
              No messages yet. Start the conversation.
            </p>
          ) : null}

          {messages.map((message) => {
            const isMine = Number(message.sender_id) === Number(user?.id);

            return (
              <div
                key={message.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: isMine ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(isMine ? styles.myMessage : styles.otherMessage),
                  }}
                >
                  <p style={styles.messageText}>{message.message_text}</p>
                  <span style={styles.messageTime}>
                    {formatDate(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSendMessage} style={styles.messageForm}>
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Write a message..."
            style={styles.input}
          />

          <button type="submit" style={styles.sendButton} disabled={sending}>
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

const styles = {
  page: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  backLink: {
    display: "inline-block",
    marginBottom: "18px",
    textDecoration: "none",
    color: "#263526",
    fontWeight: "900",
  },

  chatCard: {
    backgroundColor: "#fff",
    border: "1px solid #e2e2dc",
    borderRadius: "28px",
    overflow: "hidden",
    boxShadow: "0 14px 34px rgba(31, 47, 31, 0.10)",
  },

  chatHeader: {
    backgroundColor: "#dfe8d3",
    padding: "24px",
    borderBottom: "1px solid #cfd8c3",
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
    margin: "14px 0 0 0",
    fontSize: "34px",
    fontWeight: "950",
    color: "#fff",
  },

  messagesBox: {
    height: "520px",
    overflowY: "auto",
    padding: "22px",
    backgroundColor: "#f8faf6",
    display: "grid",
    gap: "12px",
    alignContent: "start",
  },

  emptyText: {
    color: "#65705f",
    fontWeight: "800",
    textAlign: "center",
  },

  messageRow: {
    display: "flex",
  },

  messageBubble: {
    maxWidth: "70%",
    borderRadius: "18px",
    padding: "12px 14px",
  },

  myMessage: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    borderBottomRightRadius: "6px",
  },

  otherMessage: {
    backgroundColor: "#fff",
    color: "#172117",
    border: "1px solid #e2e2dc",
    borderBottomLeftRadius: "6px",
  },

  messageText: {
    margin: 0,
    lineHeight: 1.45,
    fontWeight: "650",
  },

  messageTime: {
    display: "block",
    marginTop: "6px",
    fontSize: "11px",
    opacity: 0.8,
    fontWeight: "800",
  },

  messageForm: {
    display: "grid",
    gridTemplateColumns: "1fr 120px",
    gap: "12px",
    padding: "18px",
    borderTop: "1px solid #e2e2dc",
  },

  input: {
    height: "50px",
    borderRadius: "14px",
    border: "1px solid #d0d0c8",
    padding: "0 14px",
    fontSize: "15px",
    outline: "none",
  },

  sendButton: {
    border: "none",
    borderRadius: "14px",
    backgroundColor: "#172117",
    color: "#fff",
    fontWeight: "950",
    cursor: "pointer",
  },

  error: {
    color: "#c0392b",
    fontWeight: "900",
    padding: "0 22px",
  },
};

export default ConversationPage;