import React, { useState } from 'react';
import {
  Image,
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
import { api, ApiError } from '../../src/lib/api';
import { Button, Field } from '../../src/components/ui';
import { colors, font, radius } from '../../src/theme';

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;

    setError(null);
    setNotice(null);
    setFieldErrors({});
    setBusy(true);

    try {
      if (forgot) {
        const response = await api.forgotPassword(email.trim());
        setNotice(response.message);
        return;
      }

      await signIn(email.trim(), password);
      router.replace('/');
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.status === 422) setFieldErrors(mapErrors(e));
      } else {
        setError(forgot ? 'Could not send the link. Please try again.' : 'Could not sign in. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 48 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.wordmark}>Eilams</Text>
          <Text style={styles.tagline}>Hotels, guesthouses and resorts across Pakistan</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{forgot ? 'Reset your password' : 'Welcome back'}</Text>

          {forgot ? (
            <Text style={styles.titleHint}>
              Type the email you signed up with and we will send a link to choose a new password.
            </Text>
          ) : null}

          {notice ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Field label="Email" error={fieldErrors.email}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              placeholderTextColor={colors.faint}
              style={styles.input}
              testID="email"
            />
          </Field>

          {forgot ? null : (
            <Field label="Password" error={fieldErrors.password}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                placeholder="Your password"
                placeholderTextColor={colors.faint}
                style={styles.input}
                testID="password"
                onSubmitEditing={submit}
                returnKeyType="go"
              />
            </Field>
          )}

          <Button
            title={forgot ? 'Email me a reset link' : 'Sign in'}
            onPress={submit}
            loading={busy}
            testID="submit"
          />

          <View style={styles.footer}>
            {forgot ? (
              <Pressable
                onPress={() => {
                  setForgot(false);
                  setNotice(null);
                  setError(null);
                }}
                accessibilityRole="link"
              >
                <Text style={styles.footerLink}>Back to signing in</Text>
              </Pressable>
            ) : (
              <>
                <Link href="/sign-up" asChild>
                  <Pressable accessibilityRole="link">
                    <Text style={styles.footerLink}>Create an account</Text>
                  </Pressable>
                </Link>
                <Text style={styles.footerDot}>·</Text>
                <Pressable onPress={() => setForgot(true)} accessibilityRole="link">
                  <Text style={styles.footerLink}>Forgot password?</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function mapErrors(error: ApiError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(error.errors)) {
    if (messages[0]) out[key] = messages[0];
  }
  return out;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  scroll: { paddingBottom: 32, paddingHorizontal: 20 },
  brand: { alignItems: 'center', gap: 6, marginBottom: 28 },
  logo: { width: 64, height: 64, borderRadius: 16, marginBottom: 6 },
  wordmark: { ...font.bold, fontSize: 28, color: colors.brand, letterSpacing: -0.5 },
  tagline: { ...font.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 14,
  },
  title: { ...font.semibold, fontSize: 20, color: colors.ink },
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
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 4 },
  footerText: { ...font.regular, fontSize: 14, color: colors.muted },
  footerDot: { ...font.regular, fontSize: 14, color: colors.faint },
  footerLink: { ...font.semibold, fontSize: 14, color: colors.brand },
  titleHint: { ...font.regular, fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: -6 },
  noticeBox: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  noticeText: { ...font.regular, fontSize: 14, color: colors.success, lineHeight: 20 },
});
