import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import TourViewer from "../components/TourViewer";


function PropertyPage() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [externalTourOpen, setExternalTourOpen] = useState(false);
  const [tourScenes, setTourScenes] = useState([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [sceneConnections, setSceneConnections] = useState([]);
  const [currentSceneHotspots, setCurrentSceneHotspots] = useState([]);

  const [bookingData, setBookingData] = useState({
    check_in_date: "",
    check_out_date: "",
    guests_count: 1,
  });

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    const fetchPropertyData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          propertyResponse,
          imagesResponse,
          amenitiesResponse,
          reviewsResponse,
          calendarResponse,
          tourScenesResponse,
          sceneConnectionsResponse,
        ] = await Promise.all([
          api.get(`/properties/${id}`),
          api.get(`/properties/${id}/images`).catch(() => ({ data: [] })),
          api.get(`/properties/${id}/amenities`).catch(() => ({ data: [] })),
          api.get(`/properties/${id}/reviews`).catch(() => ({ data: [] })),
          api.get(`/properties/${id}/calendar`).catch(() => ({ data: [] })),
          api.get(`/properties/${id}/tour-scenes`).catch(() => ({ data: [] })),
          api.get(`/properties/${id}/tour-scene-connections`).catch(() => ({ data: [] })),
        ]);

        setProperty(propertyResponse.data);
        setImages(imagesResponse.data || []);
        setAmenities(amenitiesResponse.data || []);
        setReviews(reviewsResponse.data || []);
        setTourScenes(tourScenesResponse.data || []);
        setSceneConnections(sceneConnectionsResponse.data || []);
        setActiveSceneIndex(0);

        const calendarData = calendarResponse.data;

        if (Array.isArray(calendarData)) {
          setCalendar(calendarData);
        } else if (calendarData?.calendar && Array.isArray(calendarData.calendar)) {
          setCalendar(calendarData.calendar);
        } else if (calendarData?.availability && Array.isArray(calendarData.availability)) {
          setCalendar(calendarData.availability);
        } else if (
          calendarData?.unavailable_dates &&
          Array.isArray(calendarData.unavailable_dates)
        ) {
          setCalendar(calendarData.unavailable_dates);
        } else {
          setCalendar([]);
        }

        try {
          const tourResponse = await api.get(`/properties/${id}/tour`);
          setTour(tourResponse.data);
        } catch {
          setTour(null);
        }
      } catch (err) {
        console.error("Property page error:", err);
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load property."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [id]);

  const mainImage = useMemo(() => {
    return (
      images.find((image) => image.is_main)?.image_url ||
      property?.main_image_url ||
      images[0]?.image_url ||
      "https://img.freepik.com/premium-vector/no-photo-available-vector-icon-default-image-symbol-picture-coming-soon-web-site-mobile-app_87543-10639.jpg"
    );
  }, [images, property]);

  const galleryImages = useMemo(() => {
    const fallback = [{ id: "fallback", image_url: mainImage }];
    return images.length > 0 ? images : fallback;
  }, [images, mainImage]);

  const unavailableDates = useMemo(() => {
    return calendar.map((item) => {
      if (typeof item === "string") return item;
      return item.date || item.check_in_date || "";
    });
  }, [calendar]);

  const calendarPreview = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    const startWeekday = firstDay.getDay();
    const emptyDaysBefore = startWeekday === 0 ? 6 : startWeekday - 1;

    for (let i = 0; i < emptyDaysBefore; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const formatted = date.toISOString().split("T")[0];

      days.push({
        date: formatted,
        dayNumber: day,
        unavailable: unavailableDates.includes(formatted),
        isToday: formatted === new Date().toISOString().split("T")[0],
      });
    }

    return days;
  }, [calendarMonth, unavailableDates]);

  const nights = useMemo(() => {
    if (!bookingData.check_in_date || !bookingData.check_out_date) return 0;

    const start = new Date(bookingData.check_in_date);
    const end = new Date(bookingData.check_out_date);
    const diff = end - start;

    if (diff <= 0) return 0;

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [bookingData.check_in_date, bookingData.check_out_date]);

  const pricePerNight = property?.price_per_night || property?.price || 0;
  const totalPrice = nights * pricePerNight;

  const averageRating = useMemo(() => {
    if (!reviews.length) return "New";
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const activeScene = tourScenes[activeSceneIndex];

  const hasTourScenes = tourScenes.length > 0;

  useEffect(() => {
    const fetchCurrentSceneHotspots = async () => {
      if (!activeScene?.id) {
        setCurrentSceneHotspots([]);
        return;
      }

      try {
        const response = await api.get(`/tour-scenes/${activeScene.id}/hotspots`);
        setCurrentSceneHotspots(response.data || []);
      } catch (err) {
        console.error("Failed to load scene hotspots", err);
        setCurrentSceneHotspots([]);
      }
    };

    fetchCurrentSceneHotspots();
  }, [activeScene?.id]);

  const goToPreviousScene = () => {
    setActiveSceneIndex((prev) =>
      prev === 0 ? tourScenes.length - 1 : prev - 1
    );
  };

  const goToNextScene = () => {
    setActiveSceneIndex((prev) =>
      prev === tourScenes.length - 1 ? 0 : prev + 1
    );
  };

  const handleHotspotClick = (targetSceneId) => {
    const targetIndex = tourScenes.findIndex(
      (scene) => scene.id === targetSceneId
    );

    if (targetIndex !== -1) {
      setActiveSceneIndex(targetIndex);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedImageIndex === null) return;

      if (event.key === "Escape") {
        setSelectedImageIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setSelectedImageIndex((prev) =>
          prev === 0 ? galleryImages.length - 1 : prev - 1
        );
      }

      if (event.key === "ArrowRight") {
        setSelectedImageIndex((prev) =>
          prev === galleryImages.length - 1 ? 0 : prev + 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, galleryImages.length]);

  const handleBookingChange = (e) => {
    const { name, value } = e.target;

    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    setBookingMessage("");
    setBookingError("");
    setBookingLoading(true);

    try {
      await api.post("/bookings", {
        property_id: Number(id),
        check_in_date: bookingData.check_in_date,
        check_out_date: bookingData.check_out_date,
        guests_count: Number(bookingData.guests_count),
      });

      setBookingMessage(
        "Reservation request was created successfully. Host will review it soon."
      );

      setBookingData({
        check_in_date: "",
        check_out_date: "",
        guests_count: 1,
      });
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to create reservation."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const openImageViewer = (index) => setSelectedImageIndex(index);
  const closeImageViewer = () => setSelectedImageIndex(null);

  const showPrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const showNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  const goToPreviousMonth = () => {
    setCalendarMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCalendarMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const currentMonthLabel = calendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });


  if (loading) return <LoadingState message="Loading property details..." />;
  if (error) return <ErrorState message={error} />;
  if (!property) return <EmptyState title="Property not found" />;

  const hasCoordinates =
    property.latitude !== null &&
    property.latitude !== undefined &&
    property.longitude !== null &&
    property.longitude !== undefined &&
    property.latitude !== "" &&
    property.longitude !== "";

  return (
    <div style={styles.page}>
      <Link to="/listings" style={styles.backLink}>
        ← Back to listings
      </Link>

      <section style={styles.topHeader}>
        <div>
          <span style={styles.typeBadge}>
            {property.property_type || "Rural stay"}
          </span>

          <h1 style={styles.title}>{property.title}</h1>

          <p style={styles.location}>
            {property.city || "Unknown city"}
            {property.country ? `, ${property.country}` : ""}
          </p>
        </div>

        <div style={styles.ratingBox}>
          <strong>{averageRating}</strong>
          <span>
            {reviews.length ? `${reviews.length} reviews` : "No reviews yet"}
          </span>
        </div>
      </section>

      <section style={styles.gallery}>
        <button
          type="button"
          onClick={() => openImageViewer(0)}
          style={styles.mainImageBox}
        >
          <img
            src={getImageUrl(mainImage)}
            alt={property.title}
            style={styles.mainImage}
          />
          <span style={styles.viewPhotosBadge}>View photos</span>
        </button>

        <div style={styles.sideGallery}>
          {galleryImages.slice(1, 5).map((image, index) => (
            <button
              type="button"
              key={image.id || index}
              onClick={() => openImageViewer(index + 1)}
              style={styles.smallImageButton}
            >
              <img
                src={getImageUrl(image.image_url)}
                alt={property.title}
                style={styles.smallImage}
              />
            </button>
          ))}

          {galleryImages.length === 1 ? (
            <div style={styles.emptyGalleryBox}>
              More photos can be added by the host
            </div>
          ) : null}
        </div>
      </section>

      {selectedImageIndex !== null ? (
        <div style={styles.lightbox}>
          <button type="button" onClick={closeImageViewer} style={styles.closeButton}>
            ×
          </button>

          {galleryImages.length > 1 ? (
            <button
              type="button"
              onClick={showPrevImage}
              style={{ ...styles.arrowButton, left: "30px" }}
            >
              ‹
            </button>
          ) : null}

          <img
            src={getImageUrl(galleryImages[selectedImageIndex]?.image_url || mainImage)}
            alt={property.title}
            style={styles.lightboxImage}
          />

          {galleryImages.length > 1 ? (
            <button
              type="button"
              onClick={showNextImage}
              style={{ ...styles.arrowButton, right: "30px" }}
            >
              ›
            </button>
          ) : null}

          <div style={styles.imageCounter}>
            {selectedImageIndex + 1} / {galleryImages.length}
          </div>
        </div>
      ) : null}

      <section style={styles.mainLayout}>
        <div style={styles.leftColumn}>
          <section style={styles.card}>
            <div style={styles.propertyIntro}>
              <div>
                <h2 style={styles.sectionTitle}>About this stay</h2>
                <p style={styles.description}>
                  {property.full_description ||
                    property.description ||
                    property.short_description ||
                    "A peaceful rural accommodation designed for nature-based tourism, calm weekends and authentic countryside experiences."}
                </p>
              </div>

              <div style={styles.quickFacts}>
                <div style={styles.factItem}>
                  <strong>{property.max_guests || 1}</strong>
                  <span>Guests</span>
                </div>

                <div style={styles.factItem}>
                  <strong>€{pricePerNight}</strong>
                  <span>Per night</span>
                </div>

                <div style={styles.factItem}>
                  <strong>{amenities.length}</strong>
                  <span>Amenities</span>
                </div>
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Stay atmosphere</h2>

            <div style={styles.atmosphereGrid}>
              <div style={styles.atmosphereItem}>
                <span>🌿</span>
                <strong>Nature-focused</strong>
                <p>Designed for guests looking for calm, green spaces and slow tourism.</p>
              </div>

              <div style={styles.atmosphereItem}>
                <span>🏡</span>
                <strong>Rural comfort</strong>
                <p>Combines countryside atmosphere with practical accommodation details.</p>
              </div>

              <div style={styles.atmosphereItem}>
                <span>📍</span>
                <strong>Local experience</strong>
                <p>Helps visitors discover rural places beyond typical city destinations.</p>
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Meet your host</h2>

            <div style={styles.hostCard}>
              <div style={styles.hostAvatar}>H</div>

              <div>
                <h3 style={styles.hostTitle}>Local rural provider</h3>
                <p style={styles.hostText}>
                  This stay is managed by host #{property.host_id}. The host can
                  update property details, images, amenities and booking requests
                  through the platform dashboard.
                </p>

                <div style={styles.trustGrid}>
                  <span>✓ Verified host profile</span>
                  <span>✓ Booking request management</span>
                  <span>✓ Local accommodation provider</span>
                </div>
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Amenities</h2>

            {amenities.length === 0 ? (
              <p style={styles.muted}>No amenities added yet.</p>
            ) : (
              <div style={styles.amenitiesGrid}>
                {amenities.map((amenity) => (
                  <div key={amenity.id} style={styles.amenityItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {hasTourScenes ? (
            <section style={styles.card}>
              <div style={styles.walkthroughHeader}>
                <div>
                  <span style={styles.walkthroughBadge}>Multi-scene experience</span>
                  <h2 style={styles.sectionTitle}>360° Walkthrough</h2>
                  <p style={styles.muted}>
                    Move between several panorama points to explore this property like a
                    small virtual route.
                  </p>
                </div>

                <div style={styles.sceneCounter}>
                  {activeSceneIndex + 1} / {tourScenes.length}
                </div>
              </div>

              <div style={styles.viewerWrapper}>
                {activeScene?.panorama_url ? (
                  <TourViewer
                    key={activeScene.id}
                    imageUrl={getImageUrl(activeScene.panorama_url)}
                    hotSpots={currentSceneHotspots}
                    onHotspotClick={handleHotspotClick}
                  />
                ) : (
                  <p style={styles.muted}>Panorama scene is not available.</p>
                )}
              </div>

              <div style={styles.sceneNavigation}>
                <button
                  type="button"
                  onClick={goToPreviousScene}
                  style={styles.sceneNavButton}
                >
                  ← Previous view
                </button>

                <div style={styles.activeSceneInfo}>
                  <strong>{activeScene.title || "Tour scene"}</strong>
                  <span>Current panorama point</span>
                </div>

                <button
                  type="button"
                  onClick={goToNextScene}
                  style={styles.sceneNavButton}
                >
                  Next view →
                </button>
              </div>

              <div style={styles.sceneThumbnailGrid}>
                {tourScenes.map((scene, index) => (
                  <button
                    type="button"
                    key={scene.id}
                    onClick={() => setActiveSceneIndex(index)}
                    style={{
                      ...styles.sceneThumbnail,
                      ...(index === activeSceneIndex
                        ? styles.activeSceneThumbnail
                        : {}),
                    }}
                  >
                    <img
                      src={getImageUrl(scene.preview_image_url || scene.panorama_url)}
                      alt={scene.title}
                      style={styles.sceneThumbnailImage}
                    />
                    <span>{scene.title || `Scene ${index + 1}`}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : tour?.panorama_url ? (
            tour.panorama_url.startsWith("/uploads/") ? (
              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>360° Virtual Tour</h2>

                <p style={styles.muted}>
                  Drag the image to look around the property and experience the stay in an
                  interactive 360° view.
                </p>

                <div style={styles.viewerWrapper}>
                  <TourViewer imageUrl={getImageUrl(tour.panorama_url)} />
                </div>
              </section>
            ) : (
              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>External / Google Virtual Tour</h2>

                <p style={styles.muted}>
                  Explore this place using an embedded Google View or external virtual
                  tour.
                </p>

                <div style={styles.embeddedTourBox}>
                  <iframe
                    title="External virtual tour"
                    src={tour.panorama_url}
                    style={styles.embeddedTourFrame}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setExternalTourOpen(true)}
                  style={styles.openExternalButton}
                >
                  Open fullscreen view
                </button>
              </section>
            )
          ) : null}

          <section style={styles.card}>
            <div style={styles.calendarHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Availability calendar</h2>
                <p style={styles.muted}>
                  Switch months to check which dates are available or blocked by existing
                  bookings.
                </p>
              </div>

              <div style={styles.calendarControls}>
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  style={styles.calendarNavButton}
                >
                  ←
                </button>

                <strong style={styles.monthLabel}>{currentMonthLabel}</strong>

                <button
                  type="button"
                  onClick={goToNextMonth}
                  style={styles.calendarNavButton}
                >
                  →
                </button>
              </div>
            </div>

            <div style={styles.weekDays}>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            <div style={styles.monthGrid}>
              {calendarPreview.map((day, index) =>
                day ? (
                  <div
                    key={day.date}
                    style={{
                      ...styles.monthDay,
                      ...(day.unavailable ? styles.unavailableDay : styles.availableDay),
                      ...(day.isToday ? styles.todayDay : {}),
                    }}
                  >
                    <strong>{day.dayNumber}</strong>
                    <span>{day.unavailable ? "Blocked" : "Available"}</span>
                  </div>
                ) : (
                  <div key={`empty-${index}`} style={styles.emptyDay} />
                )
              )}
            </div>
          </section>

          {hasCoordinates ? (
             <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Location</h2>

              <iframe
                title="Property location"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  Number(property.longitude) - 0.03
                }%2C${Number(property.latitude) - 0.03}%2C${
                  Number(property.longitude) + 0.03
                }%2C${Number(property.latitude) + 0.03}&layer=mapnik&marker=${
                  property.latitude
                }%2C${property.longitude}`}
                style={styles.map}
              />

              <p style={styles.mapText}>
                Approximate location: {property.city}, {property.country}
              </p>
            </section>
          ) : null}


          <section style={styles.card}>
            <div style={styles.reviewsHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Guest reviews</h2>
                <p style={styles.muted}>
                  {reviews.length
                    ? `Average rating: ${averageRating} / 5`
                    : "No reviews yet. Completed bookings will allow guests to share their experience."}
                </p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div style={styles.emptyReviews}>
                <strong>No guest reviews yet</strong>
                <span>Reviews will appear here after completed stays.</span>
              </div>
            ) : (
              <div style={styles.reviewsGrid}>
                {reviews.map((review) => (
                  <div key={review.id} style={styles.reviewCard}>
                    <div style={styles.reviewTop}>
                      <div style={styles.reviewAvatar}>G</div>
                      <div>
                        <strong>Guest review</strong>
                        <p style={styles.reviewStars}>
                          {"★".repeat(review.rating || 5)}
                        </p>
                      </div>
                    </div>

                    <p style={styles.reviewText}>
                      “{review.comment || review.text || "Wonderful stay."}”
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside style={styles.bookingCard}>
          <div style={styles.bookingTop}>
            <div>
              <span style={styles.bookingPrice}>€{pricePerNight}</span>
              <span style={styles.perNight}> / night</span>
            </div>

            <span style={styles.bookingRating}>★ {averageRating}</span>
          </div>

          <form onSubmit={handleBookingSubmit} style={styles.bookingForm}>
            <label style={styles.label}>
              Check-in
              <input
                type="date"
                name="check_in_date"
                value={bookingData.check_in_date}
                onChange={handleBookingChange}
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Check-out
              <input
                type="date"
                name="check_out_date"
                value={bookingData.check_out_date}
                onChange={handleBookingChange}
                required
                style={styles.input}
              />
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Guests
              <input
                type="number"
                name="guests_count"
                value={bookingData.guests_count}
                onChange={handleBookingChange}
                min="1"
                max={property.max_guests || 20}
                required
                style={styles.input}
              />
            </label>

            <div style={styles.priceSummary}>
              <div style={styles.priceLine}>
                <span>€{pricePerNight} × {nights || 0} night(s)</span>
                <strong>{nights > 0 ? `€${totalPrice}` : "—"}</strong>
              </div>

              <div style={styles.priceLine}>
                <span>Service fee</span>
                <strong>€0</strong>
              </div>

              <div style={styles.totalLine}>
                <span>Total</span>
                <strong>{nights > 0 ? `€${totalPrice}` : "Select dates"}</strong>
              </div>
            </div>

            {bookingMessage ? <p style={styles.success}>{bookingMessage}</p> : null}
            {bookingError ? <p style={styles.errorText}>{bookingError}</p> : null}

            <button
              type="submit"
              style={styles.reserveButton}
              disabled={bookingLoading}
            >
              {bookingLoading ? "Creating request..." : "Reserve this stay"}
            </button>

            <p style={styles.bookingNote}>
              You will not be charged now. The host needs to confirm your booking.
            </p>
          </form>
        </aside>
      </section>
    </div>
  );
}

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:8000${url}`;
}

const styles = {
  page: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "32px 24px 80px",
  },

  backLink: {
    display: "inline-block",
    marginBottom: "22px",
    textDecoration: "none",
    color: "#263526",
    fontWeight: "900",
  },

  topHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "flex-end",
    marginBottom: "24px",
    flexWrap: "wrap",
  },

  typeBadge: {
    display: "inline-block",
    backgroundColor: "#e8f2df",
    color: "#2f4f2f",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "900",
    textTransform: "capitalize",
    marginBottom: "14px",
  },

  title: {
    margin: 0,
    fontSize: "54px",
    lineHeight: 1,
    fontWeight: "950",
    color: "#172117",
    letterSpacing: "-1px",
  },

  location: {
    margin: "12px 0 0 0",
    color: "#65705f",
    fontSize: "18px",
    fontWeight: "800",
  },

  ratingBox: {
    backgroundColor: "#fff",
    border: "1px solid #e0e4da",
    borderRadius: "20px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 10px 24px rgba(31, 47, 31, 0.08)",
  },

  gallery: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(220px, 0.8fr)",
    gap: "16px",
    height: "520px",
    marginBottom: "34px",
  },

  mainImageBox: {
    position: "relative",
    border: "none",
    padding: 0,
    width: "100%",
    height: "100%",
    borderRadius: "28px",
    overflow: "hidden",
    backgroundColor: "#d8dfd1",
    cursor: "pointer",
    boxShadow: "0 18px 44px rgba(31, 47, 31, 0.12)",
  },

  mainImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  viewPhotosBadge: {
    position: "absolute",
    right: "20px",
    bottom: "20px",
    backgroundColor: "#172117",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "14px",
    fontWeight: "950",
    boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
  },

  sideGallery: {
    display: "grid",
    gridTemplateRows: "repeat(2, 1fr)",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    height: "100%",
  },

  smallImageButton: {
    border: "none",
    padding: 0,
    width: "100%",
    height: "100%",
    borderRadius: "20px",
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#d8dfd1",
    boxShadow: "0 10px 24px rgba(31, 47, 31, 0.08)",
  },

  smallImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  emptyGalleryBox: {
    borderRadius: "20px",
    backgroundColor: "#edf4e7",
    color: "#384a35",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontWeight: "850",
  },

  lightbox: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    zIndex: 5000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },

  lightboxImage: {
    maxWidth: "86vw",
    maxHeight: "84vh",
    objectFit: "contain",
    borderRadius: "18px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
  },

  closeButton: {
    position: "absolute",
    top: "24px",
    right: "30px",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#fff",
    color: "#111",
    fontSize: "30px",
    cursor: "pointer",
    fontWeight: "900",
  },

  arrowButton: {
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

  imageCounter: {
    position: "absolute",
    bottom: "26px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(255,255,255,0.92)",
    color: "#111",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "900",
  },

  mainLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: "32px",
    alignItems: "start",
  },

  leftColumn: {
    display: "grid",
    gap: "24px",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: "26px",
    padding: "28px",
    border: "1px solid #e0e4da",
    boxShadow: "0 12px 30px rgba(31, 47, 31, 0.07)",
    minWidth: 0,
  },

  propertyIntro: {
    display: "grid",
    gridTemplateColumns: "1fr 260px",
    gap: "28px",
    alignItems: "start",
  },

  sectionTitle: {
    margin: "0 0 18px 0",
    fontSize: "30px",
    fontWeight: "950",
    color: "#172117",
  },

  description: {
    margin: 0,
    color: "#4f5c4b",
    fontSize: "17px",
    lineHeight: 1.75,
    fontWeight: "600",
  },

  quickFacts: {
    display: "grid",
    gap: "12px",
  },

  factItem: {
    backgroundColor: "#f5f8f1",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  atmosphereGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },

  atmosphereItem: {
    backgroundColor: "#f5f8f1",
    borderRadius: "20px",
    padding: "20px",
  },

  hostCard: {
    display: "grid",
    gridTemplateColumns: "72px 1fr",
    gap: "18px",
    alignItems: "start",
  },

  hostAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#172117",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "950",
  },

  hostTitle: {
    margin: "0 0 8px 0",
    fontSize: "22px",
    fontWeight: "950",
    color: "#172117",
  },

  hostText: {
    margin: 0,
    color: "#4f5c4b",
    lineHeight: 1.6,
    fontWeight: "650",
  },

  trustGrid: {
    marginTop: "16px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  amenitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },

  amenityItem: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    backgroundColor: "#f5f8f1",
    borderRadius: "16px",
    padding: "14px",
    fontWeight: "850",
    color: "#263526",
  },

  checkIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#e74c3c",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    flexShrink: 0,
  },

  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(82px, 1fr))",
    gap: "10px",
    marginTop: "18px",
  },

  calendarDay: {
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    textAlign: "center",
    fontWeight: "850",
  },

  availableDay: {
    backgroundColor: "#e8f7ea",
    color: "#166534",
  },

  unavailableDay: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },

  map: {
    width: "100%",
    height: "320px",
    border: "none",
    borderRadius: "22px",
  },

  mapPlaceholder: {
    height: "260px",
    borderRadius: "22px",
    backgroundColor: "#edf4e7",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "28px",
    color: "#263526",
  },

  reviewsHeader: {
    marginBottom: "18px",
  },

  reviewsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "16px",
  },

  emptyReviews: {
    backgroundColor: "#f5f8f1",
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: "#263526",
  },

  reviewCard: {
    backgroundColor: "#f8faf6",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid #e0e4da",
  },

  reviewTop: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "16px",
  },

  reviewAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#172117",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "950",
  },

  reviewStars: {
    margin: "4px 0 0 0",
    color: "#e74c3c",
  },

  reviewText: {
    margin: 0,
    color: "#4f5c4b",
    lineHeight: 1.55,
    fontWeight: "650",
  },

  muted: {
    margin: 0,
    color: "#65705f",
    fontWeight: "650",
  },

  bookingCard: {
    position: "sticky",
    top: "110px",
    backgroundColor: "#fff",
    borderRadius: "28px",
    padding: "24px",
    border: "1px solid #e0e4da",
    boxShadow: "0 22px 50px rgba(31, 47, 31, 0.15)",
  },

  bookingTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "20px",
  },

  bookingPrice: {
    fontSize: "34px",
    fontWeight: "950",
    color: "#172117",
  },

  perNight: {
    color: "#65705f",
    fontWeight: "800",
  },

  bookingRating: {
    backgroundColor: "#f5f8f1",
    padding: "9px 12px",
    borderRadius: "999px",
    fontWeight: "950",
  },

  bookingForm: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#263526",
    fontWeight: "900",
    fontSize: "14px",
  },

  input: {
    height: "50px",
    borderRadius: "14px",
    border: "1px solid #d8ded1",
    padding: "0 12px",
    fontSize: "15px",
    outline: "none",
  },

  priceSummary: {
    gridColumn: "1 / -1",
    backgroundColor: "#f5f8f1",
    borderRadius: "20px",
    padding: "16px",
    display: "grid",
    gap: "10px",
  },

  priceLine: {
    display: "flex",
    justifyContent: "space-between",
    color: "#586354",
    fontWeight: "700",
  },

  totalLine: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "10px",
    borderTop: "1px solid #d8ded1",
    fontSize: "18px",
    fontWeight: "950",
    color: "#172117",
  },

  reserveButton: {
    gridColumn: "1 / -1",
    height: "56px",
    border: "none",
    borderRadius: "18px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    fontWeight: "950",
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(231, 76, 60, 0.25)",
  },

  bookingNote: {
    gridColumn: "1 / -1",
    margin: 0,
    color: "#65705f",
    fontSize: "13px",
    lineHeight: 1.45,
    textAlign: "center",
    fontWeight: "650",
  },

  success: {
    gridColumn: "1 / -1",
    margin: 0,
    color: "green",
    fontWeight: "850",
  },

  errorText: {
    gridColumn: "1 / -1",
    margin: 0,
    color: "#c0392b",
    fontWeight: "850",
  },
  mapText: {
    margin: "12px 0 0 0",
    color: "#65705f",
    fontWeight: "700",
  },

  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  calendarControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#f5f8f1",
    borderRadius: "999px",
    padding: "8px",
  },

  calendarNavButton: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#172117",
    color: "#fff",
    fontWeight: "950",
    cursor: "pointer",
  },

  monthLabel: {
    minWidth: "150px",
    textAlign: "center",
    color: "#172117",
  },

  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "8px",
    width: "100%",
    overflow: "hidden",
  },

  weekDays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "8px",
    marginBottom: "8px",
    color: "#65705f",
    fontWeight: "900",
    textAlign: "center",
    fontSize: "13px",
  },

  monthDay: {
    minHeight: "68px",
    minWidth: 0,
    borderRadius: "14px",
    padding: "8px 4px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "4px",
    textAlign: "center",
    fontWeight: "850",
    border: "1px solid transparent",
    fontSize: "13px",
  },

  emptyDay: {
    minHeight: "68px",
    minWidth: 0,
    borderRadius: "14px",
    backgroundColor: "#f8faf6",
  },

  todayDay: {
    border: "2px solid #172117",
  },
  viewerWrapper: {
    marginTop: "18px",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 16px 38px rgba(31, 47, 31, 0.12)",
  },
  externalTourFrame: {
    width: "86vw",
    height: "82vh",
    border: "none",
    borderRadius: "22px",
    backgroundColor: "#fff",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
  },
  tourLink: {
    display: "inline-block",
    marginTop: "10px",
    textDecoration: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    padding: "13px 18px",
    borderRadius: "14px",
    fontWeight: "950",
    border: "none",
    cursor: "pointer",
  },
  embeddedTourBox: {
    marginTop: "18px",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid #e0e4da",
    boxShadow: "0 16px 38px rgba(31, 47, 31, 0.12)",
  },

  embeddedTourFrame: {
    width: "100%",
    height: "460px",
    border: "none",
    display: "block",
    backgroundColor: "#f5f8f1",
  },
  openExternalButton: {
    marginTop: "16px",
    border: "none",
    backgroundColor: "#172117",
    color: "#fff",
    padding: "13px 18px",
    borderRadius: "14px",
    fontWeight: "950",
    cursor: "pointer",
  },
  walkthroughHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  walkthroughBadge: {
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

  sceneCounter: {
    backgroundColor: "#172117",
    color: "#fff",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "950",
  },

  sceneNavigation: {
    display: "grid",
    gridTemplateColumns: "160px 1fr 160px",
    gap: "14px",
    alignItems: "center",
    marginTop: "18px",
  },

  sceneNavButton: {
    border: "none",
    backgroundColor: "#172117",
    color: "#fff",
    borderRadius: "14px",
    padding: "13px 16px",
    fontWeight: "950",
    cursor: "pointer",
  },

  activeSceneInfo: {
    backgroundColor: "#f5f8f1",
    borderRadius: "16px",
    padding: "14px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#263526",
  },

  sceneThumbnailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginTop: "18px",
  },

  sceneThumbnail: {
    border: "1px solid #e0e4da",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "8px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "850",
    color: "#263526",
  },

  activeSceneThumbnail: {
    border: "2px solid #e74c3c",
    backgroundColor: "#fff7f5",
  },

  sceneThumbnailImage: {
    width: "100%",
    height: "86px",
    objectFit: "cover",
    borderRadius: "12px",
    display: "block",
    marginBottom: "8px",
  },

  publicRouteWrapper: {
    marginTop: "24px",
  },

  smallRouteTitle: {
    margin: "0 0 14px 0",
    fontSize: "18px",
    fontWeight: "950",
    color: "#172117",
  },

  publicRouteCanvas: {
    position: "relative",
    width: "100%",
    height: "320px",
    background:
      "linear-gradient(135deg, #edf4e7 0%, #f8faf6 50%, #dfe8d3 100%)",
    border: "2px dashed #9cad8f",
    borderRadius: "22px",
    overflow: "hidden",
  },

  publicRoutePoint: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    minWidth: "90px",
    maxWidth: "150px",
    padding: "10px 14px",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    boxShadow: "0 8px 18px rgba(31, 47, 31, 0.24)",
    fontSize: "13px",
    fontWeight: "900",
    textAlign: "center",
    cursor: "pointer",
    zIndex: 2,
  },
  publicRouteConnectionLayer: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 1,
  },
};

export default PropertyPage;