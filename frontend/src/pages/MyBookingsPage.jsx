import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import { useNavigate } from "react-router-dom";

function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reviewForms, setReviewForms] = useState({});
  const [reviewLoadingId, setReviewLoadingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsResponse, propertiesResponse] = await Promise.all([
          api.get("/my-bookings"),
          api.get("/properties"),
        ]);

        setBookings(bookingsResponse.data || []);
        setProperties(propertiesResponse.data || []);
      } catch (err) {
        console.error("My bookings error:", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load your bookings."
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

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");
    setActionLoadingId(bookingId);

    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`);

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? response.data : booking
        )
      );

      setMessage("Booking cancelled successfully.");
    } catch (err) {
      console.error("Cancel booking error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to cancel booking."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReviewChange = (bookingId, field, value) => {
  setReviewForms((prev) => ({
    ...prev,
    [bookingId]: {
      rating: prev[bookingId]?.rating || 5,
      comment: prev[bookingId]?.comment || "",
      [field]: value,
    },
  }));
};

const handleSubmitReview = async (booking) => {
  const form = reviewForms[booking.id] || {
    rating: 5,
    comment: "",
  };

  if (!form.comment.trim()) {
    setError("Please write a short review comment.");
    return;
  }

  setMessage("");
  setError("");
  setReviewLoadingId(booking.id);

  try {
    await api.post("/reviews", {
      booking_id: booking.id,
      property_id: booking.property_id,
      rating: Number(form.rating),
      comment: form.comment.trim(),
    });

    setMessage("Review submitted successfully.");

    setReviewForms((prev) => ({
      ...prev,
      [booking.id]: {
        rating: 5,
        comment: "",
        submitted: true,
      },
    }));
  } catch (err) {
    console.error("Review submit error:", err);
    setError(
      err.response?.data?.detail ||
        err.message ||
        "Failed to submit review."
    );
  } finally {
    setReviewLoadingId(null);
  }
};

const handleOpenConversation = async (bookingId) => {
  setMessage("");
  setError("");

  try {
    const response = await api.post(`/bookings/${bookingId}/conversation`);
    navigate(`/messages/${response.data.id}`);
  } catch (err) {
    console.error("Open conversation error:", err);
    setError(
      err.response?.data?.detail ||
        err.message ||
        "Failed to open conversation."
    );
  }
};

const handlePayBooking = async (bookingId) => {
  setMessage("");
  setError("");

  try {
    const response = await api.post(
      `/bookings/${bookingId}/create-checkout-session`
    );

    window.location.href = response.data.checkout_url;
  } catch (err) {
    console.error("Create checkout session error:", err);
    setError(
      err.response?.data?.detail ||
        err.message ||
        "Failed to start payment."
    );
  }
};





  if (loading) {
    return <LoadingState message="Loading your bookings..." />;
  }

  if (error && bookings.length === 0) {
    return <ErrorState message={error} />;
  }

  const activeCount = bookings.filter(
    (booking) => booking.status === "pending" || booking.status === "confirmed"
  ).length;

  const confirmedCount = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status === "cancelled"
  ).length;

  return (
    <div>
      <section style={styles.header}>
        <div>
          <span style={styles.badge}>User dashboard</span>
          <h1 style={styles.title}>My Bookings</h1>
          <p style={styles.subtitle}>
            Track your rural stays, check reservation statuses and manage your
            upcoming trips.
          </p>
        </div>

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <strong>{activeCount}</strong>
            <span>Active</span>
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
          description="Explore rural stays and create your first reservation."
        />
      ) : (
        <div style={styles.grid}>
          {bookings.map((booking) => {
            const property = propertiesMap[booking.property_id];

            return (
              <article key={booking.id} style={styles.card}>
                <div style={styles.imageWrapper}>
                  <img
                    src={getPropertyImage(property)}
                    alt={property?.title || "Rural stay"}
                    style={styles.image}
                  />

                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(booking.status),
                    }}
                  >
                    {booking.status}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardTop}>
                    <div>
                      <span style={styles.bookingId}>
                        Booking #{booking.id}
                      </span>

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

                    {property ? (
                      <Link
                        to={`/properties/${property.id}`}
                        style={styles.viewButton}
                      >
                        View stay
                      </Link>
                    ) : null}
                  </div>

                  <div style={styles.infoGrid}>
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

                    <div style={styles.infoBox}>
                      <span>Payment</span>
                      <strong>{booking.payment_status || "unpaid"}</strong>
                    </div>
                  </div>

                  <div style={styles.bottomRow}>
                    <p style={styles.note}>
                      {getStatusDescription(booking.status)}
                    </p>
                    {booking.status === "awaiting_payment" ? (
                      <button
                        type="button"
                        onClick={() => handlePayBooking(booking.id)}
                        style={styles.payNowLargeButton}
                      >
                        Pay now with Stripe
                      </button>
                    ) : null}

                    {booking.status === "completed" ? (
  <div style={styles.reviewBox}>
    <h3 style={styles.reviewTitle}>Leave a review</h3>

    {reviewForms[booking.id]?.submitted ? (
      <p style={styles.reviewSuccess}>
        Thank you! Your review has been submitted.
      </p>
    ) : (
      <>
        <label style={styles.reviewLabel}>
          Rating
          <select
            value={reviewForms[booking.id]?.rating || 5}
            onChange={(e) =>
              handleReviewChange(booking.id, "rating", e.target.value)
            }
            style={styles.reviewSelect}
          >
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Good</option>
            <option value="3">3 — Average</option>
            <option value="2">2 — Poor</option>
            <option value="1">1 — Very poor</option>
          </select>
        </label>

        <label style={styles.reviewLabel}>
          Comment
          <textarea
            value={reviewForms[booking.id]?.comment || ""}
            onChange={(e) =>
              handleReviewChange(booking.id, "comment", e.target.value)
            }
            style={styles.reviewTextarea}
            placeholder="Share your experience..."
          />
        </label>

        <button
          onClick={() => handleSubmitReview(booking)}
          style={styles.reviewButton}
          disabled={reviewLoadingId === booking.id}
        >
          {reviewLoadingId === booking.id ? "Submitting..." : "Submit review"}
        </button>
      </>
    )}
  </div>
) : null}

















                    {(booking.status === "pending" ||
                      booking.status === "confirmed") ? (
                      <div style={styles.bookingActions}>
                        {booking.status !== "cancelled" ? (
                          <button
                            type="button"
                            onClick={() => handleOpenConversation(booking.id)}
                            style={styles.messageButton}
                          >
                            Message host
                          </button>
                        ) : null}

                        {booking.status === "awaiting_payment" ? (
                          <button
                            type="button"
                            onClick={() => handlePayBooking(booking.id)}
                            style={styles.payButton}
                          >
                            Pay now
                          </button>
                        ) : null}

                        {(booking.status === "pending" ||
                          booking.status === "awaiting_payment" ||
                          booking.status === "confirmed") ? (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            style={styles.cancelButton}
                            disabled={actionLoadingId === booking.id}
                          >
                            {actionLoadingId === booking.id ? "Cancelling..." : "Cancel booking"}
                          </button>
                        ) : null}
                      </div>
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

function getPropertyImage(property) {
  return (
    property?.main_image_url ||
    property?.image_url ||
    property?.images?.[0]?.image_url ||
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
  );
}

function getStatusDescription(status) {
  if (status === "pending") {
    return "Your booking request is waiting for host confirmation.";
  }

  if (status === "awaiting_payment") {
    return "The host approved your booking request. Complete the payment to confirm and secure your reservation.";
  }

  if (status === "confirmed") {
    return "Your stay is confirmed. Please check the dates and prepare for your trip.";
  }

  if (status === "completed") {
    return "This stay has been completed successfully.";
  }

  if (status === "cancelled") {
    return "This booking was cancelled and is no longer active.";
  }

  return "Booking status updated.";
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
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    backgroundColor: "#fff",
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid #e2e2dc",
    boxShadow: "0 12px 30px rgba(31, 47, 31, 0.08)",
  },

  imageWrapper: {
    position: "relative",
    minHeight: "260px",
    backgroundColor: "#d8dfd1",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  statusBadge: {
    position: "absolute",
    top: "14px",
    left: "14px",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "capitalize",
  },

  cardBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "18px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    flexWrap: "wrap",
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

  viewButton: {
    textDecoration: "none",
    backgroundColor: "#111",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: "12px",
    fontWeight: "900",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
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
    marginTop: "2px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  },

  note: {
    margin: 0,
    color: "#555",
    fontWeight: "700",
    maxWidth: "520px",
    lineHeight: 1.45,
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
  reviewBox: {
    marginTop: "18px",
    backgroundColor: "#f8faf6",
    border: "1px solid #e0e4da",
    borderRadius: "18px",
    padding: "18px",
  },

  reviewTitle: {
    margin: "0 0 14px 0",
    fontSize: "20px",
    fontWeight: "950",
    color: "#172117",
  },

  reviewLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontWeight: "850",
    color: "#263526",
    marginBottom: "12px",
  },

  reviewSelect: {
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #d8ded1",
    padding: "0 12px",
    fontSize: "15px",
    outline: "none",
  },

  reviewTextarea: {
    minHeight: "96px",
    borderRadius: "12px",
    border: "1px solid #d8ded1",
    padding: "12px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },

  reviewButton: {
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  reviewSuccess: {
    margin: 0,
    color: "green",
    fontWeight: "850",
  },
  bookingActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  messageButton: {
    border: "none",
    backgroundColor: "#172117",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },
  payButton: {
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  paymentNotice: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    backgroundColor: "#fff4ef",
    border: "1px solid #ffd6c7",
  },

  paymentTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
    color: "#1c1c1c",
  },

  paymentText: {
    marginTop: "8px",
    marginBottom: "16px",
    color: "#5f5f5f",
    lineHeight: 1.5,
  },

  largePayButton: {
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "14px 22px",
    borderRadius: "14px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
  },
  payNowLargeButton: {
    marginTop: "18px",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "14px 22px",
    borderRadius: "14px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(231, 76, 60, 0.25)",
  },
};

export default MyBookingsPage;