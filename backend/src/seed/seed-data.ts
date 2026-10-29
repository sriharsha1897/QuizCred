export const seedQuizzes = [
  {
    title: 'World Capitals',
    description:
      'Four capital cities. The pass mark is 75, so three correct answers clear the quiz.',
    stake: 100,
    reward: 250,
    passMark: 75,
    questions: [
      {
        prompt: 'What is the capital of France?',
        options: ['Lyon', 'Paris', 'Nice', 'Marseille'],
        correctIndex: 1,
      },
      {
        prompt: 'What is the capital of Japan?',
        options: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'],
        correctIndex: 2,
      },
      {
        prompt: 'What is the capital of Canada?',
        options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
        correctIndex: 3,
      },
      {
        prompt: 'What is the capital of Kenya?',
        options: ['Mombasa', 'Nairobi', 'Kisumu', 'Nakuru'],
        correctIndex: 1,
      },
    ],
  },
  {
    title: 'Quick Arithmetic',
    description: 'Four short calculations. The pass mark is 50, so two correct answers are enough.',
    stake: 50,
    reward: 150,
    passMark: 50,
    questions: [
      {
        prompt: 'What is 7 + 5?',
        options: ['10', '11', '12', '13'],
        correctIndex: 2,
      },
      {
        prompt: 'What is 9 × 3?',
        options: ['18', '27', '36', '21'],
        correctIndex: 1,
      },
      {
        prompt: 'What is 15 − 4?',
        options: ['11', '9', '12', '10'],
        correctIndex: 0,
      },
      {
        prompt: 'What is 8 ÷ 2?',
        options: ['2', '6', '3', '4'],
        correctIndex: 3,
      },
    ],
  },
];
