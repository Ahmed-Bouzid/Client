/**
 * 🎨 ColorCustomizerScreen - Custom color picker for restaurant themes
 *
 * Features:
 * - 6 preset color swatches for primary color
 * - 6 preset color swatches for accent color
 * - Logo URL input field
 * - Live preview banner with selected colors
 * - Save button to persist customization via API
 *
 * Props:
 * - restaurantId: ID of the restaurant
 * - currentTheme: { primaryColor, accentColor, logoUrl }
 * - onBack: Callback to navigate back
 * - onSave: Callback after successful save
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useThemeStore from "../stores/useThemeStore";

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 COLOR PRESETS
// ═══════════════════════════════════════════════════════════════════════════

const COLOR_PRESETS = [
  { id: "blue", color: "#2563EB", label: "Bleu" },
  { id: "green", color: "#146845", label: "Vert" },
  { id: "orange", color: "#F97316", label: "Orange" },
  { id: "red", color: "#DC2626", label: "Rouge" },
  { id: "purple", color: "#7C3AED", label: "Violet" },
  { id: "black", color: "#1F2937", label: "Noir" },
];

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 COLORS
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  shadow: "#000000",
  white: "#FFFFFF",
};

// ═══════════════════════════════════════════════════════════════════════════
// 📦 COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ColorCustomizerScreen({
  restaurantId,
  currentTheme,
  onBack,
  onSave,
}) {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────

  const [primaryColor, setPrimaryColor] = useState(
    currentTheme?.primaryColor || COLOR_PRESETS[0].color
  );
  const [accentColor, setAccentColor] = useState(
    currentTheme?.accentColor || COLOR_PRESETS[0].color
  );
  const [logoUrl, setLogoUrl] = useState(currentTheme?.logoUrl || "");
  const [saving, setSaving] = useState(false);

  // Theme store for API calls
  const updateCustomizations = useThemeStore(
    (state) => state.updateCustomizations
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MEMOS
  // ─────────────────────────────────────────────────────────────────────────

  const previewGradient = useMemo(() => {
    return [primaryColor, accentColor];
  }, [primaryColor, accentColor]);

  const isValidUrl = useMemo(() => {
    if (!logoUrl.trim()) return true; // Empty is valid (optional)
    try {
      new URL(logoUrl);
      return true;
    } catch {
      return false;
    }
  }, [logoUrl]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleSelectPrimaryColor = useCallback((color) => {
    setPrimaryColor(color);
  }, []);

  const handleSelectAccentColor = useCallback((color) => {
    setAccentColor(color);
  }, []);

  const handleLogoUrlChange = useCallback((text) => {
    setLogoUrl(text);
  }, []);

  const handleSave = useCallback(async () => {
    if (!restaurantId) {
      Alert.alert("Erreur", "Restaurant ID manquant");
      return;
    }

    if (!isValidUrl) {
      Alert.alert("Erreur", "L'URL du logo n'est pas valide");
      return;
    }

    try {
      setSaving(true);

      // Prepare customizations
      const customizations = {
        primaryColor,
        accentColor,
        logoUrl: logoUrl.trim() || null,
      };

      // Call the API via store
      await updateCustomizations(restaurantId, customizations);

      // Success feedback
      Alert.alert("✅ Succès", "Les couleurs ont été enregistrées!", [
        {
          text: "OK",
          onPress: () => {
            if (onSave) {
              onSave(customizations);
            }
          },
        },
      ]);
    } catch (error) {
      console.error("❌ [ColorCustomizer] Error saving:", error);
      Alert.alert(
        "Erreur",
        "Impossible de sauvegarder les couleurs. Veuillez réessayer."
      );
    } finally {
      setSaving(false);
    }
  }, [
    restaurantId,
    primaryColor,
    accentColor,
    logoUrl,
    isValidUrl,
    updateCustomizations,
    onSave,
  ]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Personnaliser les couleurs</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderColorSwatch = (preset, selectedColor, onSelect) => {
    const isSelected = selectedColor === preset.color;

    return (
      <TouchableOpacity
        key={preset.id}
        style={[
          styles.colorSwatch,
          { backgroundColor: preset.color },
          isSelected && styles.colorSwatchSelected,
        ]}
        onPress={() => onSelect(preset.color)}
        activeOpacity={0.8}
        accessibilityLabel={preset.label}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={COLORS.white} />
        )}
      </TouchableOpacity>
    );
  };

  const renderColorSection = (title, selectedColor, onSelect) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.swatchesRow}>
        {COLOR_PRESETS.map((preset) =>
          renderColorSwatch(preset, selectedColor, onSelect)
        )}
      </View>
    </View>
  );

  const renderLogoInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>URL du logo (optionnel)</Text>
      <TextInput
        style={[styles.textInput, !isValidUrl && styles.textInputError]}
        value={logoUrl}
        onChangeText={handleLogoUrlChange}
        placeholder="https://example.com/logo.png"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      {!isValidUrl && (
        <Text style={styles.errorText}>URL invalide</Text>
      )}
    </View>
  );

  const renderLivePreview = () => (
    <View style={styles.previewSection}>
      <View style={styles.previewHeader}>
        <View style={styles.previewDivider} />
        <Text style={styles.previewLabel}>APERÇU</Text>
        <View style={styles.previewDivider} />
      </View>

      {/* Banner Preview */}
      <LinearGradient
        colors={previewGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerPreview}
      >
        {logoUrl.trim() && isValidUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={styles.logoPreview}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="image-outline" size={32} color={COLORS.white} />
          </View>
        )}
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Mon Restaurant</Text>
          <Text style={styles.bannerSubtitle}>Bienvenue</Text>
        </View>
      </LinearGradient>

      {/* Color Indicators */}
      <View style={styles.colorIndicators}>
        <View style={styles.colorIndicator}>
          <View
            style={[styles.indicatorDot, { backgroundColor: primaryColor }]}
          />
          <Text style={styles.indicatorLabel}>Principale</Text>
        </View>
        <View style={styles.colorIndicator}>
          <View
            style={[styles.indicatorDot, { backgroundColor: accentColor }]}
          />
          <Text style={styles.indicatorLabel}>Accent</Text>
        </View>
      </View>
    </View>
  );

  const renderButtons = () => (
    <View style={styles.buttonContainer}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButtonBottom}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        activeOpacity={0.8}
        disabled={saving}
      >
        <LinearGradient
          colors={previewGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveButtonGradient}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Primary Color Section */}
        {renderColorSection(
          "Couleur principale",
          primaryColor,
          handleSelectPrimaryColor
        )}

        {/* Accent Color Section */}
        {renderColorSection(
          "Couleur d'accent",
          accentColor,
          handleSelectAccentColor
        )}

        {/* Logo URL Input */}
        {renderLogoInput()}

        {/* Live Preview Section */}
        {renderLivePreview()}
      </ScrollView>

      {/* Bottom Buttons */}
      {renderButtons()}
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 0.3,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },

  // Color Swatches
  swatchesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  colorSwatchSelected: {
    borderColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  // Text Input
  textInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },

  // Preview Section
  previewSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 12,
  },
  previewDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },

  // Banner Preview
  bannerPreview: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logoPreview: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },

  // Color Indicators
  colorIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 16,
  },
  colorIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicatorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  indicatorLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Button Container
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // Back Button (Bottom)
  backButtonBottom: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  // Save Button
  saveButton: {
    flex: 1.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
});
