import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PropertyCard from "../components/PropertyCard";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";

function ListingsPage() {
  const emptyFilters = {
    city: "",
    country: "",
    property_type: "",
    min_price: "",
    max_price: "",
    guests: "",
  };

  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [sortBy, setSortBy] = useState("recommended");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProperties = async (customFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      Object.entries(customFilters).forEach(([key, value]) => {
        if (value !== "") {
          params[key] = value;
        }
      });

      const response = await api.get("/properties", { params });
      setProperties(response.data || []);
    } catch (err) {
      console.error("Failed to load listings:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load properties."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(emptyFilters);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties(filters);
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    setSortBy("recommended");
    fetchProperties(emptyFilters);
  };

  const handleQuickType = (type) => {
    const nextFilters = {
      ...filters,
      property_type: type,
    };

    setFilters(nextFilters);
    fetchProperties(nextFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const sortedProperties = useMemo(() => {
    const copy = [...properties];

    if (sortBy === "price_low") {
      return copy.sort(
        (a, b) => Number(a.price_per_night || 0) - Number(b.price_per_night || 0)
      );
    }

    if (sortBy === "price_high") {
      return copy.sort(
        (a, b) => Number(b.price_per_night || 0) - Number(a.price_per_night || 0)
      );
    }

    if (sortBy === "guests_high") {
      return copy.sort(
        (a, b) => Number(b.max_guests || 0) - Number(a.max_guests || 0)
      );
    }

    return copy;
  }, [properties, sortBy]);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <span style={styles.heroBadge}>Rural tourism platform</span>

          <h1 style={styles.heroTitle}>
            Discover peaceful rural stays with immersive 360° tours
          </h1>

          <p style={styles.heroText}>
            Browse cottages, farm stays, glamping places and countryside escapes
            with online booking and virtual walkthrough experiences.
          </p>

          <form onSubmit={handleSearch} style={styles.searchBox}>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleChange}
              placeholder="Where to?"
              style={styles.searchInput}
            />

            <input
              type="text"
              name="country"
              value={filters.country}
              onChange={handleChange}
              placeholder="Country"
              style={styles.searchInput}
            />

            <input
              type="number"
              name="guests"
              value={filters.guests}
              onChange={handleChange}
              placeholder="Guests"
              min="1"
              style={styles.searchInput}
            />

            <button type="submit" style={styles.searchButton}>
              Search stays
            </button>
          </form>
        </div>
      </section>

      <section style={styles.contentSection}>
        <div style={styles.headerRow}>
          <div>
            <span style={styles.sectionBadge}>Available stays</span>
            <h2 style={styles.title}>Explore rural accommodations</h2>
            <p style={styles.subtitle}>
              Choose a stay, view photos, explore amenities and open the 360°
              walkthrough before booking.
            </p>
          </div>

          <div style={styles.resultsBox}>
            <strong>{sortedProperties.length}</strong>
            <span>
              {sortedProperties.length === 1 ? "property found" : "properties found"}
            </span>
          </div>
        </div>

        <div style={styles.filtersPanel}>
          <label style={styles.filterLabel}>
            Property type
            <select
              name="property_type"
              value={filters.property_type}
              onChange={handleChange}
              style={styles.filterInput}
            >
              <option value="">All types</option>
              <option value="glamping">Glamping</option>
              <option value="cottage">Cottage</option>
              <option value="farmstay">Farmstay</option>
              <option value="guesthouse">Guesthouse</option>
              <option value="villa">Villa</option>
            </select>
          </label>

          <label style={styles.filterLabel}>
            Sort by
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.filterInput}
            >
              <option value="recommended">Recommended</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
              <option value="guests_high">Most guests</option>
            </select>
          </label>

          <div style={styles.filterActions}>
            <button type="button" onClick={() => fetchProperties(filters)} style={styles.applyButton}>
              Apply filters
            </button>

            <button type="button" onClick={handleReset} style={styles.resetButton}>
              Reset
            </button>
          </div>
        </div>

        {activeFiltersCount > 0 ? (
          <div style={styles.activeFilters}>
            <span style={styles.activeFiltersLabel}>
              Active filters: {activeFiltersCount}
            </span>

            {Object.entries(filters).map(([key, value]) =>
              value ? (
                <span key={key} style={styles.filterChip}>
                  {key.replace("_", " ")}: {value}
                </span>
              ) : null
            )}
          </div>
        ) : null}

        <div style={styles.infoStrip}>
          <div>
            <span>Guests can preview selected stays using immersive panorama tours.</span>
          </div>

          <div>
            <span>Listings are designed around nature, local culture and calm travel.</span>
          </div>

          <div>
            <span>Each property can support availability checks and booking requests.</span>
          </div>
        </div>

        {loading ? <LoadingState message="Loading properties..." /> : null}

        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && !error && sortedProperties.length === 0 ? (
          <EmptyState
            title="No properties found"
            description="Try changing filters, searching another city or resetting the search."
          />
        ) : null}

        {!loading && !error && sortedProperties.length > 0 ? (
          <div style={styles.grid}>
            {sortedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "28px",
  },

  hero: {
    minHeight: "430px",
    borderRadius: "0 0 28px 28px",
    backgroundImage:
      "linear-gradient(120deg, rgba(18, 33, 23, 0.82), rgba(18, 33, 23, 0.45)), url('https://media.geeksforgeeks.org/wp-content/uploads/20230222113127/Village-tourism-(1)-768.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "-32px -24px 0 -24px",
    padding: "56px 24px",
  },

  heroContent: {
    width: "100%",
    maxWidth: "1080px",
    color: "#fff",
  },

  heroBadge: {
    display: "inline-block",
    backgroundColor: "rgba(232, 242, 223, 0.95)",
    color: "#172117",
    padding: "9px 15px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "950",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "18px",
  },

  heroTitle: {
    maxWidth: "760px",
    margin: "0 0 18px 0",
    fontSize: "54px",
    fontWeight: "950",
    lineHeight: 1.05,
  },

  heroText: {
    maxWidth: "700px",
    margin: "0 0 30px 0",
    fontSize: "18px",
    lineHeight: 1.6,
    fontWeight: "600",
  },

  searchBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 180px",
    gap: "10px",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: "22px",
    padding: "12px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
    maxWidth: "980px",
  },

  searchInput: {
    height: "56px",
    border: "1px solid #d8ded1",
    borderRadius: "16px",
    padding: "0 16px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#fff",
  },

  searchButton: {
    border: "none",
    borderRadius: "16px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "950",
    cursor: "pointer",
  },

  heroHighlights: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "20px",
    fontWeight: "800",
  },

  quickTypes: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "-18px",
    position: "relative",
    zIndex: 2,
  },

  quickTypeButton: {
    border: "1px solid #d8ded1",
    backgroundColor: "#fff",
    color: "#172117",
    borderRadius: "999px",
    padding: "12px 18px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(31, 47, 31, 0.08)",
  },

  contentSection: {
    display: "grid",
    gap: "22px",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    flexWrap: "wrap",
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

  title: {
    margin: 0,
    fontSize: "36px",
    fontWeight: "950",
    color: "#172117",
  },

  subtitle: {
    margin: "8px 0 0 0",
    color: "#65705f",
    fontSize: "16px",
    lineHeight: 1.6,
    fontWeight: "600",
  },

  resultsBox: {
    backgroundColor: "#172117",
    color: "#fff",
    borderRadius: "20px",
    padding: "16px 20px",
    display: "grid",
    gap: "4px",
    minWidth: "150px",
    textAlign: "center",
  },

  filtersPanel: {
    backgroundColor: "#fff",
    border: "1px solid #e2e2dc",
    borderRadius: "24px",
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    alignItems: "end",
    boxShadow: "0 12px 30px rgba(31, 47, 31, 0.08)",
  },

  filterLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "850",
    color: "#263526",
  },

  filterInput: {
    height: "48px",
    border: "1px solid #d0d0c8",
    borderRadius: "14px",
    padding: "0 14px",
    fontSize: "15px",
    backgroundColor: "#fff",
    outline: "none",
  },

  filterActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  applyButton: {
    height: "48px",
    border: "none",
    borderRadius: "14px",
    padding: "0 18px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    fontWeight: "950",
    cursor: "pointer",
  },

  resetButton: {
    height: "48px",
    border: "1px solid #d0d0c8",
    borderRadius: "14px",
    padding: "0 18px",
    backgroundColor: "#fff",
    color: "#172117",
    fontWeight: "900",
    cursor: "pointer",
  },

  activeFilters: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  activeFiltersLabel: {
    color: "#65705f",
    fontWeight: "900",
  },

  filterChip: {
    backgroundColor: "#edf4e7",
    color: "#263526",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: "850",
    fontSize: "13px",
  },

  infoStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
    gap: "28px",
  },
  infoStripItem: {
    backgroundColor: "#f8faf6",
    border: "1px solid #e0e4da",
    borderRadius: "18px",
    padding: "16px",
    display: "grid",
    gap: "6px",
    color: "#263526",
  },
};

export default ListingsPage;