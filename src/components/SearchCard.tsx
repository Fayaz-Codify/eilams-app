import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, shadows } from '../theme';
import { plural, shortDate } from '../lib/format';
import type { Stay } from '../lib/api';

type Focus = 'destination' | 'dates' | 'guests';

type Props = {
  stay: Stay;
  onSubmit: () => void;
  cityLabel?: string;
  citySlug?: string;
};

/** Floating search panel inspired by modern airline / travel booking apps. */
export function SearchCard({ stay, onSubmit, cityLabel, citySlug }: Props) {
  const router = useRouter();

  const openSearch = (focus: Focus) => {
    router.push({
      pathname: '/search',
      params: {
        focus,
        check_in: stay.check_in,
        check_out: stay.check_out,
        adults: String(stay.adults),
        children: String(stay.children),
        ...(citySlug ? { city: citySlug } : {}),
      },
    });
  };

  const guestSummary = `${plural(stay.adults, 'adult')}, ${plural(stay.children, 'child', 'children')}`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeading}>
          <Text style={styles.eyebrow}>PLAN YOUR ESCAPE</Text>
          <Text style={styles.title}>Find a place to stay</Text>
        </View>
        <View style={styles.sparkle}>
          <Ionicons name="sparkles-outline" size={18} color={colors.brand} />
        </View>
      </View>

      <Pressable
        onPress={() => openSearch('destination')}
        accessibilityRole="button"
        accessibilityLabel={`Destination: ${cityLabel || 'Anywhere in Pakistan'}`}
        style={({ pressed }) => [styles.destination, pressed && styles.pressed]}
      >
        <View style={styles.iconBox}>
          <Ionicons name="location-outline" size={19} color={colors.brand} />
        </View>
        <View style={styles.destinationText}>
          <Text style={styles.fieldLabel}>DESTINATION</Text>
          <Text style={styles.fieldValue} numberOfLines={1}>
            {cityLabel || 'Anywhere in Pakistan'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </Pressable>

      <View style={styles.detailsRow}>
        <Pressable
          onPress={() => openSearch('dates')}
          accessibilityRole="button"
          accessibilityLabel={`Stay dates: ${shortDate(stay.check_in)} to ${shortDate(stay.check_out)}`}
          style={({ pressed }) => [styles.detailCell, pressed && styles.pressed]}
        >
          <View style={styles.detailIcon}>
            <Ionicons name="calendar-outline" size={17} color={colors.brand} />
          </View>
          <Text style={styles.fieldLabel}>CHECK-IN · CHECK-OUT</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {shortDate(stay.check_in)} — {shortDate(stay.check_out)}
          </Text>
        </Pressable>

        <View style={styles.verticalRule} />

        <Pressable
          onPress={() => openSearch('guests')}
          accessibilityRole="button"
          accessibilityLabel={`Guests: ${guestSummary}`}
          style={({ pressed }) => [styles.detailCell, styles.guestCell, pressed && styles.pressed]}
        >
          <View style={styles.detailIcon}>
            <Ionicons name="people-outline" size={17} color={colors.brand} />
          </View>
          <Text style={styles.fieldLabel}>GUESTS</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {guestSummary}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onSubmit}
        accessibilityRole="button"
        accessibilityLabel="Search stays"
        style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}
      >
        <Ionicons name="search" size={19} color="#FFFFFF" />
        <Text style={styles.submitText}>Search stays</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: 18,
    gap: 12,
    ...shadows.floating,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  cardHeading: { gap: 3 },
  eyebrow: { ...font.semibold, color: colors.ocean, fontSize: 10, letterSpacing: 1.3 },
  title: { ...font.bold, color: colors.ink, fontSize: 19, letterSpacing: -0.35 },
  sparkle: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  destination: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.sunken,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 17,
  },
  iconBox: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#E8F1FA', alignItems: 'center', justifyContent: 'center' },
  destinationText: { flex: 1, gap: 3 },
  fieldLabel: { ...font.semibold, color: colors.muted, fontSize: 9, letterSpacing: 0.75 },
  fieldValue: { ...font.semibold, color: colors.ink, fontSize: 15 },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 3,
  },
  detailCell: { flex: 1, minWidth: 0, gap: 5, paddingHorizontal: 3, paddingVertical: 5 },
  guestCell: { paddingLeft: 13 },
  detailIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#EEF4FA', alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  detailValue: { ...font.semibold, color: colors.ink, fontSize: 13 },
  verticalRule: { width: 1, backgroundColor: colors.line, marginVertical: 5 },
  pressed: { opacity: 0.75 },
  submit: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    backgroundColor: colors.brand,
    marginTop: 1,
    paddingHorizontal: 16,
  },
  submitPressed: { backgroundColor: colors.brandHover, transform: [{ scale: 0.99 }] },
  submitText: { ...font.semibold, color: '#FFFFFF', fontSize: 15, flex: 1 },
});
