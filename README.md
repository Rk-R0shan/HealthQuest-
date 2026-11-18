# 🌟 HealthQuest

<div align="center">

![HealthQuest Banner](https://img.shields.io/badge/HealthQuest-Adventure%20for%20Kids-4CAF50?style=for-the-badge&logo=heart&logoColor=white)

**A gamified health, nutrition, and wellness learning adventure designed specifically for young children and early readers.**

[![Live Web App](https://img.shields.io/badge/Live%20Demo-health--quest--pi.vercel.app-blue?style=flat-square&logo=vercel)](https://health-quest-pi.vercel.app)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-NativeWind%20v4-38B2AC?style=flat-square&logo=tailwind-css)](https://nativewind.dev)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%2011-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)

</div>

---

## 📖 About HealthQuest

**HealthQuest** transforms essential childhood health education into an interactive, role-playing adventure. Rather than reading dry textbooks, young children build their own personalized superhero mascot, embark on colorful quests, earn gold coins and XP, and level up by mastering healthy everyday habits.

The app is built from the ground up to be **accessible for young children (ages 5–9 / Kindergarten to Grade 3)**, featuring large chunky tap targets, vibrant cartoon illustrations, short accessible vocabulary, and built-in text-to-speech audio narration.

---

## ✨ Key Features

### 🛡️ Customizable Hero Avatar Creator
- **Interactive Customization**: Children style their own health mascot by selecting skin tones, hair styles, colors, heroic facial expressions, outfits, and accessories (crowns, glasses, headphones).
- **Persistent Cloud Sync**: Avatars are saved directly to Google Cloud Firestore and sync seamlessly across iOS, Android, and Desktop web browsers.

### 🧠 Interactive Picture Quizzes (Child-First Design)
- **Visual Answer Cards**: Chunky 3D-styled cards with large picture emojis, bold titles, and helpful hints.
- **🔊 "Read to Me" Audio Support**: Integrated text-to-speech powered by `expo-speech` with gentle pitch and slower cadence for pre-readers and early learners.
- **Instant Encouraging Feedback**: Single-tap answers with instant audio chimes (Web Audio API synthesis), cheerful green highlights, and constructive mascot tips.
- **Playful Rewards**: Star ratings (`⭐⭐⭐`), level-up fanfare, and gold treasure chests.

### 📚 Bite-Sized Learning Curriculum
- **🍎 Nutrition**: The rainbow fruit superpower guide (energy bananas, heart-protecting apples, memory grapes).
- **🏃 Fitness & Movement**: Heart muscle mechanics and 30-minute daily activity challenges.
- **💤 Sleep & Rest**: Battery recharge science, screen turn-off routines, and 9–11 hour sleep goals.
- **🧼 Hygiene & Dental**: The 2-minute brushing rule and germ-busting handwashing adventures.

### 🎮 Gamification & Daily Habit Tracking
- **Habit Tracking**: Interactive daily hydration counter (tap to log water cups 🥛), movement steps, and rest logs.
- **Game Economy**: Energy points (⚡), Daily Streaks (🔥), Level progression, and Gold Coins (🪙).
- **Achievements & Badges**: Unlockable trophies such as *First Quiz Master*, *Brainiac (100% Score)*, and *Water Hero*.
- **Hero Leaderboard**: Friendly, wholesome weekly league competition with classmates.

### 🎒 Companion Teacher Web Portal
- Dedicated web portal (`/teacher-portal`) built with React and Vite for educators and parents to monitor student progress, review quiz attempts, and assign classroom health challenges.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile & Web App** | React Native 0.81, Expo SDK 54, Expo Router v6 (File-based Routing) |
| **Language & Styling** | TypeScript 5.9, NativeWind (Tailwind CSS v3), Lucide React Native |
| **State Management** | Zustand (persistent auth, onboarding, and student profiles) |
| **Data Fetching** | TanStack React Query v5 |
| **Backend & Auth** | Google Cloud Firestore, Firebase Authentication |
| **Audio & Haptics** | `expo-speech` (TTS narration), Web Audio API Synthesizer (`soundEffects.ts`), `expo-haptics` |
| **Hosting & CI/CD** | Vercel (Live Web / PWA), Expo Application Services (EAS for iOS/Android) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- [Expo Go App](https://expo.dev/client) (optional, for running natively on your phone)

### 1. Clone the Repository
```bash
git clone https://github.com/Rk-R0shan/HealthQuest-.git
cd HealthQuest-
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Environment Variables Setup
Create a `.env` file in the project root with your Firebase credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY="your-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
EXPO_PUBLIC_FIREBASE_APP_ID="your-app-id"
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

### 4. Run the Development Server
```bash
# Start local development server
npm start

# Or launch directly in your browser
npm run web
```

---

## 📁 Project Structure

```text
HealthQuest-/
├── app/                        # Expo Router file-based route definitions
│   ├── (auth)/                 # Authentication routes (Login, Signup, Verify)
│   ├── (onboarding)/           # Mascot Avatar creation & onboarding flow
│   ├── (tabs)/                 # Bottom tab bar screens
│   │   ├── index.tsx           # Student Explorer Dashboard (XP, Streak, Hydration)
│   │   ├── learn/              # Learning modules and video quests
│   │   ├── quiz/               # Picture-first interactive quiz arena
│   │   ├── challenges/         # Daily healthy habits tracker
│   │   └── profile/            # Hero profile, level rank, unlocked badges
│   ├── _layout.tsx             # Root layout with font loading & auth guards
│   └── leaderboard.tsx         # Classmate podium & rankings
├── assets/                     # Fonts, icons, and static images
├── scratch/                    # Firestore database seed scripts (quizzes, lessons)
├── src/
│   ├── config/                 # Firebase SDK & QueryClient initialization
│   ├── features/               # Auth, Profile, and Onboarding Zustand stores
│   ├── shared/
│   │   ├── components/         # Reusable UI cards, 3D buttons, SVG avatar engine
│   │   └── utils/              # Sound effects synthesizer, achievements engine
│   └── theme/                  # Color palette, spacing, and styling tokens
├── teacher-portal/             # Independent React + Vite web portal for educators
├── vercel.json                 # Vercel SPA routing & anti-cache deployment config
└── package.json
```

---

## 🔒 Child Safety & Privacy Principles

HealthQuest is built with child safety as an uncompromising foundation:
- 🚫 **Zero Advertisements**: Absolutely no third-party ads, tracking pixels, or marketing analytics.
- 🔗 **Zero External Links**: No outbound hyperlinks or web redirects that could take young children outside the learning environment.
- 🛡️ **Minimal Data Collection**: Only student nicknames, avatars, and learning quest scores are stored.
- 👨‍👩‍👧 **COPPA & FERPA Compliant Principles**: Safe for classroom deployment and personal home use.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
