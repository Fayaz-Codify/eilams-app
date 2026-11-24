import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError, type City, type HotelCardData, type SearchMeta, type Stay } from '../src/lib/api';
import { addDays, date, nightsBetween, today } from '../src/lib/format';
import { HotelCard } from '../src/components/HotelCard';
import { Button, Chip, ErrorNotice, Spinner } from '../src/components/ui';
import { colors, font, radius } from '../src/theme';

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

/** Search and filters designed to remain usable on a small phone screen. */
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

  // Bootstrap is only used for the destination picker; a temporary bootstrap
  // failure should not hide results when the hotels endpoint is available.
  useEffect(() => {
    let cancelled = false;
    api
      .bootstrap()
      .then((response) => {
        if (!cancelled) setCities(response.cities);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the screen in sync when another home shortcut opens Search with a new
  // destination or stay in the same navigation stack.
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
      // Never move the check-in before today.
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
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <TextInput
          value={queryInput}
          onChangeText={setQueryInput}
          placeholder="Search hotels, cities…"
          placeholderTextColor={colors.faint}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => setQuery(queryInput.trim())}
          accessibilityLabel="Search hotels and cities"
        />
        <Pressable
          onPress={() => setQuery(queryInput.trim())}
          accessibilityRole="button"
          accessibilityLabel="Search"
          hitSlop={8}
        >
          <Ionicons name="search" size={20} color={colors.brand} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {focusHint ? <Text style={styles.focusHint}>{focusHint}</Text> : null}

        <View style={styles.destinationHeading}>
          <Text style={styles.filterLabel}>Destination</Text>
          <Text style={styles.selectedCity} numberOfLines={1}>
            {selectedCity?.city ?? (city ? city.replace(/-/g, ' ') : 'Anywhere in Pakistan')}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
          <Chip label="Anywhere" active={!city} onPress={() => setCity('')} />
          {cities.map((item) => (
            <Chip
              key={item.slug}
              label={item.city}
              active={city === item.slug}
              onPress={() => setCity(item.slug)}
            />
          ))}
        </ScrollView>

        <View style={styles.datesRow}>
          <StepButton icon="chevron-back" label="Move dates back" onPress={() => shiftStay(-1)} />
          <View style={styles.datesText}>
            <Text style={styles.date}>{date(stay.check_in)}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.faint} />
            <Text style={styles.date}>{date(stay.check_out)}</Text>
          </View>
          <StepButton icon="chevron-forward" label="Move dates forward" onPress={() => shiftStay(1)} />
        </View>

        <View style={styles.guestRow}>
          <Stepper
            label="Nights"
            value={nights}
            minimum={1}
            onChange={(value) =>
              setStay((current) => ({
                ...current,
                check_out: addDays(current.check_in, value),
                nights: value,
              }))
            }
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORTS.map((option) => (
            <Chip
              key={option.key}
              label={option.label}
              active={sort === option.key}
              onPress={() => setSort(option.key)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.results} keyboardShouldPersistTaps="handled">
        {error ? (
          <ErrorNotice message={error} onRetry={run} />
        ) : loading ? (
          <Spinner label="Finding available rooms…" />
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No stays free for those dates</Text>
            <Text style={styles.emptyBody}>
              Try moving your dates a day either way, or choose another destination.
            </Text>
            <Button title="Widen the dates" variant="secondary" compact onPress={() => shiftStay(1)} />
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              {meta?.total ?? results.length}{' '}
              {(meta?.total ?? 0) === 1 ? 'property' : 'properties'} available
            </Text>
            {results.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onPress={() =>
                  router.push({
                    pathname: '/hotel/[slug]',
                    params: {
                      slug: hotel.slug,
                      check_in: stay.check_in,
                      check_out: stay.check_out,
                      adults: String(stay.adults),
                      children: String(stay.children),
                    },
                  })
                }
              />
            ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  searchInput: { ...font.regular, fontSize: 15, color: colors.ink, flex: 1, minHeight: 40 },
  filters: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  focusHint: { ...font.regular, fontSize: 12, color: colors.brand },
  destinationHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  filterLabel: { ...font.medium, fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedCity: { ...font.semibold, fontSize: 13, color: colors.ink, textTransform: 'capitalize', flex: 1, textAlign: 'right' },
  cityRow: { gap: 6 },
  datesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  datesText: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { ...font.semibold, fontSize: 14, color: colors.brand },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.sunken,
    paddingRight: 2,
  },
  stepperLabel: { ...font.medium, fontSize: 12, color: colors.muted, paddingLeft: 10, paddingRight: 4 },
  stepperButton: { width: 28, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { ...font.semibold, fontSize: 14, color: colors.ink, minWidth: 20, textAlign: 'center' },
  sortRow: { gap: 6 },
  results: { padding: 16, paddingBottom: 40 },
  resultCount: { ...font.regular, fontSize: 13, color: colors.muted, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 30, gap: 10, paddingHorizontal: 20 },
  emptyTitle: { ...font.semibold, fontSize: 16, color: colors.ink },
  emptyBody: { ...font.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
