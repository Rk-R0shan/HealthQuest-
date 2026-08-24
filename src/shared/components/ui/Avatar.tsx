import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle, Rect, Path, G, Ellipse } from 'react-native-svg';
import { AvatarConfig } from '@/shared/types/database';

interface AvatarProps {
  config: AvatarConfig;
  size?: number;
  style?: ViewStyle;
}

export const SKIN_COLORS: Record<string, string> = {
  peach: '#FFD1A9',
  honey: '#E5A65D',
  chocolate: '#8D5524',
  almond: '#F1C27D',
  fair: '#FFE0BD',
};

export const HAIR_COLORS: Record<string, string> = {
  black: '#1E293B',
  brown: '#5D4037',
  blonde: '#F59E0B',
  red: '#DC2626',
  purple: '#7C3AED',
};

export const CLOTHING_COLORS: Record<string, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  pink: '#EC4899',
};

export const Avatar: React.FC<AvatarProps> = ({ config, size = 100, style }) => {
  const skin = SKIN_COLORS[config.skinColor] || SKIN_COLORS.peach;
  const hairColor = HAIR_COLORS[config.hairColor] || HAIR_COLORS.black;
  const clothes = CLOTHING_COLORS[config.clothing] || CLOTHING_COLORS.blue;

  return (
    <View style={[{ width: size, height: size, overflow: 'hidden' }, style]}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* 1. Background / Base Shadow */}
        <Circle cx="50" cy="50" r="48" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />

        {/* 2. Back Hair Layer (falls behind shoulders & neck) */}
        {config.hairStyle === 'long' && (
          <G fill={hairColor} stroke="#0F172A" strokeWidth="3">
            {/* Left Twin Tail */}
            <Path d="M 24 44 C 12 55 14 78 20 86 C 26 86 28 78 28 66 Z" />
            {/* Right Twin Tail */}
            <Path d="M 76 44 C 88 55 86 78 80 86 C 74 86 72 78 72 66 Z" />
          </G>
        )}

        {/* 3. Neck & Body / Shirt Layer */}
        <Rect x="44" y="62" width="12" height="15" fill={skin} stroke="#0F172A" strokeWidth="3" />
        
        <Path
          d="M 18 92 Q 50 68 82 92 Z"
          fill={clothes}
          stroke="#0F172A"
          strokeWidth="3"
        />
        {/* Shirt Collar / Neck Trim */}
        <Path
          d="M 38 77 Q 50 86 62 77"
          fill="none"
          stroke="#0F172A"
          strokeWidth="3"
        />

        {/* 4. Head & Ears Base */}
        <Circle cx="50" cy="46" r="23" fill={skin} stroke="#0F172A" strokeWidth="3" />
        {/* Left & Right Ears */}
        <Circle cx="26" cy="46" r="4.5" fill={skin} stroke="#0F172A" strokeWidth="3" />
        <Circle cx="74" cy="46" r="4.5" fill={skin} stroke="#0F172A" strokeWidth="3" />

        {/* 5. Rosy Cheeks (Cute Mascot Touch) */}
        <Circle cx="35" cy="50" r="3.5" fill="#FF8A80" opacity={0.4} />
        <Circle cx="65" cy="50" r="3.5" fill="#FF8A80" opacity={0.4} />

        {/* 6. Front Hair Sets (Properly positioned & aligned) */}
        {config.hairStyle === 'short' && (
          <G fill={hairColor} stroke="#0F172A" strokeWidth="3">
            <Path d="M 26 44 C 23 23 32 14 50 14 C 68 14 77 23 74 44 C 72 38 67 33 60 35 C 54 37 50 31 44 33 C 38 35 32 31 26 44 Z" />
          </G>
        )}

        {config.hairStyle === 'spiky' && (
          <G fill={hairColor} stroke="#0F172A" strokeWidth="3">
            <Path d="M 26 43 L 23 28 L 31 18 L 38 25 L 50 10 L 62 25 L 69 18 L 77 28 L 74 43 C 71 36 65 33 58 35 C 52 37 48 31 42 34 C 36 36 29 33 26 43 Z" />
          </G>
        )}

        {config.hairStyle === 'curly' && (
          <G fill={hairColor} stroke="#0F172A" strokeWidth="3">
            {/* Fluffy cloud puffs framing head */}
            <Circle cx="26" cy="38" r="7.5" />
            <Circle cx="29" cy="26" r="8.5" />
            <Circle cx="40" cy="16" r="9" />
            <Circle cx="50" cy="14" r="9.5" />
            <Circle cx="60" cy="16" r="9" />
            <Circle cx="71" cy="26" r="8.5" />
            <Circle cx="74" cy="38" r="7.5" />
            {/* Smooth base filling gap over head */}
            <Path d="M 26 40 C 26 22 34 16 50 16 C 66 16 74 22 74 40 C 70 34 64 32 58 34 C 52 36 48 31 42 33 C 36 35 30 33 26 40 Z" fill={hairColor} stroke="none" />
            <Path d="M 26 40 C 30 33 36 35 42 33 C 48 31 52 36 58 34 C 64 32 70 34 74 40" fill="none" stroke="#0F172A" strokeWidth="3" />
          </G>
        )}

        {config.hairStyle === 'long' && (
          <G fill={hairColor} stroke="#0F172A" strokeWidth="3">
            {/* Front Bangs & Crown */}
            <Path d="M 26 44 C 23 23 33 14 50 14 C 67 14 77 23 74 44 C 72 37 66 33 59 35 C 50 37 45 32 39 34 C 33 36 28 35 26 44 Z" />
            {/* Hair Ties */}
            <Circle cx="21" cy="54" r="3" fill="#EF4444" stroke="#0F172A" strokeWidth="2" />
            <Circle cx="79" cy="54" r="3" fill="#EF4444" stroke="#0F172A" strokeWidth="2" />
          </G>
        )}

        {/* 7. Eyes & Expression */}
        {config.expression === 'happy' && (
          <G stroke="#0F172A" strokeWidth="3" fill="none">
            {/* Happy Closed Arcs */}
            <Path d="M 38 43 Q 43 38 46 43" />
            <Path d="M 54 43 Q 57 38 62 43" />
            {/* Cheerful Open Smile */}
            <Path d="M 43 53 Q 50 63 57 53 Z" fill="#EF4444" />
          </G>
        )}

        {config.expression === 'smile' && (
          <G stroke="#0F172A" strokeWidth="3" fill="none">
            {/* Dot eyes */}
            <Circle cx="42" cy="44" r="2.5" fill="#0F172A" />
            <Circle cx="58" cy="44" r="2.5" fill="#0F172A" />
            {/* Smile curve */}
            <Path d="M 44 54 Q 50 61 56 54" />
          </G>
        )}

        {config.expression === 'determined' && (
          <G stroke="#0F172A" strokeWidth="3" fill="none">
            {/* Hero Eyebrows */}
            <Path d="M 37 39 L 45 42" strokeWidth="2.5" />
            <Path d="M 55 42 L 63 39" strokeWidth="2.5" />
            {/* Confident Eyes */}
            <Circle cx="42" cy="45" r="2.5" fill="#0F172A" />
            <Circle cx="58" cy="45" r="2.5" fill="#0F172A" />
            {/* Determined smirk */}
            <Path d="M 44 55 L 56 55" />
          </G>
        )}

        {config.expression === 'surprised' && (
          <G stroke="#0F172A" strokeWidth="3" fill="none">
            {/* Round Eyes */}
            <Circle cx="42" cy="43" r="3.5" fill="none" />
            <Circle cx="42" cy="43" r="1.5" fill="#0F172A" />
            <Circle cx="58" cy="43" r="3.5" fill="none" />
            <Circle cx="58" cy="43" r="1.5" fill="#0F172A" />
            {/* O-Mouth */}
            <Circle cx="50" cy="55" r="4" fill="#EF4444" />
          </G>
        )}

        {/* 8. Accessories Layer */}
        {config.accessory === 'glasses' && (
          <G stroke="#0F172A" strokeWidth="3.5" fill="none">
            {/* Left Lens */}
            <Circle cx="41" cy="44" r="8" stroke="#3B82F6" />
            {/* Right Lens */}
            <Circle cx="59" cy="44" r="8" stroke="#3B82F6" />
            {/* Bridge */}
            <Path d="M 49 44 L 51 44" />
            {/* Frames to ears */}
            <Path d="M 25 44 L 33 44" />
            <Path d="M 67 44 L 75 44" />
          </G>
        )}

        {config.accessory === 'crown' && (
          <G>
            <Path
              d="M 35 22 L 30 9 L 41 15 L 50 5 L 59 15 L 70 9 L 65 22 Z"
              fill="#F59E0B"
              stroke="#0F172A"
              strokeWidth="2.5"
            />
            {/* Jewels on Crown */}
            <Circle cx="30" cy="9" r="1.5" fill="#EF4444" />
            <Circle cx="50" cy="5" r="1.5" fill="#3B82F6" />
            <Circle cx="70" cy="9" r="1.5" fill="#10B981" />
          </G>
        )}

        {config.accessory === 'headphones' && (
          <G stroke="#0F172A" strokeWidth="3" fill="none">
            {/* Headband */}
            <Path d="M 26 42 Q 50 14 74 42" stroke="#8B5CF6" strokeWidth="4" />
            {/* Ear Cups */}
            <Ellipse cx="25" cy="46" rx="4" ry="7.5" fill="#8B5CF6" />
            <Ellipse cx="75" cy="46" rx="4" ry="7.5" fill="#8B5CF6" />
          </G>
        )}
      </Svg>
    </View>
  );
};
