import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAllergyStore } from "../stores/useAllergyStore";

/**
 * Badge d'alerte allergène pour un produit
 * Affiche un point rouge si le produit contient un allergène de l'utilisateur
 */
export default function AllergenBadge({ product, style }) {
	const { productContainsUserAllergen, getMatchingAllergens } =
		useAllergyStore();
	const [modalVisible, setModalVisible] = useState(false);

	const hasAllergen = productContainsUserAllergen(product);

	if (!hasAllergen) return null;

	const matchingAllergens = getMatchingAllergens(product);

	return (
		<>
			<TouchableOpacity
				onPress={() => setModalVisible(true)}
				style={[
					{
						position: "absolute",
						top: 8,
						right: 8,
						width: 32,
						height: 32,
						borderRadius: 16,
						backgroundColor: "#eb3349",
						alignItems: "center",
						justifyContent: "center",
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.3,
						shadowRadius: 3,
						elevation: 5,
						zIndex: 10,
					},
					style,
				]}
				activeOpacity={0.8}
			>
				<Ionicons name="warning" size={18} color="#fff" />
			</TouchableOpacity>

			{/* Modal d'alerte */}
			<Modal
				visible={modalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setModalVisible(false)}
			>
				<TouchableOpacity
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.5)",
						justifyContent: "center",
						alignItems: "center",
					}}
					activeOpacity={1}
					onPress={() => setModalVisible(false)}
				>
					<TouchableOpacity
						activeOpacity={1}
						onPress={(e) => e.stopPropagation()}
						style={{
							backgroundColor: "#fff",
							borderRadius: 16,
							padding: 20,
							margin: 20,
							maxWidth: 320,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.3,
							shadowRadius: 8,
							elevation: 8,
						}}
					>
						{/* Icon Header */}
						<View
							style={{
								alignItems: "center",
								marginBottom: 16,
							}}
						>
							<View
								style={{
									width: 64,
									height: 64,
									borderRadius: 32,
									backgroundColor: "#fee",
									alignItems: "center",
									justifyContent: "center",
									marginBottom: 12,
								}}
							>
								<Ionicons name="warning" size={36} color="#eb3349" />
							</View>
							<Text
								style={{
									fontSize: 20,
									fontWeight: "700",
									color: "#eb3349",
								}}
							>
								Attention : Allergène
							</Text>
						</View>

						{/* Product Name */}
						<Text
							style={{
								fontSize: 16,
								fontWeight: "600",
								color: "#333",
								textAlign: "center",
								marginBottom: 12,
							}}
						>
							{product.name}
						</Text>

						{/* Allergens List */}
						<View
							style={{
								backgroundColor: "#f8f9fa",
								borderRadius: 8,
								padding: 12,
								marginBottom: 16,
							}}
						>
							<Text
								style={{
									fontSize: 14,
									fontWeight: "600",
									color: "#555",
									marginBottom: 8,
								}}
							>
								Ce produit contient :
							</Text>
							{matchingAllergens.map((allergen) => (
								<View
									key={allergen._id}
									style={{
										flexDirection: "row",
										alignItems: "center",
										marginVertical: 4,
									}}
								>
									<View
										style={{
											width: 6,
											height: 6,
											borderRadius: 3,
											backgroundColor: "#eb3349",
											marginRight: 8,
										}}
									/>
									<Text
										style={{
											fontSize: 14,
											color: "#333",
											fontWeight: "500",
										}}
									>
										{allergen.icon} {allergen.name}
									</Text>
								</View>
							))}
						</View>

						{/* Warning Text */}
						<Text
							style={{
								fontSize: 13,
								color: "#666",
								textAlign: "center",
								marginBottom: 16,
								lineHeight: 18,
							}}
						>
							Ce produit peut ne pas convenir à votre régime alimentaire.
							Veuillez vérifier avec le personnel.
						</Text>

						{/* Close Button */}
						<TouchableOpacity
							onPress={() => setModalVisible(false)}
							style={{
								backgroundColor: "#eb3349",
								paddingVertical: 12,
								borderRadius: 8,
								alignItems: "center",
							}}
						>
							<Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
								J'ai compris
							</Text>
						</TouchableOpacity>
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
		</>
	);
}
