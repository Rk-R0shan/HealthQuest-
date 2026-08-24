import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Avatar } from '@/shared/components/ui/Avatar';
import { useOnboardingStore } from '@/features/auth/stores/onboardingStore';
import { colors } from '@/theme';

// Validation schema matching our database constraints
const nameSchema = z.object({
  nickname: z
    .string()
    .min(3, 'Name must be at least 3 letters long')
    .max(15, 'Name must be 15 letters or less')
    .regex(/^[a-zA-Z0-9_\s]+$/, 'Only letters, numbers, and spaces are allowed'),
});

type FormValues = {
  nickname: string;
};

export default function OnboardingUsername() {
  const router = useRouter();
  const { avatar, nickname, setNickname } = useOnboardingStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      nickname: nickname || '',
    },
  });

  const onSubmit = (data: FormValues) => {
    setNickname(data.nickname.trim());
    router.push('/(onboarding)/grade');
  };

  return (
    <Screen scrollable={false}>
      <View className="flex-1 px-4 py-6 justify-between" style={{ maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        
        {/* Header */}
        <View className="items-center">
          <Text className="font-nunito-extrabold text-2xl text-text text-center">
            👋 What's Your Hero Name?
          </Text>
          <Text className="font-nunito-semibold text-xs text-text-secondary text-center mt-1">
            Choose a fun nickname for your HealthQuest adventure!
          </Text>
        </View>

        {/* Mascot Banner */}
        <View className="items-center my-4">
          <View 
            className="flex-row items-center p-4 bg-white rounded-3xl w-full border-2 border-slate-200 shadow-sm"
            style={{ borderBottomWidth: 4 }}
          >
            <View className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-300 items-center justify-center overflow-hidden mr-3">
              <Avatar config={avatar} size={58} />
            </View>
            <View className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <Text className="font-nunito-bold text-xs text-slate-700">
                "Hi! I'm your health buddy. What should I call you on our quests?"
              </Text>
            </View>
          </View>
        </View>

        {/* Name Input Field */}
        <View className="flex-1 justify-center max-h-[160px] mb-6">
          <Text className="font-nunito-extrabold text-xs text-slate-700 uppercase tracking-wider mb-2 ml-1">
            Hero Nickname
          </Text>
          
          <Controller
            control={control}
            name="nickname"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="relative">
                <TextInput
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="e.g. Captain Spark"
                  placeholderTextColor="#94A3B8"
                  className="font-nunito-extrabold text-lg text-text px-5 py-3.5 bg-white border-2 rounded-2xl w-full"
                  style={{
                    borderColor: errors.nickname ? colors.error : '#CBD5E1',
                    borderBottomWidth: 4,
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}
          />

          {/* Form Validation Errors */}
          {errors.nickname && (
            <Text className="font-nunito-bold text-xs text-red-500 mt-2 ml-1">
              ⚠️ {errors.nickname.message}
            </Text>
          )}
        </View>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
        >
          Next: Choose Grade ➔
        </Button>
        
      </View>
    </Screen>
  );
}
