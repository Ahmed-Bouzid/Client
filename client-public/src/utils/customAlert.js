// utils/customAlert.js
import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const useCustomAlert = () => {
	const [isVisible, setIsVisible] = useState(false);
	const [alertConfig, setAlertConfig] = useState({
		title: "",
		message: "",
		buttons: [],
	});

	const showAlert = (title, message, buttons = [{ text: "OK" }]) => {
		setAlertConfig({ title, message, buttons });
		setIsVisible(true);
	};

	const AlertComponent = () => (
		<Modal
			visible={isVisible}
			transparent={true}
			animationType="fade"
			onRequestClose={() => setIsVisible(false)}
		>
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "rgba(10,18,36,0.55)",
				}}
			>
				<BlurView
					intensity={60}
					tint="dark"
					style={{ borderRadius: 24, overflow: "hidden" }}
				>
					<LinearGradient
						colors={["#232B3B", "#1A1F29", "#232B3B"]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={{
							width: SCREEN_WIDTH * 0.8,
							minHeight: 180,
							padding: 28,
							borderRadius: 24,
							alignItems: "center",
							margin: 20,
							shadowColor: "#000",
							shadowOpacity: 0.25,
							shadowOffset: { width: 0, height: 8 },
							shadowRadius: 24,
							elevation: 16,
						}}
					>
						<Text
							style={{
								fontSize: 22,
								fontWeight: "bold",
								marginBottom: 15,
								textAlign: "center",
								color: "#fff",
							}}
						>
							{alertConfig.title}
						</Text>
						<Text
							style={{
								fontSize: 16,
								marginBottom: 25,
								textAlign: "center",
								lineHeight: 22,
								color: "#E0E6F0",
							}}
						>
							{alertConfig.message}
						</Text>
						<View
							style={{
								flexDirection: "row",
								gap: 10,
								width: "100%",
							}}
						>
							{alertConfig.buttons.map((button, index) => (
								<TouchableOpacity
									key={index}
									style={{
										backgroundColor: "#4CAF50",
										paddingHorizontal: 20,
										paddingVertical: 12,
										borderRadius: 10,
										flex: 1,
										marginHorizontal: 4,
										shadowColor: "#000",
										shadowOpacity: 0.18,
										shadowOffset: { width: 0, height: 2 },
										shadowRadius: 6,
										elevation: 6,
									}}
									onPress={() => {
										setIsVisible(false);
										button.onPress?.();
									}}
								>
									<Text
										style={{
											color: "#fff",
											fontWeight: "bold",
											textAlign: "center",
											fontSize: 17,
										}}
									>
										{button.text}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</LinearGradient>
				</BlurView>
			</View>
		</Modal>
	);

	return { showAlert, AlertComponent };
};
