import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '../theme';
import { money, plural } from '../lib/format';
import type { HotelCardData } from '../lib/api';
import { Stars } from './ui';

type Props = {
  hotel: HotelCardData;
  onPress?: () => void;
  /** Full-width on a results screen, or square-ish on a horizontal rail. */
  compact?: boolean;
  testID?: string;
};

/**
 * The property card. Deliberately the same information the website leads with:
 * photo, name, city, rating, and the real price for the dates the guest asked
 * about — never a "from" price pulled off the room type.
 */
export function HotelCard({ hotel, onPress, compact, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${hotel.name}, ${hotel.city}, ${money(hotel.price.total)} for ${plural(hotel.price.nights, 'night')}`}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {hotel.image ? (
          <Image source={{ uri: hotel.image }} style={styles.image} accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>{hotel.name.slice(0, 1)}</Text>
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{hotel.property_type}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.headingRow}>
          <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
            {hotel.name}
          </Text>
          {hotel.rating !== null ? (
            <View style={styles.rating}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingValue}>{hotel.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.city} numberOfLines={1}>
          {hotel.city}
        </Text>

        <Stars count={hotel.stars} />

        <View style={styles.priceRow}>
          <Text style={styles.price}>{money(hotel.price.per_night)}</Text>
          <Text style={styles.priceUnit}>/ night</Text>
        </View>
        {hotel.price.available && hotel.price.room_type ? (
          <Text style={styles.priceDetail} numberOfLines={1}>
            {hotel.price.room_type} · {money(hotel.price.total)} total
          </Text>
        ) : (
          <Text style={styles.priceDetail}>No rooms free on these dates</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    marginBottom: 14,
  },
  compact: { width: 240, marginBottom: 0 },
  pressed: { opacity: 0.97 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 150, backgroundColor: colors.subtle },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { ...font.bold, fontSize: 40, color: colors.lineStrong },
  typeBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(23, 33, 43, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  typeBadgeText: { ...font.medium, fontSize: 10, color: '#FFFFFF', textTransform: 'capitalize' },
  body: { padding: 12, gap: 3 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { ...font.semibold, fontSize: 16, color: colors.ink, flex: 1, lineHeight: 21 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  ratingStar: { color: colors.sun, fontSize: 11 },
  ratingValue: { ...font.semibold, fontSize: 12, color: colors.ink },
  city: { ...font.regular, fontSize: 13, color: colors.muted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  price: { ...font.bold, fontSize: 17, color: colors.brand },
  priceUnit: { ...font.regular, fontSize: 12, color: colors.muted },
  priceDetail: { ...font.regular, fontSize: 12, color: colors.faint },
});
