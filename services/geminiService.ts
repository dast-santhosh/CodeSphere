import { GoogleGenAI, Type } from "@google/genai";
import { CodeExecutionResult } from '../types';

// Safely get the key
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const executePythonCode = async (code: string): Promise<CodeExecutionResult> => {
  if (!API_KEY) {
    return { output: '', error: 'API Key missing. Cannot execute code.' };
  }

  try {
    const prompt = `
      You are a Python interpreter. 
      Execute the following Python code and return the output.
      If there is an error, return the error message.
      
      Do NOT explain the code. ONLY return the output as if it were running in a console.
      If the code requests input(), assume the input is "Test Input".
      
      Code to execute:
      ${code}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const output = response.text || '';
    return { output: output.trim() };
  } catch (error: any) {
    console.error("Gemini Execution Error:", error);
    return { output: '', error: 'Failed to connect to CODESPHERE runtime.' };
  }
};

export const gradeCode = async (code: string, task: string): Promise<CodeExecutionResult> => {
  if (!API_KEY) {
    return { output: '', error: 'API Key missing. Cannot grade.' };
  }

  try {
    const prompt = `
      You are a strict code auto-grader for a Python course.
      
      Task: "${task}"
      Student Code:
      ${code}

      Analyze if the code fulfills the task.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              passed: {
                type: Type.BOOLEAN,
                description: "True if the code correctly fulfills the task."
              },
              output: {
                type: Type.STRING,
                description: "The simulated output of the code."
              },
              feedback: {
                type: Type.STRING,
                description: "Constructive feedback for the student."
              }
            },
            required: ["passed", "output", "feedback"]
          }
      }
    });

    const text = response.text || '{}';
    const result = JSON.parse(text);

    return {
      isCorrect: result.passed,
      output: result.output,
      feedback: result.feedback
    };

  } catch (error) {
    console.error("Gemini Grading Error:", error);
    return { output: '', error: 'Grading service unavailable.' };
  }
};

export const getAiAssistance = async (context: string, question: string): Promise<string> => {
   if (!API_KEY) return "I need an API Key to help you!";

   try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context: ${context}\n\nStudent Question: ${question}\n\nProvide a helpful, short, and encouraging answer as a tutor named CodeSphere Bot.`,
      });
      return response.text || "I couldn't think of an answer right now.";
   } catch (e) {
       return "Sorry, I am offline.";
   }
};