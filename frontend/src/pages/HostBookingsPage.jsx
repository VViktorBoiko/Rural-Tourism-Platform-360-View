import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";

function HostBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsResponse, propertiesResponse] = await Promise.all([
          api.get("/host/bookings"),
          api.get("/host/properties"),
        ]);

        setBookings(bookingsResponse.data || []);
        setProperties(propertiesResponse.data || []);
      } catch (err) {
        console.error("Host bookings error:", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load host bookings."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const propertiesMap = useMemo(() => {
    return properties.reduce((acc, property) => {
      acc[property.id] = property;
      return acc;
    }, {});
  }, [properties]);

  const updateBookingStatus = async (bookingId, status) => {
    setMessage("");
    setError("");
    setActionLoadingId(bookingId);

    try {
      const response = await api.patch(`/bookings/${bookingId}/status`, {
        status,
      });

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? response.data : booking
        )
      );

      setMessage(`Booking ${status} successfully.`);
    } catch (err) {
      console.error("Update booking status error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update booking status."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading host bookings..." />;
  }

  if (error && bookings.length === 0) {
    return <ErrorState message={error} />;
  }

  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
  const confirmedCount = bookings.filter((booking) => booking.status === "confirmed").length;
  const cancelledCount = bookings.filter((booking) => booking.status === "cancelled").length;

  return (
    <div>
      <section style={styles.header}>
        <div>
          <span style={styles.badge}>Host dashboard</span>
          <h1 style={styles.title}>Booking Requests</h1>
          <p style={styles.subtitle}>
            Review guest reservations, confirm suitable stays, or cancel requests
            when the property is unavailable.
          </p>
        </div>

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <strong>{pendingCount}</strong>
            <span>Pending</span>
          </div>
          <div style={styles.statCard}>
            <strong>{confirmedCount}</strong>
            <span>Confirmed</span>
          </div>
          <div style={styles.statCard}>
            <strong>{cancelledCount}</strong>
            <span>Cancelled</span>
          </div>
        </div>
      </section>

      {message ? <p style={styles.success}>{message}</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Guest bookings for your properties will appear here."
        />
      ) : (
        <div style={styles.grid}>
          {bookings.map((booking) => {
            const property = propertiesMap[booking.property_id];

            return (
              <article key={booking.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <span style={styles.bookingId}>Booking #{booking.id}</span>
                    <h2 style={styles.cardTitle}>
                      {property?.title || `Property #${booking.property_id}`}
                    </h2>
                    <p style={styles.location}>
                      {property
                        ? `${property.city || "Unknown city"}${
                            property.country ? `, ${property.country}` : ""
                          }`
                        : "Property information unavailable"}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(booking.status),
                    }}
                  >
                    {booking.status}
                  </span>
                </div>

                <div style={styles.infoGrid}>
                  <div style={styles.infoBox}>
                    <span>Guest ID</span>
                    <strong>{booking.user_id}</strong>
                  </div>

                  <div style={styles.infoBox}>
                    <span>Check-in</span>
                    <strong>{booking.check_in_date}</strong>
                  </div>

                  <div style={styles.infoBox}>
                    <span>Check-out</span>
                    <strong>{booking.check_out_date}</strong>
                  </div>

                  <div style={styles.infoBox}>
                    <span>Guests</span>
                    <strong>{booking.guests_count}</strong>
                  </div>

                  <div style={styles.infoBox}>
                    <span>Nights</span>
                    <strong>{booking.nights}</strong>
                  </div>

                  <div style={styles.infoBox}>
                    <span>Total price</span>
                    <strong>€{booking.total_price}</strong>
                  </div>
                </div>

                <div style={styles.bottomRow}>
                  <div style={styles.paymentBox}>
                    <span>Payment status</span>
                    <strong>{booking.payment_status || "unpaid"}</strong>
                  </div>

                  <div style={styles.actions}>
                    {booking.status === "pending" ? (
                      <button
                        onClick={() =>
                          updateBookingStatus(booking.id, "awaiting_payment")
                        }
                        style={styles.confirmButton}
                        disabled={actionLoadingId === booking.id}
                      >
                        {actionLoadingId === booking.id
                          ? "Updating..."
                          : "Approve and request payment"}
                      </button>
                    ) : null}

                    {booking.status === "pending" ||
                    booking.status === "awaiting_payment" ||
                    booking.status === "confirmed" ? (
                      <button
                        onClick={() =>
                          updateBookingStatus(booking.id, "cancelled")
                        }
                        style={styles.cancelButton}
                        disabled={actionLoadingId === booking.id}
                      >
                        {actionLoadingId === booking.id
                          ? "Updating..."
                          : "Cancel"}
                      </button>
                    ) : null}
                    {booking.status === "confirmed" ? (
                      <button
                        type="button"
                        onClick={() => updateBookingStatus(booking.id, "completed")}
                        style={styles.completedButton}
                      >
                        Mark as completed
                      </button>
                    ) : null}
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
  if (status === "confirmed") {
    return {
      backgroundColor: "#e8f7ea",
      color: "#1f7a33",
    };
  }

  if (status === "cancelled") {
    return {
      backgroundColor: "#fdecec",
      color: "#b42318",
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  bookingId: {
    display: "inline-block",
    color: "#65705f",
    fontWeight: "900",
    marginBottom: "8px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "950",
    color: "#1f1f1f",
  },

  location: {
    margin: "8px 0 0 0",
    color: "#65705f",
    fontSize: "15px",
    fontWeight: "700",
  },

  statusBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "capitalize",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
  },

  infoBox: {
    backgroundColor: "#f4f7ef",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  bottomRow: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  paymentBox: {
    backgroundColor: "#edf4e7",
    borderRadius: "999px",
    padding: "10px 14px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    color: "#263526",
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  confirmButton: {
    border: "none",
    backgroundColor: "#2f6b3b",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  cancelButton: {
    border: "none",
    backgroundColor: "#b42318",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

completedButton: {
  border: "none",
  backgroundColor: "#172117",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: "12px",
  fontWeight: "900",
  cursor: "pointer",
},
};

export default HostBookingsPage;