
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeForumContent = async (content: string, type: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert community moderator. Analyze this forum ${type} for toxicity, spam, or harassment.
      Content: "${content}"
      
      Provide a concise 1-sentence risk assessment and a safety score from 0-100 (0=Safe, 100=Dangerous).`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Analysis failed. System manual check required.";
  }
};
