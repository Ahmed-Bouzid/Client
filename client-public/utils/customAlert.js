// utils/customAlert.js
import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, Dimensions } from "react-native";

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
					backgroundColor: "rgba(0,0,0,0.5)",
				}}
			>
				<View
					style={{
						backgroundColor: "white",
						padding: 25,
						borderRadius: 15,
						alignItems: "center",
						width: SCREEN_WIDTH * 0.8,
						margin: 20,
					}}
				>
					<Text
						style={{
							fontSize: 20,
							fontWeight: "bold",
							marginBottom: 15,
							textAlign: "center",
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
									borderRadius: 8,
									flex: 1,
								}}
								onPress={() => {
									setIsVisible(false);
									button.onPress?.();
								}}
							>
								<Text
									style={{
										color: "white",
										fontWeight: "bold",
										textAlign: "center",
									}}
								>
									{button.text}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>
			</View>
		</Modal>
	);

	return { showAlert, AlertComponent };
};
