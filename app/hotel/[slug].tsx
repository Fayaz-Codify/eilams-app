import React, { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError, type HotelDetail, type Room, type Stay } from '../../src/lib/api';
import { addDays, date, money, nightsBetween, today } from '../../src/lib/format';
import { Button, ErrorNotice, Pill, Spinner, Stars } from '../../src/components/ui';
import { colors, font, radius } from '../../src/theme';

export default function HotelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const params = useLocalSearchParams<{ check_in?: string; check_out?: string; adults?: string }>();

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [stay, setStay] = useState<Stay>({
    check_in: params.check_in ?? addDays(today(), 1),
    check_out: params.check_out ?? addDays(today(), 2),
    nights: 1,
    adults: Number(params.adults ?? 2),
    children: 0,
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
      });
      setHotel(response.data);
      setStay((current) => ({ ...current, ...response.meta.stay }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load this property.');
    } finally {
      setLoading(false);
    }
  }, [slug, stay.check_in, stay.check_out, stay.adults]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, stay.check_in, stay.check_out, stay.adults]);

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
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
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
              <Text style={styles.heroPlaceholderText}>{hotel.name.slice(0, 1)}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.headingRow}>
            <View style={styles.headingText}>
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
  hero: { height: 260, backgroundColor: colors.subtle },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { ...font.bold, fontSize: 64, color: colors.lineStrong },
  heroTap: { ...StyleSheet.absoluteFill },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(23, 33, 43, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    right: 16,
    bottom: 12,
    backgroundColor: 'rgba(23, 33, 43, 0.62)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  photoBadgeText: { ...font.medium, fontSize: 11, color: '#FFFFFF' },
  body: { padding: 18, gap: 8 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingText: { flex: 1, gap: 2 },
  name: { ...font.bold, fontSize: 24, color: colors.ink, letterSpacing: -0.4 },
  city: { ...font.regular, fontSize: 14, color: colors.muted, textTransform: 'capitalize' },
  ratingBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  ratingValue: { ...font.bold, fontSize: 15, color: colors.ink },
  ratingCount: { ...font.regular, fontSize: 10, color: colors.muted },
  description: { ...font.regular, fontSize: 14, color: colors.body, lineHeight: 21 },
  policies: { gap: 8, marginTop: 8, padding: 14, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  policyLabel: { ...font.regular, fontSize: 12, color: colors.muted, width: 70 },
  policyValue: { ...font.medium, fontSize: 13, color: colors.ink, flex: 1 },
  sectionTitle: { ...font.semibold, fontSize: 17, color: colors.ink, marginTop: 14, marginBottom: 6 },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.sunken,
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 10,
  },
  dateStep: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dateBarText: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  dateBarDate: { ...font.semibold, fontSize: 13, color: colors.ink },
  dateBarMeta: { ...font.regular, fontSize: 12, color: colors.muted },
  sectionHint: { ...font.regular, fontSize: 12, color: colors.muted, marginBottom: 10 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  soldOut: { padding: 18, borderRadius: radius.md, backgroundColor: colors.warningSoft, gap: 4 },
  soldOutTitle: { ...font.semibold, fontSize: 14, color: colors.warning },
  soldOutBody: { ...font.regular, fontSize: 13, color: colors.muted },
  room: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  roomImage: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.subtle },
  roomPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  roomBody: { flex: 1, gap: 5 },
  roomHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  roomName: { ...font.semibold, fontSize: 15, color: colors.ink, flex: 1 },
  roomPrice: { ...font.semibold, fontSize: 14, color: colors.brand },
  roomMeta: { ...font.regular, fontSize: 12, color: colors.muted },
  roomTotal: { ...font.medium, fontSize: 13, color: colors.ink },
  roomLeft: { ...font.regular, fontSize: 11, color: colors.success },
  roomUnavailable: { ...font.regular, fontSize: 12, color: colors.danger },
  policyBox: { marginTop: 6, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: colors.brand },
  policyTitle: { ...font.semibold, fontSize: 13, color: colors.ink, marginBottom: 3 },
  policyBody: { ...font.regular, fontSize: 13, color: colors.body, lineHeight: 19 },
  review: { padding: 12, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, marginBottom: 8, gap: 4 },
  reviewText: { ...font.regular, fontSize: 13, color: colors.body, lineHeight: 19 },
  reviewMeta: { ...font.regular, fontSize: 11, color: colors.faint },
});
