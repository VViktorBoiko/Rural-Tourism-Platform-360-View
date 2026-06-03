import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function MainLayout() {
  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.main}>
        <div style={styles.container}>
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f3",
    display: "flex",
    flexDirection: "column",
  },

  main: {
    flex: 1,
    width: "100%",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 24px 0 24px",
  },
};

export default MainLayout;