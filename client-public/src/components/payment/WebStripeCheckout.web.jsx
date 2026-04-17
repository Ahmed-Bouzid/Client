import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function WebStripeCheckoutForm({ clientSecret, onSuccess, onCancel, onError }) {
	const stripe = useStripe();
	const elements = useElements();
	const [processing, setProcessing] = useState(false);

	const canSubmit = !!stripe && !!elements && !!clientSecret && !processing;

	const handleSubmit = async () => {
		if (!stripe || !elements || !clientSecret) {
			onError?.("Paiement web indisponible pour le moment.");
			return;
		}

		setProcessing(true);
		try {
			const cardElement = elements.getElement(CardElement);
			if (!cardElement) {
				onError?.("Champ carte indisponible.");
				setProcessing(false);
				return;
			}

			const result = await stripe.confirmCardPayment(clientSecret, {
				payment_method: {
					card: cardElement,
				},
			});

			if (result.error) {
				onError?.(result.error.message || "Paiement refusé.");
				setProcessing(false);
				return;
			}

			if (result.paymentIntent?.status === "succeeded") {
				onSuccess?.(result.paymentIntent.id);
				setProcessing(false);
				return;
			}

			onError?.("Le paiement n'a pas été finalisé.");
		} catch (error) {
			onError?.(error?.message || "Erreur paiement web.");
		} finally {
			setProcessing(false);
		}
	};

	return (
		<View style={{ gap: 12 }}>
			<View
				style={{
					borderWidth: 1,
					borderColor: "#CBD5E1",
					borderRadius: 10,
					padding: 12,
					backgroundColor: "#FFFFFF",
				}}
			>
				<CardElement
					options={{
						style: {
							base: {
								fontSize: "16px",
								color: "#0F172A",
								"::placeholder": { color: "#94A3B8" },
							},
						},
					}}
				/>
			</View>

			<TouchableOpacity
				onPress={handleSubmit}
				disabled={!canSubmit}
				style={{
					backgroundColor: canSubmit ? "#0F766E" : "#94A3B8",
					paddingVertical: 12,
					borderRadius: 10,
					alignItems: "center",
				}}
			>
				{processing ? (
					<ActivityIndicator color="#FFFFFF" />
				) : (
					<Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Payer maintenant</Text>
				)}
			</TouchableOpacity>

			<TouchableOpacity
				onPress={onCancel}
				disabled={processing}
				style={{
					paddingVertical: 10,
					borderRadius: 10,
					alignItems: "center",
					borderWidth: 1,
					borderColor: "#CBD5E1",
				}}
			>
				<Text style={{ color: "#334155", fontWeight: "600" }}>Annuler</Text>
			</TouchableOpacity>
		</View>
	);
}

export default function WebStripeCheckout({ clientSecret, onSuccess, onCancel, onError }) {
	const stripe = useMemo(() => stripePromise, []);

	if (!publishableKey || !stripe) {
		return (
			<View>
				<Text style={{ color: "#B91C1C", fontWeight: "600" }}>
					EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY manquant (web)
				</Text>
			</View>
		);
	}

	return (
		<Elements stripe={stripe}>
			<WebStripeCheckoutForm
				clientSecret={clientSecret}
				onSuccess={onSuccess}
				onCancel={onCancel}
				onError={onError}
			/>
		</Elements>
	);
}
