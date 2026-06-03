import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("booking_id");
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const confirmPayment = async () => {
      if (!bookingId || !sessionId) {
        setError("Missing payment confirmation data.");
        setLoading(false);
        return;
      }

      try {
        await api.post(
          `/bookings/${bookingId}/confirm-payment?session_id=${sessionId}`
        );

        setConfirmed(true);
      } catch (err) {
        console.error("Confirm payment error:", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to confirm payment."
        );
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [bookingId, sessionId]);

  if (loading) {
    return <LoadingState message="Confirming your payment..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <section style={styles.card}>
      <span style={styles.icon}>✓</span>

      <h1 style={styles.title}>
        {confirmed ? "Payment successful" : "Payment processed"}
      </h1>

      <p style={styles.text}>
        Your booking has been confirmed and marked as paid.
      </p>

      <div style={styles.actions}>
        <Link to="/my-bookings" style={styles.primaryButton}>
          View my bookings
        </Link>

        <Link to="/listings" style={styles.secondaryButton}>
          Explore more stays
        </Link>
      </div>
    </section>
  );
}

const styles = {
  card: {
    maxWidth: "720px",
    margin: "40px auto",
    backgroundColor: "#fff",
    borderRadius: "28px",
    padding: "38px",
    textAlign: "center",
    border: "1px solid #e2e2dc",
    boxShadow: "0 14px 34px rgba(31, 47, 31, 0.10)",
  },

  icon: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#e8f7ea",
    color: "#1f7a33",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    fontWeight: "950",
    marginBottom: "18px",
  },

  title: {
    margin: 0,
    fontSize: "38px",
    fontWeight: "950",
    color: "#172117",
  },

  text: {
    color: "#4f5c4b",
    fontSize: "16px",
    fontWeight: "650",
    lineHeight: 1.6,
  },

  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "22px",
  },

  primaryButton: {
    textDecoration: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: "14px",
    fontWeight: "950",
  },

  secondaryButton: {
    textDecoration: "none",
    backgroundColor: "#172117",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: "14px",
    fontWeight: "950",
  },
};

export default PaymentSuccessPage;