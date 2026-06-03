function ErrorState({ message = "Something went wrong." }) {
  return <p style={styles.text}>{message}</p>;
}

const styles = {
  text: {
    color: "crimson",
    fontWeight: "bold",
    fontSize: "16px",
  },
};

export default ErrorState;