import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, type Booking, type Intent } from '../../src/lib/api';
import { money } from '../../src/lib/format';
import { Button, Spinner } from '../../src/components/ui';
import { colors, font } from '../../src/theme';

type Phase = 'checking' | 'paid' | 'failed' | 'unknown';

/**
 * What the guest sees after the wallet page: "did it work?"
 *
 * The in-app browser gives no reliable result when it closes, and a gateway
 * that redirects to a deep link can be slower than the app. So this screen
 * polls the intent — the server is the only party that knows — for about a
 * minute, then shows whatever it knows and offers a way out.
 */
const MAX_ATTEMPTS = 20;
const INTERVAL_MS = 3000;

export default function PaymentResult() {
  const insets = useSafeAreaInsets();
  const { reference } = useLocalSearchParams<{ reference: string; state?: string }>();

  const [intent, setIntent] = useState<Intent | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [phase, setPhase] = useState<Phase>('checking');
  const attempts = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkRef = useRef<() => Promise<void>>(async () => undefined);

  const check = useCallback(async () => {
    attempts.current += 1;

    let next: Intent | null = null;

    try {
      const response = await api.intent(reference);
      next = response.data;
      setIntent(response.data);
      if (response.booking?.data) setBooking(response.booking.data);
    } catch {
      // Offline, or a 404 for someone else's reference. Treat as "not yet".
    }

    if (next?.status === 'paid') {
      setPhase('paid');
      return;
    }
    if (next?.status === 'failed') {
      setPhase('failed');
      return;
    }

    if (attempts.current >= MAX_ATTEMPTS) {
      setPhase('unknown');
      return;
    }

    timer.current = setTimeout(() => {
      void checkRef.current();
    }, INTERVAL_MS);
  }, [reference]);

  useEffect(() => {
    checkRef.current = check;
    void check();

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [check]);

  const bookingId = booking?.id;

  const openBooking = () => {
    if (bookingId) {
      router.replace({ pathname: '/booking/[id]', params: { id: String(bookingId) } });
    } else {
      router.replace('/bookings');
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {phase === 'checking' ? (
          <View style={styles.center}>
            <Spinner label="Waiting for the wallet to confirm…" />
            <Text style={styles.hint}>
              Keep this open. We are checking every few seconds — this usually takes under a minute.
            </Text>
          </View>
        ) : null}

        {phase === 'paid' ? (
          <View style={styles.center}>
            <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="checkmark" size={40} color={colors.success} />
            </View>
            <Text style={styles.title}>Payment received</Text>
            <Text style={styles.body}>
              {money(intent?.amount ?? 0)} is confirmed. Your room is booked, the hotel has been
              told, and your receipt is in your email.
            </Text>
            <Button title="View my booking" onPress={openBooking} />
            <Button title="Back to Explore" variant="ghost" onPress={() => router.replace('/')} />
          </View>
        ) : null}

        {phase === 'failed' || phase === 'unknown' ? (
          <View style={styles.center}>
            <View
              style={[
                styles.badge,
                { backgroundColor: phase === 'failed' ? colors.dangerSoft : colors.warningSoft },
              ]}
            >
              <Ionicons
                name={phase === 'failed' ? 'close' : 'time'}
                size={36}
                color={phase === 'failed' ? colors.danger : colors.warning}
              />
            </View>
            <Text style={styles.title}>
              {phase === 'failed' ? 'Payment not completed' : 'Still waiting'}
            </Text>
            <Text style={styles.body}>
              {phase === 'failed'
                ? 'Your wallet did not approve this payment. The room is still held, so you can try again.'
                : 'We have not heard back yet. Check your trips before paying again, so you are not charged twice.'}
            </Text>
            <Button title="Open my trips" onPress={openBooking} />
            <Button title="Back to Explore" variant="ghost" onPress={() => router.replace('/')} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  scroll: { padding: 24, paddingBottom: 40 },
  center: { alignItems: 'center', paddingTop: 40, gap: 12 },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { ...font.bold, fontSize: 22, color: colors.ink, textAlign: 'center' },
  body: { ...font.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  hint: { ...font.regular, fontSize: 12, color: colors.faint, textAlign: 'center', lineHeight: 18 },
});
