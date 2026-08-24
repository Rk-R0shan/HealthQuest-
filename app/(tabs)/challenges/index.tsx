import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { CHALLENGE_TYPES } from '@/config/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { checkAndAwardAchievement } from '@/shared/utils/achievements';
import { Card } from '@/shared/components/ui/Card';
import { colors } from '@/theme';

// Map challenge IDs to cartoon emojis
const CHALLENGE_EMOJIS: Record<string, string> = {
  drink_water: '💧',
  walk: '🏃',
  exercise: '🏋️',
  sleep_early: '🌙',
  eat_fruits: '🍎',
  meditate: '🧘',
  stretch: '🙆',
  brush_teeth: '🪥',
};

export default function ChallengesScreen() {
  const { user, studentProfile, updateStudentProfile } = useAuthStore();

  // Get local date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  // Perform client-side daily reset if date changes
  useEffect(() => {
    if (!studentProfile) return;

    const today = getTodayDateString();
    if (studentProfile.lastChallengeDate !== today) {
      updateStudentProfile({
        lastChallengeDate: today,
        dailyChallenges: {}, // Clear all daily progress counts
      }).catch((err) => {
        console.error('Failed to reset daily challenges:', err);
      });
    }
  }, [studentProfile?.lastChallengeDate]);

  if (!studentProfile) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text className="font-nunito-bold text-text-secondary mt-3">Loading Challenges...</Text>
      </SafeAreaView>
    );
  }

  // Read current count helper
  const getChallengeProgress = (id: string): number => {
    if (id === 'drink_water') {
      return studentProfile.waterIntake || 0;
    }
    return (studentProfile.dailyChallenges || {})[id] || 0;
  };

  // Calculate completed count
  const completedCount = CHALLENGE_TYPES.reduce((acc, challenge) => {
    const progress = getChallengeProgress(challenge.id);
    return progress >= challenge.target ? acc + 1 : acc;
  }, 0);

  const handleLogActivity = async (id: string, increment: number) => {
    if (!user) return;

    const challenge = CHALLENGE_TYPES.find((c) => c.id === id);
    if (!challenge) return;

    const currentCount = getChallengeProgress(id);
    const newCount = Math.max(0, currentCount + increment);

    if (id === 'drink_water') {
      // Update waterIntake on the profile
      const updates: any = { waterIntake: newCount };
      
      // Award water rewards (+15 XP, +10 Coins) on first completion
      if (newCount === challenge.target && currentCount < challenge.target) {
        updates.coins = (studentProfile.coins || 0) + 10;
        updates.totalXP = (studentProfile.totalXP || 0) + 15;
        
        checkAndAwardAchievement(user.uid, 'ach_water_goal', (title, icon) => {
          alert(`🏆 ACHIEVEMENT UNLOCKED: ${icon} ${title}!\nDrink 8 glasses of water in a single day.`);
        });
      }
      // Deduct rewards if downgraded
      else if (newCount < challenge.target && currentCount >= challenge.target) {
        updates.coins = Math.max(0, (studentProfile.coins || 0) - 10);
        updates.totalXP = Math.max(0, (studentProfile.totalXP || 0) - 15);
      }

      await updateStudentProfile(updates);
    } else {
      // Normal daily challenge update
      const updates: any = {
        dailyChallenges: {
          ...(studentProfile.dailyChallenges || {}),
          [id]: newCount,
        },
      };

      // Award rewards (+10 XP, +5 Coins) on first completion
      if (newCount === challenge.target && currentCount < challenge.target) {
        updates.coins = (studentProfile.coins || 0) + 5;
        updates.totalXP = (studentProfile.totalXP || 0) + 10;
      }
      else if (newCount < challenge.target && currentCount >= challenge.target) {
        updates.coins = Math.max(0, (studentProfile.coins || 0) - 5);
        updates.totalXP = Math.max(0, (studentProfile.totalXP || 0) - 10);
      }

      await updateStudentProfile(updates);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
      <View className="flex-1" style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        <View className="px-5 py-4 border-b-2 border-slate-200 bg-white">
          <Text className="font-nunito-extrabold text-2xl text-text">🎯 Daily Quests</Text>
          <Text className="font-nunito-bold text-xs text-text-secondary mt-0.5">
            Build healthy habits to earn bonus XP and Coins!
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          
          {/* Daily Completion Header Banner */}
          <Card 
            variant="default" 
            className="flex-row items-center justify-between mb-4 bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm"
            style={{ borderBottomWidth: 4 }}
          >
            <View className="flex-1 mr-3">
              <Text className="font-nunito-extrabold text-base text-text">
                Habits Progress
              </Text>
              <Text className="font-nunito-bold text-xs text-slate-500 mt-0.5">
                {completedCount} of {CHALLENGE_TYPES.length} goals completed today
              </Text>
              
              {/* Progress bar */}
              <View className="h-3 bg-slate-100 rounded-full border border-slate-200 mt-2 overflow-hidden">
                <View 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(completedCount / CHALLENGE_TYPES.length) * 100}%` }}
                />
              </View>
            </View>
            <View className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 items-center justify-center">
              <Text className="text-2xl">🏆</Text>
            </View>
          </Card>

          {/* List of Challenges */}
          <View className="gap-3 pb-10">
          {CHALLENGE_TYPES.map((challenge) => {
            const count = getChallengeProgress(challenge.id);
            const isCompleted = count >= challenge.target;

            return (
              <Card 
                key={challenge.id}
                variant="default"
                className="bg-white border-2 border-text rounded-3xl p-4 flex-row items-center justify-between shadow-sm"
                style={{
                  borderColor: isCompleted ? '#4CAF50' : colors.text.DEFAULT,
                  backgroundColor: isCompleted ? '#F0FDF4' : '#FFF',
                }}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  {/* Emoji Badge */}
                  <View 
                    className="w-12 h-12 rounded-2xl border-2 border-text items-center justify-center mr-3"
                    style={{
                      backgroundColor: isCompleted ? '#DCFCE7' : '#EEF1FF',
                    }}
                  >
                    <Text className="text-2xl">{CHALLENGE_EMOJIS[challenge.id] || '🎯'}</Text>
                  </View>

                  <View className="flex-1">
                    <Text className="font-nunito-extrabold text-body-lg text-text">
                      {challenge.title}
                    </Text>
                    <Text className="font-nunito-bold text-xs text-text-secondary mt-0.5">
                      Goal: {challenge.target} {challenge.id === 'drink_water' ? 'glasses' : 'time'}{challenge.target > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                {/* Log / Count Controls */}
                <View className="flex-row items-center gap-3">
                  {/* Decrement Button */}
                  <TouchableOpacity
                    onPress={() => handleLogActivity(challenge.id, -1)}
                    disabled={count === 0}
                    activeOpacity={0.7}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: colors.text.DEFAULT,
                      backgroundColor: '#FF6B6B',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: count === 0 ? 0.3 : 1,
                    }}
                  >
                    <Text className="font-nunito-extrabold text-white text-lg mt-[-2px]">-</Text>
                  </TouchableOpacity>

                  {/* Count Display */}
                  <Text className="font-nunito-extrabold text-body-lg text-text min-w-[20px] text-center">
                    {count}
                  </Text>

                  {/* Increment Button */}
                  <TouchableOpacity
                    onPress={() => handleLogActivity(challenge.id, 1)}
                    activeOpacity={0.7}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: colors.text.DEFAULT,
                      backgroundColor: '#4CAF50',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text className="font-nunito-extrabold text-white text-lg mt-[-2px]">+</Text>
                  </TouchableOpacity>
                  
                  {/* Goal Complete Check */}
                  {isCompleted && (
                    <View className="ml-1">
                      <CheckCircle2 size={24} color="#4CAF50" strokeWidth={3} />
                    </View>
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}
