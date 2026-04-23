/**
 * OrderLookupInput.jsx — Input de recherche commande par numéro (#XXX-XXX)
 *
 * Composant réutilisable pour le flow "Retrouver ma commande".
 * Style Grillz par défaut, extensible pour d'autres thèmes.
 *
 * Props :
 *   - orderNumber: string — valeur actuelle
 *   - onChangeText: (text) => void — callback onChange
 *   - isValid: boolean — format valide ?
 *   - error: string — message d'erreur
 *   - loading: boolean — recherche en cours ?
 *   - onSubmit: () => void — callback quand on appuie sur "Retrouver"
 */

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function OrderLookupInput({
  orderNumber = "",
  onChangeText,
  isValid = false,
  error = "",
  loading = false,
  onSubmit,
}) {
  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>Retrouver une commande</Text>
      <Text style={styles.hint}>Saisissez votre numéro de commande</Text>

      {/* Input */}
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
          isValid ? styles.inputValid : null,
        ]}
      >
        <Ionicons
          name="receipt-outline"
          size={20}
          color={error ? "#FF6B6B" : isValid ? "#4CAF50" : "#FF8A50"}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="#000-000"
          placeholderTextColor="#555"
          value={orderNumber}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={8}
          returnKeyType="search"
          onSubmitEditing={isValid && !loading ? onSubmit : undefined}
        />
        {/* Indicateur de validité */}
        {orderNumber.length > 1 && (
          <Ionicons
            name={isValid ? "checkmark-circle" : "close-circle"}
            size={20}
            color={isValid ? "#4CAF50" : "#FF6B6B"}
          />
        )}
      </View>

      {/* Format hint */}
      <Text style={styles.formatHint}>Format : #123-456</Text>

      {/* Error message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Submit button */}
      <TouchableOpacity
        onPress={onSubmit}
        activeOpacity={0.8}
        disabled={!isValid || loading}
        style={{ marginTop: 12 }}
      >
        <LinearGradient
          colors={isValid ? ["#D35400", "#E67E22"] : ["#444", "#555"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.submitButton,
            { opacity: isValid && !loading ? 1 : 0.5 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons
                name="search"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitText}>Retrouver ma commande</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 8,
  },
  label: {
    color: "#FF8A50",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  hint: {
    color: "#999",
    fontSize: 13,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D35400",
    paddingHorizontal: 14,
    height: 50,
  },
  inputError: {
    borderColor: "#FF6B6B",
  },
  inputValid: {
    borderColor: "#4CAF50",
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  formatHint: {
    color: "#666",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  submitButton: {
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
