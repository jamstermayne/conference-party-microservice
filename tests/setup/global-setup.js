/**
 * Global Test Setup
 * Runs once before all tests to prepare the test environment
 */

const fs = require('fs');
const path = require('path');

async function globalSetup(config) {
  console.log('🚀 Starting global test setup...');
  
  // Create test results directory
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }
  
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';
  
  // Create test data directory
  const testDataDir = path.join(process.cwd(), 'tests', 'fixtures', 'data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  // Initialize test database (if needed)
  await initializeTestDatabase();
  
  // Seed test data
  await seedTestData();
  
  console.log('✅ Global test setup complete');
  
  // Return a teardown function
  return async () => {
    console.log('🧹 Running global teardown...');
    await cleanupTestData();
  };
}

async function initializeTestDatabase() {
  // In a real app, this would set up a test database
  // For this demo, we'll use localStorage mock
  console.log('  📦 Initializing test database...');
  
  const mockData = {
    users: generateMockUsers(50),
    gatherings: generateMockGatherings(20),
    conversations: generateMockConversations(30),
    matches: generateMockMatches(100)
  };
  
  // Save to fixtures
  const fixturesPath = path.join(process.cwd(), 'tests', 'fixtures', 'mock-data.json');
  fs.writeFileSync(fixturesPath, JSON.stringify(mockData, null, 2));
  
  console.log('  ✅ Test database initialized');
}

async function seedTestData() {
  console.log('  🌱 Seeding test data...');
  
  // Create standard test users
  const testUsers = [
    {
      id: 'test_cto_001',
      email: 'alice@test.com',
      name: 'Alice Chen',
      title: 'CTO',
      company: 'TechStartup Inc',
      industry: 'Technology',
      interests: ['AI', 'Scaling', 'Leadership', 'Architecture'],
      skills: ['Python', 'AWS', 'Team Management', 'System Design'],
      goals: ['hiring', 'networking', 'mentoring'],
      bio: 'Building scalable systems and high-performing teams',
      linkedinUrl: 'https://linkedin.com/in/alice-chen',
      experience: 15,
      location: 'San Francisco, CA'
    },
    {
      id: 'test_eng_001',
      email: 'bob@test.com',
      name: 'Bob Smith',
      title: 'Senior Engineer',
      company: 'GameDev Studio',
      industry: 'Gaming',
      interests: ['Gaming', 'Performance', 'Graphics', 'AI'],
      skills: ['C++', 'Unity', 'Unreal Engine', 'OpenGL'],
      goals: ['learning', 'networking', 'job-seeking'],
      bio: 'Passionate about creating immersive gaming experiences',
      linkedinUrl: 'https://linkedin.com/in/bob-smith',
      experience: 8,
      location: 'Los Angeles, CA'
    },
    {
      id: 'test_pm_001',
      email: 'carol@test.com',
      name: 'Carol Davis',
      title: 'Product Manager',
      company: 'BigTech Corp',
      industry: 'Technology',
      interests: ['Product Strategy', 'User Research', 'Analytics', 'AI'],
      skills: ['Product Management', 'Data Analysis', 'User Research', 'Agile'],
      goals: ['networking', 'learning', 'partnership'],
      bio: 'Driving product innovation through user-centered design',
      linkedinUrl: 'https://linkedin.com/in/carol-davis',
      experience: 10,
      location: 'Seattle, WA'
    },
    {
      id: 'test_investor_001',
      email: 'david@ventures.com',
      name: 'David Martinez',
      title: 'Partner',
      company: 'Martinez Ventures',
      industry: 'Venture Capital',
      interests: ['Startups', 'AI', 'Gaming', 'Web3'],
      skills: ['Investment Analysis', 'Due Diligence', 'Portfolio Management'],
      goals: ['investing', 'networking', 'mentoring'],
      bio: 'Investing in the future of gaming and AI',
      linkedinUrl: 'https://linkedin.com/in/david-martinez',
      experience: 12,
      location: 'New York, NY'
    }
  ];
  
  // Save test users
  const usersPath = path.join(process.cwd(), 'tests', 'fixtures', 'test-users.json');
  fs.writeFileSync(usersPath, JSON.stringify(testUsers, null, 2));
  
  console.log('  ✅ Test data seeded');
}

async function cleanupTestData() {
  console.log('  🧹 Cleaning up test data...');
  
  // Clean up test files
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (fs.existsSync(testResultsDir)) {
    // Keep the directory but clean old results
    const files = fs.readdirSync(testResultsDir);
    files.forEach(file => {
      const filePath = path.join(testResultsDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
  }
  
  console.log('  ✅ Cleanup complete');
}

// Mock data generators
function generateMockUsers(count) {
  const users = [];
  const titles = ['Engineer', 'Designer', 'Product Manager', 'CTO', 'CEO', 'Developer'];
  const companies = ['TechCorp', 'StartupInc', 'GameStudio', 'AILabs', 'CloudCo'];
  const industries = ['Technology', 'Gaming', 'Finance', 'Healthcare', 'Education'];
  
  for (let i = 0; i < count; i++) {
    users.push({
      id: `user_${i}`,
      name: `User ${i}`,
      email: `user${i}@test.com`,
      title: titles[i % titles.length],
      company: companies[i % companies.length],
      industry: industries[i % industries.length],
      interests: generateRandomInterests(),
      skills: generateRandomSkills(),
      goals: generateRandomGoals(),
      experience: Math.floor(Math.random() * 20) + 1
    });
  }
  
  return users;
}

function generateMockGatherings(count) {
  const gatherings = [];
  const types = ['coffee', 'lunch', 'workshop', 'demo', 'networking'];
  const venues = ['Starbucks Hall 6', 'Demo Booth 7', 'Workshop Room 1', 'Networking Lounge'];
  
  for (let i = 0; i < count; i++) {
    gatherings.push({
      id: `gathering_${i}`,
      type: types[i % types.length],
      title: `Test Gathering ${i}`,
      description: `Description for test gathering ${i}`,
      venue: venues[i % venues.length],
      organizerId: `user_${i % 10}`,
      capacity: Math.floor(Math.random() * 20) + 5,
      attendees: [],
      status: 'active',
      startTime: new Date(Date.now() + i * 3600000).toISOString()
    });
  }
  
  return gatherings;
}

function generateMockConversations(count) {
  const conversations = [];
  
  for (let i = 0; i < count; i++) {
    conversations.push({
      id: `conv_${i}`,
      participants: [`user_${i}`, `user_${(i + 1) % 50}`],
      messages: generateMockMessages(Math.floor(Math.random() * 10) + 1),
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      lastMessageAt: new Date().toISOString()
    });
  }
  
  return conversations;
}

function generateMockMessages(count) {
  const messages = [];
  const contents = [
    'Hi! Great to connect!',
    'Looking forward to the conference',
    'Would love to discuss your work',
    'Any sessions you recommend?',
    'Let\'s meet up at the event'
  ];
  
  for (let i = 0; i < count; i++) {
    messages.push({
      id: `msg_${Date.now()}_${i}`,
      content: contents[i % contents.length],
      senderId: i % 2 === 0 ? 'user_0' : 'user_1',
      timestamp: new Date(Date.now() - (count - i) * 60000).toISOString()
    });
  }
  
  return messages;
}

function generateMockMatches(count) {
  const matches = [];
  
  for (let i = 0; i < count; i++) {
    matches.push({
      user1Id: `user_${i % 50}`,
      user2Id: `user_${(i + 1) % 50}`,
      score: Math.floor(Math.random() * 40) + 60,
      reasoning: 'Shared interests in AI and gaming',
      createdAt: new Date().toISOString()
    });
  }
  
  return matches;
}

function generateRandomInterests() {
  const allInterests = [
    'AI', 'Machine Learning', 'Gaming', 'Web Development',
    'Mobile Development', 'Cloud Computing', 'DevOps', 'Security',
    'Blockchain', 'AR/VR', 'Data Science', 'Product Design'
  ];
  
  const count = Math.floor(Math.random() * 4) + 2;
  const interests = [];
  
  for (let i = 0; i < count; i++) {
    const interest = allInterests[Math.floor(Math.random() * allInterests.length)];
    if (!interests.includes(interest)) {
      interests.push(interest);
    }
  }
  
  return interests;
}

function generateRandomSkills() {
  const allSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
    'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'GraphQL'
  ];
  
  const count = Math.floor(Math.random() * 5) + 3;
  const skills = [];
  
  for (let i = 0; i < count; i++) {
    const skill = allSkills[Math.floor(Math.random() * allSkills.length)];
    if (!skills.includes(skill)) {
      skills.push(skill);
    }
  }
  
  return skills;
}

function generateRandomGoals() {
  const allGoals = [
    'networking', 'learning', 'hiring', 'job-seeking',
    'partnership', 'investing', 'mentoring', 'fundraising'
  ];
  
  const count = Math.floor(Math.random() * 3) + 1;
  const goals = [];
  
  for (let i = 0; i < count; i++) {
    const goal = allGoals[Math.floor(Math.random() * allGoals.length)];
    if (!goals.includes(goal)) {
      goals.push(goal);
    }
  }
  
  return goals;
}

module.exports = globalSetup;