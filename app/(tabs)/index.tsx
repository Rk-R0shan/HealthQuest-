import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Card } from '@/shared/components/ui/Card';
import { useNotification } from '@/shared/components/ui/NotificationContext';
import { checkAndAwardAchievement } from '@/shared/utils/achievements';
import { colors } from '@/theme';

export default function HomeScreen() {
  const { user, profile, studentProfile, updateStudentProfile } = useAuthStore();
  const { showNotification } = useNotification();

  // If loading or profile does not exist yet
  if (!profile || !studentProfile) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text className="font-nunito-bold text-text-secondary mt-3">Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  // Calculate XP progress towards the daily goal
  const dailyGoal = studentProfile.dailyGoalXP || 20;
  const currentXP = studentProfile.totalXP || 0;
  const xpPercentage = Math.min(Math.round((currentXP / dailyGoal) * 100), 100);

  // Read hydration glasses (stored in studentProfile, default to 0)
  const glasses = (studentProfile as any).waterIntake || 0;
  const goalGlasses = 8;
  const isHydrated = glasses >= goalGlasses;

  const handleUpdateWater = async (increment: number) => {
    const newGlasses = Math.max(0, glasses + increment);
    const updates: any = { waterIntake: newGlasses };

    // Award bonus if reaching 8 glasses for the first time
    if (newGlasses === goalGlasses && glasses < goalGlasses) {
      updates.coins = (studentProfile.coins || 0) + 10;
      updates.totalXP = (studentProfile.totalXP || 0) + 15;

      if (user) {
        checkAndAwardAchievement(user.uid, 'ach_water_goal', (title, icon) => {
          showNotification({
            title: `🏆 Achievement Unlocked: ${title}!`,
            message: `You unlocked the ${icon} badge for drinking 8 glasses of water today!`,
            type: 'achievement',
          });
        });
      }
    } 
    // Deduct bonus if downgrading below 8 glasses
    else if (newGlasses < goalGlasses && glasses >= goalGlasses) {
      updates.coins = Math.max(0, (studentProfile.coins || 0) - 10);
      updates.totalXP = Math.max(0, (studentProfile.totalXP || 0) - 15);
    }

    await updateStudentProfile(updates);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
      <ScrollView 
        className="flex-1 px-4 pt-3" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ maxWidth: 600, width: '100%', alignSelf: 'center', paddingBottom: 24 }}
      >
        
        {/* Top Header Section */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="font-nunito-bold text-xs text-slate-500 uppercase tracking-wider">
              HealthQuest Explorer
            </Text>
            <Text className="font-nunito-extrabold text-2xl text-slate-800">
              {studentProfile.nickname} 🌟
            </Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View 
              className="w-13 h-13 rounded-full bg-indigo-50 border-3 border-indigo-400 items-center justify-center overflow-hidden shadow-sm"
              style={{ width: 52, height: 52 }}
            >
              <Avatar config={studentProfile.avatar} size={46} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Daily XP Progress Bar Card */}
        <View 
          className="p-4 bg-white border-2 border-slate-200 rounded-3xl mb-4 shadow-sm"
          style={{ borderBottomWidth: 4 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="px-2.5 py-0.5 rounded-full bg-indigo-100 border border-indigo-300">
                <Text className="font-nunito-extrabold text-xs text-indigo-700">
                  Level {studentProfile.level || 1}
                </Text>
              </View>
              <Text className="font-nunito-bold text-xs text-slate-500">
                Daily Goal: {dailyGoal} XP
              </Text>
            </View>
            <Text className="font-nunito-extrabold text-sm text-emerald-600">
              {currentXP} / {dailyGoal} XP
            </Text>
          </View>

          {/* Duolingo-style Progress Bar */}
          <View className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <View 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${xpPercentage}%`, backgroundColor: '#10B981' }} 
            />
          </View>
          
          <Text className="font-nunito-bold text-xs text-slate-500 mt-2">
            {xpPercentage >= 100 
              ? '🎉 Daily goal completed! Super job!' 
              : `Earn ${Math.max(0, dailyGoal - currentXP)} more XP to reach your daily goal!`}
          </Text>
        </View>

        {/* Stats Summary Row with Vibrant Cartoon Cards */}
        <View className="flex-row gap-2.5 mb-4">
          {/* Streak Flame */}
          <View 
            className="flex-1 bg-amber-50 rounded-2xl p-3 border-2 border-amber-300 items-center shadow-xs"
            style={{ borderBottomWidth: 4 }}
          >
            <Text className="text-2xl mb-0.5">🔥</Text>
            <Text className="font-nunito-extrabold text-lg text-amber-900">
              {studentProfile.streakCount || 0}
            </Text>
            <Text className="font-nunito-bold text-[10px] text-amber-700 uppercase">Streak</Text>
          </View>
          
          {/* Coins Balance */}
          <View 
            className="flex-1 bg-yellow-50 rounded-2xl p-3 border-2 border-yellow-300 items-center shadow-xs"
            style={{ borderBottomWidth: 4 }}
          >
            <Text className="text-2xl mb-0.5">🪙</Text>
            <Text className="font-nunito-extrabold text-lg text-yellow-900">
              {studentProfile.coins || 0}
            </Text>
            <Text className="font-nunito-bold text-[10px] text-yellow-700 uppercase">Coins</Text>
          </View>
          
          {/* Energy Lightning */}
          <View 
            className="flex-1 bg-purple-50 rounded-2xl p-3 border-2 border-purple-300 items-center shadow-xs"
            style={{ borderBottomWidth: 4 }}
          >
            <Text className="text-2xl mb-0.5">⚡</Text>
            <Text className="font-nunito-extrabold text-lg text-purple-900">
              {studentProfile.energy || 100}
            </Text>
            <Text className="font-nunito-bold text-[10px] text-purple-700 uppercase">Energy</Text>
          </View>
        </View>

        {/* Interactive Dynamic Daily Challenge Card (Hydration Tracker) */}
        <View 
          className="p-4 bg-white mb-4 rounded-3xl border-2 border-blue-200 shadow-sm"
          style={{ borderBottomWidth: 4 }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-lg">💧</Text>
              <Text className="font-nunito-extrabold text-base text-slate-800">
                Hydration Quest
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-blue-100 border border-blue-300">
              <Text className="font-nunito-extrabold text-xs text-blue-700">
                {glasses} / {goalGlasses} Cups
              </Text>
            </View>
          </View>

          <Text className="font-nunito-medium text-xs text-slate-600 mb-3 leading-4">
            Drink 8 glasses of fresh water today to power up your brain & muscles!
          </Text>

          {/* Visual Glass Tracker Indicators */}
          <View className="flex-row justify-between mb-3 px-1 py-1.5 bg-blue-50/60 rounded-2xl border border-blue-100">
            {Array.from({ length: goalGlasses }).map((_, idx) => {
              const filled = idx < glasses;
              return (
                <Text 
                  key={idx} 
                  className={`text-xl ${filled ? 'opacity-100' : 'opacity-25 grayscale'}`}
                  style={{ transform: [{ scale: filled ? 1.15 : 1 }] }}
                >
                  🥛
                </Text>
              );
            })}
          </View>

          {/* Log Buttons */}
          <View className="flex-row justify-between gap-2.5">
            <TouchableOpacity
              onPress={() => handleUpdateWater(-1)}
              activeOpacity={0.8}
              disabled={glasses === 0}
              className="flex-1 py-2.5 border-2 border-slate-300 rounded-2xl bg-slate-100 items-center justify-center"
              style={{ borderBottomWidth: 3, opacity: glasses === 0 ? 0.4 : 1 }}
            >
              <Text className="font-nunito-extrabold text-xs text-slate-700">- Remove Cup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleUpdateWater(1)}
              activeOpacity={0.8}
              className="flex-1 py-2.5 border-2 border-blue-600 rounded-2xl bg-blue-500 items-center justify-center"
              style={{ borderBottomWidth: 3, backgroundColor: '#3B82F6', borderColor: '#1D4ED8' }}
            >
              <Text className="font-nunito-extrabold text-xs text-white">+ Log Cup 🥛</Text>
            </TouchableOpacity>
          </View>

          {/* Celebration Success Overlay Banner */}
          {isHydrated && (
            <View className="mt-3 bg-emerald-50 border border-emerald-300 p-2.5 rounded-2xl items-center">
              <Text className="font-nunito-bold text-xs text-emerald-800 text-center">
                🎉 Super Hydrated! Quest Complete! (+10 🪙, +15 ⚡)
              </Text>
            </View>
          )}
        </View>

        {/* Leaderboard Showcase Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/leaderboard')}
        >
          <View 
            className="p-4 bg-white mb-4 rounded-3xl border-2 border-slate-200 shadow-sm"
            style={{ borderBottomWidth: 4 }}
          >
            <View className="flex-row justify-between items-center mb-1.5">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-lg">🏆</Text>
                <Text className="font-nunito-extrabold text-base text-slate-800">
                  Hero Leaderboard
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-nunito-extrabold text-xs text-indigo-600 mr-1">View All</Text>
                <ChevronRight size={14} color="#4F46E5" strokeWidth={3} />
              </View>
            </View>
            <Text className="font-nunito-medium text-xs text-slate-500 mb-3">
              Compete with classmates and climb to the #1 podium!
            </Text>
            <View className="flex-row items-center bg-indigo-50/60 border border-indigo-100 p-3 rounded-2xl justify-between">
              <View className="flex-row items-center">
                <Text className="text-xl mr-2">👑</Text>
                <Text className="font-nunito-extrabold text-xs text-indigo-950">
                  Weekly League Active
                </Text>
              </View>
              <View className="bg-indigo-600 px-2.5 py-0.5 rounded-full">
                <Text className="font-nunito-extrabold text-[10px] text-white">
                  TOP 50
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Continue Learning Course Section */}
        <Text className="font-nunito-extrabold text-base text-slate-800 mb-2">
          📚 Continue Learning
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/learn/lesson_1_nutrition')}
        >
          <View 
            className="p-4 bg-white border-2 border-slate-200 rounded-3xl mb-4 shadow-sm"
            style={{ borderBottomWidth: 4 }}
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 items-center justify-center mr-3">
                <Text className="text-2xl">🍎</Text>
              </View>
              <View className="flex-1">
                <Text className="font-nunito-extrabold text-sm text-slate-800">
                  Intro to Fruits & Superpowers
                </Text>
                <Text className="font-nunito-bold text-xs text-slate-500 mt-0.5">
                  Learn why colorful fruits protect your body!
                </Text>
              </View>
              <Text className="font-nunito-extrabold text-xs text-red-500 ml-2">
                Play ➔
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Daily Health Tip Panel */}
        <View 
          className="p-4 bg-teal-50 border-2 border-teal-300 rounded-3xl mb-6 shadow-sm"
          style={{ borderBottomWidth: 4 }}
        >
          <Text className="font-nunito-extrabold text-sm text-teal-900 mb-1">
            💡 Health Tip of the Day
          </Text>
          <Text className="font-nunito-medium text-xs text-teal-800 leading-5">
            Eating colorful fruits and vegetables gives your body different vitamins it needs to grow big, strong, and think clearly!
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
