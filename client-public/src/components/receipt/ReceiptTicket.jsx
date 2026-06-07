// components/receipt/ReceiptTicket.jsx
// THEMING: orphan palette by design — see audit 0.1
// Style: thermal paper receipt (white/cream, monospace, classic)
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useTranslation } from "../../hooks/useTranslation";

const { width } = Dimensions.get("window");
const TICKET_WIDTH = Math.min(width - 48, 380);

// Jagged edge — simulates torn thermal paper
const JaggedEdge = ({ flipped = false }) => {
	const count = Math.floor(TICKET_WIDTH / 10);
	return (
		<View style={[styles.jaggedRow, flipped && { transform: [{ scaleY: -1 }] }]}>
			{Array.from({ length: count }).map((_, i) => (
				<View key={i} style={styles.jaggedTooth} />
			))}
		</View>
	);
};

// Dashed separator (thermal style)
const DashedSeparator = () => (
	<Text style={styles.dashedLine}>
		{"- - - - - - - - - - - - - - - - - - - - - - - - - - -"}
	</Text>
);

const SolidSeparator = () => <View style={styles.solidLine} />;

export const ReceiptTicket = React.forwardRef(
	(
		{
			ticketId,
			orderCode,
			amount,
			date,
			items = [],
			restaurantName = "SunnyGo Restaurant",
			tableNumber,
			paymentMethod = "Card",
			last4Digits,
		},
		ref,
	) => {
		const { t } = useTranslation();
		const fadeAnim = useRef(new Animated.Value(0)).current;
		const slideAnim = useRef(new Animated.Value(20)).current;

		useEffect(() => {
			Animated.parallel([
				Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
				Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
			]).start();
		}, [fadeAnim, slideAnim]);

		const formattedAmount = `${(parseFloat(amount) || 0).toFixed(2)} €`;
		const dateObj = date instanceof Date ? date : new Date(date);
		const formattedDate = dateObj.toLocaleDateString("fr-FR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
		const formattedTime = dateObj.toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit",
		});

		// Deterministic barcode bars (no re-render flicker)
		const barsPattern = Array.from({ length: 48 }).map((_, i) => {
			const seed = ticketId ? ticketId.charCodeAt(i % ticketId.length) : i;
			return (seed + i) % 3 === 0 ? 1 : (seed + i) % 5 === 0 ? 4 : 2;
		});

		return (
			<Animated.View
				ref={ref}
				style={[
					styles.wrapper,
					{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
				]}
			>
				{/* Top jagged edge */}
				<JaggedEdge />

				{/* Paper body */}
				<View style={styles.paper}>
					{/* Store name */}
					<Text style={styles.storeName}>{restaurantName.toUpperCase()}</Text>
					{tableNumber && (
						<Text style={styles.storeAddress}>{t("Table")} {tableNumber}</Text>
					)}

					<DashedSeparator />

					{/* Receipt title */}
					<Text style={styles.receiptTitle}>{"*** " + t("Merci !").toUpperCase() + " ***"}</Text>
					<Text style={styles.receiptSubtitle}>
						{t("Votre paiement a été effectué avec succès").toUpperCase()}
					</Text>

					<DashedSeparator />

					{/* Meta */}
					<View style={styles.metaRow}>
						<Text style={styles.metaText}>{formattedDate}</Text>
						<Text style={styles.metaText}>{formattedTime}</Text>
					</View>
					<View style={styles.metaRow}>
						<Text style={styles.metaLabel}>{t("N° TICKET")}</Text>
						<Text style={styles.metaValue}>{ticketId}</Text>
					</View>

					<DashedSeparator />

					{/* Items */}
					{items.length > 0 && (
						<>
							{items.map((item, index) => {
								const qty = parseInt(item.quantity) || 1;
								const unitPrice = parseFloat(item.price) || 0;
								const lineTotal = (qty * unitPrice).toFixed(2);
								return (
									<View key={index} style={styles.itemBlock}>
										<View style={styles.itemMainRow}>
											<Text style={styles.itemName} numberOfLines={1}>
												{item.name || t("Article")}
											</Text>
											<Text style={styles.itemTotal}>{lineTotal} €</Text>
										</View>
										{qty > 1 && (
											<Text style={styles.itemSub}>
												{"  x" + qty + " @ " + unitPrice.toFixed(2) + " €"}
											</Text>
										)}
									</View>
								);
							})}
							<DashedSeparator />
							<View style={styles.totalRow}>
								<Text style={styles.subtotalLabel}>SOUS-TOTAL</Text>
								<Text style={styles.subtotalValue}>{formattedAmount}</Text>
							</View>
						</>
					)}

					{/* Total */}
					<SolidSeparator />
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>{t("MONTANT")}</Text>
						<Text style={styles.totalValue}>{formattedAmount}</Text>
					</View>
					<SolidSeparator />

					{/* Payment */}
					<View style={[styles.metaRow, { marginTop: 8 }]}>
						<Text style={styles.metaLabel}>{paymentMethod.toUpperCase()}</Text>
						{last4Digits && (
							<Text style={styles.metaValue}>{"•••• " + last4Digits}</Text>
						)}
					</View>

					<DashedSeparator />

					{/* Order code */}
					{orderCode && (
						<>
							<View style={styles.metaRow}>
								<Text style={styles.metaLabel}>{t("Code commande")}</Text>
								<Text style={styles.metaValueBold}>{orderCode}</Text>
							</View>
							<Text style={styles.lookupText}>
								{t("Tapez ce code sur la page d'accueil pour retrouver votre commande, votre paiement et votre ticket.")}
							</Text>
							<DashedSeparator />
						</>
					)}

					{/* Barcode */}
					<View style={styles.barcodeContainer}>
						<View style={styles.barcode}>
							{barsPattern.map((w, i) => (
								<View key={i} style={[styles.bar, { width: w }]} />
							))}
						</View>
						<Text style={styles.barcodeLabel}>{ticketId}</Text>
					</View>

					{/* Footer */}
					<Text style={styles.thankYou}>
						{t("Merci de votre visite !").toUpperCase()}
					</Text>
					<Text style={styles.footerUrl}>www.sunnygo.fr</Text>
				</View>

				{/* Bottom jagged edge */}
				<JaggedEdge flipped />
			</Animated.View>
		);
	},
);

const styles = StyleSheet.create({
	wrapper: {
		width: TICKET_WIDTH,
		alignSelf: "center",
	},
	jaggedRow: {
		flexDirection: "row",
		height: 10,
		overflow: "hidden",
	},
	jaggedTooth: {
		width: 10,
		height: 10,
		backgroundColor: "#f2efe8",
		borderBottomLeftRadius: 5,
		borderBottomRightRadius: 5,
	},
	paper: {
		backgroundColor: "#f2efe8",
		paddingHorizontal: 24,
		paddingVertical: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 12,
		elevation: 6,
	},
	storeName: {
		fontFamily: "monospace",
		fontSize: 18,
		fontWeight: "700",
		color: "#1a1a1a",
		textAlign: "center",
		letterSpacing: 1,
		marginBottom: 4,
	},
	storeAddress: {
		fontFamily: "monospace",
		fontSize: 12,
		color: "#555",
		textAlign: "center",
		marginBottom: 4,
	},
	dashedLine: {
		fontFamily: "monospace",
		fontSize: 10,
		color: "#aaa",
		textAlign: "center",
		marginVertical: 8,
	},
	solidLine: {
		height: 1.5,
		backgroundColor: "#1a1a1a",
		marginVertical: 6,
	},
	receiptTitle: {
		fontFamily: "monospace",
		fontSize: 16,
		fontWeight: "700",
		color: "#1a1a1a",
		textAlign: "center",
		letterSpacing: 1,
		marginBottom: 4,
	},
	receiptSubtitle: {
		fontFamily: "monospace",
		fontSize: 9,
		color: "#444",
		textAlign: "center",
		letterSpacing: 0.5,
	},
	metaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	metaLabel: {
		fontFamily: "monospace",
		fontSize: 11,
		color: "#555",
	},
	metaValue: {
		fontFamily: "monospace",
		fontSize: 11,
		color: "#1a1a1a",
	},
	metaValueBold: {
		fontFamily: "monospace",
		fontSize: 11,
		fontWeight: "700",
		color: "#1a1a1a",
	},
	metaText: {
		fontFamily: "monospace",
		fontSize: 11,
		color: "#555",
	},
	itemBlock: {
		marginBottom: 6,
	},
	itemMainRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	itemName: {
		fontFamily: "monospace",
		fontSize: 13,
		color: "#1a1a1a",
		flex: 1,
		marginRight: 8,
	},
	itemTotal: {
		fontFamily: "monospace",
		fontSize: 13,
		color: "#1a1a1a",
		fontWeight: "600",
	},
	itemSub: {
		fontFamily: "monospace",
		fontSize: 11,
		color: "#777",
	},
	totalRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginVertical: 4,
	},
	subtotalLabel: {
		fontFamily: "monospace",
		fontSize: 12,
		color: "#555",
	},
	subtotalValue: {
		fontFamily: "monospace",
		fontSize: 12,
		color: "#555",
	},
	totalLabel: {
		fontFamily: "monospace",
		fontSize: 16,
		fontWeight: "700",
		color: "#1a1a1a",
		letterSpacing: 1,
	},
	totalValue: {
		fontFamily: "monospace",
		fontSize: 16,
		fontWeight: "700",
		color: "#1a1a1a",
	},
	lookupText: {
		fontFamily: "monospace",
		fontSize: 9,
		color: "#666",
		textAlign: "center",
		lineHeight: 14,
		marginTop: 4,
		marginBottom: 4,
	},
	barcodeContainer: {
		alignItems: "center",
		marginVertical: 16,
	},
	barcode: {
		flexDirection: "row",
		height: 56,
		alignItems: "stretch",
		gap: 1,
		marginBottom: 6,
	},
	bar: {
		backgroundColor: "#1a1a1a",
	},
	barcodeLabel: {
		fontFamily: "monospace",
		fontSize: 10,
		color: "#555",
		letterSpacing: 2,
	},
	thankYou: {
		fontFamily: "monospace",
		fontSize: 12,
		fontWeight: "700",
		color: "#1a1a1a",
		textAlign: "center",
		letterSpacing: 1,
		marginTop: 4,
		marginBottom: 2,
	},
	footerUrl: {
		fontFamily: "monospace",
		fontSize: 10,
		color: "#888",
		textAlign: "center",
		marginBottom: 4,
	},
});

ReceiptTicket.displayName = "ReceiptTicket";
