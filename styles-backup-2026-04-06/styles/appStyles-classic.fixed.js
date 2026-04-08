import { StyleSheet, Dimensions } from "react-native";
import { PREMIUM_COLORS } from "../theme/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;

const appStyles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		paddingTop: 50,
		backgroundColor: "#fff",
	},
	listContainer: {
		padding: 15,
		paddingBottom: 200,
	},
	productCard: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 15,
		borderRadius: 12,
		marginBottom: 10,
		elevation: 2,
	},
	productInfo: {
		flex: 1,
		marginRight: 15,
	},
	productName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 5,
	},
	productDescription: {
		fontSize: 14,
		color: "#666",
		marginBottom: 5,
	},
	price: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#4CAF50",
	},
	floatingCart: {
		position: "absolute",
		bottom: 20,
		left: 20,
		right: 20,
		backgroundColor: "#fff",
		borderRadius: 15,
		padding: 15,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		elevation: 8,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: "85%",
		backgroundColor: "#fff",
		borderRadius: 15,
		padding: 20,
		alignItems: "center",
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#333",
		marginBottom: 8,
	},
	modalDescription: {
		fontSize: 14,
		color: "#555",
		textAlign: "center",
		lineHeight: 20,
	},
	center: { justifyContent: "center", alignItems: "center" },
});

export default appStyles;
