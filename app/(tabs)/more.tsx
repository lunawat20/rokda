// ROKDA MORE / TOOLS & SETTINGS HUB

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDb } from '../../src/context/DbContext';
import { populateSampleData } from '../../src/services/sampleData';

export default function MoreScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { refreshData } = useDb();
  const router = useRouter();

  const handleLoadSampleData = async () => {
    if (!user) return;
    Alert.alert('Load Sample Data', 'This will populate fictional salary, rent, groceries, and goals for demo testing.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Load Sample Data',
        onPress: async () => {
          await populateSampleData(user.id);
          await refreshData();
          Alert.alert('Success', 'Sample financial dataset loaded!');
        }
      }
    ]);
  };

  const menuSections = [
    {
      title: 'Financial Management',
      items: [
        { icon: 'card', label: 'Accounts & Balances', route: '/accounts' },
        { icon: 'tv', label: 'Subscriptions Hub', route: '/subscriptions' },
        { icon: 'repeat', label: 'Recurring Payments', route: '/recurring' },
        { icon: 'flag', label: 'Savings Goals', route: '/goals' },
        { icon: 'calendar', label: 'Daily Calendar View', route: '/calendar' },
      ]
    },
    {
      title: 'Reports & Data',
      items: [
        { icon: 'document-text', label: 'Reports & CSV Export', route: '/reports' },
        { icon: 'cloud-download', label: 'Local Backup & Restore', route: '/settings/backup' },
        { icon: 'flask', label: 'Load Demo Sample Data', action: handleLoadSampleData },
      ]
    },
    {
      title: 'Settings & Security',
      items: [
        { icon: 'person', label: 'User Profile & Account', route: '/settings/account' },
        { icon: 'shield-checkmark', label: 'Face ID & App Security', route: '/settings/security' },
        { icon: 'options', label: 'Dashboard Customization', route: '/settings/customization' },
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>More & Settings</Text>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="person" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.user_metadata?.name || 'Rokda User'}</Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || 'Local User'}</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{sec.title}</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {sec.items.map((item, j) => (
                <Pressable
                  key={j}
                  style={({ pressed }) => [
                    styles.menuItem,
                    j < sec.items.length - 1 && [styles.borderBottom, { borderBottomColor: colors.cardBorder }],
                    pressed && { backgroundColor: colors.inputBg }
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (item.action) {
                      item.action();
                    } else if (item.route) {
                      router.push(item.route as any);
                    }
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name={item.icon as any} size={18} color={colors.accent} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Theme Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>App Theme</Text>
          <View style={[styles.themeRow, { backgroundColor: colors.inputBg }]}>
            {(['light', 'dark', 'system'] as const).map(t => (
              <Pressable
                key={t}
                style={[
                  styles.themeChip,
                  theme === t && [styles.activeThemeChip, { backgroundColor: colors.card }]
                ]}
                onPress={() => setTheme(t)}
              >
                <Text style={{ color: theme === t ? colors.textPrimary : colors.textMuted, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Sign Out Button */}
        <Pressable
          style={[styles.signOutBtn, { borderColor: colors.danger }]}
          onPress={signOut}
        >
          <Text style={[styles.signOutText, { color: colors.danger }]}>Log Out of Rokda</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 14,
    padding: 4,
  },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeThemeChip: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  signOutBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
