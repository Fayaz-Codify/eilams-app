import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth';
import { initials } from '../../src/lib/format';
import { Button } from '../../src/components/ui';
import { colors, font, radius } from '../../src/theme';

const SUPPORT_EMAIL = 'support@eilams.com';
const WHATSAPP = 'https://wa.me/923001234567';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
          <View style={styles.who}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Help</Text>

        <Row
          icon="chatbubble-ellipses-outline"
          title="Chat on WhatsApp"
          body="Fastest way to reach us about a booking"
          onPress={() => WebBrowser.openBrowserAsync(WHATSAPP)}
        />
        <Row
          icon="mail-outline"
          title="Email support"
          body={SUPPORT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />

        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.card}>
          <Text style={styles.about}>
            Eilams is an online booking platform for hotels, guesthouses, resorts and apartments in
            Swat, Khyber Pakhtunkhwa and across Pakistan.
          </Text>
          <Text style={styles.version}>Eilams app 1.0.0</Text>
        </View>

        <Button title="Sign out" variant="secondary" onPress={signOut} />
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  title,
  body,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, styles.row, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={colors.brand} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBody}>{body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { ...font.bold, fontSize: 24, color: colors.ink, letterSpacing: -0.4, marginBottom: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressed: { opacity: 0.9 },
  rowText: { flex: 1 },
  rowTitle: { ...font.semibold, fontSize: 14, color: colors.ink },
  rowBody: { ...font.regular, fontSize: 12, color: colors.muted },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...font.bold, fontSize: 18, color: '#FFFFFF' },
  who: { flex: 1 },
  name: { ...font.semibold, fontSize: 16, color: colors.ink },
  email: { ...font.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  phone: { ...font.regular, fontSize: 13, color: colors.muted },
  sectionTitle: { ...font.semibold, fontSize: 15, color: colors.ink, marginTop: 8, marginBottom: 8 },
  about: { ...font.regular, fontSize: 13, color: colors.body, lineHeight: 20 },
  version: { ...font.regular, fontSize: 11, color: colors.faint, marginTop: 8 },
});
