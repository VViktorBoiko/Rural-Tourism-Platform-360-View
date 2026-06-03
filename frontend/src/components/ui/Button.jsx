import { theme } from "../../styles/theme";

function Button({ children, onClick, variant = "primary" }) {
  const style =
    variant === "primary" ? styles.primary :
    variant === "secondary" ? styles.secondary :
    styles.black;

  return (
    <button onClick={onClick} style={style}>
      {children}
    </button>
  );
}

const styles = {
  primary: {
    backgroundColor: theme.colors.primary,
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },
  secondary: {
    backgroundColor: "#fff",
    border: `1px solid ${theme.colors.border}`,
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },
  black: {
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },
};

export default Button;