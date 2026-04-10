/**
 * 🎨 ThemeEditorScreen - Theme selection and preview for restaurants
 *
 * Features:
 * - 3 preset theme cards: Light (blue), Cucina (green), Le Grillz (orange)
 * - Selected theme indicator with checkmark
 * - Live preview banner with theme colors
 * - Save button to persist selection via API
 * - Optional "Customize Colors" button for Phase 2.5
 *
 * Props:
 * - restaurantId: ID of the restaurant
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
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useThemeStore from "../stores/useThemeStore";

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 THEME PRESETS
// ═══════════════════════════════════════════════════════════════════════════

const THEME_PRESETS = [
  {
    id: "light",
    name: "Light",
    subtitle: "Modern & Clean",
    gradient: ["#3B82F6", "#1D4ED8"],
    cardBg: "#FFFFFF",
    textColor: "#1F2937",
    accentColor: "#3B82F6",
  },
  {
    id: "cucina",
    name: "Cucina",
    subtitle: "Italian Vibes",
    gradient: ["#10B981", "#059669"],
    cardBg: "#F0FDF4",
    textColor: "#065F46",
    accentColor: "#10B981",
  },
  {
    id: "grillz",
    name: "Le Grillz",
    subtitle: "BBQ & Grill",
    gradient: ["#F97316", "#EA580C"],
    cardBg: "#FFF7ED",
    textColor: "#9A3412",
    accentColor: "#F97316",
  },
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
};

// ═══════════════════════════════════════════════════════════════════════════
// 📦 COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ThemeEditorScreen({ restaurantId, onBack, onSave }) {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────

  const [selectedThemeId, setSelectedThemeId] = useState("light");
  const [saving, setSaving] = useState(false);

  // Theme store for API calls
  const updateCustomizations = useThemeStore(
    (state) => state.updateCustomizations
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MEMOS
  // ─────────────────────────────────────────────────────────────────────────

  const selectedTheme = useMemo(() => {
    return (
      THEME_PRESETS.find((t) => t.id === selectedThemeId) || THEME_PRESETS[0]
    );
  }, [selectedThemeId]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleSelectTheme = useCallback((themeId) => {
    setSelectedThemeId(themeId);
  }, []);

  const handleSave = useCallback(async () => {
    if (!restaurantId) {
      Alert.alert("Erreur", "Restaurant ID manquant");
      return;
    }

    try {
      setSaving(true);

      // Prepare theme customizations
      const customizations = {
        themeId: selectedThemeId,
        gradient: selectedTheme.gradient,
        cardBg: selectedTheme.cardBg,
        textColor: selectedTheme.textColor,
        accentColor: selectedTheme.accentColor,
      };

      // Call the API via store
      await updateCustomizations(restaurantId, customizations);

      // Success feedback
      Alert.alert("✅ Succès", "Le thème a été enregistré avec succès!", [
        {
          text: "OK",
          onPress: () => {
            if (onSave) {
              onSave(selectedTheme);
            }
          },
        },
      ]);
    } catch (error) {
      console.error("❌ [ThemeEditor] Error saving theme:", error);
      Alert.alert(
        "Erreur",
        "Impossible de sauvegarder le thème. Veuillez réessayer."
      );
    } finally {
      setSaving(false);
    }
  }, [restaurantId, selectedThemeId, selectedTheme, updateCustomizations, onSave]);

  const handleCustomize = useCallback(() => {
    Alert.alert(
      "🎨 Phase 2.5",
      "La personnalisation avancée des couleurs sera disponible prochainement!"
    );
  }, []);

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
      <Text style={styles.headerTitle}>Theme</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderThemeCard = (theme) => {
    const isSelected = selectedThemeId === theme.id;

    return (
      <TouchableOpacity
        key={theme.id}
        style={[styles.themeCard, isSelected && styles.themeCardSelected]}
        onPress={() => handleSelectTheme(theme.id)}
        activeOpacity={0.8}
      >
        {/* Gradient Preview */}
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientPreview}
        >
          {isSelected && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            </View>
          )}
        </LinearGradient>

        {/* Theme Info */}
        <View style={styles.themeInfo}>
          <Text style={styles.themeName}>{theme.name}</Text>
          <Text style={styles.themeSubtitle}>{theme.subtitle}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLivePreview = () => (
    <View style={styles.previewSection}>
      <Text style={styles.sectionTitle}>Aperçu en direct</Text>

      {/* Banner Preview */}
      <LinearGradient
        colors={selectedTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerPreview}
      >
        <Text style={styles.bannerTitle}>Bienvenue</Text>
        <Text style={styles.bannerSubtitle}>Menu du jour</Text>
      </LinearGradient>

      {/* Card Preview */}
      <View
        style={[styles.cardPreview, { backgroundColor: selectedTheme.cardBg }]}
      >
        <View style={styles.cardPreviewHeader}>
          <View
            style={[
              styles.cardDot,
              { backgroundColor: selectedTheme.accentColor },
            ]}
          />
          <Text
            style={[styles.cardPreviewTitle, { color: selectedTheme.textColor }]}
          >
            Article exemple
          </Text>
        </View>
        <Text
          style={[
            styles.cardPreviewPrice,
            { color: selectedTheme.accentColor },
          ]}
        >
          12,50 €
        </Text>
      </View>
    </View>
  );

  const renderButtons = () => (
    <View style={styles.buttonContainer}>
      {/* Customize Button - Phase 2.5 */}
      <TouchableOpacity
        style={styles.customizeButton}
        onPress={handleCustomize}
        activeOpacity={0.7}
      >
        <Ionicons name="color-palette-outline" size={20} color={COLORS.text} />
        <Text style={styles.customizeButtonText}>Personnaliser les couleurs</Text>
      </TouchableOpacity>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        activeOpacity={0.8}
        disabled={saving}
      >
        <LinearGradient
          colors={selectedTheme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveButtonGradient}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={22} color="#FFFFFF" />
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
      >
        {/* Theme Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisir un thème</Text>
          <View style={styles.themesRow}>
            {THEME_PRESETS.map(renderThemeCard)}
          </View>
        </View>

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
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 0.3,
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
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 14,
  },

  // Theme Cards Row
  themesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  // Theme Card
  themeCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  themeCardSelected: {
    borderColor: COLORS.success,
  },
  gradientPreview: {
    height: 80,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    padding: 8,
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  themeInfo: {
    padding: 12,
    alignItems: "center",
  },
  themeName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  themeSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Preview Section
  previewSection: {
    marginBottom: 20,
  },
  bannerPreview: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },
  cardPreview: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardPreviewTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardPreviewPrice: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Button Container
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // Customize Button
  customizeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  customizeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  // Save Button
  saveButton: {
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
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
