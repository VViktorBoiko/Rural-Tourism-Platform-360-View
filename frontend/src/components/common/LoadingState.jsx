function LoadingState({ message = "Loading..." }) {
  return <p style={styles.text}>{message}</p>;
}

const styles = {
  text: {
    fontSize: "16px",
    color: "#555",
  },
};

export default LoadingState;