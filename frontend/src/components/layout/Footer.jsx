import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.left}>
          <div style={styles.brand}>Glamporia</div>

          <p style={styles.description}>
            Discover unique glamping experiences across Lithuania&apos;s most
            beautiful natural landscapes.
          </p>

          <div style={styles.socials}>
            <span style={styles.socialIcon}>f</span>
            <span style={styles.socialIcon}>in</span>
            <span style={styles.socialIcon}>▶</span>
            <span style={styles.socialIcon}>◎</span>
          </div>
        </div>

        <div style={styles.right}>
          <Link to="/" style={styles.link}>
            Investor relations
          </Link>
          <Link to="/" style={styles.link}>
            Company Policy
          </Link>
          <Link to="/" style={styles.link}>
            Terms and conditions
          </Link>
          <Link to="/" style={styles.link}>
            Company details
          </Link>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    marginTop: "60px",
    backgroundColor: "#dfe8d3",
    borderTop: "1px solid #cfd8c3",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "36px 24px",
    display: "flex",
    justifyContent: "space-between",
    gap: "40px",
    flexWrap: "wrap",
  },

  left: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "420px",
  },

  brand: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1f1f1f",
  },

  description: {
    margin: 0,
    fontSize: "18px",
    lineHeight: 1.5,
    color: "#2d2d2d",
  },

  socials: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginTop: "6px",
  },

  socialIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "1px solid #9fad95",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    color: "#4a4a4a",
    backgroundColor: "#eef4e8",
  },

  right: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    minWidth: "220px",
    alignItems: "flex-start",
    justifyContent: "center",
  },

  link: {
    textDecoration: "none",
    color: "#2c2c2c",
    fontSize: "20px",
    lineHeight: 1.4,
  },
};

export default Footer;