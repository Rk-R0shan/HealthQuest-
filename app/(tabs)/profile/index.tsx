import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { AchievementDocument } from '@/shared/types/database';
import { colors } from '@/theme';

const DEFAULT_ACHIEVEMENTS: AchievementDocument[] = [
  {
    id: 'ach_first_lesson',
    title: 'Early Bird',
    description: 'Complete your first educational lesson.',
    icon: '🍎',
    coinsReward: 15,
    xpReward: 10,
  },
  {
    id: 'ach_water_goal',
    title: 'Super Hydrated',
    description: 'Drink 8 glasses of water in a single day.',
    icon: '💧',
    coinsReward: 20,
    xpReward: 15,
  },
  {
    id: 'ach_first_quiz',
    title: 'Energy Builder',
    description: 'Pass your first educational lesson quiz.',
    icon: '⚡',
    coinsReward: 15,
    xpReward: 10,
  },
  {
    id: 'ach_perfect_quizzes',
    title: 'Brainiac',
    description: 'Get a perfect 100% score on a quiz.',
    icon: '🎓',
    coinsReward: 30,
    xpReward: 25,
  },
];

export default function ProfileScreen() {
  const { signOut, user, studentProfile } = useAuthStore();
  const [achievements, setAchievements] = useState<AchievementDocument[]>(DEFAULT_ACHIEVEMENTS);
  const [unlockedIds, setUnlockedIds] = useState<Record<string, boolean>>({ ach_water_goal: true, ach_first_quiz: true });
  const [loading, setLoading] = useState(false);

  // 1. Subscribe to all achievements
  useEffect(() => {
    if (!user) return;

    try {
      const achQuery = query(collection(db, 'achievements'));
      const unsubscribe = onSnapshot(achQuery, (snapshot) => {
        const list: AchievementDocument[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as AchievementDocument);
        });
        if (list.length > 0) {
          setAchievements(list);
        }
        setLoading(false);
      }, (error) => {
        console.warn('Error loading achievements templates, using defaults:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (e) {
      setLoading(false);
    }
  }, [user]);

  // 2. Subscribe to user's unlocked achievements
  useEffect(() => {
    if (!user) return;

    const unlockedQuery = query(
      collection(db, 'studentAchievements'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(unlockedQuery, (snapshot) => {
      const unlockedMap: Record<string, boolean> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        unlockedMap[data.achievementId] = true;
      });
      setUnlockedIds(unlockedMap);
    }, (error) => {
      console.error('Error loading student achievements:', error);
    });

    return unsubscribe;
  }, [user]);

  if (!studentProfile) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text className="font-nunito-bold text-text-secondary mt-3">Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
      <View className="flex-1" style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        <View className="px-5 py-4 border-b-2 border-slate-200 bg-white">
          <Text className="font-nunito-extrabold text-2xl text-text">🛡️ My Hero Profile</Text>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          
          {/* Student Avatar Card */}
          <Card variant="default" className="bg-white border-2 border-slate-200 rounded-3xl p-6 items-center shadow-sm mb-5" style={{ borderBottomWidth: 4 }}>
            <View className="mb-3">
              <View className="w-24 h-24 rounded-full bg-indigo-50 border-3 border-indigo-400 items-center justify-center overflow-hidden shadow-sm" style={{ width: 96, height: 96 }}>
                <Avatar config={studentProfile.avatar} size={84} />
              </View>
            </View>
            
            <Text className="font-nunito-extrabold text-2xl text-text">
              {studentProfile.nickname} 🌟
            </Text>
            <Text className="font-nunito-bold text-xs text-text-secondary mt-0.5 mb-3">
              {user?.email}
            </Text>
            
            {/* Gaming Stats Box */}
            <View className="flex-row mt-1 border-t border-slate-100 pt-3 w-full justify-around">
              <View className="items-center">
                <Text className="font-nunito-extrabold text-lg text-indigo-600">
                  Level {studentProfile.level || 1}
                </Text>
                <Text className="font-nunito-bold text-[11px] text-text-secondary uppercase">Rank</Text>
              </View>
              <View className="items-center">
                <Text className="font-nunito-extrabold text-lg text-emerald-600">
                  {studentProfile.totalXP || 0}
                </Text>
                <Text className="font-nunito-bold text-[11px] text-text-secondary uppercase">Total XP</Text>
              </View>
              <View className="items-center">
                <Text className="font-nunito-extrabold text-lg text-yellow-600">
                  {studentProfile.coins || 0}
                </Text>
                <Text className="font-nunito-bold text-[11px] text-text-secondary uppercase">Coins</Text>
              </View>
            </View>
          </Card>

          {/* Badges & Achievements Section */}
          <Text className="font-nunito-extrabold text-lg text-text mb-3">
            🏆 Badges & Achievements
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary.DEFAULT} className="my-4" />
          ) : (
            <View className="space-y-3 mb-6">
              {achievements.map((ach) => {
                const isUnlocked = unlockedIds[ach.id!] || false;
                return (
                  <Card
                    key={ach.id}
                    variant="default"
                    className="p-4 rounded-3xl flex-row items-center border-2 shadow-xs mb-3"
                    style={{
                      opacity: isUnlocked ? 1 : 0.65,
                      backgroundColor: isUnlocked ? '#FFF' : '#F8FAFC',
                      borderColor: isUnlocked ? '#CBD5E1' : '#E2E8F0',
                      borderBottomWidth: 3,
                    }}
                  >
                    <View 
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: isUnlocked ? '#FEF3C7' : '#E2E8F0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: isUnlocked ? '#F59E0B' : '#CBD5E1',
                      }}
                    >
                      <Text className="text-2xl">{isUnlocked ? ach.icon : '🔒'}</Text>
                    </View>

                    <View className="flex-1 ml-3 mr-2">
                      <Text 
                        className={`font-nunito-extrabold text-base ${isUnlocked ? 'text-text' : 'text-slate-500'}`}
                      >
                        {ach.title}
                      </Text>
                      <Text 
                        className={`font-nunito-bold text-xs ${isUnlocked ? 'text-text-secondary' : 'text-slate-400'} mt-0.5`}
                        numberOfLines={2}
                      >
                        {ach.description}
                      </Text>
                    </View>

                    {isUnlocked && (
                      <View className="bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                        <Text className="font-nunito-extrabold text-[9px] text-emerald-800">UNLOCKED</Text>
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}

          {/* Bulletproof Log Out Button */}
          <Button
            variant="secondary"
            size="lg"
            onPress={() => signOut()}
            className="mb-8 w-full"
          >
            Log Out
          </Button>
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
