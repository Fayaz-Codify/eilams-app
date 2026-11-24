import React, { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, ApiError, type HotelDetail, type Room, type Stay } from '../../src/lib/api';
import { addDays, date, money, nightsBetween, today } from '../../src/lib/format';
import { Button, ErrorNotice, Pill, Spinner, Stars } from '../../src/components/ui';
import { colors, font, radius, shadows } from '../../src/theme';

export default function HotelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    slug: string;
    check_in?: string;
    check_out?: string;
    adults?: string;
    children?: string;
  }>();
  const { slug } = params;

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [stay, setStay] = useState<Stay>({
    check_in: params.check_in ?? addDays(today(), 1),
    check_out: params.check_out ?? addDays(today(), 2),
    nights: nightsBetween(
      params.check_in ?? addDays(today(), 1),
      params.check_out ?? addDays(today(), 2),
    ),
    adults: Number(params.adults ?? 2),
    children: Number(params.children ?? 0),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.hotel(slug, {
        check_in: stay.check_in,
        check_out: stay.check_out,
        adults: stay.adults,
        children: stay.children,
      });
      setHotel(response.data);
      setStay((current) => ({ ...current, ...response.meta.stay }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load this property.');
    } finally {
      setLoading(false);
    }
  }, [slug, stay.check_in, stay.check_out, stay.adults, stay.children]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, stay.check_in, stay.check_out, stay.adults, stay.children]);

  const shiftStay = (direction: -1 | 1) => {
    setStay((current) => {
      const check_in =
        direction < 0 && addDays(current.check_in, direction) < today()
          ? current.check_in
          : addDays(current.check_in, direction);
      const nights = nightsBetween(current.check_in, current.check_out);

      return {
        ...current,
        check_in,
        check_out: addDays(check_in, nights),
        nights,
      };
    });
  };

  const photos = hotel?.images.length ? hotel.images : hotel?.image ? [hotel.image] : [];
  const nights = nightsBetween(stay.check_in, stay.check_out);

  if (loading && !hotel) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 40 }]}>
        <Spinner label="Loading the property…" />
      </View>
    );
  }

  if (error || !hotel) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 40 }]}>
        <ErrorNotice message={error ?? 'We could not load this property.'} onRetry={load} />
      </View>
    );
  }

  const bookable = hotel.rooms.filter((room) => room.bookable);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          {photos.length > 0 ? (
            <>
              <Image source={{ uri: photos[photoIndex] ?? photos[0] }} style={styles.heroImage} />
              <Pressable
                onPress={() => setPhotoIndex((index) => (index + 1) % photos.length)}
                accessibilityRole="button"
                accessibilityLabel="Next photo"
                style={styles.heroTap}
              />
              <LinearGradient
                colors={['rgba(8,28,56,0.34)', 'transparent', 'rgba(8,28,56,0.15)']}
                locations={[0, 0.48, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              {photos.length > 1 ? (
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeText}>
                    {photoIndex + 1} / {photos.length}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="bed-outline" size={54} color="#8295A9" />
            </View>
          )}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <View pointerEvents="none" style={styles.heroCaption}>
            <View style={styles.heroLocation}>
              <Ionicons name="location" size={12} color="#FFFFFF" />
              <Text style={styles.heroLocationText} numberOfLines={1}>{hotel.city}</Text>
            </View>
            {hotel.stars > 0 ? <Stars count={hotel.stars} size={12} /> : null}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.headingRow}>
            <View style={styles.headingText}>
              <Text style={styles.propertyKicker}>YOUR NEXT GETAWAY</Text>
              <Text style={styles.name}>{hotel.name}</Text>
              <Text style={styles.city}>
                {hotel.city} · {hotel.property_type}
              </Text>
            </View>
            {hotel.rating !== null ? (
              <View style={styles.ratingBox}>
                <Text style={styles.ratingValue}>{hotel.rating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>{hotel.reviews_count} reviews</Text>
              </View>
            ) : null}
          </View>

          <Stars count={hotel.stars} size={14} />

          {hotel.description ? <Text style={styles.description}>{hotel.description}</Text> : null}

          <View style={styles.policies}>
            <PolicyRow icon="time-outline" label="Check-in" value={hotel.check_in_time ?? '14:00'} />
            <PolicyRow icon="log-out-outline" label="Check-out" value={hotel.check_out_time ?? '12:00'} />
            <PolicyRow
              icon="location-outline"
              label="Address"
              value={hotel.address ?? hotel.city}
              onPress={hotel.lat && hotel.lng ? () => Linking.openURL(`https://maps.google.com/?q=${hotel.lat},${hotel.lng}`) : undefined}
            />
            {hotel.phone ? (
              <PolicyRow
                icon="call-outline"
                label="Phone"
                value={hotel.phone}
                onPress={() => Linking.openURL(`tel:${hotel.phone}`)}
              />
            ) : null}
          </View>

          {hotel.amenities.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenities}>
                {hotel.amenities.map((amenity) => (
                  <Pill key={amenity.key} label={amenity.label} />
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>
            Rooms for {pluralNight(nights)}
          </Text>

          <View style={styles.dateBar}>
            <Pressable
              onPress={() => shiftStay(-1)}
              accessibilityRole="button"
              accessibilityLabel="Move dates back"
              style={styles.dateStep}
            >
              <Ionicons name="chevron-back" size={18} color={colors.brand} />
            </Pressable>
            <View style={styles.dateBarText}>
              <Text style={styles.dateBarDate}>{date(stay.check_in)}</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.faint} />
              <Text style={styles.dateBarDate}>{date(stay.check_out)}</Text>
              <Text style={styles.dateBarMeta}>{money(hotel.price.per_night)} a night from</Text>
            </View>
            <Pressable
              onPress={() => shiftStay(1)}
              accessibilityRole="button"
              accessibilityLabel="Move dates forward"
              style={styles.dateStep}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.brand} />
            </Pressable>
          </View>

          {bookable.length === 0 ? (
            <View style={styles.soldOut}>
              <Text style={styles.soldOutTitle}>Nothing free on these dates</Text>
              <Text style={styles.soldOutBody}>Move the dates and we will look again.</Text>
            </View>
          ) : null}

          {hotel.rooms.map((room) => (
            <RoomRow
              key={room.id}
              room={room}
              nights={nights}
              onBook={() =>
                router.push({
                  pathname: '/checkout',
                  params: {
                    hotel: hotel.slug,
                    room: String(room.id),
                    check_in: stay.check_in,
                    check_out: stay.check_out,
                    adults: String(stay.adults),
                    children: String(stay.children),
                  },
                })
              }
            />
          ))}

          {hotel.cancellation_policy ? (
            <View style={styles.policyBox}>
              <Text style={styles.policyTitle}>Cancellation</Text>
              <Text style={styles.policyBody}>{hotel.cancellation_policy}</Text>
            </View>
          ) : null}

          {hotel.reviews.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>What guests say</Text>
              {hotel.reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.review}>
                  <Stars count={review.rating} size={11} />
                  <Text style={styles.reviewText}>{review.comment}</Text>
                  <Text style={styles.reviewMeta}>
                    {review.name} · {review.date}
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function PolicyRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }) => [styles.policyRow, pressed && onPress ? { opacity: 0.7 } : null]}
    >
      <Ionicons name={icon} size={16} color={colors.brand} />
      <Text style={styles.policyLabel}>{label}</Text>
      <Text style={styles.policyValue} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
}

function RoomRow({ room, nights, onBook }: { room: Room; nights: number; onBook: () => void }) {
  return (
    <View style={styles.room}>
      {room.images[0] ? (
        <Image source={{ uri: room.images[0] }} style={styles.roomImage} />
      ) : (
        <View style={[styles.roomImage, styles.roomPlaceholder]}>
          <Ionicons name="bed-outline" size={22} color={colors.lineStrong} />
        </View>
      )}

      <View style={styles.roomBody}>
        <View style={styles.roomHeading}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomPrice}>{money(room.per_night)}</Text>
        </View>

        <Text style={styles.roomMeta}>
          {pluralNight(nights)} · sleeps {room.max_adults}
          {room.max_children > 0 ? ` + ${room.max_children} child` : ''}
        </Text>

        {room.bookable ? (
          <>
            <Text style={styles.roomTotal}>
              {money(room.total)} total{room.tax > 0 ? ` (incl. ${money(room.tax)} tax)` : ''}
            </Text>
            {room.left <= 3 ? (
              <Text style={styles.roomLeft}>Only {room.left} left at this price</Text>
            ) : null}
            <Button title="Book this room" compact onPress={onBook} />
          </>
        ) : (
          <>
            <Text style={styles.roomUnavailable}>{room.reason ?? 'Not available'}</Text>
            <Button title="Unavailable" variant="secondary" compact disabled />
          </>
        )}
      </View>
    </View>
  );
}

function pluralNight(nights: number): string {
  return `${nights} ${nights === 1 ? 'night' : 'nights'}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  scroll: { paddingBottom: 40 },
  hero: { height: 286, backgroundColor: '#E5EDF4', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5EDF4' },
  heroTap: { ...StyleSheet.absoluteFill },
  backButton: {
    position: 'absolute', top: 12, left: 16, width: 42, height: 42, borderRadius: 15,
    backgroundColor: 'rgba(8,28,56,0.66)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroCaption: { position: 'absolute', left: 17, right: 17, bottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(8,28,56,0.64)', borderRadius: radius.pill },
  heroLocationText: { ...font.medium, color: '#FFFFFF', fontSize: 11, textTransform: 'capitalize' },
  photoBadge: { position: 'absolute', right: 17, top: 13, backgroundColor: 'rgba(8,28,56,0.68)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill },
  photoBadgeText: { ...font.medium, fontSize: 11, color: '#FFFFFF' },
  body: { marginTop: -20, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 35, gap: 10, backgroundColor: colors.subtle, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingText: { flex: 1, gap: 3 },
  propertyKicker: { ...font.semibold, color: colors.ocean, fontSize: 9, letterSpacing: 1.1 },
  name: { ...font.bold, fontSize: 24, color: colors.ink, letterSpacing: -0.5 },
  city: { ...font.regular, fontSize: 13, color: colors.muted, textTransform: 'capitalize' },
  ratingBox: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center', ...shadows.card },
  ratingValue: { ...font.bold, fontSize: 15, color: colors.ink },
  ratingCount: { ...font.regular, fontSize: 10, color: colors.muted },
  description: { ...font.regular, fontSize: 14, color: colors.body, lineHeight: 22, marginTop: 2 },
  policies: { gap: 11, marginTop: 6, padding: 15, backgroundColor: colors.surface, borderRadius: 19, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  policyLabel: { ...font.medium, fontSize: 12, color: colors.muted, width: 72 },
  policyValue: { ...font.medium, fontSize: 13, color: colors.ink, flex: 1 },
  sectionTitle: { ...font.bold, fontSize: 18, color: colors.ink, marginTop: 15, marginBottom: 3, letterSpacing: -0.2 },
  dateBar: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.line, borderRadius: 17, backgroundColor: colors.surface, paddingHorizontal: 5, paddingVertical: 7, marginBottom: 6, ...shadows.card },
  dateStep: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.sunken, alignItems: 'center', justifyContent: 'center' },
  dateBarText: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  dateBarDate: { ...font.semibold, fontSize: 12, color: colors.brand },
  dateBarMeta: { ...font.regular, fontSize: 11, color: colors.muted },
  sectionHint: { ...font.regular, fontSize: 12, color: colors.muted, marginBottom: 10 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  soldOut: { padding: 17, borderRadius: 18, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: '#F2E3BE', gap: 4 },
  soldOutTitle: { ...font.semibold, fontSize: 14, color: colors.warning },
  soldOutBody: { ...font.regular, fontSize: 13, color: colors.muted },
  room: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line, marginBottom: 10, ...shadows.card },
  roomImage: { width: 82, height: 82, borderRadius: 14, backgroundColor: colors.subtle },
  roomPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  roomBody: { flex: 1, gap: 6 },
  roomHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  roomName: { ...font.semibold, fontSize: 15, color: colors.ink, flex: 1 },
  roomPrice: { ...font.bold, fontSize: 14, color: colors.brand },
  roomMeta: { ...font.regular, fontSize: 12, color: colors.muted },
  roomTotal: { ...font.medium, fontSize: 13, color: colors.ink },
  roomLeft: { ...font.medium, fontSize: 11, color: colors.success },
  roomUnavailable: { ...font.regular, fontSize: 12, color: colors.danger },
  policyBox: { marginTop: 6, padding: 15, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  policyTitle: { ...font.semibold, fontSize: 14, color: colors.ink, marginBottom: 5 },
  policyBody: { ...font.regular, fontSize: 13, color: colors.body, lineHeight: 20 },
  review: { padding: 14, backgroundColor: colors.surface, borderRadius: 17, borderWidth: 1, borderColor: colors.line, marginBottom: 9, gap: 6 },
  reviewText: { ...font.regular, fontSize: 13, color: colors.body, lineHeight: 20 },
  reviewMeta: { ...font.medium, fontSize: 11, color: colors.faint },
});
