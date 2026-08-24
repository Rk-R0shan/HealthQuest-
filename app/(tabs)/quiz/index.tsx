import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { QuizDocument, QuizQuestion } from '@/shared/types/database';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Avatar } from '@/shared/components/ui/Avatar';
import { checkAndAwardAchievement } from '@/shared/utils/achievements';
import { useNotification } from '@/shared/components/ui/NotificationContext';
import { colors } from '@/theme';

export const DEFAULT_QUIZZES: QuizDocument[] = [
  {
    id: 'quiz_1_nutrition',
    lessonId: 'lesson_1_nutrition',
    title: 'Intro to Fruits Quiz 🧠',
    energyCost: 10,
    rewardsXP: 25,
    rewardsCoins: 15,
    questions: [
      {
        id: 'q1_1',
        type: 'mcq',
        question: 'Which color fruit gives steady energy like a battery?',
        options: ['Red', 'Yellow', 'Blue', 'Black'],
        correctAnswer: 'Yellow',
        explanation: 'Yellow fruits like bananas are packed with healthy carbohydrates that give your body steady, long-lasting energy!',
      },
      {
        id: 'q1_2',
        type: 'tf',
        question: 'Red fruits like apples are great for protecting your lungs.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Red fruits like strawberries and apples are excellent for keeping your HEART strong and healthy!',
      },
      {
        id: 'q1_3',
        type: 'scenario',
        question: 'Max wants to help his brain remember facts for a school test tomorrow. Which fruit should he eat?',
        options: ['Apples', 'Grapes', 'Lemons', 'Bananas'],
        correctAnswer: 'Grapes',
        explanation: 'Purple fruits like grapes and blueberries are rich in antioxidants that boost memory and help brain functions!',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'quiz_2_fitness',
    lessonId: 'lesson_2_fitness',
    title: 'Active Playing Quiz 🧠',
    energyCost: 10,
    rewardsXP: 30,
    rewardsCoins: 20,
    questions: [
      {
        id: 'q2_1',
        type: 'tf',
        question: 'Your heart is actually a muscle.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Yes! Your heart is a very important muscle that gets stronger and healthier every time you run, play, and stay active!',
      },
      {
        id: 'q2_2',
        type: 'mcq',
        question: 'How many minutes should kids play actively each day to stay healthy?',
        options: ['5 minutes', '10 minutes', '30 minutes', '180 minutes'],
        correctAnswer: '30 minutes',
        explanation: 'Playing actively for at least 30 minutes keeps your heart pumping and makes your muscles and bones strong!',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'quiz_3_sleep',
    lessonId: 'lesson_3_sleep',
    title: 'Power of Sleep Quiz 🧠',
    energyCost: 10,
    rewardsXP: 25,
    rewardsCoins: 15,
    questions: [
      {
        id: 'q3_1',
        type: 'mcq',
        question: 'What should you do with tablet/phone screens 1 hour before bedtime?',
        options: ['Play a game', 'Turn them off', 'Watch a video', 'Keep them under the pillow'],
        correctAnswer: 'Turn them off',
        explanation: 'Turning off screens 1 hour before bed helps your brain relax and tells your body it is time for restful sleep!',
      },
      {
        id: 'q3_2',
        type: 'tf',
        question: 'Growing kids need about 9 to 11 hours of sleep every night.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Yes! Growing kids need 9 to 11 hours of sleep to fully recharge their body and store new memories!',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'quiz_4_hygiene',
    lessonId: 'lesson_4_hygiene',
    title: 'Sparkling Teeth Quiz 🧠',
    energyCost: 10,
    rewardsXP: 25,
    rewardsCoins: 15,
    questions: [
      {
        id: 'q4_1',
        type: 'mcq',
        question: 'How many minutes should you brush your teeth for to clean them properly?',
        options: ['30 seconds', '1 minute', '2 minutes', '5 minutes'],
        correctAnswer: '2 minutes',
        explanation: 'Dentists recommend brushing for exactly 2 minutes to make sure you clean all parts of your teeth and get rid of cavity bugs!',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export default function QuizScreen() {
  const { quizId } = useLocalSearchParams();
  const router = useRouter();
  const { user, studentProfile, updateStudentProfile } = useAuthStore();
  const { showNotification } = useNotification();

  const [quizzesList, setQuizzesList] = useState<QuizDocument[]>(DEFAULT_QUIZZES);
  const [activeQuiz, setActiveQuiz] = useState<QuizDocument | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  // Gameplay State
  const [gameState, setGameState] = useState<'hub' | 'start' | 'playing' | 'results'>('hub');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [savingAttempt, setSavingAttempt] = useState(false);

  // 1. Fetch all quizzes for the Hub list
  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const quizzesCol = collection(db, 'quizzes');
        const querySnap = await getDocs(quizzesCol);
        const list: QuizDocument[] = [];
        querySnap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as QuizDocument);
        });
        if (list.length > 0) {
          setQuizzesList(list);
        }
      } catch (err) {
        console.warn('Error fetching quizzes list, using default quizzes:', err);
      } finally {
        setListLoading(false);
      }
    }
    fetchQuizzes();
  }, [quizId]);

  // 2. Fetch specific quiz if quizId parameter changes
  useEffect(() => {
    if (!quizId) {
      setGameState('hub');
      setActiveQuiz(null);
      return;
    }

    async function fetchSpecificQuiz() {
      try {
        setQuizLoading(true);
        let foundQuiz: QuizDocument | null = null;
        try {
          const quizRef = doc(db, 'quizzes', quizId as string);
          const quizSnap = await getDoc(quizRef);
          if (quizSnap.exists()) {
            foundQuiz = { id: quizSnap.id, ...quizSnap.data() } as QuizDocument;
          }
        } catch (e) {
          console.warn('Firestore quiz fetch fallback:', e);
        }

        if (!foundQuiz) {
          foundQuiz = DEFAULT_QUIZZES.find((q) => q.id === quizId || q.lessonId === quizId) || DEFAULT_QUIZZES[0];
        }

        setActiveQuiz(foundQuiz);
        setGameState('start');
      } catch (err) {
        console.error('Error loading quiz:', err);
      } finally {
        setQuizLoading(false);
      }
    }

    fetchSpecificQuiz();
  }, [quizId]);

  const handleStartQuiz = async () => {
    if (!activeQuiz || !studentProfile) return;

    // Energy check
    const cost = activeQuiz.energyCost || 10;
    const currentEnergy = studentProfile.energy || 100;

    if (currentEnergy < cost) {
      alert(`⚠️ Not enough energy! You need at least ${cost} energy to start this quiz. Complete daily challenges to recharge!`);
      return;
    }

    setQuizLoading(true);
    try {
      // Deduct energy
      await updateStudentProfile({
        energy: Math.max(0, currentEnergy - cost),
      });

      // Start gameplay loop
      setCurrentQuestionIdx(0);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setCorrectAnswersCount(0);
      setGameState('playing');
    } catch (err) {
      console.error('Failed to deduct energy:', err);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleCheckAnswer = () => {
    if (!activeQuiz || selectedOption === null) return;

    const currentQuestion = activeQuiz.questions[currentQuestionIdx];
    const isAnsCorrect = selectedOption === currentQuestion.correctAnswer;

    setIsCorrect(isAnsCorrect);
    setIsAnswerChecked(true);

    if (isAnsCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;

    if (currentQuestionIdx + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      // Finished all questions → Transition to results
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    if (!activeQuiz || !user || !studentProfile) return;

    setSavingAttempt(true);
    try {
      const totalQuestions = activeQuiz.questions.length;
      const scorePercentage = Math.round((correctAnswersCount / totalQuestions) * 100);
      const isPassed = scorePercentage >= 60;

      const attemptId = `${user.uid}_${activeQuiz.id}`;
      const attemptRef = doc(db, 'quizAttempts', attemptId);

      // Save attempt log
      await setDoc(attemptRef, {
        userId: user.uid,
        quizId: activeQuiz.id,
        score: correctAnswersCount,
        totalQuestions,
        passed: isPassed,
        attemptedAt: serverTimestamp(),
      });

      // Award prizes if passed
      if (isPassed) {
        const currentXP = studentProfile.totalXP || 0;
        const currentCoins = studentProfile.coins || 0;
        
        const rewardXP = activeQuiz.rewardsXP || 25;
        const rewardCoins = activeQuiz.rewardsCoins || 15;

        // Calculate Level Up
        const nextLevel = Math.floor((currentXP + rewardXP) / 100) + 1;
        const currentLevel = studentProfile.level || 1;
        const didLevelUp = nextLevel > currentLevel;

        const profileUpdates: any = {
          totalXP: currentXP + rewardXP,
          coins: currentCoins + rewardCoins,
        };

        if (didLevelUp) {
          profileUpdates.level = nextLevel;
          profileUpdates.coins += 25; // Bonus level up coins
        }

        await updateStudentProfile(profileUpdates);

        // Award Energy Builder achievement (first quiz completed)
        checkAndAwardAchievement(user.uid, 'ach_first_quiz', (title, icon) => {
          showNotification({
            title: `🏆 Achievement Unlocked: ${title}!`,
            message: `You earned the ${icon} badge for passing your first quiz!`,
            type: 'achievement',
          });
        });

        // Award Brainiac achievement if score is 100%
        if (correctAnswersCount === totalQuestions) {
          checkAndAwardAchievement(user.uid, 'ach_perfect_quizzes', (title, icon) => {
            showNotification({
              title: `🏆 Achievement Unlocked: ${title}!`,
              message: `You earned the ${icon} badge for scoring 100% on a quiz!`,
              type: 'achievement',
            });
          });
        }
      }

      setGameState('results');
    } catch (err) {
      console.error('Error logging quiz attempt:', err);
    } finally {
      setSavingAttempt(false);
    }
  };

  const handleResetQuiz = () => {
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setCorrectAnswersCount(0);
    setCurrentQuestionIdx(0);
    setGameState('start');
  };

  // --- RENDER VIEWS ---

  // Loading Screen
  if (quizLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text className="font-nunito-bold text-text-secondary mt-3">Loading Quiz...</Text>
      </View>
    );
  }

  // View: Hub List (when no specific quizId is loaded)
  if (gameState === 'hub') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
        <View className="flex-1" style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          <View className="px-5 py-4 border-b-2 border-slate-200 bg-white">
            <Text className="font-nunito-extrabold text-2xl text-text">🧠 Quiz Arena</Text>
            <Text className="font-nunito-bold text-xs text-text-secondary mt-0.5">
              Complete lessons to unlock trivia challenges!
            </Text>
          </View>

          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {listLoading ? (
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} className="mt-8" />
            ) : quizzesList.length === 0 ? (
              <Card variant="default" className="p-6 bg-white border-2 border-slate-200 rounded-3xl mt-4 items-center">
                <Text className="text-4xl mb-2">🎓</Text>
                <Text className="font-nunito-bold text-text-secondary text-center">
                  No Quizzes Available yet. Complete your first lesson!
                </Text>
              </Card>
            ) : (
              quizzesList.map((quiz) => (
                <TouchableOpacity
                  key={quiz.id}
                  onPress={() => router.push({ pathname: '/(tabs)/quiz', params: { quizId: quiz.id } })}
                  activeOpacity={0.8}
                >
                  <Card 
                    variant="pressable" 
                    className="mb-4 bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm"
                    style={{ borderBottomWidth: 4 }}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="font-nunito-extrabold text-base text-text flex-1 mr-2">
                        {quiz.title}
                      </Text>
                      <View className="bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full">
                        <Text className="font-nunito-extrabold text-[10px] text-blue-800">-{quiz.energyCost} ⚡</Text>
                      </View>
                    </View>

                    <Text className="font-nunito-semibold text-xs text-slate-500">
                      XP Reward: +{quiz.rewardsXP} XP • Coins: +{quiz.rewardsCoins} 🪙
                    </Text>
                    
                    <Text className="font-nunito-extrabold text-xs text-amber-600 mt-3 self-end">
                      Start Quiz ➔
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))
            )}
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
            <TouchableOpacity onPress={() => router.replace('/(tabs)/quiz')} className="self-start px-3.5 py-1.5 bg-slate-100 border border-slate-300 rounded-full mb-4">
              <Text className="font-nunito-bold text-xs text-text">◀ Arena Hub</Text>
            </TouchableOpacity>

            <Text className="font-nunito-extrabold text-2xl text-text mb-1">
              {activeQuiz.title}
            </Text>
            <Text className="font-nunito-semibold text-xs text-text-secondary mb-5">
              Prove your health knowledge and win gold coins!
            </Text>

            <Card variant="default" className="p-5 bg-white border-2 border-slate-200 rounded-3xl mb-5 shadow-sm" style={{ borderBottomWidth: 4 }}>
              <Text className="font-nunito-extrabold text-sm text-text mb-3">Quest Details</Text>
              
              <View className="flex-row justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <Text className="font-nunito-bold text-xs text-text-secondary">⚡ Energy Cost</Text>
                <Text className="font-nunito-extrabold text-xs text-blue-600">-{activeQuiz.energyCost} Energy</Text>
              </View>
              
              <View className="flex-row justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <Text className="font-nunito-bold text-xs text-text-secondary">🏆 XP Reward</Text>
                <Text className="font-nunito-extrabold text-xs text-emerald-600">+{activeQuiz.rewardsXP} XP</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="font-nunito-bold text-xs text-text-secondary">🪙 Coin Reward</Text>
                <Text className="font-nunito-extrabold text-xs text-yellow-600">+{activeQuiz.rewardsCoins} Coins</Text>
              </View>
            </Card>

            <View className="flex-row items-center p-3.5 bg-indigo-50 border-2 border-indigo-200 rounded-3xl mb-4 shadow-xs" style={{ borderBottomWidth: 3 }}>
              <View className="w-14 h-14 rounded-full bg-white border border-indigo-300 items-center justify-center overflow-hidden mr-3">
                <Avatar config={studentProfile?.avatar || {} as any} size={48} />
              </View>
              <View className="flex-1 bg-white border border-indigo-100 p-2.5 rounded-2xl">
                <Text className="font-nunito-bold text-xs text-slate-700">
                  "Ready to put your brain to work? Let's crush this quiz!"
                </Text>
              </View>
            </View>
          </View>

          <Button variant="primary" size="lg" onPress={handleStartQuiz}>Start Quest! ➔</Button>
        </View>
      </SafeAreaView>
    );
  }

  // View: Playing / Answering Questions
  if (gameState === 'playing' && activeQuiz) {
    const questions = activeQuiz.questions;
    const currentQuestion = questions[currentQuestionIdx];
    const totalQuestions = questions.length;
    const progressPercent = ((currentQuestionIdx + 1) / totalQuestions) * 100;

    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
        <View className="flex-1 px-4 py-4 justify-between" style={{ maxWidth: 540, width: '100%', alignSelf: 'center' }}>
          
          {/* Header Progress Indicators */}
          <View className="mb-3">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="font-nunito-extrabold text-xs text-slate-500">
                Question {currentQuestionIdx + 1} of {totalQuestions}
              </Text>
              <Text className="font-nunito-extrabold text-xs text-emerald-600">
                Score: {correctAnswersCount} correct
              </Text>
            </View>
            <View className="h-2.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
              <View 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${progressPercent}%`, backgroundColor: '#10B981' }} 
              />
            </View>
          </View>

          {/* Question Text */}
          <ScrollView className="flex-1 mb-3" showsVerticalScrollIndicator={false}>
            <Card variant="default" className="p-4 bg-white border-2 border-slate-200 rounded-3xl mb-4 shadow-sm" style={{ borderBottomWidth: 4 }}>
              {currentQuestion.type === 'scenario' && (
                <Text className="font-nunito-extrabold text-[10px] text-indigo-600 mb-1.5 uppercase tracking-wider">
                  📖 Story Scenario
                </Text>
              )}
              <Text className="font-nunito-extrabold text-base text-text">
                {currentQuestion.question}
              </Text>
            </Card>

            {/* Selection Grid / Options */}
            <View className="gap-2.5">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedOption === opt;
                
                // Styling when answer is checked
                let optionBg = '#FFF';
                let optionBorder = '#CBD5E1';
                let optionBorderWidth = isSelected ? 4 : 2;

                if (isAnswerChecked) {
                  if (opt === currentQuestion.correctAnswer) {
                    optionBg = '#ECFDF5'; // Light green
                    optionBorder = '#10B981'; // Green border
                    optionBorderWidth = 4;
                  } else if (isSelected) {
                    optionBg = '#FEF2F2'; // Light red
                    optionBorder = '#EF4444'; // Red border
                    optionBorderWidth = 4;
                  }
                } else if (isSelected) {
                  optionBg = '#EEF2FF';
                  optionBorder = '#4F46E5';
                }

                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      if (!isAnswerChecked) {
                        setSelectedOption(opt);
                      }
                    }}
                    activeOpacity={0.8}
                    disabled={isAnswerChecked}
                    style={{
                      backgroundColor: optionBg,
                      borderColor: optionBorder,
                      borderWidth: 2,
                      borderBottomWidth: optionBorderWidth,
                    }}
                    className="p-4 rounded-2xl shadow-xs"
                  >
                    <Text className={`font-nunito-extrabold text-sm text-text`}>
                      {opt} {isSelected && !isAnswerChecked ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Explanation card after checked */}
            {isAnswerChecked && (
              <Card 
                variant="default" 
                className="p-3.5 mt-4 rounded-2xl border-2 shadow-xs"
                style={{ 
                  backgroundColor: isCorrect ? '#ECFDF5' : '#FEF2F2',
                  borderColor: isCorrect ? '#10B981' : '#EF4444' 
                }}
              >
                <Text className={`font-nunito-extrabold text-xs mb-1 ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                  {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
                </Text>
                <Text className="font-nunito-bold text-xs text-slate-600 leading-4">
                  {currentQuestion.explanation}
                </Text>
              </Card>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View className="py-1">
            {!isAnswerChecked ? (
              <Button
                variant="primary"
                size="lg"
                onPress={handleCheckAnswer}
                disabled={selectedOption === null}
              >Check Answer</Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onPress={handleNextQuestion}
              >{currentQuestionIdx + 1 === totalQuestions ? 'Finish Quiz ➔' : 'Next Question ➔'}</Button>
            )}
          </View>

        </View>
      </SafeAreaView>
    );
  }

  // View: Quiz Results (Pass / Fail)
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
                <Text className="text-6xl mb-3">🏆</Text>
                <Text className="font-nunito-extrabold text-2xl text-emerald-800 text-center">
                  Quest Passed!
                </Text>
                <Text className="font-nunito-bold text-sm text-emerald-600 text-center mt-1">
                  You got {correctAnswersCount} / {totalQuestions} correct ({scorePercentage}%)!
                </Text>

                <Card variant="default" className="p-4 mt-5 bg-yellow-50 border-2 border-yellow-400 items-center rounded-3xl w-full shadow-sm" style={{ borderBottomWidth: 4 }}>
                  <Text className="font-nunito-extrabold text-sm text-yellow-800 mb-1">🪙 Rewards Claimed 🪙</Text>
                  <Text className="font-nunito-bold text-xs text-yellow-700">
                    +{activeQuiz.rewardsXP} XP & +{activeQuiz.rewardsCoins} Coins
                  </Text>
                </Card>
              </>
            ) : (
              <>
                <Text className="text-6xl mb-3">💪</Text>
                <Text className="font-nunito-extrabold text-2xl text-red-800 text-center">
                  Keep Practicing!
                </Text>
                <Text className="font-nunito-bold text-sm text-red-600 text-center mt-1">
                  You got {correctAnswersCount} / {totalQuestions} correct ({scorePercentage}%).
                </Text>
                <Text className="font-nunito-medium text-xs text-slate-500 text-center mt-3 px-4 leading-4">
                  Pass with 60% or higher to earn coins, XP, and unlock prizes. Re-read the lesson material and try again!
                </Text>
              </>
            )}
          </View>

          <View className="gap-2.5 w-full">
            {!passed ? (
              <Button variant="primary" size="lg" onPress={handleResetQuiz}>Try Again</Button>
            ) : null}

            <Button 
              variant={passed ? "primary" : "outline"} 
              size="lg" 
              onPress={() => router.replace('/(tabs)/learn')}
            >Back to Learn</Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}
