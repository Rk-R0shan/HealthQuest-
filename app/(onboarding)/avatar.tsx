import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Avatar, SKIN_COLORS, HAIR_COLORS, CLOTHING_COLORS } from '@/shared/components/ui/Avatar';
import { useOnboardingStore } from '@/features/auth/stores/onboardingStore';
import { colors } from '@/theme';

type Category = 'skin' | 'hairStyle' | 'hairColor' | 'expression' | 'clothing' | 'accessory';

interface OptionItem {
  id: string;
  label: string;
  value: string;
}

export default function OnboardingAvatar() {
  const router = useRouter();
  const { avatar, setAvatar } = useOnboardingStore();
  const [activeCategory, setActiveCategory] = useState<Category>('skin');

  // Define customization categories
  const categories: { key: Category; label: string; icon: string }[] = [
    { key: 'skin', label: 'Skin', icon: '🎨' },
    { key: 'hairStyle', label: 'Hair Style', icon: '💇' },
    { key: 'hairColor', label: 'Hair Color', icon: '🌈' },
    { key: 'expression', label: 'Face', icon: '😊' },
    { key: 'clothing', label: 'Outfit', icon: '👕' },
    { key: 'accessory', label: 'Accessory', icon: '🕶️' },
  ];

  // Options lists
  const optionsMap: Record<Category, OptionItem[]> = {
    skin: Object.keys(SKIN_COLORS).map((c) => ({ id: c, label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
    hairStyle: [
      { id: 'short', label: 'Short', value: 'short' },
      { id: 'spiky', label: 'Spiky', value: 'spiky' },
      { id: 'curly', label: 'Curly', value: 'curly' },
      { id: 'long', label: 'Long', value: 'long' },
    ],
    hairColor: Object.keys(HAIR_COLORS).map((c) => ({ id: c, label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
    expression: [
      { id: 'smile', label: 'Friendly', value: 'smile' },
      { id: 'happy', label: 'Cheerful', value: 'happy' },
      { id: 'determined', label: 'Heroic', value: 'determined' },
      { id: 'surprised', label: 'Excited', value: 'surprised' },
    ],
    clothing: Object.keys(CLOTHING_COLORS).map((c) => ({ id: c, label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
    accessory: [
      { id: 'none', label: 'None', value: 'none' },
      { id: 'glasses', label: 'Glasses', value: 'glasses' },
      { id: 'headphones', label: 'Headphones', value: 'headphones' },
      { id: 'crown', label: 'Crown', value: 'crown' },
    ],
  };

  const handleSelectOption = (value: string) => {
    setAvatar({
      ...avatar,
      [activeCategory]: value,
    });
  };

  return (
    <Screen scrollable={false}>
      <View className="flex-1 px-4 py-4 justify-between" style={{ maxWidth: 540, width: '100%', alignSelf: 'center' }}>
        
        {/* Header */}
        <View className="items-center">
          <Text className="font-nunito-extrabold text-2xl text-text text-center">
            🎨 Design Your Hero
          </Text>
          <Text className="font-nunito-bold text-xs text-text-secondary text-center mt-1">
            Customize your mascot for HealthQuest adventures!
          </Text>
        </View>

        {/* Hero Avatar Display Pedestal */}
        <View className="items-center justify-center my-3">
          <View 
            className="w-40 h-40 rounded-full bg-gradient-to-b from-blue-50 to-indigo-100 border-4 border-indigo-400 shadow-lg items-center justify-center relative overflow-hidden"
            style={{
              backgroundColor: '#EEF2FF',
              borderColor: '#818CF8',
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
            }}
          >
            <Avatar config={avatar} size={130} />
          </View>
        </View>

        {/* Category Tabs Selector */}
        <View className="mb-2">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2, paddingVertical: 4 }}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setActiveCategory(cat.key)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isActive ? '#4F46E5' : '#FFFFFF',
                    borderColor: isActive ? '#3730A3' : '#CBD5E1',
                    borderWidth: 2,
                    borderBottomWidth: isActive ? 2 : 4,
                  }}
                  className="px-3.5 py-1.5 mr-2.5 rounded-full flex-row items-center justify-center shadow-sm"
                >
                  <Text className="mr-1 text-sm">{cat.icon}</Text>
                  <Text 
                    className={`font-nunito-extrabold text-xs ${isActive ? 'text-white' : 'text-slate-700'}`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Option Selection Grid */}
        <View 
          className="flex-1 bg-white border-2 border-slate-200 rounded-3xl p-3.5 mb-4 shadow-sm"
          style={{ borderBottomWidth: 4 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap justify-between">
              {optionsMap[activeCategory].map((opt) => {
                const isSelected = avatar[activeCategory] === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => handleSelectOption(opt.value)}
                    activeOpacity={0.8}
                    style={{
                      width: '48%',
                      backgroundColor: isSelected ? '#EEF2FF' : '#F8FAFC',
                      borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                      borderWidth: 2,
                      borderBottomWidth: isSelected ? 4 : 3,
                    }}
                    className="p-3 mb-3 rounded-2xl items-center justify-center shadow-xs"
                  >
                    {/* Render visual color circles for color tabs */}
                    {activeCategory === 'skin' && (
                      <View 
                        style={{ backgroundColor: SKIN_COLORS[opt.value], width: 28, height: 28 }} 
                        className="rounded-full border-2 border-slate-700 mb-1.5 shadow-xs"
                      />
                    )}
                    {activeCategory === 'hairColor' && (
                      <View 
                        style={{ backgroundColor: HAIR_COLORS[opt.value], width: 28, height: 28 }} 
                        className="rounded-full border-2 border-slate-700 mb-1.5 shadow-xs"
                      />
                    )}
                    {activeCategory === 'clothing' && (
                      <View 
                        style={{ backgroundColor: CLOTHING_COLORS[opt.value], width: 28, height: 28 }} 
                        className="rounded-full border-2 border-slate-700 mb-1.5 shadow-xs"
                      />
                    )}
                    
                    <Text className={`font-nunito-extrabold text-xs text-center ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {opt.label} {isSelected ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Navigation Action */}
        <Button 
          variant="primary" 
          size="lg"
          onPress={() => router.push('/(onboarding)/username')}
        >
          Next: Choose Name ➔
        </Button>
        
      </View>
    </Screen>
  );
}
