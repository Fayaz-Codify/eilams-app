import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, ApiError, type City, type HotelCardData, type SearchMeta, type Stay } from '../src/lib/api';
import { addDays, date, nightsBetween, today } from '../src/lib/format';
import { HotelCard } from '../src/components/HotelCard';
import { Button, Chip, ErrorNotice, Spinner } from '../src/components/ui';
import { colors, font, shadows } from '../src/theme';

const SORTS = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'rating', label: 'Top rated' },
] as const;

const FOCUS_HINTS: Record<string, string> = {
  destination: 'Choose a destination, then browse available stays.',
  dates: 'Adjust your dates to see current availability and prices.',
  guests: 'Set the number of guests before choosing a room.',
};

/** Search stays as a guest, with destination, stay dates, guests, and sort filters. */
export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    city?: string;
    check_in?: string;
    check_out?: string;
    adults?: string;
    children?: string;
    q?: string;
    focus?: string;
  }>();

  const [stay, setStay] = useState<Stay>(() => {
    const check_in = params.check_in ?? addDays(today(), 1);
    const check_out = params.check_out ?? addDays(today(), 2);
    return {
      check_in,
      check_out,
      nights: nightsBetween(check_in, check_out),
      adults: validCount(params.adults, 2, 1),
      children: validCount(params.children, 0, 0),
    };
  });
  const [city, setCity] = useState(params.city ?? '');
  const [cities, setCities] = useState<City[]>([]);
  const [query, setQuery] = useState(params.q?.trim() ?? '');
  const [queryInput, setQueryInput] = useState(params.q ?? '');
  const [sort, setSort] = useState<string>('recommended');
  const [results, setResults] = useState<HotelCardData[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const nights = nightsBetween(stay.check_in, stay.check_out);

  // A bootstrap failure should not hide results if the hotels endpoint works.
  useEffect(() => {
    let cancelled = false;
    api.bootstrap()
      .then((response) => {
        if (!cancelled) setCities(response.cities);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the screen in sync when another shortcut opens Search in the same stack.
  useEffect(() => {
    setCity(params.city ?? '');
    setStay((current) => {
      const check_in = params.check_in ?? current.check_in;
      const check_out = params.check_out ?? current.check_out;
      return {
        check_in,
        check_out,
        nights: nightsBetween(check_in, check_out),
        adults: validCount(params.adults, current.adults, 1),
        children: validCount(params.children, current.children, 0),
      };
    });
    setQuery(params.q?.trim() ?? '');
    setQueryInput(params.q ?? '');
  }, [params.city, params.check_in, params.check_out, params.adults, params.children, params.q]);

  const run = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const response = await api.search({
        ...(city ? { city } : {}),
        ...(query ? { q: query } : {}),
        check_in: stay.check_in,
        check_out: stay.check_out,
        adults: stay.adults,
        children: stay.children,
        sort,
      });

      if (currentRequest !== requestId.current) return;
      setResults(response.data);
      setMeta(response.meta);
    } catch (e) {
      if (currentRequest !== requestId.current) return;
      setError(e instanceof ApiError ? e.message : 'Search failed.');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [city, query, stay, sort]);

  useEffect(() => {
    const timer = setTimeout(() => void run(), 180);
    return () => {
      clearTimeout(timer);
      requestId.current += 1;
    };
  }, [run]);

  const shiftStay = (direction: -1 | 1) => {
    setStay((current) => {
      const nextCheckIn =
        direction < 0 && addDays(current.check_in, direction) < today()
          ? current.check_in
          : addDays(current.check_in, direction);
      const currentNights = nightsBetween(current.check_in, current.check_out);
      return {
        ...current,
        check_in: nextCheckIn,
        check_out: addDays(nextCheckIn, currentNights),
        nights: currentNights,
      };
    });
  };

  const selectedCity = cities.find((item) => item.slug === city);
  const focusHint = params.focus ? FOCUS_HINTS[params.focus] : undefined;

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={[colors.brandDeep, '#0A4770', colors.ocean]}
        locations={[0, 0.58, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerKicker}>EXPLORE EILAMS</Text>
            <Text style={styles.headerTitle}>Find your stay</Text>
          </View>
          <View style={styles.headerSparkle}>
            <Ionicons name="sparkles-outline" size={18} color="#D9F1E6" />
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color={colors.brand} />
          <TextInput
            value={queryInput}
            onChangeText={setQueryInput}
            placeholder="Hotel, city or destination"
            placeholderTextColor={colors.faint}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => setQuery(queryInput.trim())}
            accessibilityLabel="Search hotels and cities"
          />
          {queryInput ? (
            <Pressable
              onPress={() => { setQueryInput(''); setQuery(''); }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={19} color={colors.faint} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setQuery(queryInput.trim())}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={styles.searchAction}
          >
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.filters}>
        {focusHint ? (
          <View style={styles.focusHintBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.ocean} />
            <Text style={styles.focusHint}>{focusHint}</Text>
          </View>
        ) : null}

        <View style={styles.destinationHeading}>
          <View>
            <Text style={styles.filterLabel}>DESTINATION</Text>
            <Text style={styles.selectedCity} numberOfLines={1}>
              {selectedCity?.city ?? (city ? city.replace(/-/g, ' ') : 'Anywhere in Pakistan')}
            </Text>
          </View>
          <Ionicons name="location-outline" size={20} color={colors.brand} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
          <Chip label="Anywhere" active={!city} onPress={() => setCity('')} />
          {cities.map((item) => (
            <Chip key={item.slug} label={item.city} active={city === item.slug} onPress={() => setCity(item.slug)} />
          ))}
        </ScrollView>

        <View style={styles.stayPanel}>
          <Text style={styles.stayPanelLabel}>YOUR STAY</Text>
          <View style={styles.datesRow}>
            <StepButton icon="chevron-back" label="Move dates back" onPress={() => shiftStay(-1)} />
            <View style={styles.datesText}>
              <Text style={styles.date}>{date(stay.check_in)}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.faint} />
              <Text style={styles.date}>{date(stay.check_out)}</Text>
            </View>
            <StepButton icon="chevron-forward" label="Move dates forward" onPress={() => shiftStay(1)} />
          </View>
          <View style={styles.stayDivider} />
          <View style={styles.guestRow}>
            <Stepper
              label="Nights"
              value={nights}
              minimum={1}
              onChange={(value) => setStay((current) => ({ ...current, check_out: addDays(current.check_in, value), nights: value }))}
            />
            <Stepper
              label="Adults"
              value={stay.adults}
              minimum={1}
              onChange={(value) => setStay((current) => ({ ...current, adults: value }))}
            />
            <Stepper
              label="Children"
              value={stay.children}
              minimum={0}
              onChange={(value) => setStay((current) => ({ ...current, children: value }))}
            />
          </View>
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <View style={styles.resultsTitleBlock}>
          <Text style={styles.resultsTitle}>Available stays</Text>
          <Text style={styles.resultsSubtitle}>Thoughtful places, picked for your trip</Text>
        </View>
        <Ionicons name="options-outline" size={19} color={colors.brand} />
      </View>
      <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.results} keyboardShouldPersistTaps="handled">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORTS.map((option) => (
            <Chip key={option.key} label={option.label} active={sort === option.key} onPress={() => setSort(option.key)} />
          ))}
        </ScrollView>

        {error ? (
          <ErrorNotice message={error} onRetry={run} />
        ) : loading ? (
          <Spinner label="Finding available rooms…" />
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={24} color={colors.brand} />
            </View>
            <Text style={styles.emptyTitle}>No stays free for those dates</Text>
            <Text style={styles.emptyBody}>Try moving your dates a day either way, or choose another destination.</Text>
            <Button title="Widen the dates" variant="secondary" compact onPress={() => shiftStay(1)} />
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              {meta?.total ?? results.length} {(meta?.total ?? 0) === 1 ? 'property' : 'properties'} available
            </Text>
            <View style={styles.cardsList}>
              {results.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onPress={() => router.push({
                    pathname: '/hotel/[slug]',
                    params: {
                      slug: hotel.slug,
                      check_in: stay.check_in,
                      check_out: stay.check_out,
                      adults: String(stay.adults),
                      children: String(stay.children),
                    },
                  })}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function validCount(value: string | undefined, fallback: number, minimum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
}

function StepButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.stepButton}
    >
      <Ionicons name={icon} size={18} color={colors.brand} />
    </Pressable>
  );
}

function Stepper({
  label,
  value,
  minimum,
  onChange,
}: {
  label: string;
  value: number;
  minimum: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <Pressable
        onPress={() => onChange(Math.max(minimum, value - 1))}
        accessibilityRole="button"
        accessibilityLabel={`One less ${label.toLowerCase()}`}
        style={styles.stepperButton}
      >
        <Ionicons name="remove" size={14} color={colors.brand} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        accessibilityRole="button"
        accessibilityLabel={`One more ${label.toLowerCase()}`}
        style={styles.stepperButton}
      >
        <Ionicons name="add" size={14} color={colors.brand} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  header: { paddingHorizontal: 18, paddingBottom: 32 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 17 },
  backButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.12)' },
  backPressed: { backgroundColor: 'rgba(255,255,255,0.24)' },
  headerTitleBlock: { flex: 1, gap: 2 },
  headerKicker: { ...font.semibold, color: 'rgba(225,242,246,0.72)', fontSize: 9, letterSpacing: 1.15 },
  headerTitle: { ...font.bold, color: '#FFFFFF', fontSize: 22, letterSpacing: -0.35 },
  headerSparkle: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  searchBox: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 14, paddingRight: 6, borderRadius: 17, backgroundColor: '#FFFFFF', ...shadows.card },
  searchInput: { ...font.regular, fontSize: 14, color: colors.ink, flex: 1, minHeight: 48 },
  searchAction: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  filters: { marginTop: -18, marginHorizontal: 14, padding: 15, gap: 12, zIndex: 2, backgroundColor: colors.surface, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(255,255,255,0.88)', ...shadows.floating },
  focusHintBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#E9F5F2', borderRadius: 12 },
  focusHint: { ...font.medium, color: colors.ocean, fontSize: 11, flex: 1 },
  destinationHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  filterLabel: { ...font.semibold, color: colors.muted, fontSize: 9, letterSpacing: 0.9 },
  selectedCity: { ...font.semibold, color: colors.ink, fontSize: 15, textTransform: 'capitalize', marginTop: 3 },
  cityRow: { gap: 6, paddingRight: 2 },
  stayPanel: { padding: 11, borderRadius: 16, backgroundColor: colors.sunken, borderWidth: 1, borderColor: colors.line, gap: 7 },
  stayPanelLabel: { ...font.semibold, color: colors.muted, fontSize: 9, letterSpacing: 0.8 },
  datesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  datesText: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  date: { ...font.semibold, fontSize: 12, color: colors.brand },
  stepButton: { width: 32, height: 32, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stayDivider: { height: 1, backgroundColor: colors.line, marginVertical: 1 },
  guestRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 5 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 0, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.surface, paddingRight: 1 },
  stepperLabel: { ...font.medium, fontSize: 10, color: colors.muted, paddingLeft: 7, paddingRight: 2 },
  stepperButton: { width: 24, height: 31, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { ...font.semibold, fontSize: 12, color: colors.ink, minWidth: 15, textAlign: 'center' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 19, paddingTop: 17, paddingBottom: 1 },
  resultsTitleBlock: { gap: 2 },
  resultsTitle: { ...font.bold, color: colors.ink, fontSize: 19, letterSpacing: -0.25 },
  resultsSubtitle: { ...font.regular, color: colors.muted, fontSize: 11 },
  resultsScroll: { flex: 1 },
  results: { paddingHorizontal: 16, paddingTop: 11, paddingBottom: 36 },
  sortRow: { gap: 7, paddingBottom: 14, paddingRight: 16 },
  resultCount: { ...font.medium, fontSize: 12, color: colors.muted, marginBottom: 11 },
  cardsList: { gap: 13 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 10, paddingHorizontal: 22, marginTop: 8, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.line },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#EAF2F9', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { ...font.semibold, fontSize: 16, color: colors.ink, textAlign: 'center' },
  emptyBody: { ...font.regular, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
});
