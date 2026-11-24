import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth';
import { ApiError } from '../../src/lib/api';
import { Button, Field } from '../../src/components/ui';
import { colors, font, radius } from '../../src/theme';

export default function SignUp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (busy) return;

    setError(null);
    setFieldErrors({});

    if (form.password !== form.confirm) {
      setFieldErrors({ password: 'Those passwords do not match.' });
      return;
    }

    setBusy(true);

    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.confirm,
        phone: form.phone.trim() || undefined,
      });
      router.replace('/');
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.status === 422) {
          const out: Record<string, string> = {};
          for (const [key, messages] of Object.entries(e.errors)) {
            if (messages[0]) out[key === 'password_confirmation' ? 'confirm' : key] = messages[0];
          }
          setFieldErrors(out);
        }
      } else {
        setError('Could not create your account. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Book in two taps and keep every reservation in one place.
        </Text>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Field label="Full name" error={fieldErrors.name}>
            <TextInput
              value={form.name}
              onChangeText={set('name')}
              autoCapitalize="words"
              textContentType="name"
              placeholder="Ayesha Khan"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </Field>

          <Field label="Email" error={fieldErrors.email}>
            <TextInput
              value={form.email}
              onChangeText={set('email')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </Field>

          <Field
            label="Mobile number"
            hint="Pakistani mobile, used for booking confirmations."
            error={fieldErrors.phone}
          >
            <TextInput
              value={form.phone}
              onChangeText={set('phone')}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              placeholder="0300-1234567"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </Field>

          <Field label="Password" hint="At least 8 characters with a letter and a number." error={fieldErrors.password}>
            <TextInput
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry
              textContentType="newPassword"
              placeholder="At least 8 characters"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </Field>

          <Field label="Confirm password" error={fieldErrors.confirm}>
            <TextInput
              value={form.confirm}
              onChangeText={set('confirm')}
              secureTextEntry
              textContentType="newPassword"
              placeholder="Repeat your password"
              placeholderTextColor={colors.faint}
              style={styles.input}
              onSubmitEditing={submit}
              returnKeyType="go"
            />
          </Field>

          <Button title="Create account" onPress={submit} loading={busy} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/sign-in" asChild>
              <Pressable accessibilityRole="link">
                <Text style={styles.footerLink}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  scroll: { paddingBottom: 32, paddingHorizontal: 20 },
  title: { ...font.bold, fontSize: 26, color: colors.brand, letterSpacing: -0.4 },
  subtitle: { ...font.regular, fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 14,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F3D6D4',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  errorText: { ...font.regular, fontSize: 14, color: colors.danger, lineHeight: 20 },
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
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 4 },
  footerText: { ...font.regular, fontSize: 14, color: colors.muted },
  footerLink: { ...font.semibold, fontSize: 14, color: colors.brand },
});
