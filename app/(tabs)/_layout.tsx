/**
 * HealthQuest — Main Tab Navigation
 *
 * Five-tab bottom navigation: Home, Learn, Quiz, Challenges, Profile
 * Uses custom tab bar styling matching the Bright Cartoon theme.
 */
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import {
  Home,
  BookOpen,
  HelpCircle,
  Target,
  User,
} from 'lucide-react-native';
import { colors } from '@/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 2,
          borderTopColor: '#E2E8F0',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          maxWidth: Platform.OS === 'web' ? 640 : undefined,
          width: '100%',
          alignSelf: 'center',
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Nunito_700Bold',
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.15 : 1 }] }}>
              <Home size={24} color={color} strokeWidth={focused ? 3 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="learn/index"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.15 : 1 }] }}>
              <BookOpen size={24} color={color} strokeWidth={focused ? 3 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="quiz/index"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#F59E0B' : '#FEF3C7',
                borderRadius: 12,
                padding: 4,
                borderWidth: 1.5,
                borderColor: focused ? '#D97706' : '#FDE68A',
                transform: [{ scale: focused ? 1.15 : 1 }],
              }}
            >
              <HelpCircle size={20} color={focused ? '#FFFFFF' : '#D97706'} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="challenges/index"
        options={{
          title: 'Quests',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.15 : 1 }] }}>
              <Target size={24} color={color} strokeWidth={focused ? 3 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.15 : 1 }] }}>
              <User size={24} color={color} strokeWidth={focused ? 3 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
