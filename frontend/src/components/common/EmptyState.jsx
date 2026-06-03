function EmptyState({ title = "No data found.", description = "" }) {
  return (
    <div style={styles.box}>
      <h3 style={styles.title}>{title}</h3>
      {description ? <p style={styles.description}>{description}</p> : null}
    </div>
  );
}

const styles = {
  box: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "24px",
  },
  title: {
    margin: "0 0 8px 0",
  },
  description: {
    margin: 0,
    color: "#555",
  },
};

export default EmptyState;