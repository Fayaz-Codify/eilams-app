import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import {
  api,
  ApiError,
  type Checkout,
  type HotelDetail,
  type PaymentMethod,
  type Room,
} from '../src/lib/api';
import { useAuth } from '../src/lib/auth';
import { date, money, nightsBetween, providerLabel } from '../src/lib/format';
import { Button, Chip, Divider, ErrorNotice, Field, Spinner } from '../src/components/ui';
import { colors, font, radius } from '../src/theme';

type PayWith = 'at_hotel' | 'wallet';

/**
 * The last screen before a reservation exists. It shows the real total for the
 * room and dates the guest picked, collects the guest details the hotel needs,
 * and offers the two ways to pay: at the hotel, or in the app now.
 *
 * For a wallet payment the server answers with a checkout (a signed form POST
 * or, in test mode, our own approve URL). We open it in the in-app browser and
 * then poll the intent — the browser has no reliable "I came back" callback
 * with a result, so polling is the honest way to know the money landed.
 */
export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    hotel: string;
    room: string;
    check_in: string;
    check_out: string;
    adults?: string;
    children?: string;
  }>();

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [payWith, setPayWith] = useState<PayWith>('wallet');
  const [provider, setProvider] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', requests: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const nights = nightsBetween(params.check_in, params.check_out);
  const adults = Number(params.adults ?? 2);
  const children = Number(params.children ?? 0);

  useEffect(() => {
    if (!user) return;

    setForm((current) => ({
      name: current.name || user.name,
      email: current.email || user.email,
      phone: current.phone || (user.phone ?? ''),
      requests: current.requests,
    }));
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [detail, boot] = await Promise.all([
          api.hotel(params.hotel, {
            check_in: params.check_in,
            check_out: params.check_out,
            adults,
            children,
          }),
          api.bootstrap(),
        ]);

        if (cancelled) return;

        setHotel(detail.data);
        setRoom(detail.data.rooms.find((r) => String(r.id) === params.room) ?? null);
        setMethods(boot.payment_methods);
        setProvider(boot.payment_methods[0]?.key ?? 'sandbox');
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load this booking.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.hotel, params.room]);

  const total = room?.total ?? hotel?.price.total ?? 0;

  const submit = async () => {
    if (busy || !room) return;

    setError(null);
    setFieldErrors({});
    setBusy(true);

    try {
      const response = await api.storeBooking({
        room_type_id: room.id,
        qty: 1,
        check_in: params.check_in,
        check_out: params.check_out,
        adults,
        children,
        guest_name: form.name.trim(),
        guest_email: form.email.trim(),
        guest_phone: form.phone.trim(),
        special_requests: form.requests.trim() || null,
        payment_method: payWith,
        ...(payWith === 'wallet' && provider ? { provider } : {}),
      });

      if (payWith === 'wallet' && response.payment) {
        await openCheckout(response.payment.checkout);
        router.replace({
          pathname: '/payments/[reference]',
          params: { reference: response.payment.intent.reference },
        });
        return;
      }

      router.replace({
        pathname: '/booking/[id]',
        params: { id: String(response.data.id), created: '1' },
      });
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        const out: Record<string, string> = {};
        for (const [key, messages] of Object.entries(e.errors)) {
          if (messages[0]) out[key] = messages[0];
        }
        setFieldErrors(out);
      } else {
        setError('Could not complete the booking. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 40 }]}>
        <Spinner label="Preparing your booking…" />
      </View>
    );
  }

  if (error && !room) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 40 }]}>
        <ErrorNotice message={error} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Link href="/" asChild>
          <Ionicons name="close" size={26} color={colors.ink} />
        </Link>
        <Text style={styles.headerTitle}>Confirm your stay</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {hotel ? (
            <>
              <Text style={styles.hotelName}>{hotel.name}</Text>
              <Text style={styles.hotelCity}>{hotel.city}</Text>
            </>
          ) : null}

          {room ? (
            <Text style={styles.roomName}>{room.name}</Text>
          ) : null}

          <View style={styles.stayRow}>
            <Text style={styles.stayText}>
              {date(params.check_in)} → {date(params.check_out)}
            </Text>
            <Text style={styles.stayMeta}>
              {nights} {nights === 1 ? 'night' : 'nights'} · {adults} adult{adults === 1 ? '' : 's'}
              {children > 0 ? `, ${children} child${children === 1 ? '' : 'ren'}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Guest details</Text>

          <Field label="Full name" error={fieldErrors.guest_name}>
            <TextInput
              value={form.name}
              onChangeText={(value) => setForm((c) => ({ ...c, name: value }))}
              textContentType="name"
              placeholder="Name on the booking"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </Field>

          <Field label="Email" hint="The confirmation and receipt go here." error={fieldErrors.guest_email}>
            <TextInput
              value={form.email}
              onChangeText={(value) => setForm((c) => ({ ...c, email: value }))}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </Field>

          <Field label="Mobile number" hint="Pakistani mobile, e.g. 0300-1234567." error={fieldErrors.guest_phone}>
            <TextInput
              value={form.phone}
              onChangeText={(value) => setForm((c) => ({ ...c, phone: value }))}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              placeholder="0300-1234567"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </Field>

          <Field label="Special requests" hint="Optional. Late arrival, a quiet room, extra bed." error={fieldErrors.special_requests}>
            <TextInput
              value={form.requests}
              onChangeText={(value) => setForm((c) => ({ ...c, requests: value }))}
              multiline
              numberOfLines={3}
              placeholder="Anything the hotel should know?"
              placeholderTextColor={colors.faint}
              style={[styles.input, styles.textarea]}
            />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>

          <View style={styles.optionRow}>
            <Chip
              label="Pay in the app now"
              active={payWith === 'wallet'}
              onPress={() => setPayWith('wallet')}
            />
            <Chip
              label="Pay at the hotel"
              active={payWith === 'at_hotel'}
              onPress={() => setPayWith('at_hotel')}
            />
          </View>

          {payWith === 'wallet' ? (
            <View style={styles.providerRow}>
              {methods.map((method) => (
                <Chip
                  key={method.key}
                  label={method.label}
                  active={provider === method.key}
                  onPress={() => setProvider(method.key)}
                />
              ))}
            </View>
          ) : null}

          <Text style={styles.hint}>
            {payWith === 'wallet'
              ? `You will be sent to ${providerLabel(provider ?? '')} to approve ${money(
                  total,
                )}. Your room is held while you pay.`
              : 'Your room is held immediately. Pay the hotel when you arrive.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price summary</Text>

          <Row label={`${room?.name ?? 'Room'} × ${nights} night${nights === 1 ? '' : 's'}`} value={money(room?.subtotal ?? 0)} />
          {room && room.tax > 0 ? <Row label="Taxes" value={money(room.tax)} /> : null}
          <Divider style={{ marginVertical: 10 }} />
          <Row label="Total" value={money(total)} strong />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          title={payWith === 'wallet' ? `Pay ${money(total)}` : 'Reserve now'}
          onPress={submit}
          loading={busy}
          disabled={!room}
        />

        <Text style={styles.footnote}>
          By continuing you agree to the hotel's cancellation policy. Prices are in Pakistani rupees and include taxes.
        </Text>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, strong && styles.priceLabelStrong]}>{label}</Text>
      <Text style={[styles.priceValue, strong && styles.priceValueStrong]}>{value}</Text>
    </View>
  );
}

/**
 * Sends the guest to the wallet and returns when the browser closes.
 *
 * The server hosts the self-submitting gateway form (a native app cannot build
 * one), so there is nothing to do here but open it — for the test wallet that
 * is a single POST and no browser at all.
 */
async function openCheckout(checkout: Checkout): Promise<void> {
  if (checkout.mode === 'sandbox') {
    await fetch(checkout.page ?? checkout.action, { method: 'POST' });
    return;
  }

  await WebBrowser.openBrowserAsync(checkout.page ?? checkout.action);
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: { ...font.semibold, fontSize: 16, color: colors.ink },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
  hotelName: { ...font.semibold, fontSize: 16, color: colors.ink },
  hotelCity: { ...font.regular, fontSize: 13, color: colors.muted, textTransform: 'capitalize' },
  roomName: { ...font.medium, fontSize: 14, color: colors.body },
  stayRow: { gap: 2 },
  stayText: { ...font.medium, fontSize: 13, color: colors.ink },
  stayMeta: { ...font.regular, fontSize: 12, color: colors.muted },
  sectionTitle: { ...font.semibold, fontSize: 15, color: colors.ink },
  input: {
    ...font.regular,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.sunken,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  textarea: { minHeight: 84, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  providerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hint: { ...font.regular, fontSize: 12, color: colors.muted, lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 2 },
  priceLabel: { ...font.regular, fontSize: 14, color: colors.muted },
  priceLabelStrong: { ...font.semibold, color: colors.ink },
  priceValue: { ...font.regular, fontSize: 14, color: colors.body },
  priceValueStrong: { ...font.bold, fontSize: 17, color: colors.brand },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F3D6D4',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  errorText: { ...font.regular, fontSize: 14, color: colors.danger, lineHeight: 20 },
  footnote: { ...font.regular, fontSize: 11, color: colors.faint, lineHeight: 16, textAlign: 'center' },
});
