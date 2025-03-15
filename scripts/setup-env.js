const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envFilePath = path.join(__dirname, '..', '.env.local');

console.log('AI Sports Analyzer - Environment Setup');
console.log('======================================');
console.log('This script will help you set up your environment variables.');
console.log('You will need your Supabase, OpenAI, and Roboflow API keys.');
console.log('\n');

const questions = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    message: 'Enter your Supabase URL:',
    default: 'https://dxnpmtzugaveqmojynnk.supabase.co'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    message: 'Enter your Supabase Anon Key:',
    default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bnBtdHp1Z2F2ZXFtb2p5bm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNTI5NDAsImV4cCI6MjA1NTkyODk0MH0.IG_WqvJnDloTEwG9M6w46t_0wjV_kPBZy75PIm2vh5o'
  },
  {
    name: 'NEXT_PUBLIC_OPENAI_API_KEY',
    message: 'Enter your OpenAI API Key:',
    default: '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'
  },
  {
    name: 'NEXT_PUBLIC_ROBOFLOW_API_KEY',
    message: 'Enter your Roboflow API Key:',
    default: '305kTUjX7IoYABj7vMen'
  }
];

const envVars = {};

function askQuestion(index) {
  if (index >= questions.length) {
    writeEnvFile();
    return;
  }

  const question = questions[index];
  rl.question(`${question.message} (default: ${question.default}) `, (answer) => {
    envVars[question.name] = answer.trim() || question.default;
    askQuestion(index + 1);
  });
}

function writeEnvFile() {
  let envContent = '';
  
  for (const [key, value] of Object.entries(envVars)) {
    envContent += `${key}=${value}\n`;
  }

  fs.writeFileSync(envFilePath, envContent);
  
  console.log('\nEnvironment variables have been saved to .env.local');
  console.log('You can now run the application with:');
  console.log('  npm run dev');
  console.log('\nDon\'t forget to set up your Supabase database using the SQL script in scripts/setup-supabase.sql');
  
  rl.close();
}

// Check if .env.local already exists
if (fs.existsSync(envFilePath)) {
  rl.question('.env.local already exists. Do you want to overwrite it? (y/n) ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      askQuestion(0);
    } else {
      console.log('Setup cancelled. Your .env.local file was not modified.');
      rl.close();
    }
  });
} else {
  askQuestion(0);
} 