import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function PropertyCard({ property }) {
  const fallbackImage =
    "https://img.freepik.com/premium-vector/no-photo-available-vector-icon-default-image-symbol-picture-coming-soon-web-site-mobile-app_87543-10639.jpg";

  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const price = property.price_per_night || property.price;
  

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await api.get(`/properties/${property.id}/images`);
        setImages(response.data || []);
      } catch (err) {
        console.error("Failed to load property images:", err);
        setImages([]);
      }
    };

    if (property?.id) {
      fetchImages();
    }
  }, [property.id]);

  const galleryImages = useMemo(() => {
    const propertyImages =
      images.length > 0
        ? images
        : property.images || [];

    if (propertyImages.length > 0) {
      return [...propertyImages].sort((a, b) => {
        if (a.is_main && !b.is_main) return -1;
        if (!a.is_main && b.is_main) return 1;
        return 0;
      });
    }

    const mainImage =
      property.main_image_url ||
      property.image_url ||
      fallbackImage;

    return [
      {
        id: "fallback",
        image_url: mainImage,
        is_main: true,
      },
    ];
  }, [images, property.images, property.main_image_url, property.image_url]);

  const activeImage =
    galleryImages[activeImageIndex]?.image_url ||
    galleryImages[0]?.image_url ||
    fallbackImage;

  const showPreviousImage = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setActiveImageIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const showNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setActiveImageIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  const selectImage = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex(index);
  };

  return (
    <article
      style={{
        ...styles.card,
        transform: isHovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: isHovered
          ? "0 24px 48px rgba(31,47,31,0.16)"
          : styles.card.boxShadow,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.imageWrap}>
        <img
          src={getImageUrl(activeImage)}
          alt={property.title}
          style={styles.image}
        />

        <div style={styles.gradient} />

        <span style={styles.typeBadge}>
          {formatPropertyType(property.property_type)}
        </span>

        <span style={styles.photoBadge}>
          {activeImageIndex + 1} / {galleryImages.length}
        </span>

        {galleryImages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              style={{ ...styles.imageArrow, left: "12px" }}
              aria-label="Previous image"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={showNextImage}
              style={{ ...styles.imageArrow, right: "12px" }}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        ) : null}

        <div style={styles.imageDots}>
          {galleryImages.slice(0, 5).map((image, index) => (
            <button
              key={image.id || index}
              type="button"
              onClick={(e) => selectImage(e, index)}
              style={{
                ...styles.imageDot,
                ...(index === activeImageIndex ? styles.activeImageDot : {}),
              }}
              aria-label={`Show image ${index + 1}`}
            />
          ))}

          {galleryImages.length > 5 ? (
            <span style={styles.moreImages}>+{galleryImages.length - 5}</span>
          ) : null}
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.topRow}>
          <div>
            <h3 style={styles.title}>{property.title}</h3>
            <p style={styles.location}>
              📍 {property.city || "Unknown city"}
              {property.country ? `, ${property.country}` : ""}
            </p>
          </div>

          <div style={styles.rating}>★ 4.8</div>
        </div>

        <p style={styles.description}>
          {property.short_description ||
            property.description ||
            "A peaceful rural stay surrounded by nature, comfort and authentic local atmosphere."}
        </p>

        <div style={styles.metaRow}>
          <span style={styles.metaItem}>👥 {property.max_guests || 2} guests</span>
          <span style={styles.metaItem}>🌿 Nature</span>
          <span style={styles.metaItem}>🧭 360° ready</span>
        </div>

        <div style={styles.bottomRow}>
          <div>
            <span style={styles.price}>
              {price ? `${Number(price).toFixed(0)}€` : "Price"}
            </span>
            <span style={styles.night}> / night</span>
          </div>

          <Link to={`/properties/${property.id}`} style={styles.button}>
            Explore
          </Link>
        </div>
      </div>
    </article>
  );
}

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:8000${url}`;
}

function formatPropertyType(type) {
  if (!type) return "Rural stay";
  return type.replace("_", " ");
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid #e2e2dc",
    boxShadow: "0 14px 34px rgba(31, 47, 31, 0.10)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    cursor: "pointer",
  },

  imageWrap: {
    height: "245px",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#d8dfd1",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  gradient: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.48))",
    pointerEvents: "none",
  },

  typeBadge: {
    position: "absolute",
    left: "14px",
    top: "14px",
    padding: "8px 13px",
    backgroundColor: "rgba(255,255,255,0.94)",
    color: "#263526",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "capitalize",
  },

  photoBadge: {
    position: "absolute",
    right: "14px",
    top: "14px",
    padding: "8px 12px",
    backgroundColor: "rgba(23,33,23,0.88)",
    color: "#fff",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
  },

  imageArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.16)",
    backdropFilter: "blur(10px)",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
  },

  imageDots: {
    position: "absolute",
    left: "50%",
    bottom: "14px",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    backgroundColor: "rgba(23,33,23,0.5)",
    borderRadius: "999px",
    padding: "7px 10px",
  },

  imageDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "rgba(255,255,255,0.55)",
    cursor: "pointer",
    padding: 0,
  },

  activeImageDot: {
    width: "18px",
    borderRadius: "999px",
    backgroundColor: "#fff",
  },

  moreImages: {
    color: "#fff",
    fontSize: "11px",
    fontWeight: "900",
  },

  body: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },

  title: {
    margin: 0,
    fontSize: "23px",
    fontWeight: "950",
    color: "#172117",
    lineHeight: 1.15,
  },

  location: {
    margin: "8px 0 0 0",
    color: "#65705f",
    fontSize: "14px",
    fontWeight: "700",
  },

  rating: {
    backgroundColor: "#f4f7ef",
    color: "#263526",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "13px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  description: {
    margin: "16px 0",
    color: "#4f5c4b",
    fontSize: "15px",
    lineHeight: 1.5,
    fontWeight: "600",
  },

  metaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },

  metaItem: {
    backgroundColor: "#edf4e7",
    color: "#263526",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "13px",
    fontWeight: "850",
  },

  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    marginTop: "auto",
  },

  price: {
    color: "#172117",
    fontSize: "25px",
    fontWeight: "950",
  },

  night: {
    color: "#65705f",
    fontWeight: "700",
  },

  button: {
    textDecoration: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "12px 17px",
    borderRadius: "14px",
    fontWeight: "950",
  },
};

export default PropertyCard;