/**
 * HealthQuest — Interactive Kids Quiz Seeding Utility
 *
 * Seeds Cloud Firestore with interactive, illustrated trivia quizzes
 * specially designed for young children (early readers / elementary age).
 *
 * Run:
 * node scratch/seed-quizzes.js
 */
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, writeBatch, serverTimestamp } = require('firebase/firestore');

const envPath = path.join(__dirname, '..', '.env');

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
      env[key] = val;
    }
  });

  return env;
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MOCK_QUIZZES = [
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
          { text: 'Yellow Banana', visual: '🍌', subtitle: 'Energy booster', color: '#FEF08A' },
          { text: 'Sugary Lollipop', visual: '🍭', subtitle: 'Too much sugar', color: '#FBCFE8' },
          { text: 'Greasy Fries', visual: '🍟', subtitle: 'Heavy snack', color: '#FED7AA' }
        ],
        correctAnswer: 'Yellow Banana',
        explanation: 'Woohoo! Yellow bananas give long-lasting energy like a full battery! 🍌⚡'
      },
      {
        id: 'q1_2',
        type: 'mcq',
        visual: '❤️',
        question: 'What bright red fruit protects your happy heart?',
        soundPrompt: 'What bright red fruit protects your happy heart?',
        options: [
          { text: 'Crunchy Red Apple', visual: '🍎', subtitle: 'Heart hero', color: '#FECACA' },
          { text: 'Blue Cupcake', visual: '🧁', subtitle: 'Sweet dessert', color: '#BFDBFE' },
          { text: 'Chocolate Bar', visual: '🍫', subtitle: 'Candy treat', color: '#E2E8F0' }
        ],
        correctAnswer: 'Crunchy Red Apple',
        explanation: 'Super! Red apples and strawberries keep your heart beating strong! ❤️🍎'
      },
      {
        id: 'q1_3',
        type: 'mcq',
        visual: '🧠',
        question: 'Which juicy fruit helps your brain remember things?',
        soundPrompt: 'Which juicy fruit helps your brain remember things?',
        options: [
          { text: 'Purple Grapes', visual: '🍇', subtitle: 'Brain helper', color: '#DDD6FE' },
          { text: 'Glazed Donut', visual: '🍩', subtitle: 'Sleepy brain', color: '#FCE7F3' },
          { text: 'Fizzy Soda', visual: '🥤', subtitle: 'Sugar rush', color: '#CFFAFE' }
        ],
        correctAnswer: 'Purple Grapes',
        explanation: 'Brain power unlocked! Purple grapes and blueberries boost your memory! 🍇✨'
      }
    ]
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
          { text: 'YES! True!', visual: '👍', subtitle: 'Strong heart muscle', color: '#BBF7D0' },
          { text: 'NO! False!', visual: '👎', subtitle: 'Not a muscle', color: '#FECDD3' }
        ],
        correctAnswer: 'YES! True!',
        explanation: 'Yes! Your heart is a mighty muscle that loves active playtime! 💓🎉'
      },
      {
        id: 'q2_2',
        type: 'mcq',
        visual: '⏰',
        question: 'How much fun active play should kids get every day?',
        soundPrompt: 'How much fun active play should kids get every day?',
        options: [
          { text: '30 Minutes or More', visual: '🏃‍♂️', subtitle: 'Happy & strong', color: '#BAE6FD' },
          { text: '1 Single Minute', visual: '🛋️', subtitle: 'Too quick!', color: '#E2E8F0' },
          { text: 'Zero Minutes', visual: '😴', subtitle: 'Couch potato', color: '#FED7AA' }
        ],
        correctAnswer: '30 Minutes or More',
        explanation: 'You got it! 30 minutes of running, jumping, and playing keeps you fit! 🌟'
      },
      {
        id: 'q2_3',
        type: 'mcq',
        visual: '⚽',
        question: 'Which activity builds strong legs and happy muscles?',
        soundPrompt: 'Which activity builds strong legs and happy muscles?',
        options: [
          { text: 'Kicking a Ball', visual: '⚽', subtitle: 'Outdoor fun', color: '#BBF7D0' },
          { text: 'Sitting on the Floor', visual: '🛋️', subtitle: 'Not moving', color: '#E2E8F0' },
          { text: 'Napping on the Rug', visual: '😴', subtitle: 'Sleeping', color: '#FDE68A' }
        ],
        correctAnswer: 'Kicking a Ball',
        explanation: 'Goal! Running and kicking a soccer ball makes you super athletic! ⚽🔥'
      }
    ]
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
        question: 'What should we do with tablets and screens 1 hour before bed?',
        soundPrompt: 'What should we do with tablets and screens 1 hour before bed?',
        options: [
          { text: 'Turn Them Off', visual: '📴', subtitle: 'Rest your eyes', color: '#DDD6FE' },
          { text: 'Play Loud Games', visual: '🎮', subtitle: 'Wakes brain up', color: '#FECDD3' },
          { text: 'Hide Under Pillow', visual: '📱', subtitle: 'Sneaky screen', color: '#FDE68A' }
        ],
        correctAnswer: 'Turn Them Off',
        explanation: 'Great choice! Turning screens off helps your brain prepare for sweet dreams! 🌙'
      },
      {
        id: 'q3_2',
        type: 'mcq',
        visual: '🌙',
        question: 'How many hours of sleep do growing superheroes need each night?',
        soundPrompt: 'How many hours of sleep do growing superheroes need each night?',
        options: [
          { text: '9 to 11 Hours', visual: '🛌', subtitle: 'Full recharge', color: '#C7D2FE' },
          { text: '2 Short Hours', visual: '⚡', subtitle: 'Way too sleepy', color: '#FECDD3' },
          { text: 'Zero Hours', visual: '🦉', subtitle: 'Night owl', color: '#E2E8F0' }
        ],
        correctAnswer: '9 to 11 Hours',
        explanation: 'Yes! 9 to 11 hours gives your body time to grow taller and recharge! 😴⭐'
      },
      {
        id: 'q3_3',
        type: 'mcq',
        visual: '🔋',
        question: 'What does your body do while you sleep peacefully?',
        soundPrompt: 'What does your body do while you sleep peacefully?',
        options: [
          { text: 'Recharges Battery!', visual: '🔋', subtitle: 'Repairs & grows', color: '#BBF7D0' },
          { text: 'Turns to Green Slime', visual: '🧪', subtitle: 'Silly monster', color: '#BAE6FD' },
          { text: 'Floats to the Moon', visual: '🎈', subtitle: 'Floating away', color: '#FBCFE8' }
        ],
        correctAnswer: 'Recharges Battery!',
        explanation: 'Hero recharge! Sleep repairs your muscles and keeps you happy! 🛌✨'
      }
    ]
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
        question: 'How many minutes should you brush your teeth to fight cavity bugs?',
        soundPrompt: 'How many minutes should you brush your teeth to fight cavity bugs?',
        options: [
          { text: '2 Full Minutes', visual: '⏳', subtitle: 'Sparkling clean', color: '#A7F3D0' },
          { text: '5 Quick Seconds', visual: '⚡', subtitle: 'Too fast!', color: '#FECDD3' },
          { text: 'Once a Month', visual: '🥱', subtitle: 'Germ city!', color: '#E2E8F0' }
        ],
        correctAnswer: '2 Full Minutes',
        explanation: 'Hooray! 2 minutes with circular brush strokes keeps your teeth bright and strong! 🪥✨'
      },
      {
        id: 'q4_2',
        type: 'mcq',
        visual: '🧼',
        question: 'What washes dirt and playground germs off your hands?',
        soundPrompt: 'What washes dirt and playground germs off your hands?',
        options: [
          { text: 'Soap and Warm Water', visual: '🧼', subtitle: 'Bubbly clean', color: '#BAE6FD' },
          { text: 'Chocolate Pudding', visual: '🍫', subtitle: 'Sticky mess!', color: '#FED7AA' },
          { text: 'Wiping on your Pants', visual: '👖', subtitle: 'Germs remain', color: '#E2E8F0' }
        ],
        correctAnswer: 'Soap and Warm Water',
        explanation: 'Bubbly clean! Soap and water chase all naughty germs right down the drain! 🧼🫧'
      },
      {
        id: 'q4_3',
        type: 'mcq',
        visual: '💧',
        question: 'Which drink protects your teeth and gives you superpowers?',
        soundPrompt: 'Which drink protects your teeth and gives you superpowers?',
        options: [
          { text: 'Fresh Cool Water', visual: '💧', subtitle: 'Best hydration', color: '#BFDBFE' },
          { text: 'Sticky Soda Pop', visual: '🥤', subtitle: 'Cavity monster', color: '#FECDD3' },
          { text: 'Sweet Candy Juice', visual: '🧃', subtitle: 'Lots of sugar', color: '#FED7AA' }
        ],
        correctAnswer: 'Fresh Cool Water',
        explanation: 'Splendid! Cool water rinses your mouth clean and keeps your teeth sparkling! 💧🦷'
      }
    ]
  }
];

async function seed() {
  console.log('🚀 Seeding new Interactive Kid-Friendly Quizzes in Firestore...');
  const batch = writeBatch(db);

  for (const quiz of MOCK_QUIZZES) {
    const quizRef = doc(db, 'quizzes', quiz.id);
    batch.set(quizRef, {
      ...quiz,
      createdAt: serverTimestamp()
    });
    console.log(`➕ Queued Kids Quiz: ${quiz.title} (${quiz.id}) with ${quiz.questions.length} questions`);
  }

  try {
    await batch.commit();
    console.log('🎉 Successfully committed interactive quizzes to Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed quizzes:', error);
    process.exit(1);
  }
}

seed();
