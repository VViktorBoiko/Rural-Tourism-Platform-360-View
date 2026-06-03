import { Link, useSearchParams } from "react-router-dom";

function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  return (
    <section style={styles.card}>
      <span style={styles.icon}>!</span>

      <h1 style={styles.title}>Payment cancelled</h1>

      <p style={styles.text}>
        Your booking has not been confirmed yet. You can return to your bookings
        and try the payment again.
      </p>

      <div style={styles.actions}>
        <Link to="/my-bookings" style={styles.primaryButton}>
          Back to my bookings
        </Link>

        {bookingId ? (
          <Link to="/listings" style={styles.secondaryButton}>
            Explore listings
          </Link>
        ) : null}
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
    backgroundColor: "#fff4e5",
    color: "#b26b00",
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
    backgroundColor: "#172117",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: "14px",
    fontWeight: "950",
  },

  secondaryButton: {
    textDecoration: "none",
    backgroundColor: "#fff",
    color: "#172117",
    border: "1px solid #d0d0c8",
    padding: "14px 18px",
    borderRadius: "14px",
    fontWeight: "950",
  },
};

export default PaymentCancelPage;