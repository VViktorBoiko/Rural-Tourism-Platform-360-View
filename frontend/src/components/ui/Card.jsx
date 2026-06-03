import { theme } from "../../styles/theme";

function Card({ children }) {
  return <div style={styles.card}>{children}</div>;
}

const styles = {
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.card,
    padding: "16px",
    border: `1px solid ${theme.colors.border}`,
  },
};

export default Card;