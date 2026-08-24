import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, CheckCircle2, RotateCw } from 'lucide-react-native';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { useAuthStore } from '@/features/auth/stores/authStore';
import { db, auth } from '@/config/firebase';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { colors } from '@/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, sendVerification, signOut } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  // Auto-reload auth state on mount/interval to detect verification automatically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          clearInterval(interval);
          handleVerificationSuccess();
        }
      } catch (e) {
        // Silent catch during background check
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [user]);

  const handleVerificationSuccess = async () => {
    if (!auth.currentUser) return;
    const { uid, email } = auth.currentUser;

    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      let isOnboarded = false;

      if (!userDoc.exists()) {
        // Initialize Firestore User Document
        const initialUserData = {
          email: email || '',
          role: 'student',
          createdAt: serverTimestamp(),
          isOnboarded: false,
          settings: {
            notificationsEnabled: true,
            voiceEnabled: true,
            soundEnabled: true,
            hapticEnabled: true,
          },
        };
        await setDoc(userDocRef, initialUserData);
      } else {
        isOnboarded = userDoc.data()?.isOnboarded || false;
      }

      // Route based on onboarding status
      if (isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)/avatar');
      }
    } catch (error: any) {
      Alert.alert('Verification Error', 'Failed to create user record. Please try again.');
    }
  };

  const checkStatus = async () => {
    if (!auth.currentUser) return;
    try {
      setChecking(true);
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        await handleVerificationSuccess();
      } else {
        Alert.alert('Not Verified Yet', 'Please click the link in your verification email before checking status.');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to refresh verification status. Please check your internet connection.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await sendVerification();
      Alert.alert('Verification Sent', 'A new verification link has been sent to your email address.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send verification link.');
    } finally {
      setResending(false);
    }
  };

  const handleUseDifferentAccount = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (e) {
      router.replace('/(auth)/login');
    }
  };

  const handleQuickStart = async () => {
    // Allows instant jump to avatar customization
    router.replace('/(onboarding)/avatar');
  };

  return (
    <View className="flex-1 bg-background justify-center items-center px-5 py-8" style={{ backgroundColor: '#F8F9FF' }}>
      <View style={{ maxWidth: 480, width: '100%' }}>
        {/* Cartoon Header */}
        <View className="items-center mb-6">
          <View 
            className="w-24 h-24 rounded-full items-center justify-center mb-3 shadow-lg border-4"
            style={{ backgroundColor: '#DCFCE7', borderColor: '#22C55E' }}
          >
            <Text className="text-5xl">📬</Text>
          </View>
          <Text className="font-nunito-extrabold text-3xl text-text text-center">
            Verify Your Email
          </Text>
          <Text className="font-nunito-semibold text-sm text-text-secondary text-center mt-1 px-4">
            We sent a verification link to:{"\n"}
            <Text className="font-nunito-extrabold text-base text-primary" style={{ color: colors.primary.DEFAULT }}>
              {user?.email || 'your email'}
            </Text>
          </Text>
        </View>

        <Card 
          className="p-6 bg-white rounded-3xl border-2 border-text mb-6 shadow-md"
          style={{ borderBottomWidth: 5 }}
        >
          <Text className="font-nunito-medium text-sm text-text-secondary text-center mb-6 leading-5">
            Click the link sent to your inbox, then tap below to begin your adventure!
          </Text>

          <Button
            variant="primary"
            size="lg"
            loading={checking}
            onPress={checkStatus}
            className="w-full mb-3 shadow-sm"
          >
            ✨ I've Verified My Email
          </Button>

          <Button
            variant="outline"
            size="md"
            loading={resending}
            onPress={handleResend}
            className="w-full mb-3"
          >
            🔄 Resend Email Link
          </Button>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleQuickStart}
            className="py-2 items-center"
          >
            <Text className="font-nunito-extrabold text-xs text-blue-600 underline">
              Demo Mode: Skip to Avatar Builder ➔
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Use Different Account Button */}
        <View className="items-center">
          <TouchableOpacity
            onPress={handleUseDifferentAccount}
            activeOpacity={0.7}
            className="flex-row items-center gap-2 px-5 py-3 rounded-full bg-slate-100 border border-slate-200"
          >
            <RotateCw size={16} color={colors.text.secondary} />
            <Text className="font-nunito-extrabold text-sm text-text-secondary">
              Use a different account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
