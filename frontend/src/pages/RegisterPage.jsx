import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/register", {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.detail || err.message || "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.outerCard}>
        <h1 style={styles.title}>REGISTRATION</h1>

        <div style={styles.innerCard}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Full name
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Enter your full name"
              />
            </label>

            <label style={styles.label}>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Enter your email"
              />
            </label>

            <label style={styles.label}>
              Password
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Create a password"
              />
            </label>

            <label style={styles.label}>
              Confirm password
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Repeat your password"
              />
            </label>

            <label style={styles.label}>
              Role
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="user">User</option>
                <option value="host">Host</option>
              </select>
            </label>

            {error ? <p style={styles.error}>{error}</p> : null}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "SIGNING UP..." : "SIGN UP"}
            </button>
          </form>

          <p style={styles.bottomText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px 0",
  },

  outerCard: {
    width: "100%",
    maxWidth: "760px",
    backgroundColor: "#dfe8d3",
    borderRadius: "16px",
    padding: "28px",
    boxSizing: "border-box",
  },

  title: {
    margin: "0 0 18px 0",
    textAlign: "center",
    fontSize: "54px",
    fontWeight: "700",
    letterSpacing: "1px",
    color: "#ffffff",
  },

  innerCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "34px 36px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    fontSize: "16px",
    fontWeight: "500",
    color: "#222",
  },

  input: {
    width: "100%",
    height: "58px",
    borderRadius: "10px",
    border: "2px solid #cfcfcf",
    padding: "0 16px",
    fontSize: "16px",
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#fff",
  },

  button: {
    marginTop: "10px",
    alignSelf: "center",
    minWidth: "280px",
    height: "56px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.5px",
  },

  error: {
    margin: 0,
    color: "#c0392b",
    fontWeight: "600",
    textAlign: "center",
  },

  bottomText: {
    marginTop: "22px",
    textAlign: "center",
    color: "#555",
    fontSize: "15px",
  },

  link: {
    color: "#e74c3c",
    fontWeight: "700",
    textDecoration: "none",
  },
};

export default RegisterPage;