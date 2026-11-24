import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { colors, font, radius } from '../theme';
import { date, plural } from '../lib/format';
import type { Stay } from '../lib/api';

type Props = {
  stay: Stay;
  onStayChange: (next: Stay) => void;
  onSubmit: () => void;
  cityLabel?: string;
};

/**
 * The search box that opens the app. Tapping a segment opens a sheet rather
 * than typing, because on a phone "pick from the dates we actually have" beats
 * a calendar with 400 disabled days.
 */
export function SearchCard({ stay, onStayChange, onSubmit, cityLabel }: Props) {
  const navigation = useNavigation<any>();

  const rows = [
    {
      key: 'destination',
      label: 'Destination',
      value: cityLabel && cityLabel !== '' ? cityLabel : 'Anywhere in Pakistan',
      onPress: () => navigation.navigate('search', { focus: 'city' }),
    },
    {
      key: 'dates',
      label: 'Dates',
      value: `${date(stay.check_in)} → ${date(stay.check_out)}`,
      onPress: () => navigation.navigate('search', { focus: 'dates' }),
    },
    {
      key: 'guests',
      label: 'Guests',
      value: `${plural(stay.adults, 'adult')}, ${plural(stay.children, 'child', 'children')}`,
      onPress: () => navigation.navigate('search', { focus: 'guests' }),
    },
  ];

  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <React.Fragment key={row.key}>
          {index > 0 ? <View style={styles.rule} /> : null}
          <Pressable
            onPress={row.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${row.label}: ${row.value}`}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value} numberOfLines={1}>
              {row.value}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </React.Fragment>
      ))}

      <Pressable
        onPress={onSubmit}
        accessibilityRole="button"
        accessibilityLabel="Search stays"
        style={({ pressed }) => [styles.submit, pressed && styles.pressedSubmit]}
      >
        <Text style={styles.submitText}>Find stays</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  pressed: { backgroundColor: colors.subtle },
  rule: { height: 1, backgroundColor: colors.line, marginHorizontal: 16 },
  label: { ...font.medium, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, width: 92 },
  value: { ...font.medium, fontSize: 15, color: colors.ink, flex: 1 },
  chevron: { fontSize: 20, color: colors.faint },
  submit: {
    backgroundColor: colors.brand,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  pressedSubmit: { backgroundColor: colors.brandHover },
  submitText: { ...font.semibold, fontSize: 16, color: '#FFFFFF' },
});
