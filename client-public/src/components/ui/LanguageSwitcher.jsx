import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLanguageStore } from "../../stores/useLanguageStore";
import { LANGUAGES } from "../../i18n";

export default function LanguageSwitcher({ style, compact = false }) {
  const lang = useLanguageStore((state) => state.lang);
  const setLang = useLanguageStore((state) => state.setLang);

  const languages = Object.entries(LANGUAGES);

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.row}>
        {languages.map(([code, { label, flag }]) => {
          const isActive = lang === code;
          return (
            <TouchableOpacity
              key={code}
              style={[styles.btn, isActive && styles.btnActive]}
              onPress={() => setLang(code)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={styles.flag}>{flag}</Text>
              {!compact && (
                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {code.toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 8,
    rowGap: 6,
    columnGap: 6,
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.15)",
    minWidth: 44,
    minHeight: 44,
  },
  btnActive: {
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  flag: {
    fontSize: 22,
    lineHeight: 26,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: "#fff",
  },
});
