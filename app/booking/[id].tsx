import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError, type Booking, type Checkout } from '../../src/lib/api';
import { BOOKING_STATUS, PAYMENT_STATUS, date, money, plural, providerLabel } from '../../src/lib/format';
import { Button, Divider, ErrorNotice, Pill, Spinner } from '../../src/components/ui';
import { colors, font, radius } from '../../src/theme';

/**
 * One reservation, end to end: what was booked, what is owed, and the two
 * things a guest actually does from here — pay, or cancel.
 */
export default function BookingDetail() {
  const insets = useSafeAreaInsets();
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.booking(id);
      setBooking(response.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load this booking.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const pay = async () => {
    if (!booking || busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await api.createPayment(booking.id);
      await settle(response.checkout);
      router.replace({
        pathname: '/payments/[reference]',
        params: { reference: response.data.reference },
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start the payment.');
      setBusy(false);
    }
  };

  const cancel = () => {
    if (!booking || busy) return;

    Alert.alert(
      'Cancel this booking?',
      `${booking.hotel.name}, ${date(booking.check_in)}. ${
        booking.payment_status === 'paid'
          ? 'A paid booking is marked for refund by the hotel.'
          : 'You have not paid yet, so there is nothing to refund.'
      }`,
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await api.cancelBooking(booking.id, 'Cancelled by the guest from the app.');
              await load();
            } catch (e) {
              setError(e instanceof ApiError ? e.message : 'Could not cancel this booking.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  if (loading && !booking) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 40 }]}>
        <Spinner label="Loading your booking…" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 40 }]}>
        <ErrorNotice message={error ?? 'We could not find that booking.'} />
      </View>
    );
  }

  const status = BOOKING_STATUS[booking.status] ?? { label: booking.status, tone: 'muted' as const };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {created ? (
          <View style={styles.confirmedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.confirmedText}>
              {booking.payment_status === 'unpaid' ? 'Booking received.' : 'Booking confirmed.'} Your reference is{' '}
              <Text style={styles.confirmedReference}>{booking.reference}</Text>.
            </Text>
          </View>
        ) : null}

        {booking.hotel.image ? (
          <Image source={{ uri: booking.hotel.image }} style={styles.hero} />
        ) : null}

        <View style={styles.card}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <Text style={styles.hotelName}>{booking.hotel.name}</Text>
              <Text style={styles.hotelCity}>{booking.hotel.city}</Text>
            </View>
            <Pill label={status.label} tone={status.tone} />
          </View>

          <View style={styles.metaRow}>
            <Meta icon="calendar-outline" label="Check-in" value={date(booking.check_in)} />
            <Meta icon="calendar-clear-outline" label="Check-out" value={date(booking.check_out)} />
          </View>

          <Text style={styles.reference}>Reference {booking.reference}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your stay</Text>

          {booking.rooms.map((unit) => (
            <View key={unit.id} style={styles.roomRow}>
              <View style={styles.roomText}>
                <Text style={styles.roomName}>{unit.name ?? 'Room'}</Text>
                <Text style={styles.roomMeta}>
                  {unit.nights} {unit.nights === 1 ? 'night' : 'nights'}
                  {unit.room_number ? ` · Room ${unit.room_number}` : ''}
                </Text>
              </View>
              <Text style={styles.roomPrice}>{money(unit.line_total)}</Text>
            </View>
          ))}

          <Text style={styles.guestLine}>
            {plural(booking.adults, 'adult')}
            {booking.children > 0 ? `, ${plural(booking.children, 'child', 'children')}` : ''} ·{' '}
            {booking.guest_name}
          </Text>

          {booking.special_requests ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Your request</Text>
              <Text style={styles.noteBody}>{booking.special_requests}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>

          <Line
            label="Method"
            value={providerLabel(booking.payment_method)}
          />
          <Line label="Paid" value={money(booking.amount_paid)} />
          <Line label="Total" value={money(booking.total)} strong />
          <Divider style={{ marginVertical: 10 }} />
          <Line label="Outstanding" value={money(booking.amount_due)} strong />

          <View style={styles.payStateRow}>
            <Pill
              label={PAYMENT_STATUS[booking.payment_status]?.label ?? booking.payment_status}
              tone={PAYMENT_STATUS[booking.payment_status]?.tone ?? 'muted'}
            />
          </View>

          {booking.can_pay ? (
            <Button title={`Pay ${money(booking.amount_due)} now`} onPress={pay} loading={busy} />
          ) : null}
        </View>

        {booking.hotel.cancellation_policy ? (
          <View style={styles.policyBox}>
            <Text style={styles.policyTitle}>Cancellation policy</Text>
            <Text style={styles.policyBody}>{booking.hotel.cancellation_policy}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {booking.can_cancel ? (
            <Button title="Cancel this booking" variant="danger" onPress={cancel} loading={busy} />
          ) : null}
          <Button
            title="Share booking details"
            variant="secondary"
            onPress={() =>
              Share.share({
                message: `${booking.reference} — ${booking.hotel.name}, ${booking.hotel.city}\n${date(
                  booking.check_in,
                )} to ${date(booking.check_out)} · ${money(booking.total)}`,
              })
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

async function settle(checkout: Checkout): Promise<void> {
  if (checkout.mode === 'sandbox') {
    await fetch(checkout.page ?? checkout.action, { method: 'POST' });
    return;
  }

  const WebBrowser = await import('expo-web-browser');
  await WebBrowser.openBrowserAsync(checkout.page ?? checkout.action);
}

function Meta({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={16} color={colors.brand} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, strong && styles.lineLabelStrong]}>{label}</Text>
      <Text style={[styles.lineValue, strong && styles.lineValueStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  confirmedBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  confirmedText: { ...font.regular, fontSize: 13, color: colors.success, lineHeight: 19, flex: 1 },
  confirmedReference: { ...font.bold },
  hero: { width: '100%', height: 180, borderRadius: radius.lg, backgroundColor: colors.subtle },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleText: { flex: 1, gap: 2 },
  hotelName: { ...font.semibold, fontSize: 19, color: colors.ink, letterSpacing: -0.3 },
  hotelCity: { ...font.regular, fontSize: 13, color: colors.muted, textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', gap: 16 },
  meta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaLabel: { ...font.regular, fontSize: 12, color: colors.muted },
  metaValue: { ...font.semibold, fontSize: 12, color: colors.ink },
  reference: { ...font.regular, fontSize: 12, color: colors.faint },
  sectionTitle: { ...font.semibold, fontSize: 15, color: colors.ink },
  roomRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  roomText: { flex: 1, gap: 2 },
  roomName: { ...font.medium, fontSize: 14, color: colors.ink },
  roomMeta: { ...font.regular, fontSize: 12, color: colors.muted },
  roomPrice: { ...font.semibold, fontSize: 14, color: colors.body },
  guestLine: { ...font.regular, fontSize: 12, color: colors.muted },
  noteBox: {
    backgroundColor: colors.sunken,
    borderRadius: radius.md,
    padding: 10,
    gap: 3,
  },
  noteLabel: { ...font.semibold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  noteBody: { ...font.regular, fontSize: 13, color: colors.body },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  lineLabel: { ...font.regular, fontSize: 14, color: colors.muted },
  lineLabelStrong: { ...font.semibold, color: colors.ink },
  lineValue: { ...font.regular, fontSize: 14, color: colors.body },
  lineValueStrong: { ...font.semibold, fontSize: 15, color: colors.brand },
  payStateRow: { marginTop: 4 },
  policyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
    padding: 12,
  },
  policyTitle: { ...font.semibold, fontSize: 12, color: colors.ink, marginBottom: 3 },
  policyBody: { ...font.regular, fontSize: 12, color: colors.body, lineHeight: 18 },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F3D6D4',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  errorText: { ...font.regular, fontSize: 13, color: colors.danger, lineHeight: 19 },
  actions: { gap: 8, marginTop: 4 },
});
