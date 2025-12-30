import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const NAMES = [
  "Aanya", "Diya", "Isha", "Myra", "Pari", "Riya", "Ananya", "Prisha", 
  "Saanvi", "Saira", "Tara", "Zara", "Aditi", "Kavya", "Khushi", "Meera", 
  "Neha", "Pooja", "Priya", "Sneha", "Tanvi", "Vani", "Vidya", "Zoya"
];

const JOBS = [
  "Software Engineer", "Student", "Designer", "Marketing Manager", "Doctor", 
  "Artist", "Teacher", "Content Creator", "Architect", "Data Analyst", 
  "Writer", "Chef", "Model", "Photographer", "Entrepreneur"
];

const BIOS = [
  "Lover of chai and sunsets.",
  "Here for a good time and a long time.",
  "Just a small town girl living in a lonely world.",
  "Travel enthusiast. Foodie. Dog mom.",
  "Looking for someone to share my fries with.",
  "Music is my escape.",
  "Always down for an adventure.",
  "Sapiosexual.",
  "Not here for hookups.",
  "Let's explore the city together.",
  "Dancing through life.",
  "Dreamer. Believer. Achiever.",
  "Coffee addict.",
  "Fitness freak.",
  "Bookworm.",
  "Living my best life.",
  "Wanderlust.",
  "Good vibes only.",
  "Make it happen.",
  "Stay wild."
];

const INTERESTS = [
  "Music", "Food", "Travel", "Gym", "Movies", "Dance", 
  "Bars", "Club", "Anime", "Beaches", "Mountain", "Reading"
];

const LOOKING_FOR = [
  "Long time partner", "Short time partner", "No commitment", 
  "Still figuring it out", "Hook up type", "Chill type"
];

const RELIGION = [
  "Hindu", "Christian", "Muslim", "Sikh"
];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomInterests = () => {
  const numInterests = Math.floor(Math.random() * 4) + 2; // 2 to 5 interests
  const shuffled = INTERESTS.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numInterests);
};

export const uploadDummyDataToFirebase = async () => {
  const FIXED_DUMMY_USERS = [
    { id: 'dummy_1', name: 'Aanya', age: 24, job: 'Software Engineer', bio: 'Lover of chai and sunsets.', interests: ['Music', 'Travel', 'Reading'], gender: 'Female', lookingFor: 'Long time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/1.jpg'] },
    { id: 'dummy_2', name: 'Diya', age: 22, job: 'Student', bio: 'Here for a good time and a long time.', interests: ['Food', 'Movies', 'Dance'], gender: 'Female', lookingFor: 'Short time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/2.jpg'] },
    { id: 'dummy_3', name: 'Isha', age: 26, job: 'Designer', bio: 'Just a small town girl living in a lonely world.', interests: ['Art', 'Photography', 'Travel'], gender: 'Female', lookingFor: 'No commitment', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/3.jpg'] },
    { id: 'dummy_4', name: 'Myra', age: 23, job: 'Marketing Manager', bio: 'Travel enthusiast. Foodie. Dog mom.', interests: ['Food', 'Travel', 'Dogs'], gender: 'Female', lookingFor: 'Chill type', religion: 'Christian', location: 'India', photos: ['https://randomuser.me/api/portraits/women/4.jpg'] },
    { id: 'dummy_5', name: 'Pari', age: 21, job: 'Student', bio: 'Looking for someone to share my fries with.', interests: ['Food', 'Movies', 'Music'], gender: 'Female', lookingFor: 'Still figuring it out', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/5.jpg'] },
    { id: 'dummy_6', name: 'Riya', age: 25, job: 'Doctor', bio: 'Music is my escape.', interests: ['Music', 'Reading', 'Coffee'], gender: 'Female', lookingFor: 'Long time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/6.jpg'] },
    { id: 'dummy_7', name: 'Ananya', age: 24, job: 'Artist', bio: 'Always down for an adventure.', interests: ['Art', 'Travel', 'Hiking'], gender: 'Female', lookingFor: 'Chill type', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/7.jpg'] },
    { id: 'dummy_8', name: 'Prisha', age: 27, job: 'Teacher', bio: 'Sapiosexual.', interests: ['Reading', 'Writing', 'Coffee'], gender: 'Female', lookingFor: 'Long time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/8.jpg'] },
    { id: 'dummy_9', name: 'Saanvi', age: 22, job: 'Content Creator', bio: 'Not here for hookups.', interests: ['Photography', 'Fashion', 'Travel'], gender: 'Female', lookingFor: 'Long time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/9.jpg'] },
    { id: 'dummy_10', name: 'Saira', age: 23, job: 'Architect', bio: 'Let\'s explore the city together.', interests: ['Architecture', 'Travel', 'Food'], gender: 'Female', lookingFor: 'Short time partner', religion: 'Muslim', location: 'India', photos: ['https://randomuser.me/api/portraits/women/10.jpg'] },
    { id: 'dummy_11', name: 'Tara', age: 25, job: 'Data Analyst', bio: 'Dancing through life.', interests: ['Dance', 'Music', 'Fitness'], gender: 'Female', lookingFor: 'Chill type', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/11.jpg'] },
    { id: 'dummy_12', name: 'Zara', age: 24, job: 'Writer', bio: 'Dreamer. Believer. Achiever.', interests: ['Writing', 'Reading', 'Art'], gender: 'Female', lookingFor: 'No commitment', religion: 'Muslim', location: 'India', photos: ['https://randomuser.me/api/portraits/women/12.jpg'] },
    { id: 'dummy_13', name: 'Aditi', age: 26, job: 'Chef', bio: 'Coffee addict.', interests: ['Cooking', 'Food', 'Coffee'], gender: 'Female', lookingFor: 'Long time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/13.jpg'] },
    { id: 'dummy_14', name: 'Kavya', age: 22, job: 'Model', bio: 'Fitness freak.', interests: ['Fitness', 'Fashion', 'Photography'], gender: 'Female', lookingFor: 'Hook up type', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/14.jpg'] },
    { id: 'dummy_15', name: 'Khushi', age: 23, job: 'Photographer', bio: 'Bookworm.', interests: ['Photography', 'Reading', 'Travel'], gender: 'Female', lookingFor: 'Still figuring it out', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/15.jpg'] },
    { id: 'dummy_16', name: 'Meera', age: 25, job: 'Entrepreneur', bio: 'Living my best life.', interests: ['Business', 'Travel', 'Fitness'], gender: 'Female', lookingFor: 'Long time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/16.jpg'] },
    { id: 'dummy_17', name: 'Neha', age: 24, job: 'Software Engineer', bio: 'Wanderlust.', interests: ['Travel', 'Coding', 'Music'], gender: 'Female', lookingFor: 'Chill type', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/17.jpg'] },
    { id: 'dummy_18', name: 'Pooja', age: 27, job: 'Doctor', bio: 'Good vibes only.', interests: ['Medicine', 'Yoga', 'Meditation'], gender: 'Female', lookingFor: 'Long time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/18.jpg'] },
    { id: 'dummy_19', name: 'Priya', age: 22, job: 'Student', bio: 'Make it happen.', interests: ['Study', 'Music', 'Friends'], gender: 'Female', lookingFor: 'Short time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/19.jpg'] },
    { id: 'dummy_20', name: 'Sneha', age: 23, job: 'Designer', bio: 'Stay wild.', interests: ['Design', 'Art', 'Nature'], gender: 'Female', lookingFor: 'No commitment', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/20.jpg'] },
    { id: 'dummy_21', name: 'Tanvi', age: 25, job: 'Marketing Manager', bio: 'Simplicity is the ultimate sophistication.', interests: ['Marketing', 'Reading', 'Art'], gender: 'Female', lookingFor: 'Long time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/21.jpg'] },
    { id: 'dummy_22', name: 'Vani', age: 24, job: 'Writer', bio: 'Collecting moments, not things.', interests: ['Writing', 'Travel', 'Photography'], gender: 'Female', lookingFor: 'Chill type', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/22.jpg'] },
    { id: 'dummy_23', name: 'Vidya', age: 26, job: 'Teacher', bio: 'Life is short, make it sweet.', interests: ['Teaching', 'Kids', 'Cooking'], gender: 'Female', lookingFor: 'Long time partner', religion: 'Hindu', location: 'India', photos: ['https://randomuser.me/api/portraits/women/23.jpg'] },
    { id: 'dummy_24', name: 'Zoya', age: 23, job: 'Artist', bio: 'Creating my own sunshine.', interests: ['Art', 'Painting', 'Music'], gender: 'Female', lookingFor: 'Still figuring it out', religion: 'Muslim', location: 'India', photos: ['https://randomuser.me/api/portraits/women/24.jpg'] }
  ];

  console.log('Starting fixed dummy user upload...');
  const promises = FIXED_DUMMY_USERS.map(async (user) => {
    // Preserve static data
    const userData = {
      ...user,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.id), userData);
      console.log(`Uploaded user: ${user.name}`);
    } catch (error) {
      console.error(`Error uploading user ${user.name}:`, error);
    }
  });

  await Promise.all(promises);
  console.log('All 24 fixed dummy users uploaded successfully!');
};
