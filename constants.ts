
import { Lesson, Difficulty, ChatMessage } from './types';

// REPLACE THIS URL WITH YOUR UPLOADED LOGO URL
export const APP_LOGO = "https://ui-avatars.com/api/?name=Apex+Code+Labs&background=0ea5e9&color=fff&rounded=true&bold=true&size=128";

// Used for seeding the database if empty
export const INITIAL_CURRICULUM: Lesson[] = [
  {
    id: 'l1',
    title: 'Hello, World!',
    description: 'Your first step into Python. Learn how to print text to the screen.',
    difficulty: Difficulty.Beginner,
    topics: ['print function', 'strings', 'syntax'],
    content: `
# Welcome to Python

Python is a high-level programming language known for its readability and simplicity. 

### The Print Function
To display output in Python, we use the \`print()\` function. It takes a "string" (text enclosed in quotes) and outputs it to the console.

Example:
\`\`\`python
print("Hello, Python!")
\`\`\`
    `,
    initialCode: `# Write your code below\nprint("Hello, World!")`,
    task: 'Use the print function to output exactly: Hello, World!',
    expectedOutput: 'Hello, World!',
    quiz: [
        {
            id: 'q1_1',
            question: 'Which function is used to output text to the console in Python?',
            options: ['console.log()', 'print()', 'echo()', 'write()'],
            correctAnswer: 1
        },
        {
            id: 'q1_2',
            question: 'How do you denote a string in Python?',
            options: ['With curly braces {}', 'With square brackets []', 'With quotes "" or \'\'', 'With parenthesis ()'],
            correctAnswer: 2
        }
    ]
  },
  {
    id: 'l2',
    title: 'Variables & Data Types',
    description: 'Learn how to store data using variables.',
    difficulty: Difficulty.Beginner,
    topics: ['variables', 'integers', 'strings'],
    content: `
# Variables

Variables are containers for storing data values. In Python, you don't need to declare the type of a variable.

### Creating Variables
\`\`\`python
x = 5
name = "John"
\`\`\`

Variables can store different types of data:
*   **Strings**: text ("Hello")
*   **Integers**: whole numbers (5)
*   **Floats**: decimals (5.99)
    `,
    initialCode: `# Create a variable named 'hero' with the value 'Batman'\nhero = "Batman"\n# Print the variable\n`,
    task: 'Define a variable named `hero` and assign it the string "Batman". Then print the variable.',
    expectedOutput: 'Batman',
    quiz: [
        {
            id: 'q2_1',
            question: 'Which of the following is an Integer?',
            options: ['"5"', '5.0', '5', '[5]'],
            correctAnswer: 2
        },
        {
            id: 'q2_2',
            question: 'Do you need to declare a variable type in Python?',
            options: ['Yes, always', 'No, Python is dynamically typed', 'Only for strings', 'Only for numbers'],
            correctAnswer: 1
        }
    ]
  },
  {
    id: 'l3',
    title: 'Control Flow: If/Else',
    description: 'Make decisions in your code with conditional statements.',
    difficulty: Difficulty.Intermediate,
    topics: ['if', 'else', 'conditionals'],
    content: `
# If ... Else

Python supports logical conditions from mathematics.

*   Equals: a == b
*   Not Equals: a != b
*   Less than: a < b

\`\`\`python
a = 33
b = 200
if b > a:
  print("b is greater than a")
else:
  print("a is greater")
\`\`\`
    `,
    initialCode: `score = 85\n\n# Check if score is greater than 50\nif score > 50:\n    print("Pass")\nelse:\n    print("Fail")`,
    task: 'Write an if/else statement. If score > 50 print "Pass", otherwise print "Fail".',
    expectedOutput: 'Pass',
    quiz: [
        {
            id: 'q3_1',
            question: 'What keyword handles the "false" condition in an if statement?',
            options: ['then', 'otherwise', 'else', 'elif'],
            correctAnswer: 2
        }
    ]
  },
  {
      id: 'l4',
      title: 'Mini Project: Calculator',
      description: 'Build a simple calculator using functions and control flow.',
      difficulty: Difficulty.Intermediate,
      topics: ['functions', 'return', 'math'],
      content: `
# Mini Project: Simple Calculator

Now let's combine what we've learned! You will build a simple calculator.

### Functions
Functions are blocks of code that run when they are called. You can pass data, known as parameters, into a function.

\`\`\`python
def my_function(x):
  return 5 * x
\`\`\`
      `,
      initialCode: `def add(a, b):\n    # Return the sum of a and b\n    pass\n\ndef subtract(a, b):\n    # Return the difference\n    pass\n\n# Test your functions\nprint(add(5, 3))\nprint(subtract(10, 4))`,
      task: 'Implement the add and subtract functions so they return the correct mathematical results. The output should be 8 and 6.',
      expectedOutput: '8\n6'
  }
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [];
