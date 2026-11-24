import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, ApiError, type Bootstrap, type HotelCardData, type Stay } from '../../src/lib/api';
import { addDays, today } from '../../src/lib/format';
import { SearchCard } from '../../src/components/SearchCard';
import { HotelCard } from '../../src/components/HotelCard';
import { ErrorNotice, Spinner } from '../../src/components/ui';
import { colors, font, radius, shadows } from '../../src/theme';

/** Explore is public: guests can discover destinations and compare stays before signing in. */
export default function Explore() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [featured, setFeatured] = useState<HotelCardData[]>([]);
  const [stay] = useState<Stay>(() => ({
    check_in: addDays(today(), 1),
    check_out: addDays(today(), 2),
    nights: 1,
    adults: 2,
    children: 0,
  }));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const dates = {
      check_in: addDays(today(), 1),
      check_out: addDays(today(), 2),
    };
    const [bootstrapResult, searchResult] = await Promise.allSettled([
      api.bootstrap(),
      api.search({ ...dates, adults: 2, sort: 'recommended', per_page: 8 }),
    ]);

    if (bootstrapResult.status === 'fulfilled') setBootstrap(bootstrapResult.value);
    else setError(bootstrapResult.reason instanceof ApiError ? bootstrapResult.reason.message : 'Could not load destinations.');

    if (searchResult.status === 'fulfilled') setFeatured(searchResult.value.data);
    else setError(searchResult.reason instanceof ApiError ? searchResult.reason.message : 'Could not load featured stays.');

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const search = useCallback(() => {
    router.push({
      pathname: '/search',
      params: {
        check_in: stay.check_in,
        check_out: stay.check_out,
        adults: String(stay.adults),
        children: String(stay.children),
      },
    });
  }, [router, stay]);

  const cities = useMemo(() => bootstrap?.cities.slice(0, 8) ?? [], [bootstrap]);

  const shortcuts = [
    { label: 'Tonight', caption: '1 night', icon: 'moon-outline' as const, offset: 0 },
    { label: 'Weekend', caption: 'A little longer', icon: 'sunny-outline' as const, offset: 2 },
    { label: 'Next week', caption: 'Plan ahead', icon: 'calendar-outline' as const, offset: 7 },
  ];

  const openSearch = (offset: number) => {
    router.push({
      pathname: '/search',
      params: {
        check_in: addDays(today(), offset),
        check_out: addDays(today(), offset + 1),
        adults: '2',
        children: '0',
      },
    });
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ocean} />
        }
      >
        <View style={[styles.hero, { paddingTop: insets.top + 13 }]}>
          <LinearGradient
            colors={[colors.brandDeep, '#0A4770', colors.ocean]}
            locations={[0, 0.58, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.orbOne} />
          <View pointerEvents="none" style={styles.orbTwo} />

          <View style={styles.topBar}>
            <View style={styles.brandLockup}>
              <View style={styles.logoMark}>
                <Ionicons name="bed" size={19} color={colors.brandDeep} />
              </View>
              <View>
                <Text style={styles.brandName}>eilams</Text>
                <Text style={styles.brandCaption}>STAYS & GETAWAYS</Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              hitSlop={8}
              style={({ pressed }) => [styles.profileButton, pressed && styles.profilePressed]}
            >
              <Ionicons name="person-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.heroCopy}>
            <View style={styles.heroEyebrow}>
              <View style={styles.heroEyebrowDot} />
              <Text style={styles.heroEyebrowText}>YOUR NEXT ESCAPE STARTS HERE</Text>
            </View>
            <Text style={styles.heroTitle}>A stay worth{ '\n' }looking forward to.</Text>
            <Text style={styles.heroSubtitle}>Find your kind of calm, across Pakistan.</Text>
          </View>

          <View style={styles.heroFoot}>
            <Ionicons name="shield-checkmark-outline" size={15} color="#B8E9E2" />
            <Text style={styles.heroFootText}>Discover freely · Book with confidence</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <SearchCard stay={stay} onSubmit={search} />
        </View>

        <View style={styles.content}>
          <Text style={styles.quickLabel}>A GOOD TIME TO GO</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            {shortcuts.map((shortcut) => (
              <Pressable
                key={shortcut.label}
                onPress={() => openSearch(shortcut.offset)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name={shortcut.icon} size={17} color={colors.brand} />
                </View>
                <View style={styles.quickCopy}>
                  <Text style={styles.quickTitle}>{shortcut.label}</Text>
                  <Text style={styles.quickCaption}>{shortcut.caption}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={colors.faint} />
              </Pressable>
            ))}
          </ScrollView>

          {error ? <ErrorNotice message={error} onRetry={() => void load(true)} /> : null}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionKicker}>MAKE IT A MEMORY</Text>
              <Text style={styles.sectionTitle}>Places to get away</Text>
              <Text style={styles.sectionSub}>Some favourite corners of Pakistan</Text>
            </View>
            <Pressable
              onPress={() => router.push('/search')}
              accessibilityRole="link"
              hitSlop={8}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAll}>See all</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.brand} />
            </Pressable>
          </View>

          {loading && cities.length === 0 ? (
            <Spinner label="Finding beautiful places…" />
          ) : cities.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityRail}
            >
              {cities.map((item, index) => (
                <Pressable
                  key={item.slug}
                  onPress={() =>
                    router.push({
                      pathname: '/search',
                      params: {
                        city: item.slug,
                        check_in: stay.check_in,
                        check_out: stay.check_out,
                        adults: String(stay.adults),
                        children: String(stay.children),
                      },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Find stays in ${item.city}`}
                  style={({ pressed }) => [styles.cityCard, pressed && styles.cityPressed]}
                >
                  {item.cover ? (
                    <Image source={{ uri: item.cover }} style={styles.cityImage} resizeMode="cover" />
                  ) : (
                    <LinearGradient
                      colors={index % 2 === 0 ? ['#1B6075', '#102B53'] : ['#607C73', '#17384D']}
                      style={styles.cityImage}
                    />
                  )}
                  <LinearGradient
                    colors={['rgba(5,19,38,0.02)', 'rgba(5,19,38,0.78)']}
                    locations={[0.12, 1]}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                  <View style={styles.cityTop}>
                    <View style={styles.cityPin}>
                      <Ionicons name="location" size={12} color={colors.brandDeep} />
                    </View>
                    <Ionicons name="arrow-up-outline" size={14} color="#FFFFFF" style={styles.cityArrow} />
                  </View>
                  <View style={styles.cityText}>
                    <Text style={styles.cityName} numberOfLines={1}>{item.city}</Text>
                    <Text style={styles.cityCount}>
                      {item.hotels} {item.hotels === 1 ? 'stay' : 'stays'} to explore
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyInline}>
              <Ionicons name="map-outline" size={19} color={colors.muted} />
              <Text style={styles.emptyInlineText}>Choose any destination to start exploring.</Text>
            </View>
          )}

          <View style={[styles.sectionHeader, styles.featuredHeader]}>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionKicker}>HANDPICKED FOR YOU</Text>
              <Text style={styles.sectionTitle}>Featured stays</Text>
              <Text style={styles.sectionSub}>Thoughtful places for your next pause</Text>
            </View>
            <Pressable
              onPress={() => router.push('/search')}
              accessibilityRole="link"
              hitSlop={8}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAll}>Browse</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.brand} />
            </Pressable>
          </View>

          {loading && featured.length === 0 ? (
            <Spinner label="Finding available stays…" />
          ) : featured.length === 0 ? (
            <View style={styles.emptyFeatured}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bed-outline" size={22} color={colors.brand} />
              </View>
              <Text style={styles.emptyFeaturedTitle}>Something lovely is out there</Text>
              <Text style={styles.emptyFeaturedText}>Try a different date or browse all stays.</Text>
              <Pressable onPress={search} accessibilityRole="button" style={styles.emptyAction}>
                <Text style={styles.emptyActionText}>Explore stays</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.brand} />
              </Pressable>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredRail}
            >
              {featured.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  compact
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
            </ScrollView>
          )}

          <View style={styles.trustCard}>
            <View style={styles.trustIcon}>
              <Ionicons name="lock-closed-outline" size={17} color={colors.ocean} />
            </View>
            <View style={styles.trustCopy}>
              <Text style={styles.trustTitle}>Browse now. Sign in when you book.</Text>
              <Text style={styles.trustText}>Explore stays as a guest; your account is only needed at checkout.</Text>
            </View>
          </View>

          <Text style={styles.footnote}>Availability and final pricing are confirmed before booking.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.subtle },
  scroll: { paddingBottom: 40 },
  hero: {
    minHeight: 334,
    paddingHorizontal: 21,
    paddingBottom: 98,
    overflow: 'hidden',
    position: 'relative',
  },
  orbOne: {
    position: 'absolute', right: -61, top: 30, width: 230, height: 230,
    borderRadius: 115, borderWidth: 1, borderColor: 'rgba(197,236,241,0.17)',
    backgroundColor: 'rgba(75,183,188,0.07)',
  },
  orbTwo: {
    position: 'absolute', right: 16, top: 95, width: 115, height: 115,
    borderRadius: 58, borderWidth: 1, borderColor: 'rgba(197,236,241,0.12)',
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 39, height: 39, borderRadius: 14, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', ...shadows.card,
  },
  brandName: { ...font.bold, color: '#FFFFFF', fontSize: 19, letterSpacing: 0.2 },
  brandCaption: { ...font.semibold, color: 'rgba(226,243,247,0.72)', fontSize: 8, letterSpacing: 1.15, marginTop: 1 },
  profileButton: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.12)',
  },
  profilePressed: { backgroundColor: 'rgba(255,255,255,0.24)' },
  heroCopy: { marginTop: 32, maxWidth: 330 },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 },
  heroEyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  heroEyebrowText: { ...font.semibold, color: '#D4E9EC', fontSize: 9, letterSpacing: 1.25 },
  heroTitle: { ...font.bold, color: '#FFFFFF', fontSize: 31, lineHeight: 37, letterSpacing: -0.7 },
  heroSubtitle: { ...font.regular, color: 'rgba(237,246,249,0.82)', fontSize: 14, marginTop: 9 },
  heroFoot: { position: 'absolute', bottom: 91, left: 22, flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroFootText: { ...font.medium, color: 'rgba(237,246,249,0.86)', fontSize: 11 },
  searchWrap: { marginTop: -77, paddingHorizontal: 15, zIndex: 2 },
  content: { paddingHorizontal: 20, paddingTop: 22 },
  quickLabel: { ...font.semibold, color: colors.muted, fontSize: 9, letterSpacing: 1, marginBottom: 9 },
  quickRow: { gap: 9, paddingRight: 20, paddingBottom: 1 },
  quickCard: {
    minWidth: 142, minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 9, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: 16, ...shadows.card,
  },
  quickCardPressed: { opacity: 0.78 },
  quickIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#EAF2F9', alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1 },
  quickTitle: { ...font.semibold, color: colors.ink, fontSize: 12 },
  quickCaption: { ...font.regular, color: colors.muted, fontSize: 10, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 27, marginBottom: 14 },
  sectionCopy: { flex: 1 },
  sectionKicker: { ...font.semibold, color: colors.ocean, fontSize: 9, letterSpacing: 1.1, marginBottom: 4 },
  sectionTitle: { ...font.bold, color: colors.ink, fontSize: 21, letterSpacing: -0.45 },
  sectionSub: { ...font.regular, color: colors.muted, fontSize: 12, marginTop: 3 },
  seeAllButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 9, paddingLeft: 7 },
  seeAll: { ...font.semibold, color: colors.brand, fontSize: 12 },
  cityRail: { gap: 12, paddingRight: 20 },
  cityCard: { width: 173, height: 154, borderRadius: 22, overflow: 'hidden', position: 'relative', backgroundColor: '#244863' },
  cityPressed: { opacity: 0.89, transform: [{ scale: 0.985 }] },
  cityImage: { width: '100%', height: '100%' },
  cityTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cityPin: { width: 29, height: 29, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  cityArrow: { transform: [{ rotate: '45deg' }] },
  cityText: { position: 'absolute', left: 13, right: 12, bottom: 13 },
  cityName: { ...font.bold, color: '#FFFFFF', fontSize: 17, letterSpacing: -0.2 },
  cityCount: { ...font.medium, color: 'rgba(255,255,255,0.78)', fontSize: 10, marginTop: 3 },
  emptyInline: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 16, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  emptyInlineText: { ...font.regular, color: colors.muted, fontSize: 13, flex: 1 },
  featuredHeader: { marginTop: 31 },
  featuredRail: { gap: 0, paddingRight: 20, paddingBottom: 5 },
  emptyFeatured: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 22, gap: 7 },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#EAF2F9', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  emptyFeaturedTitle: { ...font.semibold, color: colors.ink, fontSize: 15 },
  emptyFeaturedText: { ...font.regular, color: colors.muted, fontSize: 12, textAlign: 'center' },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingVertical: 7, paddingHorizontal: 10 },
  emptyActionText: { ...font.semibold, color: colors.brand, fontSize: 13 },
  trustCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 25, padding: 15, borderRadius: 19, backgroundColor: '#EAF3F4', borderWidth: 1, borderColor: '#DDEBED' },
  trustIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  trustCopy: { flex: 1 },
  trustTitle: { ...font.semibold, color: colors.ink, fontSize: 12 },
  trustText: { ...font.regular, color: colors.body, fontSize: 11, lineHeight: 16, marginTop: 3 },
  footnote: { ...font.regular, fontSize: 10, color: colors.faint, marginTop: 13, textAlign: 'center' },
});
