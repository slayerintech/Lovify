import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const MALE_NAMES = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth'];
const FEMALE_NAMES = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Margaret', 'Betty', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna'];

const BIOS = [
  "Lover of hiking and outdoors.",
  "Coffee addict and bookworm.",
  "Looking for someone to share adventures with.",
  "Foodie, traveler, and dreamer.",
  "Just here to see what happens.",
  "Music is my life.",
  "Always down for a good time.",
  "Fitness enthusiast.",
  "Tech geek and gamer.",
  "Art lover and creative soul."
];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const seedUsers = async () => {
  const users = [];
  
  // Generate 10 Males
  for (let i = 0; i < 10; i++) {
    const id = `dummy_male_${Date.now()}_${i}`;
    users.push({
      id,
      name: getRandomItem(MALE_NAMES),
      age: getRandomInt(18, 35),
      gender: 'male',
      interestedIn: Math.random() > 0.8 ? 'male' : 'female', // Mostly straight for demo, some variation
      bio: getRandomItem(BIOS),
      photos: [`https://randomuser.me/api/portraits/men/${getRandomInt(1, 99)}.jpg`],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Generate 10 Females
  for (let i = 0; i < 10; i++) {
    const id = `dummy_female_${Date.now()}_${i}`;
    users.push({
      id,
      name: getRandomItem(FEMALE_NAMES),
      age: getRandomInt(18, 35),
      gender: 'female',
      interestedIn: Math.random() > 0.8 ? 'female' : 'male',
      bio: getRandomItem(BIOS),
      photos: [`https://randomuser.me/api/portraits/women/${getRandomInt(1, 99)}.jpg`],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    const promises = users.map(user => 
      setDoc(doc(db, 'users', user.id), user)
    );
    await Promise.all(promises);
    console.log('Seeding complete!');
    return true;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};
