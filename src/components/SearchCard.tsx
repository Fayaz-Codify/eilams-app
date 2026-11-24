import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, font, radius } from '../theme';
import { date, plural } from '../lib/format';
import type { Stay } from '../lib/api';

type Focus = 'destination' | 'dates' | 'guests';

type Props = {
  stay: Stay;
  onSubmit: () => void;
  cityLabel?: string;
  citySlug?: string;
};

/** A compact, phone-friendly shortcut into the full search filters. */
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

  const rows: { key: Focus; label: string; value: string }[] = [
    {
      key: 'destination',
      label: 'Destination',
      value: cityLabel || 'Anywhere in Pakistan',
    },
    {
      key: 'dates',
      label: 'Dates',
      value: `${date(stay.check_in)} → ${date(stay.check_out)}`,
    },
    {
      key: 'guests',
      label: 'Guests',
      value: `${plural(stay.adults, 'adult')}, ${plural(stay.children, 'child', 'children')}`,
    },
  ];

  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <React.Fragment key={row.key}>
          {index > 0 ? <View style={styles.rule} /> : null}
          <Pressable
            onPress={() => openSearch(row.key)}
            accessibilityRole="button"
            accessibilityLabel={`${row.label}: ${row.value}. Change ${row.label.toLowerCase()}`}
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
