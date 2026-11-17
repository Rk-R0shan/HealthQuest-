import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Speech from 'expo-speech';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { QuizDocument, QuizQuestion, QuizOptionItem } from '@/shared/types/database';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Avatar } from '@/shared/components/ui/Avatar';
import { checkAndAwardAchievement } from '@/shared/utils/achievements';
import { useNotification } from '@/shared/components/ui/NotificationContext';
import { sounds } from '@/shared/utils/soundEffects';
import { colors } from '@/theme';

// --- INTERACTIVE KID-FRIENDLY QUIZZES (Instant In-Memory Source) ---
export const DEFAULT_QUIZZES: QuizDocument[] = [
  {
    id: 'quiz_1_nutrition',
    lessonId: 'lesson_1_nutrition',
    title: 'Rainbow Fruit Explorer 🍎',
    energyCost: 10,
    rewardsXP: 25,
    rewardsCoins: 15,
    questions: [
      {
        id: 'q1_1',
        type: 'mcq',
        visual: '⚡',
        question: 'Which fruit gives your body steady battery power?',
        soundPrompt: 'Which fruit gives your body steady battery power?',
        options: [
          { text: 'Yellow Banana', visual: '🍌', subtitle: 'Steady energy!', color: '#FEF08A' },
          { text: 'Sugary Lollipop', visual: '🍭', subtitle: 'Sugar crash!', color: '#FBCFE8' },
          { text: 'Greasy Fries', visual: '🍟', subtitle: 'Heavy tummy!', color: '#FED7AA' },
        ],
        correctAnswer: 'Yellow Banana',
        explanation: 'Woohoo! Bananas give you lasting energy like a full superhero battery! 🍌⚡',
      },
      {
        id: 'q1_2',
        type: 'mcq',
        visual: '❤️',
        question: 'What bright red fruit protects your happy heart?',
        soundPrompt: 'What bright red fruit protects your happy heart?',
        options: [
          { text: 'Crunchy Red Apple', visual: '🍎', subtitle: 'Heart hero!', color: '#FECACA' },
          { text: 'Blue Cupcake', visual: '🧁', subtitle: 'Sweet treat', color: '#BFDBFE' },
          { text: 'Chocolate Bar', visual: '🍫', subtitle: 'Sticky candy', color: '#E2E8F0' },
        ],
        correctAnswer: 'Crunchy Red Apple',
        explanation: 'Great job! Red apples and berries keep your heart beating strong and proud! ❤️🍎',
      },
      {
        id: 'q1_3',
        type: 'mcq',
        visual: '🧠',
        question: 'Which juicy fruit helps your brain remember things?',
        soundPrompt: 'Which juicy fruit helps your brain remember things?',
        options: [
          { text: 'Purple Grapes', visual: '🍇', subtitle: 'Brain booster!', color: '#DDD6FE' },
          { text: 'Glazed Donut', visual: '🍩', subtitle: 'Sleepy brain', color: '#FCE7F3' },
          { text: 'Fizzy Soda', visual: '🥤', subtitle: 'Sugar rush', color: '#CFFAFE' },
        ],
        correctAnswer: 'Purple Grapes',
        explanation: 'Super brain power! Purple grapes and blueberries boost your memory for school! 🍇✨',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'quiz_2_fitness',
    lessonId: 'lesson_2_fitness',
    title: 'Super Mover Quest 🏃',
    energyCost: 10,
    rewardsXP: 30,
    rewardsCoins: 20,
    questions: [
      {
        id: 'q2_1',
        type: 'tf',
        visual: '💓',
        question: 'Your heart is a muscle that gets stronger when you play! Is this true?',
        soundPrompt: 'Your heart is a muscle that gets stronger when you play! Is this true?',
        options: [
          { text: 'YES! True!', visual: '👍', subtitle: 'Strong heart muscle!', color: '#BBF7D0' },
          { text: 'NO! False!', visual: '👎', subtitle: 'Not a muscle', color: '#FECDD3' },
        ],
        correctAnswer: 'YES! True!',
        explanation: 'Yes! Your heart is a mighty muscle that loves when you run, jump, and dance! 💓🎉',
      },
      {
        id: 'q2_2',
        type: 'mcq',
        visual: '⏰',
        question: 'How much fun active play should kids get every single day?',
        soundPrompt: 'How much fun active play should kids get every single day?',
        options: [
          { text: '30 Minutes or More', visual: '🏃‍♂️', subtitle: 'Happy & strong!', color: '#BAE6FD' },
          { text: '1 Single Minute', visual: '🛋️', subtitle: 'Way too quick!', color: '#E2E8F0' },
          { text: 'Zero Minutes', visual: '😴', subtitle: 'Couch potato!', color: '#FED7AA' },
        ],
        correctAnswer: '30 Minutes or More',
        explanation: 'You got it! 30 minutes of running and jumping keeps your bones and heart healthy! 🌟',
      },
      {
        id: 'q2_3',
        type: 'mcq',
        visual: '⚽',
        question: 'Which fun activity builds super strong legs and muscles?',
        soundPrompt: 'Which fun activity builds super strong legs and muscles?',
        options: [
          { text: 'Kicking a Ball Outside', visual: '⚽', subtitle: 'Active play!', color: '#BBF7D0' },
          { text: 'Sitting on the Floor', visual: '🛋️', subtitle: 'Not moving', color: '#E2E8F0' },
          { text: 'Napping on the Rug', visual: '😴', subtitle: 'Sleeping', color: '#FDE68A' },
        ],
        correctAnswer: 'Kicking a Ball Outside',
        explanation: 'Goal! Playing soccer and chasing friends builds super athletic muscles! ⚽🔥',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'quiz_3_sleep',
    lessonId: 'lesson_3_sleep',
    title: 'Dreamland Hero Quiz 💤',
    energyCost: 10,
    rewardsXP: 25,
    rewardsCoins: 15,
    questions: [
      {
        id: 'q3_1',
        type: 'mcq',
        visual: '📴',
        question: 'What should we do with tablets and screens 1 hour before bedtime?',
        soundPrompt: 'What should we do with tablets and screens 1 hour before bedtime?',
        options: [
          { text: 'Turn Them Off', visual: '📴', subtitle: 'Rest your eyes!', color: '#DDD6FE' },
          { text: 'Play Loud Games', visual: '🎮', subtitle: 'Wakes brain up', color: '#FECDD3' },
          { text: 'Hide Under Pillow', visual: '📱', subtitle: 'Sneaky screen', color: '#FDE68A' },
        ],
        correctAnswer: 'Turn Them Off',
        explanation: 'Great choice! Turning off screens helps your eyes relax and readies your brain for sweet dreams! 🌙',
      },
      {
        id: 'q3_2',
        type: 'mcq',
        visual: '🌙',
        question: 'How many hours of sleep do growing superheroes need each night?',
        soundPrompt: 'How many hours of sleep do growing superheroes need each night?',
        options: [
          { text: '9 to 11 Hours', visual: '🛌', subtitle: 'Full battery charge!', color: '#C7D2FE' },
          { text: '2 Short Hours', visual: '⚡', subtitle: 'Super sleepy!', color: '#FECDD3' },
          { text: 'Zero Hours', visual: '🦉', subtitle: 'Night owl', color: '#E2E8F0' },
        ],
        correctAnswer: '9 to 11 Hours',
        explanation: 'Yes! 9 to 11 hours gives your body the time it needs to grow taller and recharge! 😴⭐',
      },
      {
        id: 'q3_3',
        type: 'mcq',
        visual: '🔋',
        question: 'What happens to your body while you sleep peacefully?',
        soundPrompt: 'What happens to your body while you sleep peacefully?',
        options: [
          { text: 'Recharges Battery!', visual: '🔋', subtitle: 'Grows & repairs!', color: '#BBF7D0' },
          { text: 'Turns to Green Slime', visual: '🧪', subtitle: 'Silly monster!', color: '#BAE6FD' },
          { text: 'Floats to the Moon', visual: '🎈', subtitle: 'Drifting off', color: '#FBCFE8' },
        ],
        correctAnswer: 'Recharges Battery!',
        explanation: 'Hero recharge! Sleep repairs your tired muscles and organizes everything you learned! 🛌✨',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'quiz_4_hygiene',
    lessonId: 'lesson_4_hygiene',
    title: 'Sparkle Smile Hero 🧼',
    energyCost: 10,
    rewardsXP: 25,
    rewardsCoins: 15,
    questions: [
      {
        id: 'q4_1',
        type: 'mcq',
        visual: '🪥',
        question: 'How many minutes should you brush your teeth to scare cavity bugs away?',
        soundPrompt: 'How many minutes should you brush your teeth to scare cavity bugs away?',
        options: [
          { text: '2 Full Minutes', visual: '⏳', subtitle: 'Sparkling clean!', color: '#A7F3D0' },
          { text: '5 Quick Seconds', visual: '⚡', subtitle: 'Way too fast!', color: '#FECDD3' },
          { text: 'Once a Month', visual: '🥱', subtitle: 'Germ city!', color: '#E2E8F0' },
        ],
        correctAnswer: '2 Full Minutes',
        explanation: 'Hooray! 2 minutes with circular brush strokes keeps your teeth shining and cavity-free! 🪥✨',
      },
      {
        id: 'q4_2',
        type: 'mcq',
        visual: '🧼',
        question: 'What washes dirt and playground germs off your hands?',
        soundPrompt: 'What washes dirt and playground germs off your hands?',
        options: [
          { text: 'Soap and Warm Water', visual: '🧼', subtitle: 'Bubbly clean!', color: '#BAE6FD' },
          { text: 'Chocolate Pudding', visual: '🍫', subtitle: 'Sticky mess!', color: '#FED7AA' },
          { text: 'Wiping on your Pants', visual: '👖', subtitle: 'Germs stay!', color: '#E2E8F0' },
        ],
        correctAnswer: 'Soap and Warm Water',
        explanation: 'Bubbly clean! Soap and water chase all dirt and germs right down the drain! 🧼🫧',
      },
      {
        id: 'q4_3',
        type: 'mcq',
        visual: '💧',
        question: 'Which drink protects your teeth and gives you superpowers?',
        soundPrompt: 'Which drink protects your teeth and gives you superpowers?',
        options: [
          { text: 'Fresh Cool Water', visual: '💧', subtitle: 'Best hydration!', color: '#BFDBFE' },
          { text: 'Sticky Soda Pop', visual: '🥤', subtitle: 'Cavity monster!', color: '#FECDD3' },
          { text: 'Sweet Candy Juice', visual: '🧃', subtitle: 'Lots of sugar', color: '#FED7AA' },
        ],
        correctAnswer: 'Fresh Cool Water',
        explanation: 'Splendid! Cool water rinses food away and keeps tooth enamel super tough! 💧🦷',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

// Helper to normalize options whether stored as string or QuizOptionItem
function normalizeOption(opt: any): { text: string; visual: string; subtitle?: string; color: string } {
  if (typeof opt === 'string') {
    const parts = opt.trim().split(' ');
    if (parts.length > 1 && /\p{Extended_Pictographic}/u.test(parts[0])) {
      return {
        visual: parts[0],
        text: parts.slice(1).join(' '),
        color: '#EEF2FF',
      };
    }
    return {
      visual: '⭐',
      text: opt,
      color: '#F8FAFC',
    };
  }
  return {
    text: opt.text || '',
    visual: opt.visual || '🌟',
    subtitle: opt.subtitle,
    color: opt.color || '#EEF2FF',
  };
}

export default function QuizScreen() {
  const params = useLocalSearchParams<{ quizId?: string | string[] }>();
  const quizIdParam = Array.isArray(params.quizId) ? params.quizId[0] : params.quizId;

  const router = useRouter();
  const { user, studentProfile, updateStudentProfile } = useAuthStore();
  const { showNotification } = useNotification();

  // Instant in-memory state: zero-second initial render
  const [quizzesList, setQuizzesList] = useState<QuizDocument[]>(DEFAULT_QUIZZES);
  const [activeQuiz, setActiveQuiz] = useState<QuizDocument | null>(() => {
    if (!quizIdParam) return null;
    return DEFAULT_QUIZZES.find((q) => q.id === quizIdParam || q.lessonId === quizIdParam) || DEFAULT_QUIZZES[0];
  });

  // Gameplay State
  const [gameState, setGameState] = useState<'hub' | 'start' | 'playing' | 'results'>(() => {
    return quizIdParam ? 'start' : 'hub';
  });

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech cleanly when changing screens or questions
  useEffect(() => {
    try {
      Speech.stop();
    } catch {}
    setIsSpeaking(false);
  }, [currentQuestionIdx, gameState]);

  // Sync state when quizIdParam changes (Instant local lookup + non-blocking background sync)
  useEffect(() => {
    if (!quizIdParam) {
      setGameState('hub');
      setActiveQuiz(null);
      return;
    }

    // 1. Immediately activate matching quiz from memory
    const localMatch = DEFAULT_QUIZZES.find((q) => q.id === quizIdParam || q.lessonId === quizIdParam) || DEFAULT_QUIZZES[0];
    setActiveQuiz(localMatch);
    setGameState('start');

    // 2. Non-blocking Firestore check with fast 1.5s timeout (never freezes the screen)
    let isMounted = true;
    const fetchRemoteQuiz = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
        const quizRef = doc(db, 'quizzes', quizIdParam);
        const quizSnap: any = await Promise.race([getDoc(quizRef), timeoutPromise]);
        if (isMounted && quizSnap && quizSnap.exists()) {
          setActiveQuiz({ id: quizSnap.id, ...quizSnap.data() } as QuizDocument);
        }
      } catch {
        // Fallback already loaded seamlessly!
      }
    };

    fetchRemoteQuiz();
    return () => {
      isMounted = false;
    };
  }, [quizIdParam]);

  // Non-blocking background sync of quizzes list for Hub
  useEffect(() => {
    let isMounted = true;
    const syncQuizzesList = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
        const quizzesCol = collection(db, 'quizzes');
        const querySnap: any = await Promise.race([getDocs(quizzesCol), timeoutPromise]);
        if (isMounted && querySnap) {
          const list: QuizDocument[] = [];
          querySnap.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as QuizDocument);
          });
          if (list.length > 0) {
            setQuizzesList(list);
          }
        }
      } catch {
        // Uses built-in DEFAULT_QUIZZES
      }
    };

    syncQuizzesList();
    return () => {
      isMounted = false;
    };
  }, []);

  const speakCurrentQuestion = (q: QuizQuestion) => {
    try {
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
        return;
      }
      setIsSpeaking(true);
      const optionsText = (q.options || [])
        .map((opt, i) => `Option ${i + 1}: ${normalizeOption(opt).text}`)
        .join('. ');
      const speechPrompt = `${q.soundPrompt || q.question}. ${optionsText}`;

      Speech.speak(speechPrompt, {
        language: 'en-US',
        pitch: 1.15,
        rate: 0.86,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      setIsSpeaking(false);
    }
  };

  // Instant Start: Zero blocking spinners
  const handleStartQuiz = () => {
    if (!activeQuiz) return;

    // Energy check
    const cost = activeQuiz.energyCost || 10;
    const currentEnergy = studentProfile?.energy ?? 100;

    if (currentEnergy < cost) {
      alert(`⚡ Need Energy!\nYou need ${cost} energy to start this quiz. Complete daily habits on the dashboard to recharge!`);
      return;
    }

    sounds.playTap();

    // Background energy deduction
    if (studentProfile && updateStudentProfile) {
      updateStudentProfile({
        energy: Math.max(0, currentEnergy - cost),
      }).catch((err) => console.warn('Energy update fallback:', err));
    }

    // Instantly launch question 1
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setCorrectAnswersCount(0);
    setGameState('playing');
  };

  // Immediate 1-tap feedback when a child taps an answer card
  const handleSelectOption = (optItem: ReturnType<typeof normalizeOption>) => {
    if (isAnswerChecked || !activeQuiz) return;

    setSelectedOption(optItem.text);
    const currentQuestion = activeQuiz.questions[currentQuestionIdx];

    const answerMatches =
      optItem.text.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim() ||
      normalizeOption(currentQuestion.correctAnswer).text.toLowerCase().trim() === optItem.text.toLowerCase().trim();

    setIsCorrect(answerMatches);
    setIsAnswerChecked(true);

    if (answerMatches) {
      sounds.playSuccessChime();
      setCorrectAnswersCount((prev) => prev + 1);
    } else {
      sounds.playTryAgainChime();
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    sounds.playTap();

    if (currentQuestionIdx + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    if (!activeQuiz) return;

    const totalQuestions = activeQuiz.questions.length;
    const scorePercentage = Math.round((correctAnswersCount / totalQuestions) * 100);
    const isPassed = scorePercentage >= 60;

    // Award prizes if passed
    if (isPassed) {
      sounds.playVictoryFanfare();
      if (studentProfile && updateStudentProfile) {
        const currentXP = studentProfile.totalXP || 0;
        const currentCoins = studentProfile.coins || 0;

        const rewardXP = activeQuiz.rewardsXP || 25;
        const rewardCoins = activeQuiz.rewardsCoins || 15;

        const nextLevel = Math.floor((currentXP + rewardXP) / 100) + 1;
        const currentLevel = studentProfile.level || 1;
        const didLevelUp = nextLevel > currentLevel;

        const profileUpdates: any = {
          totalXP: currentXP + rewardXP,
          coins: currentCoins + rewardCoins,
        };

        if (didLevelUp) {
          profileUpdates.level = nextLevel;
          profileUpdates.coins += 25;
        }

        updateStudentProfile(profileUpdates).catch((err) => console.warn('Profile reward sync:', err));
      }

      // Achievement notifications
      if (user) {
        checkAndAwardAchievement(user.uid, 'ach_first_quiz', (title, icon) => {
          showNotification({
            title: `🏆 Badge Unlocked: ${title}!`,
            message: `You earned the ${icon} badge for passing your quiz!`,
            type: 'achievement',
          });
        });

        if (correctAnswersCount === totalQuestions) {
          checkAndAwardAchievement(user.uid, 'ach_perfect_quizzes', (title, icon) => {
            showNotification({
              title: `🌟 Perfect Score: ${title}!`,
              message: `You earned the ${icon} badge for getting all questions right!`,
              type: 'achievement',
            });
          });
        }

        // Background attempt log
        const attemptId = `${user.uid}_${activeQuiz.id}`;
        setDoc(
          doc(db, 'quizAttempts', attemptId),
          {
            userId: user.uid,
            quizId: activeQuiz.id,
            score: correctAnswersCount,
            totalQuestions,
            passed: isPassed,
            attemptedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }
    }

    setGameState('results');
  };

  const handleResetQuiz = () => {
    sounds.playTap();
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setCorrectAnswersCount(0);
    setCurrentQuestionIdx(0);
    setGameState('start');
  };

  // --- RENDER VIEWS ---

  // View: Hub List
  if (gameState === 'hub') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
        <View className="flex-1" style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          <View className="px-5 py-4 border-b-2 border-slate-200 bg-white">
            <Text className="font-nunito-extrabold text-2xl text-text">🧠 Quiz Arena</Text>
            <Text className="font-nunito-bold text-xs text-text-secondary mt-0.5">
              Fun picture trivia quests to test your health superpowers!
            </Text>
          </View>

          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {quizzesList.map((quiz) => (
              <TouchableOpacity
                key={quiz.id}
                onPress={() => router.push({ pathname: '/(tabs)/quiz', params: { quizId: quiz.id } })}
                activeOpacity={0.8}
              >
                <Card
                  variant="pressable"
                  className="mb-4 bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm"
                  style={{ borderBottomWidth: 4 }}
                >
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 items-center justify-center mr-3">
                      <Text className="text-3xl">
                        {quiz.id?.includes('nutrition')
                          ? '🍎'
                          : quiz.id?.includes('fitness')
                          ? '🏃'
                          : quiz.id?.includes('sleep')
                          ? '💤'
                          : '🧼'}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="font-nunito-extrabold text-base text-text flex-1 mr-2" numberOfLines={1}>
                          {quiz.title}
                        </Text>
                        <View className="bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
                          <Text className="font-nunito-extrabold text-[10px] text-blue-800">-{quiz.energyCost} ⚡</Text>
                        </View>
                      </View>

                      <Text className="font-nunito-bold text-xs text-slate-500">
                        {quiz.questions?.length || 3} Picture Questions • +{quiz.rewardsXP} XP • +{quiz.rewardsCoins} 🪙
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <Text className="font-nunito-bold text-xs text-emerald-600">
                      ⭐ Early Reader Friendly
                    </Text>
                    <Text className="font-nunito-extrabold text-xs text-amber-600">
                      Start Quest ➔
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // View: Quiz Start Screen
  if (gameState === 'start' && activeQuiz) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
        <View className="flex-1 px-4 py-5 justify-between" style={{ maxWidth: 540, width: '100%', alignSelf: 'center' }}>
          <View>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/quiz')}
              className="self-start px-3.5 py-1.5 bg-slate-100 border border-slate-300 rounded-full mb-4"
            >
              <Text className="font-nunito-bold text-xs text-text">◀ Arena Hub</Text>
            </TouchableOpacity>

            <View className="items-center my-2">
              <View className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300 items-center justify-center mb-3 shadow-sm">
                <Text className="text-4xl">
                  {activeQuiz.id?.includes('nutrition')
                    ? '🍎'
                    : activeQuiz.id?.includes('fitness')
                    ? '🏃'
                    : activeQuiz.id?.includes('sleep')
                    ? '💤'
                    : '🧼'}
                </Text>
              </View>

              <Text className="font-nunito-extrabold text-2xl text-text text-center mb-1">
                {activeQuiz.title}
              </Text>
              <Text className="font-nunito-bold text-xs text-slate-500 text-center mb-4">
                Tap large pictures, listen to audio, and win treasure!
              </Text>
            </View>

            <Card variant="default" className="p-4 bg-white border-2 border-slate-200 rounded-3xl mb-4 shadow-sm" style={{ borderBottomWidth: 4 }}>
              <Text className="font-nunito-extrabold text-sm text-text mb-3">Quest Rewards & Rules</Text>

              <View className="flex-row justify-between border-b border-slate-100 pb-2 mb-2">
                <Text className="font-nunito-bold text-xs text-slate-500">⚡ Energy to Play</Text>
                <Text className="font-nunito-extrabold text-xs text-blue-600">-{activeQuiz.energyCost} Energy</Text>
              </View>

              <View className="flex-row justify-between border-b border-slate-100 pb-2 mb-2">
                <Text className="font-nunito-bold text-xs text-slate-500">🏆 XP Reward</Text>
                <Text className="font-nunito-extrabold text-xs text-emerald-600">+{activeQuiz.rewardsXP} XP</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="font-nunito-bold text-xs text-slate-500">🪙 Gold Coins</Text>
                <Text className="font-nunito-extrabold text-xs text-yellow-600">+{activeQuiz.rewardsCoins} Coins</Text>
              </View>
            </Card>

            <View className="flex-row items-center p-3.5 bg-indigo-50 border-2 border-indigo-200 rounded-3xl mb-4 shadow-xs" style={{ borderBottomWidth: 3 }}>
              <View className="w-14 h-14 rounded-full bg-white border border-indigo-300 items-center justify-center overflow-hidden mr-3">
                <Avatar config={studentProfile?.avatar || ({} as any)} size={48} />
              </View>
              <View className="flex-1 bg-white border border-indigo-100 p-2.5 rounded-2xl">
                <Text className="font-nunito-bold text-xs text-slate-700 leading-4">
                  "Ready to play, <Text className="font-nunito-extrabold text-primary">{studentProfile?.nickname || 'Hero'}</Text>? Tap the pictures and let's win stars!"
                </Text>
              </View>
            </View>
          </View>

          <Button variant="primary" size="lg" onPress={handleStartQuiz}>
            Start Quest! ➔
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // View: Playing / Answering Questions
  if (gameState === 'playing' && activeQuiz) {
    const questions = activeQuiz.questions;
    const currentQuestion = questions[currentQuestionIdx];
    const totalQuestions = questions.length;

    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
        <View className="flex-1 px-4 py-3 justify-between" style={{ maxWidth: 540, width: '100%', alignSelf: 'center' }}>
          
          {/* Header Progress & Audio Bar */}
          <View className="mb-2">
            <View className="flex-row justify-between items-center mb-2">
              {/* Star Milestone Indicators */}
              <View className="flex-row items-center space-x-1">
                {questions.map((_, i) => (
                  <Text key={i} className="text-xl">
                    {i < currentQuestionIdx
                      ? '⭐'
                      : i === currentQuestionIdx
                      ? '🌟'
                      : '⚪'}
                  </Text>
                ))}
                <Text className="font-nunito-extrabold text-xs text-slate-600 ml-2">
                  Question {currentQuestionIdx + 1} of {totalQuestions}
                </Text>
              </View>

              {/* Audio / Read to Me Button */}
              <TouchableOpacity
                onPress={() => speakCurrentQuestion(currentQuestion)}
                activeOpacity={0.7}
                className="flex-row items-center px-3 py-1.5 rounded-full border-2"
                style={{
                  backgroundColor: isSpeaking ? '#FEF3C7' : '#EFF6FF',
                  borderColor: isSpeaking ? '#F59E0B' : '#93C5FD',
                }}
              >
                <Text className="text-sm mr-1">{isSpeaking ? '🛑' : '🔊'}</Text>
                <Text className="font-nunito-extrabold text-xs text-slate-700">
                  {isSpeaking ? 'Stop' : 'Read to Me'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress Track */}
            <View className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%` }}
              />
            </View>
          </View>

          {/* Question Text & Illustration */}
          <ScrollView className="flex-1 mb-2" showsVerticalScrollIndicator={false}>
            <Card
              variant="default"
              className="p-4 bg-white border-2 border-slate-200 rounded-3xl mb-3 shadow-sm items-center"
              style={{ borderBottomWidth: 4 }}
            >
              {currentQuestion.visual && (
                <View className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 items-center justify-center mb-2">
                  <Text className="text-3xl">{currentQuestion.visual}</Text>
                </View>
              )}
              <Text className="font-nunito-extrabold text-lg text-text text-center leading-6">
                {currentQuestion.question}
              </Text>
            </Card>

            {/* Illustrated Picture Choices */}
            <View className="gap-2.5">
              {(currentQuestion.options || []).map((rawOpt) => {
                const opt = normalizeOption(rawOpt);
                const isSelected = selectedOption === opt.text;

                // Border & color styling for feedback
                let cardBg = opt.color;
                let cardBorder = '#CBD5E1';
                let borderThickness = 4;

                const isThisTheCorrectAnswer =
                  opt.text.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim() ||
                  normalizeOption(currentQuestion.correctAnswer).text.toLowerCase().trim() === opt.text.toLowerCase().trim();

                if (isAnswerChecked) {
                  if (isThisTheCorrectAnswer) {
                    cardBg = '#DCFCE7'; // Cheerful green
                    cardBorder = '#10B981';
                  } else if (isSelected) {
                    cardBg = '#FEE2E2'; // Soft coral
                    cardBorder = '#EF4444';
                  } else {
                    cardBg = '#F8FAFC';
                    cardBorder = '#E2E8F0';
                  }
                } else if (isSelected) {
                  cardBorder = '#4F46E5';
                }

                return (
                  <TouchableOpacity
                    key={opt.text}
                    onPress={() => handleSelectOption(opt)}
                    activeOpacity={0.75}
                    disabled={isAnswerChecked}
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      borderWidth: 2.5,
                      borderBottomWidth: borderThickness,
                      minHeight: 82,
                    }}
                    className="p-3.5 rounded-2xl flex-row items-center shadow-xs"
                  >
                    {/* Big picture / emoji badge */}
                    <View className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 items-center justify-center mr-3.5 shadow-xs">
                      <Text className="text-3xl">{opt.visual}</Text>
                    </View>

                    {/* Option Text & Subtitle */}
                    <View className="flex-1 mr-2">
                      <Text className="font-nunito-extrabold text-base text-text">
                        {opt.text}
                      </Text>
                      {opt.subtitle && (
                        <Text className="font-nunito-bold text-xs text-slate-500 mt-0.5">
                          {opt.subtitle}
                        </Text>
                      )}
                    </View>

                    {/* Feedback Icons */}
                    {isAnswerChecked && isThisTheCorrectAnswer && (
                      <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center">
                        <Text className="text-white font-nunito-extrabold text-sm">✓</Text>
                      </View>
                    )}
                    {isAnswerChecked && isSelected && !isThisTheCorrectAnswer && (
                      <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center">
                        <Text className="text-white font-nunito-extrabold text-sm">✗</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Immediate Encouraging Feedback Banner */}
            {isAnswerChecked && (
              <Card
                variant="default"
                className="p-3.5 mt-3 rounded-2xl border-2 shadow-xs"
                style={{
                  backgroundColor: isCorrect ? '#F0FDF4' : '#FFF7ED',
                  borderColor: isCorrect ? '#10B981' : '#F97316',
                  borderBottomWidth: 3,
                }}
              >
                <View className="flex-row items-center mb-1">
                  <Text className="text-xl mr-2">{isCorrect ? '🌟' : '💡'}</Text>
                  <Text className={`font-nunito-extrabold text-sm ${isCorrect ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {isCorrect ? 'SUPER JOB! YOU GOT IT!' : 'ALMOST! HERE IS A HELPFUL HINT:'}
                  </Text>
                </View>
                <Text className="font-nunito-bold text-xs text-slate-700 leading-4">
                  {currentQuestion.explanation}
                </Text>
              </Card>
            )}
          </ScrollView>

          {/* Action Footer */}
          {isAnswerChecked && (
            <View className="py-1">
              <Button variant="primary" size="lg" onPress={handleNextQuestion}>
                {currentQuestionIdx + 1 === totalQuestions ? 'Finish Quest! 🏆' : 'Next Question ➔'}
              </Button>
            </View>
          )}

        </View>
      </SafeAreaView>
    );
  }

  // View: Quiz Results
  if (gameState === 'results' && activeQuiz) {
    const totalQuestions = activeQuiz.questions.length;
    const scorePercentage = Math.round((correctAnswersCount / totalQuestions) * 100);
    const passed = scorePercentage >= 60;

    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
        <View className="flex-1 px-4 py-6 justify-between" style={{ maxWidth: 540, width: '100%', alignSelf: 'center' }}>
          <View className="items-center justify-center flex-1">
            {passed ? (
              <>
                <Text className="text-6xl mb-2">🏆</Text>
                <View className="flex-row items-center justify-center space-x-1 my-1">
                  {Array.from({ length: totalQuestions }).map((_, i) => (
                    <Text key={i} className="text-3xl">
                      {i < correctAnswersCount ? '⭐' : '⚪'}
                    </Text>
                  ))}
                </View>

                <Text className="font-nunito-extrabold text-2xl text-emerald-800 text-center mt-1">
                  {correctAnswersCount === totalQuestions ? 'Superstar Champion! 🌟' : 'Quest Passed! 🎉'}
                </Text>

                <Text className="font-nunito-bold text-sm text-emerald-600 text-center mt-1">
                  You answered {correctAnswersCount} out of {totalQuestions} correctly!
                </Text>

                <Card
                  variant="default"
                  className="p-4 mt-4 bg-yellow-50 border-2 border-yellow-400 items-center rounded-3xl w-full shadow-sm"
                  style={{ borderBottomWidth: 4 }}
                >
                  <Text className="font-nunito-extrabold text-sm text-yellow-800 mb-1">
                    🪙 Treasure Claimed! 🪙
                  </Text>
                  <Text className="font-nunito-bold text-xs text-yellow-700">
                    +{activeQuiz.rewardsXP} XP & +{activeQuiz.rewardsCoins} Coins added to your bank!
                  </Text>
                </Card>
              </>
            ) : (
              <>
                <Text className="text-6xl mb-2">💪</Text>
                <Text className="font-nunito-extrabold text-2xl text-amber-800 text-center">
                  Nice Practice! 🌟
                </Text>
                <Text className="font-nunito-bold text-sm text-amber-600 text-center mt-1">
                  You got {correctAnswersCount} out of {totalQuestions} correct.
                </Text>
                <Text className="font-nunito-bold text-xs text-slate-500 text-center mt-3 px-4 leading-4">
                  Superheroes learn by trying! Re-read the short lesson and let's play again to earn full stars!
                </Text>
              </>
            )}
          </View>

          <View className="gap-2.5 w-full">
            <Button variant="primary" size="lg" onPress={handleResetQuiz}>
              Play Again 🔄
            </Button>

            <Button
              variant="outline"
              size="lg"
              onPress={() => router.replace('/(tabs)/learn')}
            >
              Back to Learning Adventures 📚
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}
