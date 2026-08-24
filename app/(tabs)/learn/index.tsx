import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { LessonDocument, LessonCategory } from '@/shared/types/database';
import { Card } from '@/shared/components/ui/Card';
import { colors } from '@/theme';

interface CategoryOption {
  id: LessonCategory;
  title: string;
  icon: string;
  color: string;
  lightColor: string;
}

export const DEFAULT_LESSONS: LessonDocument[] = [
  {
    id: 'lesson_1_nutrition',
    title: 'Intro to Fruits 🍎',
    description: 'Discover why eating different colored fruits is like giving your body special superpowers!',
    category: 'nutrition',
    grade: 'Grade 3',
    xpReward: 15,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=400&auto=format&fit=crop',
    duration: 15,
    sections: [
      {
        id: 'sec_1',
        type: 'video',
        title: 'Watch & Learn',
        content: 'Fruits are packed with vitamins that help you think fast and run super quick!',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 15,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: 'Color Power!',
        content: 'Red fruits like apples protect your heart. Yellow fruits like bananas give you steady energy. Purple fruits like grapes help your brain remember things! Try to eat a rainbow of fruits every single day.',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lesson_2_fitness',
    title: 'Active Playing 🏃',
    description: 'Learn why jumping, running, and playing games outside keeps your heart happy and muscles growing!',
    category: 'fitness',
    grade: 'Grade 3',
    xpReward: 20,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop',
    duration: 20,
    sections: [
      {
        id: 'sec_1',
        type: 'video',
        title: 'Move Your Body',
        content: 'Your heart is a muscle that gets stronger every time you run, jump, or dance!',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: 20,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: '30-Minute Challenge',
        content: 'Try to play actively for at least 30 minutes today. Go for a bike ride, play tag with friends, or show off your best dance moves in the living room!',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lesson_3_sleep',
    title: 'Power of Sleep 💤',
    description: 'Sleeping is when your body recharges like a phone, repairs muscles, and creates memories.',
    category: 'sleep',
    grade: 'Grade 3',
    xpReward: 15,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541480601022-2308c0f02487?q=80&w=400&auto=format&fit=crop',
    duration: 15,
    sections: [
      {
        id: 'sec_1',
        type: 'video',
        title: 'Why We Sleep',
        content: 'Sleeping helps your brain store what you learned today and recharges your batteries for tomorrow.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: 15,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: 'Sleep Rules',
        content: 'Kids need 9 to 11 hours of sleep every night. Turn off all screens at least 1 hour before bedtime to help your brain get ready for deep, relaxing rest.',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lesson_4_hygiene',
    title: 'Sparkling Teeth 🧼',
    description: 'Learn the proper way to brush your teeth and keep germs away from your beautiful smile!',
    category: 'hygiene',
    grade: 'Grade 3',
    xpReward: 15,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=400&auto=format&fit=crop',
    duration: 15,
    sections: [
      {
        id: 'sec_1',
        type: 'video',
        title: 'Brush Like a Pro',
        content: 'Brushing twice a day keeps cavity bugs away!',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: 15,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: 'The 2-Minute Rule',
        content: 'Brushing should take exactly 2 minutes! Make sure to brush the fronts, backs, and chewing surfaces of all your teeth.',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export default function LearnScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [activeCategory, setActiveCategory] = useState<LessonCategory>('nutrition');
  const [lessons, setLessons] = useState<LessonDocument[]>(DEFAULT_LESSONS);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [assignedLessons, setAssignedLessons] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const categories: CategoryOption[] = [
    { id: 'nutrition', title: 'Nutrition', icon: '🍎', color: '#E53E3E', lightColor: '#FFF5F5' },
    { id: 'fitness', title: 'Fitness', icon: '🏃', color: '#3182CE', lightColor: '#EBF8FF' },
    { id: 'sleep', title: 'Sleep', icon: '💤', color: '#805AD5', lightColor: '#F3E8FF' },
    { id: 'hygiene', title: 'Hygiene', icon: '🧼', color: '#319795', lightColor: '#E6FFFA' },
  ];

  // Subscribe to lessons list
  useEffect(() => {
    if (!user) return;

    try {
      const lessonsQuery = query(collection(db, 'lessons'));
      const unsubscribe = onSnapshot(lessonsQuery, (snapshot) => {
        const lessonsList: LessonDocument[] = [];
        snapshot.forEach((doc) => {
          lessonsList.push({ id: doc.id, ...doc.data() } as LessonDocument);
        });
        if (lessonsList.length > 0) {
          setLessons(lessonsList);
        }
        setLoading(false);
      }, (error) => {
        console.warn('Error fetching lessons, using built-in curriculum:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (e) {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to teacher assignments
  useEffect(() => {
    if (!user) return;

    const assignmentsQuery = query(collection(db, 'assignments'));
    const unsubscribe = onSnapshot(assignmentsQuery, (snapshot) => {
      const assignedMap: Record<string, boolean> = {};
      snapshot.forEach((doc) => {
        assignedMap[doc.id] = true;
      });
      setAssignedLessons(assignedMap);
    }, (error) => {
      console.error('Error fetching assignments:', error);
    });

    return unsubscribe;
  }, [user]);

  // Subscribe to user's lesson progress
  useEffect(() => {
    if (!user) return;

    const progressQuery = query(
      collection(db, 'lessonProgress'),
      where('userId', '==', user.uid),
      where('completed', '==', true)
    );

    const unsubscribe = onSnapshot(progressQuery, (snapshot) => {
      const completedMap: Record<string, boolean> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        completedMap[data.lessonId] = true;
      });
      setCompletedLessons(completedMap);
    }, (error) => {
      console.error('Error fetching lesson progress:', error);
    });

    return unsubscribe;
  }, [user]);

  // Filter lessons by active category
  const filteredLessons = lessons.filter((l) => l.category === activeCategory);

  const activeCatInfo = categories.find((c) => c.id === activeCategory)!;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']} style={{ backgroundColor: '#F8F9FF' }}>
      <View className="flex-1 px-4 pt-3" style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        
        {/* Header */}
        <View className="mb-3">
          <Text className="font-nunito-extrabold text-2xl text-text">
            📚 Learning Adventures
          </Text>
          <Text className="font-nunito-bold text-xs text-text-secondary mt-0.5">
            Choose a topic and unlock health superpowers!
          </Text>
        </View>

        {/* Categories Tab Row */}
        <View className="mb-4">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isActive ? cat.color : '#FFF',
                    borderColor: colors.text.DEFAULT,
                    borderWidth: 2,
                    borderBottomWidth: isActive ? 2 : 4,
                  }}
                  className="px-4 py-2.5 mr-3 rounded-full flex-row items-center justify-center shadow-sm"
                >
                  <Text className="mr-1.5 text-base">{cat.icon}</Text>
                  <Text 
                    className={`font-nunito-extrabold text-sm ${isActive ? 'text-white' : 'text-text'}`}
                  >
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lessons List Area */}
        <View className="flex-1">
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={activeCatInfo.color} />
              <Text className="font-nunito-bold text-text-secondary mt-3">Loading Lessons...</Text>
            </View>
          ) : filteredLessons.length === 0 ? (
            <View className="flex-1 justify-center items-center bg-white border-2 border-text rounded-3xl p-6 my-4 shadow-sm">
              <Text className="text-5xl mb-4">🔍</Text>
              <Text className="font-nunito-extrabold text-heading-sm text-text text-center">
                No Lessons Yet
              </Text>
              <Text className="font-nunito-medium text-body-md text-text-secondary text-center mt-2">
                We are preparing fun quests for this category. Check back soon!
              </Text>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
            >
              {filteredLessons.map((lesson) => {
                const isCompleted = completedLessons[lesson.id!] || false;
                return (
                  <TouchableOpacity
                    key={lesson.id}
                    onPress={() => router.push(`/(tabs)/learn/${lesson.id}`)}
                    activeOpacity={0.8}
                  >
                    <Card
                      variant="pressable"
                      className="mb-4 bg-white p-0 rounded-3xl overflow-hidden border-2 border-text shadow-sm"
                      style={{ borderBottomWidth: 5 }}
                    >
                      {/* Lesson Thumbnail Image */}
                      {lesson.thumbnailUrl ? (
                        <Image 
                          source={{ uri: lesson.thumbnailUrl }} 
                          className="w-full h-36 border-b-2 border-text"
                          resizeMode="cover"
                        />
                      ) : (
                        <View 
                          style={{ backgroundColor: activeCatInfo.lightColor }}
                          className="w-full h-36 border-b-2 border-text items-center justify-center"
                        >
                          <Text className="text-5xl">{activeCatInfo.icon}</Text>
                        </View>
                      )}

                      {/* Lesson Content Info */}
                      <View className="p-4">
                        <View className="flex-row justify-between items-start mb-2">
                          <Text className="font-nunito-extrabold text-body-lg text-text flex-1 mr-2" numberOfLines={1}>
                            {lesson.title}
                          </Text>
                          {/* Completion Badge */}
                          <View className="flex-row items-center">
                            {assignedLessons[lesson.id!] && (
                              <View className="bg-red-100 border border-red-300 px-2 py-0.5 rounded-full mr-1">
                                <Text className="font-nunito-extrabold text-[9px] text-red-700">🎒 ASSIGNED</Text>
                              </View>
                            )}
                            {isCompleted ? (
                              <View className="bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                                <Text className="font-nunito-extrabold text-[9px] text-emerald-800">COMPLETED ✓</Text>
                              </View>
                            ) : (
                              <View className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                <Text className="font-nunito-extrabold text-[9px] text-amber-800">+{lesson.xpReward} XP</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <Text className="font-nunito-bold text-xs text-text-secondary" numberOfLines={2}>
                          {lesson.description}
                        </Text>
                        
                        <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-100">
                          <Text className="font-nunito-semibold text-[11px] text-text-secondary">
                            ⏱️ {Math.round(lesson.duration / 60)} min • {lesson.sections?.length || 0} sections
                          </Text>
                          <Text className="font-nunito-extrabold text-xs text-primary" style={{ color: activeCatInfo.color }}>
                            Start Quest ➔
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
        
      </View>
    </SafeAreaView>
  );
}
