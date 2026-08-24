import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useVideoPlayer, VideoView } from 'expo-video';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { LessonDocument } from '@/shared/types/database';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Avatar } from '@/shared/components/ui/Avatar';
import { checkAndAwardAchievement } from '@/shared/utils/achievements';
import { useNotification } from '@/shared/components/ui/NotificationContext';
import { colors } from '@/theme';

import { DEFAULT_LESSONS } from './index';

export default function LessonDetailsScreen() {
  const { lessonId } = useLocalSearchParams();
  const router = useRouter();
  const { user, studentProfile, updateStudentProfile } = useAuthStore();
  const { showNotification } = useNotification();

  const [lesson, setLesson] = useState<LessonDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(true);
  const [passedQuiz, setPassedQuiz] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch lesson data & student completion status
  useEffect(() => {
    if (!lessonId) return;

    async function fetchLessonData() {
      try {
        setLoading(true);
        let foundLesson: LessonDocument | null = null;

        // 1. Try Fetch lesson definition from Firestore
        try {
          const lessonRef = doc(db, 'lessons', lessonId as string);
          const lessonSnap = await getDoc(lessonRef);
          if (lessonSnap.exists()) {
            foundLesson = { id: lessonSnap.id, ...lessonSnap.data() } as LessonDocument;
          }
        } catch (e) {
          console.warn('Firestore lesson fetch fallback:', e);
        }

        // Fallback to built-in lessons if not in firestore
        if (!foundLesson) {
          foundLesson = DEFAULT_LESSONS.find((l) => l.id === lessonId) || null;
        }

        setLesson(foundLesson);

        // 2. Fetch student completion status
        if (user) {
          try {
            const progressRef = doc(db, 'lessonProgress', `${user.uid}_${lessonId}`);
            const progressSnap = await getDoc(progressRef);
            if (progressSnap.exists() && progressSnap.data().completed) {
              setCompleted(true);
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error('Error loading lesson details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLessonData();
  }, [lessonId, user]);

  // Configure video player if lesson has a video
  const videoUrl = lesson?.videoUrl || '';
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.play();
  });

  const handleCompleteLesson = async () => {
    if (!user || !lesson || !studentProfile || savingProgress) return;

    setSavingProgress(true);
    try {
      const progressId = `${user.uid}_${lesson.id || lessonId}`;
      const progressRef = doc(db, 'lessonProgress', progressId);

      // 1. Update lesson progress in Firestore
      await setDoc(progressRef, {
        userId: user.uid,
        lessonId: lesson.id || lessonId,
        completed: true,
        durationWatched: lesson.duration,
        lastAccessedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
      });

      // 2. Award XP if not already completed previously
      if (!completed) {
        const newXP = (studentProfile.totalXP || 0) + lesson.xpReward;
        
        // Calculate dynamic level (e.g. 100 XP per level)
        const nextLevel = Math.floor(newXP / 100) + 1;
        const currentLevel = studentProfile.level || 1;
        const didLevelUp = nextLevel > currentLevel;

        const profileUpdates: any = {
          totalXP: newXP,
        };

        if (didLevelUp) {
          profileUpdates.level = nextLevel;
          // Award 25 coins Level Up Bonus!
          profileUpdates.coins = (studentProfile.coins || 0) + 25;
        }

        await updateStudentProfile(profileUpdates);
        setCompleted(true);
        setShowCelebration(true);

        // Award achievement
        checkAndAwardAchievement(user.uid, 'ach_first_lesson', (title, icon) => {
          showNotification({
            title: `🏆 Achievement Unlocked: ${title}!`,
            message: `You earned the ${icon} badge for completing your first educational lesson!`,
            type: 'achievement',
          });
        });
        
        // Let them enjoy the celebration briefly, then return
        setTimeout(() => {
          setShowCelebration(false);
          router.back();
        }, 3000);
      } else {
        router.back();
      }
    } catch (err) {
      console.error('Failed to save completion progress:', err);
    } finally {
      setSavingProgress(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text className="font-nunito-bold text-text-secondary mt-3">Loading Lesson details...</Text>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-5">
        <Text className="text-4xl mb-3">⚠️</Text>
        <Text className="font-nunito-extrabold text-heading-sm text-text">Lesson Not Found</Text>
        <Button variant="outline" className="mt-4" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <Screen scrollable={false}>
      {showCelebration ? (
        // Celebratory Level Up or XP Award Screen Overlay
        <View className="flex-1 bg-primary.light justify-center items-center px-6" style={{ backgroundColor: '#F0FFF4' }}>
          <Text className="text-6xl mb-4">🎉 🏆 🎉</Text>
          <Text className="font-nunito-extrabold text-heading-lg text-emerald-800 text-center">
            Lesson Completed!
          </Text>
          <Text className="font-nunito-bold text-body-lg text-emerald-700 text-center mt-3">
            Awesome work! You earned +{lesson.xpReward} XP!
          </Text>
          
          {/* Level up check */}
          {Math.floor(((studentProfile.totalXP || 0) + lesson.xpReward) / 100) > (studentProfile.level || 1) && (
            <Card variant="default" className="p-4 mt-6 bg-yellow-50 border-2 border-yellow-400 items-center rounded-3xl">
              <Text className="text-3xl mb-1">⭐ LEVEL UP ⭐</Text>
              <Text className="font-nunito-extrabold text-body-lg text-yellow-800">
                You reached Level {Math.floor(((studentProfile.totalXP || 0) + lesson.xpReward) / 100) + 1}!
              </Text>
              <Text className="font-nunito-bold text-xs text-yellow-700 mt-1">
                +25 Level Up Coin Bonus! 🪙
              </Text>
            </Card>
          )}
        </View>
      ) : (
        <View className="flex-1 justify-between">
          
          {/* Scrollable Content View */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Header Title */}
            <View className="px-5 py-4 border-b border-slate-100 flex-row items-center justify-between">
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} className="p-2 bg-slate-100 rounded-full">
                <Text className="font-nunito-bold text-sm text-text">◀ Back</Text>
              </TouchableOpacity>
              <Text className="font-nunito-extrabold text-heading-sm text-text text-center flex-1 mx-3" numberOfLines={1}>
                {lesson.title}
              </Text>
              <View style={{ width: 40 }} /> {/* spacer */}
            </View>

            {/* Video View Section */}
            {lesson.videoUrl ? (
              <View className="border-b-2 border-text bg-black">
                <VideoView 
                  style={styles.videoPlayer}
                  player={player} 
                  allowsFullscreen 
                  allowsPictureInPicture 
                />
              </View>
            ) : null}

            {/* Lesson Sections & Materials */}
            <View className="px-5 py-6">
              {lesson.sections.map((section, idx) => {
                if (section.type === 'video') return null; // Already rendered at top
                
                return (
                  <Card key={section.id || idx} variant="default" className="p-5 bg-white border-2 border-text rounded-3xl mb-5 shadow-sm">
                    <Text className="font-nunito-extrabold text-body-lg text-text mb-2">
                      {section.title}
                    </Text>
                    <Text className="font-nunito-semibold text-body-md text-text-secondary leading-6">
                      {section.content}
                    </Text>
                  </Card>
                );
              })}

              {/* Character Mascot Dialogue Bubble */}
              <Card variant="pressable" className="flex-row items-center p-4 bg-purple-50 border-2 border-text rounded-3xl mb-8 shadow-sm">
                <Avatar config={studentProfile.avatar} size={70} />
                <View className="flex-1 ml-4 bg-white border border-slate-200 p-3 rounded-2xl">
                  <Text className="font-nunito-bold text-xs text-text-secondary">
                    "Wow! You are learning so much about being healthy! Tap below to finish this quest."
                  </Text>
                </View>
              </Card>
            </View>
          </ScrollView>

          {/* Persistent Action Footer */}
          <View className="px-5 py-4 border-t border-slate-100 bg-white">
            {!completed ? (
              <Button
                variant="primary"
                size="lg"
                onPress={handleCompleteLesson}
                isLoading={savingProgress}
              >
                {`Complete Quest (+${lesson.xpReward} XP) 🎓`}
              </Button>
            ) : hasQuiz ? (
              <View className="gap-3">
                {passedQuiz ? (
                  <View 
                    style={{ borderColor: '#10B981', borderBottomColor: '#059669', borderStyle: 'solid' }}
                    className="py-3.5 px-6 rounded-button border-2 border-b-4 items-center justify-center bg-transparent opacity-60"
                  >
                    <Text className="font-nunito-bold text-center text-label text-emerald-600">
                      Quiz Completed! ✓
                    </Text>
                  </View>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={() => {
                      const quizId = `quiz_${(lessonId as string).replace('lesson_', '')}`;
                      router.push({
                        pathname: '/(tabs)/quiz',
                        params: { quizId }
                      });
                    }}
                    style={{ backgroundColor: '#3182CE' }}
                  >
                    Take Lesson Quiz! 🧠 (-10 ⚡)
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="lg"
                  onPress={() => router.back()}
                >
                  Finish Lesson ➔
                </Button>
              </View>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onPress={() => router.back()}
              >
                Finish Lesson ➔
              </Button>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  videoPlayer: {
    width: '100%',
    height: 210,
  },
});
