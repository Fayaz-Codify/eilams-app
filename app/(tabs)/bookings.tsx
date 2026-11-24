import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError, type Booking } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { BOOKING_STATUS, PAYMENT_STATUS, date, money, plural } from '../../src/lib/format';
import { Button, EmptyState, ErrorNotice, Pill, Spinner } from '../../src/components/ui';
import { colors, font, radius } from '../../src/theme';

type Scope = 'upcoming' | 'past';

export default function Trips() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [scope, setScope] = useState<Scope>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const response = await api.bookings(scope);
        setBookings(response.data);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load your bookings.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [scope],
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My trips</Text>
        <Text style={styles.subtitle}>Everything you have booked, in one place</Text>

        <View style={styles.scopeRow}>
          {(['upcoming', 'past'] as Scope[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setScope(option)}
              accessibilityRole="tab"
              accessibilityState={{ selected: scope === option }}
              style={[styles.scopeButton, scope === option && styles.scopeButtonActive]}
            >
              <Text style={[styles.scopeText, scope === option && styles.scopeTextActive]}>
                {option === 'upcoming' ? 'Upcoming' : 'Past'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNotice message={error} onRetry={() => load()} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={scope === 'upcoming' ? 'No upcoming stays' : 'No past stays'}
          body={
            scope === 'upcoming'
              ? 'Find a room and it will show up here with its reference and payment status.'
              : 'Your older bookings will appear here once you have checked out.'
          }
          action={<Button title="Find a stay" compact onPress={() => router.replace('/')} />}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brand} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/booking/[id]', params: { id: String(item.id) } })}
              accessibilityRole="button"
              accessibilityLabel={`Booking ${item.reference} at ${item.hotel.name}`}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              {item.hotel.image ? (
                <Image source={{ uri: item.hotel.image }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="bed-outline" size={20} color={colors.lineStrong} />
                </View>
              )}

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.hotelName} numberOfLines={1}>
                    {item.hotel.name}
                  </Text>
                  <Pill
                    label={BOOKING_STATUS[item.status]?.label ?? item.status}
                    tone={BOOKING_STATUS[item.status]?.tone ?? 'muted'}
                  />
                </View>

                <Text style={styles.dates}>
                  {date(item.check_in)} → {date(item.check_out)} · {plural(item.nights, 'night')}
                </Text>

                <View style={styles.cardBottom}>
                  <Text style={styles.amount}>
                    {item.amount_due > 0 ? `${money(item.amount_due)} due` : money(item.total)}
                  </Text>
                  <Text style={[styles.payState, { color: payColor(item.payment_status) }]}>
                    {PAYMENT_STATUS[item.payment_status]?.label ?? item.payment_status}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {!user ? null : <View style={{ height: 24 }} />}
    </View>
  );
}

function payColor(status: string): string {
  if (status === 'paid') return colors.success;
  if (status === 'refunded') return colors.muted;
  return colors.warning;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { ...font.bold, fontSize: 24, color: colors.ink, letterSpacing: -0.4 },
  subtitle: { ...font.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  scopeRow: { flexDirection: 'row', gap: 6, marginTop: 12, backgroundColor: colors.sunken, padding: 4, borderRadius: radius.md },
  scopeButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm },
  scopeButtonActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  scopeText: { ...font.medium, fontSize: 13, color: colors.muted },
  scopeTextActive: { color: colors.brand },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  pressed: { opacity: 0.97 },
  thumb: { width: 62, height: 62, borderRadius: radius.md, backgroundColor: colors.subtle },
  thumbPlaceholder: { width: 62, height: 62, borderRadius: radius.md, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hotelName: { ...font.semibold, fontSize: 15, color: colors.ink, flex: 1 },
  dates: { ...font.regular, fontSize: 12, color: colors.muted },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { ...font.semibold, fontSize: 14, color: colors.brand },
  payState: { ...font.medium, fontSize: 11 },
});
