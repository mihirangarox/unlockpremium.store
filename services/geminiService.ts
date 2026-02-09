
import { GoogleGenAI } from "@google/genai";
import { SERVICES } from "../constants";
import { ChatMessage } from "../types";

// Fix: Initializing GoogleGenAI using the mandatory named parameter and direct process.env.API_KEY access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using ChatMessage type for chatHistory to ensure consistency with the UI component
export const getGeminiResponse = async (userPrompt: string, chatHistory: ChatMessage[]) => {
  // Use gemini-3-flash-preview for general text-based assistant tasks
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are the "UnlockPremium Concierge", a sophisticated and helpful AI assistant for the UnlockPremium store.
    We specialize exclusively in LinkedIn Premium upgrades.
    
    Current Promotion: We are offering 70% OFF all LinkedIn Premium plans compared to official retail prices.
    
    Our Services:
    ${SERVICES.map(s => `- ${s.name}: Features: ${s.features.join(', ')}`).join('\n')}
    
    Guidelines:
    1. Be concise, professional, and persuasive.
    2. Emphasize the "70% OFF" deal as the primary value proposition.
    3. Help users find the right LinkedIn tier:
       - Career Premium: For job seekers and course access.
       - Business Premium: For deep company insights and networking.
       - Sales Navigator: For professional lead generation and CRM tools.
    4. If a user asks about delivery, inform them it's usually within 10-30 minutes but can take up to 24 hours.
    5. Be friendly and use professional/luxury vocabulary (elite, professional edge, unlock potential, premium).
    6. Always respond in Markdown format for better readability.
  `;

  try {
    // Properly formatting contents to include chatHistory. Roles must be 'user' or 'model'.
    const contents = [
      ...chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: userPrompt }] }
    ];

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.9,
      }
    });

    // Fix: Using the .text property (not a method) to extract the response
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again or check our services manually!";
  }
};
