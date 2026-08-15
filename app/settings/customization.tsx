// ROKDA DASHBOARD LAYOUT CUSTOMIZER SCREEN

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { DEFAULT_DASHBOARD_SECTIONS } from '../../src/constants/defaults';

export default function CustomizationScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [sections, setSections] = useState(DEFAULT_DASHBOARD_SECTIONS);

  const toggleVisibility = (id: string) => {
    setSections(prev =>
      prev.map(s => (s.section_id === id ? { ...s, is_visible: !s.is_visible } : s))
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Dashboard Customization</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>TOGGLE DASHBOARD WIDGETS</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {sections.map(sec => (
            <View key={sec.section_id} style={styles.row}>
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                {sec.section_id.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Switch
                value={sec.is_visible}
                onValueChange={() => toggleVisibility(sec.section_id)}
                trackColor={{ false: colors.inputBg, true: colors.accent }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  sectionHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 13, fontWeight: '600' },
});
