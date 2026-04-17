// hooks/useReceiptExport.js
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

export const useReceiptExport = () => {
	const [isExporting, setIsExporting] = useState(false);

	const exportReceipt = useCallback(async (viewRef, ticketId) => {
		if (!viewRef || !viewRef.current) {
			Alert.alert("Erreur", "Impossible de générer le reçu");
			return;
		}

		setIsExporting(true);

		try {
			if (Platform.OS === "web") {
				try {
					const dataUri = await captureRef(viewRef, {
						format: "png",
						quality: 1,
						result: "data-uri",
					});

					const link = document.createElement("a");
					link.href = dataUri;
					link.download = `recu-${ticketId || Date.now()}.png`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					setIsExporting(false);
					return;
				} catch (webError) {
					console.warn("⚠️ Export image web indisponible, fallback impression", webError);
					if (typeof window !== "undefined" && typeof window.print === "function") {
						window.print();
						setIsExporting(false);
						return;
					}
					Alert.alert("Erreur", "Impossible d'exporter le reçu sur web.");
					setIsExporting(false);
					return;
				}
			}

			// Capturer la vue en tant qu'image
			const uri = await captureRef(viewRef, {
				format: "png",
				quality: 1,
				result: "tmpfile",
			});


			// Vérifier si le partage est disponible
			const isAvailable = await Sharing.isAvailableAsync();

			if (!isAvailable) {
				Alert.alert(
					"Partage non disponible",
					"Le partage n'est pas disponible sur cet appareil"
				);
				setIsExporting(false);
				return;
			}

			// Partager directement le fichier temporaire
			await Sharing.shareAsync(uri, {
				mimeType: "image/png",
				dialogTitle: "Enregistrer le reçu",
				UTI: "public.png",
			});

		} catch (error) {
			console.error("❌ Erreur lors de l'export du reçu:", error);
			Alert.alert(
				"Erreur",
				"Impossible d'exporter le reçu. Veuillez réessayer."
			);
		} finally {
			setIsExporting(false);
		}
	}, []);

	return {
		exportReceipt,
		isExporting,
	};
};
