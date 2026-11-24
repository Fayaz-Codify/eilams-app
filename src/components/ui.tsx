import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, font, radius } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Render small, e.g. inside a list row. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** The one button in the app. Every tap target is 48pt tall or more. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  compact,
  style,
  testID,
}: Props) {
  const inert = disabled || loading;

  const background = {
    primary: colors.brand,
    secondary: colors.surface,
    ghost: 'transparent',
    danger: colors.danger,
  }[variant];

  const foreground = {
    primary: colors.surface,
    secondary: colors.brand,
    ghost: colors.brand,
    danger: colors.surface,
  }[variant];

  const border = {
    primary: colors.brand,
    secondary: colors.lineStrong,
    ghost: 'transparent',
    danger: colors.danger,
  }[variant];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inert, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: border,
          opacity: inert ? 0.55 : 1,
          transform: [{ scale: pressed && !inert ? 0.985 : 1 }],
        },
        compact && styles.compact,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text style={[styles.label, { color: foreground }, compact && styles.compactLabel]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!active }}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.brand : colors.surface, borderColor: active ? colors.brand : colors.lineStrong },
      ]}
    >
      <Text style={[styles.chipLabel, { color: active ? colors.surface : colors.body }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({
  label,
  tone = 'muted',
  style,
}: {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'muted';
  style?: StyleProp<ViewStyle>;
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    muted: { bg: colors.sunken, fg: colors.muted },
  };

  const tone_ = tones[tone];

  return (
    <View style={[styles.pill, { backgroundColor: tone_.bg }, style]}>
      <Text style={[styles.pillLabel, { color: tone_.fg }]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {action}
    </View>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action}
    </View>
  );
}

export function Stars({ count, size = 12 }: { count: number; size?: number }) {
  return (
    <Text style={{ color: colors.sun, fontSize: size, letterSpacing: 1 }} accessibilityLabel={`${count} stars`}>
      {'★'.repeat(Math.max(0, Math.min(5, count)))}
    </Text>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <View style={styles.spinner}>
      <ActivityIndicator size="large" color={colors.brand} />
      {label ? <Text style={styles.spinnerLabel}>{label}</Text> : null}
    </View>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorNotice}>
      <Text style={styles.errorNoticeTitle}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" compact onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  compact: { minHeight: 38, paddingHorizontal: 14, paddingVertical: 8 },
  label: { ...font.semibold, fontSize: 16, letterSpacing: 0.2 },
  compactLabel: { fontSize: 14 },
  field: { gap: 6 },
  fieldLabel: { ...font.medium, fontSize: 13, color: colors.muted },
  fieldHint: { ...font.regular, fontSize: 12, color: colors.faint },
  fieldError: { ...font.regular, fontSize: 12, color: colors.danger },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipLabel: { ...font.medium, fontSize: 13 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillLabel: { ...font.semibold, fontSize: 11, letterSpacing: 0.2 },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleText: { ...font.semibold, fontSize: 17, color: colors.ink },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { ...font.semibold, fontSize: 16, color: colors.ink },
  emptyBody: { ...font.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  divider: { height: 1, backgroundColor: colors.line },
  spinner: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  spinnerLabel: { ...font.regular, fontSize: 13, color: colors.muted },
  errorNotice: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F3D6D4',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
    gap: 12,
    marginHorizontal: 20,
  },
  errorNoticeTitle: { ...font.regular, fontSize: 14, color: colors.danger, lineHeight: 20 },
});
