import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Crown } from 'lucide-react-native';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Card } from '@/shared/components/ui/Card';
import { colors } from '@/theme';

interface LeaderboardUser {
  id: string;
  nickname: string;
  avatar: any;
  level: number;
  totalXP: number;
}

const DEFAULT_RANKINGS: LeaderboardUser[] = [
  {
    id: 'user_leo',
    nickname: 'Leo The Lion 🦁',
    avatar: { skinColor: '#FFDFBF', hairStyle: 'curly', hairColor: '#4A3728', expression: 'smile', clothing: 'sporty_tshirt', accessory: 'cap' },
    level: 4,
    totalXP: 420,
  },
  {
    id: 'user_maya',
    nickname: 'Maya Super 🌟',
    avatar: { skinColor: '#F5D0A9', hairStyle: 'long', hairColor: '#1A1A1A', expression: 'happy', clothing: 'hoodie', accessory: 'glasses' },
    level: 3,
    totalXP: 340,
  },
  {
    id: 'user_sam',
    nickname: 'Sam Rocket 🚀',
    avatar: { skinColor: '#D2B48C', hairStyle: 'short', hairColor: '#8B4513', expression: 'determined', clothing: 'jacket', accessory: 'headphones' },
    level: 3,
    totalXP: 290,
  },
  {
    id: 'user_zoe',
    nickname: 'Zoe Runner 🏃‍♀️',
    avatar: { skinColor: '#FFE4C4', hairStyle: 'braids', hairColor: '#000000', expression: 'smile', clothing: 'sporty_tshirt', accessory: 'none' },
    level: 2,
    totalXP: 180,
  },
  {
    id: 'user_alex',
    nickname: 'Alex Explorer 🧭',
    avatar: { skinColor: '#FFDFBF', hairStyle: 'spiky', hairColor: '#D2691E', expression: 'smile', clothing: 'hoodie', accessory: 'cap' },
    level: 2,
    totalXP: 120,
  },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user, studentProfile } = useAuthStore();
  const [rankings, setRankings] = useState<LeaderboardUser[]>(DEFAULT_RANKINGS);
  const [loading, setLoading] = useState(false);

  // Subscribe to top student profiles
  useEffect(() => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'profiles'),
        orderBy('totalXP', 'desc'),
        limit(50) // Load top 50 students
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: LeaderboardUser[] = [];
        snapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            ...doc.data(),
          } as LeaderboardUser);
        });
        if (list.length > 0) {
          // If current user is in local state and not in list, append
          setRankings(list);
        }
        setLoading(false);
      }, (error) => {
        console.warn('Error fetching leaderboard rankings, using defaults:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (e) {
      setLoading(false);
    }
  }, [user]);

  // Find current user's rank
  const myIndex = rankings.findIndex((p) => p.id === user?.uid);
  const myRank = myIndex !== -1 ? myIndex + 1 : null;
  const myStats = myIndex !== -1 ? rankings[myIndex] : null;

  // Split top 3 from list
  const top1 = rankings[0];
  const top2 = rankings[1];
  const top3 = rankings[2];
  const remainingRanks = rankings.slice(3);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']} style={{ backgroundColor: '#F8F9FF' }}>
      <View className="flex-1" style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        {/* Cartoon Header */}
        <View className="px-5 py-4 border-b-2 border-slate-200 bg-white flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="mr-3 p-2 bg-slate-100 rounded-full border border-slate-200"
          >
            <ArrowLeft size={22} color={colors.text.DEFAULT} strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="font-nunito-extrabold text-2xl text-text">🏆 Hall of Heroes</Text>
            <Text className="font-nunito-bold text-xs text-text-secondary">Weekly XP Standings</Text>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            <Text className="font-nunito-bold text-text-secondary mt-3">Loading Standings...</Text>
          </View>
        ) : rankings.length === 0 ? (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="font-nunito-bold text-heading-sm text-text-secondary">No heroes on the board yet!</Text>
          </View>
        ) : (
          <View className="flex-1">
            <ScrollView className="flex-1 px-5 pt-3" showsVerticalScrollIndicator={false}>
            
            {/* ==================== PODIUM SECTION ==================== */}
            <View className="flex-row justify-center items-end mt-4 mb-6 pt-6 pb-2">
              
              {/* Rank 2 (Left) */}
              {top2 && (
                <View className="items-center mx-2 w-[85px]">
                  <View className="relative mb-2">
                    <Card variant="default" className="p-0.5 bg-white border-2 border-text rounded-full shadow-sm">
                      <Avatar config={top2.avatar} size={55} />
                    </Card>
                    <View className="absolute bottom-[-6px] right-[16px] bg-slate-300 border border-text px-1.5 py-0.5 rounded-full">
                      <Text className="font-nunito-extrabold text-[9px] text-text">2</Text>
                    </View>
                  </View>
                  <Text className="font-nunito-extrabold text-xs text-text text-center" numberOfLines={1}>
                    {top2.nickname}
                  </Text>
                  <Text className="font-nunito-bold text-[10px] text-slate-500 mt-0.5">
                    {top2.totalXP} XP
                  </Text>
                  {/* Podium Base */}
                  <View className="h-10 w-full bg-slate-200 border-2 border-b-0 border-text mt-2 rounded-t-lg items-center justify-center">
                    <Text className="text-sm">🥈</Text>
                  </View>
                </View>
              )}

              {/* Rank 1 (Center) */}
              {top1 && (
                <View className="items-center mx-2 w-[100px]">
                  <View className="relative mb-3">
                    {/* Crown */}
                    <View className="absolute top-[-20px] left-[26px] z-10 rotate-12">
                      <Crown size={24} color="#FFB300" fill="#FFB300" strokeWidth={1.5} />
                    </View>
                    <Card 
                      variant="default" 
                      className="p-1 bg-white border-[3px] border-amber-400 rounded-full shadow-sm"
                    >
                      <Avatar config={top1.avatar} size={65} />
                    </Card>
                    <View className="absolute bottom-[-6px] right-[24px] bg-amber-400 border border-text px-1.5 py-0.5 rounded-full">
                      <Text className="font-nunito-extrabold text-[9px] text-text">1</Text>
                    </View>
                  </View>
                  <Text className="font-nunito-extrabold text-body-md text-text text-center" numberOfLines={1}>
                    {top1.nickname}
                  </Text>
                  <Text className="font-nunito-bold text-xs text-amber-600 mt-0.5">
                    {top1.totalXP} XP
                  </Text>
                  {/* Podium Base */}
                  <View className="h-14 w-full bg-amber-100 border-[3px] border-b-0 border-amber-400 mt-2 rounded-t-xl items-center justify-center">
                    <Text className="text-lg">🥇</Text>
                  </View>
                </View>
              )}

              {/* Rank 3 (Right) */}
              {top3 && (
                <View className="items-center mx-2 w-[85px]">
                  <View className="relative mb-2">
                    <Card variant="default" className="p-0.5 bg-white border-2 border-text rounded-full shadow-sm">
                      <Avatar config={top3.avatar} size={55} />
                    </Card>
                    <View className="absolute bottom-[-6px] right-[16px] bg-orange-200 border border-text px-1.5 py-0.5 rounded-full">
                      <Text className="font-nunito-extrabold text-[9px] text-text">3</Text>
                    </View>
                  </View>
                  <Text className="font-nunito-extrabold text-xs text-text text-center" numberOfLines={1}>
                    {top3.nickname}
                  </Text>
                  <Text className="font-nunito-bold text-[10px] text-slate-500 mt-0.5">
                    {top3.totalXP} XP
                  </Text>
                  {/* Podium Base */}
                  <View className="h-8 w-full bg-orange-100 border-2 border-b-0 border-text mt-2 rounded-t-lg items-center justify-center">
                    <Text className="text-xs">🥉</Text>
                  </View>
                </View>
              )}
            </View>

            {/* ==================== LIST SECTION ==================== */}
            <View className="gap-3 pb-24">
              {rankings.map((player, index) => {
                const rank = index + 1;
                const isMe = player.id === user?.uid;
                
                // Medals check
                let medal = '';
                if (rank === 1) medal = '🥇';
                else if (rank === 2) medal = '🥈';
                else if (rank === 3) medal = '🥉';

                return (
                  <Card
                    key={player.id}
                    variant="default"
                    className="p-4 bg-white border-2 border-text rounded-3xl flex-row items-center shadow-sm"
                    style={{
                      borderColor: isMe ? '#4CAF50' : colors.text.DEFAULT,
                      backgroundColor: isMe ? '#F0FDF4' : '#FFF',
                    }}
                  >
                    {/* Rank Number */}
                    <View className="w-8 items-center">
                      {medal ? (
                        <Text className="text-xl">{medal}</Text>
                      ) : (
                        <Text className="font-nunito-extrabold text-body-md text-text-secondary">
                          {rank}
                        </Text>
                      )}
                    </View>

                    {/* Avatar */}
                    <Card variant="default" className="p-0.5 bg-slate-50 border-2 border-text rounded-full ml-1">
                      <Avatar config={player.avatar} size={38} />
                    </Card>

                    {/* Nickname & Level */}
                    <View className="flex-1 ml-4 mr-2">
                      <Text 
                        className={`font-nunito-extrabold text-body-lg text-text`}
                        numberOfLines={1}
                      >
                        {player.nickname}
                      </Text>
                      <Text className="font-nunito-bold text-[10px] text-text-secondary">
                        Level {player.level || 1}
                      </Text>
                    </View>

                    {/* XP Score */}
                    <View className="bg-purple/10 border border-purple/30 px-3 py-1 rounded-full">
                      <Text className="font-nunito-extrabold text-xs text-purple">
                        {player.totalXP} XP
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </ScrollView>

          {/* ==================== STICKY CURRENT USER STATS BAR ==================== */}
          {myStats && (
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-text px-6 py-4 flex-row items-center justify-between shadow-elevated">
              <View className="flex-row items-center">
                <Card variant="default" className="p-0.5 bg-slate-50 border-2 border-text rounded-full mr-3">
                  <Avatar config={myStats.avatar} size={40} />
                </Card>
                <View>
                  <Text className="font-nunito-extrabold text-body-lg text-text">
                    You ({myStats.nickname})
                  </Text>
                  <Text className="font-nunito-bold text-xs text-text-secondary mt-0.5">
                    Your Rank: #{myRank} • Level {myStats.level}
                  </Text>
                </View>
              </View>
              
              <View className="bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-full">
                <Text className="font-nunito-extrabold text-xs text-emerald-800">
                  {myStats.totalXP} XP
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}
