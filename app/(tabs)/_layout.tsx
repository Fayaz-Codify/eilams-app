import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, font } from '../../src/theme';
import { usePushRegistration } from '../../src/lib/push';

const TABS = [
  { name: 'index', label: 'Explore', icon: 'search-outline', active: 'search' },
  { name: 'bookings', label: 'Trips', icon: 'calendar-outline', active: 'calendar' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', active: 'person' },
] as const;

export default function TabsLayout() {
  usePushRegistration();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { ...font.medium, fontSize: 11 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? tab.active : tab.icon}
                size={20}
                color={focused ? colors.brand : colors.faint}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
