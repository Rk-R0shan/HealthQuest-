import React from 'react';
import { View, ViewStyle, ScrollView, Platform } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  maxWidth?: number;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  edges = ['top', 'left', 'right'],
  style,
  contentContainerStyle,
  maxWidth = 580,
}) => {
  const containerStyle: ViewStyle = {
    maxWidth: Platform.OS === 'web' ? maxWidth : undefined,
    width: '100%',
    alignSelf: 'center',
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={edges} style={[{ backgroundColor: '#F8F9FF' }, style]}>
      {scrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={[
            { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
            containerStyle,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 px-5 pt-4 pb-8" style={[containerStyle, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};
