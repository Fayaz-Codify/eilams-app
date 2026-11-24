import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { money } from '../lib/format';
import type { HotelCardData } from '../lib/api';
import { colors, font, radius, shadows } from '../theme';

type Props = {
  hotel: HotelCardData;
  onPress: () => void;
  compact?: boolean;
};

export function HotelCard({ hotel, onPress, compact = false }: Props) {
  const showRating = hotel.rating !== null && !Number.isNaN(Number(hotel.rating));
  const price = hotel.price?.available && hotel.price.per_night > 0
    ? money(hotel.price.per_night)
    : null;
  const propertyLabel = hotel.stars > 0
    ? `${hotel.stars}-star ${hotel.property_type || 'stay'}`
    : (hotel.property_type || 'Stay');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${hotel.name}${hotel.city ? ` in ${hotel.city}` : ''}`}
      style={({ pressed }) => [styles.card, compact && styles.compactCard, pressed && styles.pressed]}
    >
      <View style={[styles.imageWrap, compact && styles.compactImageWrap]}>
        {hotel.image ? (
          <Image source={{ uri: hotel.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="bed-outline" size={34} color="#8295A9" />
          </View>
        )}
        <LinearGradient
          colors={['rgba(8,28,56,0.38)', 'rgba(8,28,56,0.02)', 'rgba(8,28,56,0.18)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.destinationTag}>
          <Ionicons name="location" size={11} color="#FFFFFF" />
          <Text numberOfLines={1} style={styles.destinationText}>{hotel.city || 'Pakistan'}</Text>
        </View>
        <View style={styles.favorite} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="heart-outline" size={18} color={colors.ink} />
        </View>
        {hotel.price?.available ? (
          <View style={styles.availabilityTag}>
            <View style={styles.availabilityDot} />
            <Text style={styles.availabilityText}>Available</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
          {showRating ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={11} color="#D99A26" />
              <Text style={styles.ratingText}>{Number(hotel.rating).toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {propertyLabel}{hotel.city ? `  ·  ${hotel.city}` : ''}
        </Text>

        {hotel.amenities.length > 0 ? (
          <View style={styles.perksRow}>
            {hotel.amenities.slice(0, 2).map((amenity, index) => (
              <View style={styles.perk} key={`${amenity}-${index}`}>
                {index === 0 ? <Ionicons name="checkmark-circle" size={13} color={colors.ocean} /> : null}
                <Text style={styles.perkText} numberOfLines={1}>{amenity}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.reviewSummary}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.muted} />
            <Text style={styles.reviewText}>
              {hotel.reviews_count > 0 ? `${hotel.reviews_count} reviews` : 'Guest favourite'}
            </Text>
          </View>
          <View style={styles.priceWrap}>
            {price ? (
              <>
                <Text style={styles.price}>{price}</Text>
                <Text style={styles.perNight}> / night</Text>
              </>
            ) : <Text style={styles.priceOnRequest}>See availability</Text>}
          </View>
        </View>
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
    ...shadows.card,
  },
  compactCard: { width: 286, marginRight: 14 },
  imageWrap: { height: 194, backgroundColor: '#E5EDF4', position: 'relative' },
  compactImageWrap: { height: 170 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5EDF4' },
  destinationTag: {
    position: 'absolute', left: 13, top: 13, maxWidth: '62%',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: 'rgba(8,28,56,0.58)',
  },
  destinationText: { ...font.medium, color: '#FFFFFF', fontSize: 11 },
  favorite: {
    position: 'absolute', top: 11, right: 11, width: 36, height: 36,
    borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center', justifyContent: 'center', ...shadows.card,
  },
  availabilityTag: {
    position: 'absolute', left: 13, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: radius.pill,
    paddingHorizontal: 9, paddingVertical: 6,
  },
  availabilityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  availabilityText: { ...font.semibold, fontSize: 10, color: colors.success },
  body: { paddingHorizontal: 15, paddingTop: 13, paddingBottom: 14, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, ...font.semibold, fontSize: 16, color: colors.ink, letterSpacing: -0.2 },
  rating: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF7E6', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4,
  },
  ratingText: { ...font.semibold, fontSize: 11, color: colors.ink },
  meta: { ...font.regular, fontSize: 12, color: colors.muted, textTransform: 'capitalize' },
  perksRow: { flexDirection: 'row', gap: 12, marginTop: 3, minHeight: 20 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '48%' },
  perkText: { ...font.medium, color: colors.body, fontSize: 11 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line,
  },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  reviewText: { ...font.medium, color: colors.muted, fontSize: 11 },
  priceWrap: { flexDirection: 'row', alignItems: 'baseline' },
  price: { ...font.bold, color: colors.brand, fontSize: 16 },
  perNight: { ...font.regular, color: colors.muted, fontSize: 10 },
  priceOnRequest: { ...font.semibold, color: colors.brand, fontSize: 12 },
  pressed: { opacity: 0.93, transform: [{ scale: 0.995 }] },
});
