import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError, type Bootstrap, type HotelCardData, type Stay } from '../../src/lib/api';
import { addDays, today } from '../../src/lib/format';
import { SearchCard } from '../../src/components/SearchCard';
import { HotelCard } from '../../src/components/HotelCard';
import { ErrorNotice, SectionTitle, Spinner } from '../../src/components/ui';
import { colors, font, radius } from '../../src/theme';

/**
 * The app's front door: a search box, the destinations we actually have
 * properties in, and a short list of featured stays.
 */
export default function Explore() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [featured, setFeatured] = useState<HotelCardData[]>([]);
  const [stay, setStay] = useState<Stay>({
    check_in: addDays(today(), 1),
    check_out: addDays(today(), 2),
    nights: 1,
    adults: 2,
    children: 0,
  });
  const [city, setCity] = useState<{ slug: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);

    try {
      const boot = await api.bootstrap();
      setBootstrap(boot);

      const next = {
        check_in: addDays(today(), 1),
        check_out: addDays(today(), 2),
      };

      const results = await api.search({ ...next, adults: 2, sort: 'recommended', per_page: 6 });
      setFeatured(results.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load the app.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const search = useCallback(() => {
    const params = new URLSearchParams({
      check_in: stay.check_in,
      check_out: stay.check_out,
      adults: String(stay.adults),
      children: String(stay.children),
    });

    if (city) params.set('city', city.slug);

    router.push(`/search?${params.toString()}`);
  }, [router, stay, city]);

  const cities = useMemo(() => bootstrap?.cities.slice(0, 8) ?? [], [bootstrap]);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brand} />}
      >
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.hello}>Stay somewhere good</Text>
            <Text style={styles.sub}>Hotels, guesthouses and resorts across Pakistan</Text>
          </View>
          <Link href="/profile" asChild>
            <Ionicons name="person-circle-outline" size={28} color={colors.brand} />
          </Link>
        </View>

        <SearchCard
          stay={stay}
          cityLabel={city?.name}
          onStayChange={setStay}
          onSubmit={search}
        />

        <View style={styles.quickRow}>
          {['Tonight', 'This weekend', 'Next week'].map((label) => {
            const offset = label === 'Tonight' ? 0 : label === 'This weekend' ? 2 : 7;

            return (
              <Link
                key={label}
                href={`/search?check_in=${addDays(today(), offset)}&check_out=${addDays(
                  today(),
                  offset + 1,
                )}&adults=2`}
                asChild
              >
                <View style={styles.quickChip}>
                  <Text style={styles.quickChipText}>{label}</Text>
                </View>
              </Link>
            );
          })}
        </View>

        {error ? (
          <ErrorNotice message={error} onRetry={load} />
        ) : (
          <>
            <SectionTitle
              title="Destinations"
              action={
                <Link href="/search" asChild>
                  <Text style={styles.seeAll}>See all</Text>
                </Link>
              }
            />

            {loading && cities.length === 0 ? (
              <Spinner />
            ) : (
              <FlatList
                horizontal
                data={cities}
                keyExtractor={(item) => item.slug}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cityRail}
                renderItem={({ item }) => (
                  <Link href={`/search?city=${item.slug}&check_in=${stay.check_in}&check_out=${stay.check_out}`} asChild>
                    <View style={styles.cityCard}>
                      {item.cover ? (
                        <Image source={{ uri: item.cover }} style={styles.cityImage} />
                      ) : (
                        <View style={[styles.cityImage, styles.cityPlaceholder]}>
                          <Text style={styles.cityPlaceholderText}>{item.city.slice(0, 1)}</Text>
                        </View>
                      )}
                      <View style={styles.cityOverlay} />
                      <View style={styles.cityText}>
                        <Text style={styles.cityName}>{item.city}</Text>
                        <Text style={styles.cityCount}>
                          {item.hotels} {item.hotels === 1 ? 'property' : 'properties'}
                        </Text>
                      </View>
                    </View>
                  </Link>
                )}
              />
            )}

            <SectionTitle
              title="Featured stays"
              action={
                <Link href="/search" asChild>
                  <Text style={styles.seeAll}>Browse all</Text>
                </Link>
              }
            />

            {loading && featured.length === 0 ? (
              <Spinner />
            ) : featured.length === 0 ? (
              <Text style={styles.muted}>
                Nothing free for those dates yet. Try different dates or another city.
              </Text>
            ) : (
              featured.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} onPress={() => router.push(`/hotel/${hotel.slug}`)} />
              ))
            )}
          </>
        )}

        <Text style={styles.footnote}>Prices include taxes. You pay in Pakistani rupees.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  hello: { ...font.bold, fontSize: 24, color: colors.ink, letterSpacing: -0.4 },
  sub: { ...font.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 24 },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  quickChipText: { ...font.medium, fontSize: 12, color: colors.body },
  seeAll: { ...font.semibold, fontSize: 13, color: colors.brand },
  cityRail: { gap: 10, paddingRight: 20 },
  cityCard: {
    width: 150,
    height: 108,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.subtle,
  },
  cityImage: { width: '100%', height: '100%' },
  cityPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cityPlaceholderText: { ...font.bold, fontSize: 34, color: colors.lineStrong },
  cityOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 30, 40, 0.45)',
  },
  cityText: { position: 'absolute', left: 10, bottom: 9 },
  cityName: { ...font.semibold, fontSize: 14, color: '#FFFFFF' },
  cityCount: { ...font.regular, fontSize: 10, color: 'rgba(255,255,255,0.82)' },
  muted: { ...font.regular, fontSize: 14, color: colors.muted, lineHeight: 20 },
  footnote: { ...font.regular, fontSize: 11, color: colors.faint, marginTop: 8 },
});
