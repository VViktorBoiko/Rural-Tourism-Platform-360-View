import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getDefaultRouteByRole = (role) => {
    if (role === "user") return "/my-bookings";
    if (role === "host") return "/host/properties";
    if (role === "admin") return "/admin/users";
    return "/";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("username", formData.username);
      params.append("password", formData.password);

      const response = await api.post("/login", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const currentUser = await login(response.data.access_token);
      const destination =
        redirectTo !== "/" ? redirectTo : getDefaultRouteByRole(currentUser.role);

      navigate(destination);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.outerCard}>
        <h1 style={styles.title}>LOGIN</h1>

        <div style={styles.innerCard}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Email
              <input
                type="email"
                name="username"
                value={formData.username}
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
                placeholder="Enter your password"
              />
            </label>

            {error ? <p style={styles.error}>{error}</p> : null}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <p style={styles.bottomText}>
            Don&apos;t have an account?{" "}
            <Link to="/register" style={styles.link}>
              Sign up
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
    maxWidth: "700px",
    backgroundColor: "#dfe8d3",
    borderRadius: "16px",
    padding: "28px",
    boxSizing: "border-box",
  },

  title: {
    margin: "0 0 18px 0",
    textAlign: "center",
    fontSize: "56px",
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
    gap: "20px",
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
    marginTop: "8px",
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

export default LoginPage;