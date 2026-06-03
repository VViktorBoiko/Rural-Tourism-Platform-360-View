import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import PropertyCard from "../components/PropertyCard";

function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get("/properties");
        setFeaturedProperties((response.data || []).slice(0, 3));
      } catch (err) {
        console.error("Failed to load featured properties:", err);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <span style={styles.heroBadge}>Rural tourism platform</span>

          <h1 style={styles.heroTitle}>
            Explore rural stays before you book
          </h1>

          <p style={styles.heroText}>
            Discover cottages, glamping places and countryside escapes with
            online booking, rich property profiles and immersive 360° virtual
            walkthroughs.
          </p>
        </div>

        <div style={styles.heroVisual}>
          <div style={styles.visualCard}>
            <img
              src="https://storage.georgia.travel/images/rural-tourism-in-georgia.webp"
              alt="Rural stay"
              style={styles.heroImage}
            />

            <div style={styles.tourOverlay}>
              <span style={styles.tourIcon}>◎</span>
              <div>
                <strong>Interactive walkthrough</strong>
                <p>Move between panorama points like a simplified Street View.</p>
              </div>
            </div>
          </div>

          <div style={styles.floatingPanel}>
            <strong>Trust before booking</strong>
            <span>Photos, amenities, reviews, availability and 360° scenes.</span>
          </div>
        </div>
      </section>

      <section style={styles.searchStrip}>
        <div style={styles.searchItem}>
          <strong>Nature-based stays</strong>
        </div>

        <div style={styles.searchItem}>
          <strong>360° virtual preview</strong>
        </div>

        <div style={styles.searchItem}>
          <strong>Simple online request</strong>
        </div>

        <Link to="/listings" style={styles.searchButton}>
          Search listings
        </Link>
      </section>

      <section style={styles.section}>
        <div style={styles.featuredHeader}>
          <div>
            <span style={styles.sectionBadge}>Featured stays</span>
            <h2 style={styles.sectionTitle}>Explore available properties</h2>
          </div>
        </div>

        {featuredProperties.length > 0 ? (
          <div style={styles.propertyGrid}>
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div style={styles.emptyFeatured}>
            <h3>No properties yet</h3>
            <p>
              Once hosts create properties, featured rural stays will appear
              here.
            </p>
            <Link to="/listings" style={styles.primaryButton}>
              Go to listings
            </Link>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>Why this platform?</span>
          <h2 style={styles.sectionTitle}>
            Built for rural tourism visibility and trust
          </h2>
          <p style={styles.sectionText}>
            Rural stays often struggle to show atmosphere online. This platform
            helps hosts present their accommodation professionally while guests
            can explore places visually before making a booking request.
          </p>
        </div>

        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.iconCircle}>🏡</div>
            <h3>Rural listings</h3>
            <p>
              Guests can browse cottages, glamping places, farm stays and other
              rural accommodation offers in one place.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.iconCircle}>📅</div>
            <h3>Online booking</h3>
            <p>
              Users can request reservations online while hosts manage booking
              status through their dashboard.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.iconCircle}>🌐</div>
            <h3>360° walkthroughs</h3>
            <p>
              Hosts can add panorama scenes and navigation hotspots so guests
              can move between locations virtually.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.experienceSection}>
        <div style={styles.experienceContent}>
          <span style={styles.sectionBadge}>Virtual tour builder</span>

          <h2 style={styles.splitTitle}>
            A more immersive way to present countryside stays
          </h2>

          <p style={styles.splitText}>
            The platform supports multiple panorama scenes, visual scene
            arrangement and clickable hotspot navigation. This makes the stay
            easier to understand before arrival and strengthens guest confidence.
          </p>

          <div style={styles.stepList}>
            <div style={styles.stepItem}>
              <span>1</span>
              <strong>Upload panorama scenes</strong>
            </div>

            <div style={styles.stepItem}>
              <span>2</span>
              <strong>Arrange tour points visually and clickable hotspots</strong>
            </div>

            <div style={styles.stepItem}>
              <span>3</span>
              <strong>Let guests explore before booking</strong>
            </div>
          </div>
        </div>

        <div style={styles.experienceMockup}>
          <div style={styles.mockupHeader}>
            <span>360° Walkthrough</span>
          </div>

          <div style={styles.mockupViewer}>
            <span style={styles.hotspotA}>Go to room</span>
            <span style={styles.hotspotB}>Go to terrace</span>
          </div>
        </div>
      </section>

      <section style={styles.hostSection}>
        <div>
          <span style={styles.sectionBadge}>For hosts</span>
          <h2 style={styles.hostTitle}>
            Present your rural accommodation with stronger digital tools
          </h2>
          <p style={styles.hostText}>
            Hosts can manage property details, images, amenities, availability,
            booking requests and immersive virtual tour scenes from one place.
          </p>
        </div>
      </section>

      <section style={styles.ctaSection}>
        <div>
          <span style={styles.ctaBadge}>Ready to explore?</span>
          <h2 style={styles.ctaTitle}>
            Discover rural tourism through visual, trustworthy booking
          </h2>
          <p style={styles.ctaText}>
            Start browsing countryside stays or create an account to list your
            own rural accommodation.
          </p>
        </div>

        <div style={styles.ctaActions}>
          <Link to="/register" style={styles.ctaSecondary}>
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "34px",
  },

  hero: {
    minHeight: "650px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "48px",
    alignItems: "center",
    padding: "24px 0 10px 0",
  },

  heroContent: {
    maxWidth: "660px",
  },

  heroBadge: {
    display: "inline-block",
    backgroundColor: "#e8f2df",
    color: "#2f4f2f",
    padding: "9px 15px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "22px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "70px",
    lineHeight: 0.95,
    fontWeight: "950",
    color: "#172117",
    letterSpacing: "-2px",
  },

  heroText: {
    margin: "26px 0 0 0",
    color: "#586354",
    fontSize: "19px",
    lineHeight: 1.65,
    fontWeight: "650",
    maxWidth: "590px",
  },

  heroActions: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "34px",
  },

  primaryButton: {
    textDecoration: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "15px 24px",
    borderRadius: "16px",
    fontWeight: "950",
    boxShadow: "0 10px 22px rgba(231, 76, 60, 0.25)",
  },

  secondaryButton: {
    textDecoration: "none",
    backgroundColor: "#fff",
    color: "#172117",
    padding: "15px 24px",
    borderRadius: "16px",
    fontWeight: "950",
    border: "1px solid #d6dfce",
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "34px",
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "34px",
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "34px",
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "34px",
  },

  heroVisual: {
    position: "relative",
  },

  visualCard: {
    position: "relative",
    borderRadius: "36px",
    overflow: "hidden",
    minHeight: "520px",
    boxShadow: "0 28px 70px rgba(31,47,31,0.22)",
  },

  heroImage: {
    width: "100%",
    height: "520px",
    objectFit: "cover",
    display: "block",
  },

  tourOverlay: {
    position: "absolute",
    left: "24px",
    right: "24px",
    bottom: "24px",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: "24px",
    padding: "18px",
    display: "flex",
    gap: "14px",
    alignItems: "center",
    color: "#172117",
  },

  tourIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#172117",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "950",
    fontSize: "22px",
  },

  floatingPanel: {
    position: "absolute",
    top: "34px",
    left: "-34px",
    backgroundColor: "#fff",
    color: "#172117",
    borderRadius: "22px",
    padding: "18px",
    width: "230px",
    boxShadow: "0 18px 40px rgba(31,47,31,0.18)",
    display: "grid",
    gap: "6px",
  },

  searchStrip: {
    backgroundColor: "#fff",
    border: "1px solid #e2e2dc",
    borderRadius: "28px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr) 180px",
    gap: "14px",
    alignItems: "center",
    boxShadow: "0 14px 34px rgba(31,47,31,0.08)",
    marginTop: "-18px",
  },

  searchItem: {
    display: "grid",
    gap: "4px",
    padding: "8px 14px",
    borderRight: "1px solid #edf0e8",
  },

  searchButton: {
    textDecoration: "none",
    backgroundColor: "#172117",
    color: "#fff",
    borderRadius: "18px",
    padding: "16px 18px",
    fontWeight: "950",
    textAlign: "center",
  },

  section: {
    display: "grid",
    gap: "24px",
    padding: "28px 0",
  },

  sectionHeader: {
    maxWidth: "780px",
  },

  sectionBadge: {
    display: "inline-block",
    backgroundColor: "#e8f2df",
    color: "#2f4f2f",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.05,
    fontWeight: "950",
    color: "#172117",
  },

  sectionText: {
    margin: "14px 0 0 0",
    color: "#586354",
    fontSize: "17px",
    lineHeight: 1.65,
    fontWeight: "650",
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
  },

  featureCard: {
    backgroundColor: "#fff",
    border: "1px solid #e2e2dc",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 12px 30px rgba(31,47,31,0.08)",
  },

  iconCircle: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    backgroundColor: "#edf4e7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    marginBottom: "16px",
  },

  experienceSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "28px",
    alignItems: "center",
    backgroundColor: "#f4f7ef",
    border: "1px solid #dce5d4",
    borderRadius: "36px",
    padding: "34px",
  },

  splitTitle: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.08,
    fontWeight: "950",
    color: "#172117",
  },

  splitText: {
    margin: "16px 0 0 0",
    color: "#586354",
    fontSize: "17px",
    lineHeight: 1.65,
    fontWeight: "650",
  },

  stepList: {
    display: "grid",
    gap: "12px",
    marginTop: "24px",
  },

  stepItem: {
    backgroundColor: "#fff",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    fontWeight: "900",
    color: "#263526",
  },

  experienceMockup: {
    backgroundColor: "#172117",
    borderRadius: "30px",
    padding: "20px",
    color: "#fff",
    boxShadow: "0 22px 50px rgba(31,47,31,0.22)",
  },

  mockupHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    marginBottom: "16px",
  },

  mockupViewer: {
    height: "300px",
    borderRadius: "24px",
    backgroundImage:
      "linear-gradient(120deg, rgba(0,0,0,0.1), rgba(0,0,0,0.35)), url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
    overflow: "hidden",
  },

  hotspotA: {
    position: "absolute",
    left: "18%",
    top: "45%",
    backgroundColor: "rgba(255,255,255,0.92)",
    color: "#172117",
    padding: "9px 13px",
    borderRadius: "999px",
    fontWeight: "900",
  },

  hotspotB: {
    position: "absolute",
    right: "14%",
    top: "58%",
    backgroundColor: "rgba(255,255,255,0.92)",
    color: "#172117",
    padding: "9px 13px",
    borderRadius: "999px",
    fontWeight: "900",
  },

  mockupScenes: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "14px",
  },

  featuredHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },

  viewAllButton: {
    textDecoration: "none",
    color: "#172117",
    backgroundColor: "#fff",
    border: "1px solid #d6dfce",
    borderRadius: "16px",
    padding: "13px 18px",
    fontWeight: "950",
  },

  propertyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },

  emptyFeatured: {
    backgroundColor: "#fff",
    border: "1px solid #e2e2dc",
    borderRadius: "26px",
    padding: "30px",
  },

  hostSection: {
    display: "grid",
    gridTemplateColumns: "25fr 1fr",
    gap: "24px",
    backgroundColor: "#fff",
    border: "1px solid #e2e2dc",
    borderRadius: "34px",
    padding: "34px",
    boxShadow: "0 12px 30px rgba(31,47,31,0.08)",
  },

  hostTitle: {
    margin: 0,
    fontSize: "38px",
    lineHeight: 1.08,
    fontWeight: "950",
    color: "#172117",
  },

  hostText: {
    color: "#586354",
    fontSize: "16px",
    lineHeight: 1.65,
    fontWeight: "650",
  },

  hostCards: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  hostCard: {
    backgroundColor: "#edf4e7",
    borderRadius: "18px",
    padding: "16px",
    fontWeight: "900",
    color: "#263526",
  },

  ctaSection: {
    background:
      "linear-gradient(135deg, #dfe8d3 0%, #f8faf6 55%, #ffffff 100%)",
    borderRadius: "34px",
    padding: "42px",
    display: "flex",
    justifyContent: "space-between",
    gap: "28px",
    alignItems: "center",
    flexWrap: "wrap",
    border: "1px solid #d6dfce",
  },

  ctaBadge: {
    display: "inline-block",
    backgroundColor: "#fff",
    color: "#2f4f2f",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "900",
    marginBottom: "14px",
  },

  ctaTitle: {
    margin: 0,
    fontSize: "40px",
    lineHeight: 1.05,
    fontWeight: "950",
    color: "#172117",
    maxWidth: "760px",
  },

  ctaText: {
    margin: "16px 0 0 0",
    color: "#586354",
    fontWeight: "700",
    fontSize: "16px",
    maxWidth: "660px",
  },

  ctaActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  ctaPrimary: {
    textDecoration: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "15px 22px",
    borderRadius: "16px",
    fontWeight: "950",
  },

  ctaSecondary: {
    textDecoration: "none",
    backgroundColor: "#fff",
    color: "#172117",
    padding: "15px 22px",
    borderRadius: "16px",
    fontWeight: "950",
    border: "1px solid #d6dfce",
  },
};

export default HomePage;