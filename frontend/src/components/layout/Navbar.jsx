import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

function Navbar() {
  const { isAuthenticated, logout, user, authLoading } = useAuth();

  const renderRoleLinks = () => {
    if (!user) return null;

    if (user.role === "user") {
      return (
        <Link to="/my-bookings" style={styles.link}>
          My Bookings
        </Link>
      );
    }

    if (user.role === "host") {
      return (
        <>
          <Link to="/host/properties" style={styles.link}>
            My Properties
          </Link>
          <Link to="/host/bookings" style={styles.link}>
            Host Bookings
          </Link>
        </>
      );
    }

    if (user.role === "admin") {
      return (
        <>
          <Link to="/admin/users" style={styles.link}>
            Manage Users
          </Link>
          <Link to="/admin/properties" style={styles.link}>
            Moderate Properties
          </Link>
        </>
      );
    }

    return null;
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.left}>
          <Link to="/" style={styles.logoLink}>
            <img src={logo} alt="Glamporia" style={styles.logoImage} />
          </Link>

          <div style={styles.links}>
            <Link to="/listings" style={styles.link}>
              Listings
            </Link>

            {!authLoading && renderRoleLinks()}

            {!authLoading && isAuthenticated ? (
              <Link to="/messages" style={styles.link}>
                Messages
              </Link>
            ) : null}

          </div>
        </div>

        <div style={styles.right}>
          {!authLoading && !isAuthenticated ? (
            <>
              <Link to="/login" style={styles.authButton}>
                Sign In
              </Link>

              <Link to="/register" style={styles.authButtonSecondary}>
                Sign Up
              </Link>
            </>
          ) : null}

          {!authLoading && isAuthenticated ? (
            <>
              <Link to="/profile" style={styles.userBlock}>
                <div style={styles.avatar}>
                  {user?.full_name?.charAt(0)?.toUpperCase() ||
                    user?.name?.charAt(0)?.toUpperCase() ||
                    "U"}
                </div>

                <div style={styles.userInfo}>
                  <span style={styles.userName}>
                    {user?.full_name || user?.name || "User"}
                  </span>
                  <span style={styles.userRole}>{user?.role}</span>
                </div>
              </Link>

              <button onClick={logout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: "#dfe8d3",
    borderBottom: "1px solid #cfd8c3",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    height: "75px",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    height: "100%",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  left: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
    flexWrap: "wrap",
  },

  logoLink: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  },

  logoImage: {
    height: "72px",
    width: "60px",
    objectFit: "contain",
    transform: "scale(1.5)",
    transformOrigin: "left center",
    display: "block",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
    flexWrap: "wrap",
  },

  link: {
    textDecoration: "none",
    color: "#222",
    fontSize: "16px",
    fontWeight: "600",
    transition: "0.2s ease",
  },

  right: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  authButton: {
    textDecoration: "none",
    backgroundColor: "#111",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    border: "1px solid #111",
  },

  authButtonSecondary: {
    textDecoration: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    border: "1px solid #e74c3c",
  },

  userBlock: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#edf3e7",
    border: "1px solid #cfd8c3",
    borderRadius: "999px",
    padding: "6px 12px 6px 6px",
    textDecoration: "none",
  },

  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#222",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    flexShrink: 0,
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.1,
  },

  userName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#222",
  },

  userRole: {
    fontSize: "12px",
    color: "#666",
    textTransform: "capitalize",
  },

  logoutButton: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
};

export default Navbar;