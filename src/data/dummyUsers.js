const DUMMY_IMAGES = [
  require('../../assets/img1.jpeg'),
  require('../../assets/img2.jpeg'),
  require('../../assets/img3.jpeg'),
  require('../../assets/img4.jpeg'),
  require('../../assets/img5.jpeg'),
  require('../../assets/img6.jpeg'),
  require('../../assets/img7.jpeg'),
  require('../../assets/img8.jpeg'),
  require('../../assets/img9.jpeg'),
  require('../../assets/img10.jpeg'),
  require('../../assets/img11.jpeg'),
  require('../../assets/img12.jpeg'),
  require('../../assets/img13.jpeg'),
  require('../../assets/img14.jpeg'),
  require('../../assets/img15.jpeg'),
  require('../../assets/img16.jpeg'),
  require('../../assets/img17.jpeg'),
  require('../../assets/img18.jpeg'),
  require('../../assets/img19.jpeg'),
  require('../../assets/img20.jpeg'),
  require('../../assets/img21.jpeg'),
  require('../../assets/img22.jpeg'),
  require('../../assets/img23.jpeg'),
  require('../../assets/img24.jpeg'),
];

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
  "Bars", "Club", "Anime", "Beaches", "Mountains", "Reading"
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

export const generateDummyUsers = () => {
  return DUMMY_IMAGES.map((image, index) => {
    return {
      id: `dummy_${index + 1}`,
      name: NAMES[index % NAMES.length],
      age: Math.floor(Math.random() * (28 - 19 + 1)) + 19,
      photos: [image], // Array as expected by profile structure
      job: getRandomItem(JOBS),
      bio: getRandomItem(BIOS),
      interests: getRandomInterests(),
      gender: 'Female',
      lookingFor: getRandomItem(LOOKING_FOR),
      religion: getRandomItem(RELIGION),
      location: 'India' // Placeholder
    };
  });
};
