import { Question, QuestionCategory, QUESTION_CATEGORIES } from "@/types/questions";
import { PositionJD } from "@/types/positions";
import { ApiL1Question } from "@/types/api";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export async function generateQuestionsFromJD(jobDescription: string): Promise<Question[]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API Key is missing. Please set VITE_OPENROUTER_API_KEY in your .env.local file.");
  }

  const systemPrompt = `You are an expert HR Technical Recruiter. Your task is to analyze the following Job Description (JD) and generate a highly structured, professional set of 8-12 interview questions tailored specifically to the requirements and responsibilities outlined in the JD.

For each question, assign it to ONE of the following precise categories: ${QUESTION_CATEGORIES.join(", ")}. Ensure there is a good mix of categories represented.

You MUST respond strictly with a valid JSON object containing a single key "questions" which is an array of objects. Do not include any markdown formatting or explanations.

Example required format:
{
  "questions": [
    {
      "id": "unique-string-1",
      "text": "How do you approach debugging complex technical issues in [Technology from JD]?",
      "category": "Technical"
    },
    {
      "id": "unique-string-2",
      "text": "Tell me about a time you had to lead a critical project under a tight deadline.",
      "category": "Leadership"
    }
  ]
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        response_format: { type: "json_object" }, // OpenRouter supports this for OpenAI models to encourage JSON
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please generate interview questions based on this Job Description:\n\n${jobDescription}` }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Invalid response from OpenRouter API: No content returned.");
    }

    // Clean up potential markdown formatting if the model still outputs it despite instructions
    content = content.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```\n?$/, '').trim();

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse JSON:", content);
      throw new Error("Failed to parse JSON response from the AI model.");
    }

    // Extract the questions array
    let questionsArray: Question[] = [];
    if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
      questionsArray = parsedContent.questions;
    } else if (Array.isArray(parsedContent)) {
      questionsArray = parsedContent;
    } else {
      console.error("Unexpected JSON structure:", parsedContent);
      throw new Error(`Invalid response format: Expected an object with a 'questions' array, got: ${JSON.stringify(parsedContent).slice(0, 100)}...`);
    }

    // Validate structure basic
    if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
      throw new Error("Invalid response format: Expected a non-empty array of questions.");
    }

    // Ensure all questions have an ID
    return questionsArray.map((q, index) => ({
      ...q,
      id: q.id || `gen-${Date.now()}-${index}`
    }));

  } catch (error) {
    console.error("Error generating questions from OpenRouter:", error);
    throw error;
  }
}

export async function enhanceJDWithAI(rawJD: string, existingJD?: PositionJD): Promise<PositionJD> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API Key is missing. Please set VITE_OPENROUTER_API_KEY in your .env.local file.");
  }

  const systemPrompt = `You are an Elite Executive Technical Recruiter at a FAANG tier company. You write highly professional, expansive, and deeply engaging Job Descriptions. Your task is to process the user's input and return a fully structured Job Description.

${existingJD ? `CRITICAL CONTEXT: The user is requesting modifications to an EXISTING Job Description. Here is the current Job Description:
${JSON.stringify(existingJD, null, 2)}
You must ONLY modify the specific sections requested by the user's prompt. Keep all other sections exactly as they are in the current Job Description. If the user asks to "make experience fresher", you ONLY change the experience section to reflect 0-1 years of experience and leave everything else identical.` : `CRITICAL CONTEXT: You are creating a NEW Job Description from scratch based on the user's constraints.`}

OUTPUT REQUIREMENTS:
If generating new sections or heavily modifying existing ones, ensure elite FAANG-level quality:
- "purpose": 4-6 highly professional sentences detailing the role's strategic impact and core mission.
- "education": 4+ rigorous and detailed bullet points (degrees, preferred certifications).
- "experience": 6+ highly descriptive bullet points blending technical requirements, scale, and cross-functional leadership.
- "responsibilities": 8-10 expansive, action-oriented bullet points outlining daily tasks, ownership, and strategic deliverables.
- "skills": 10+ specific hard and soft skills, technologies, and traits.

You MUST respond strictly with a valid JSON object matching the exact format below. Do not include any markdown formatting or text outside the JSON object.

Required JSON format:
{
  "purpose": "string",
  "education": ["string", "string"],
  "experience": ["string", "string"],
  "responsibilities": ["string", "string"],
  "skills": ["string", "string"]
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: existingJD ? `Please modify the job description according to these instructions:\n\n${rawJD}` : `Please enhance and structure this raw Job Description:\n\n${rawJD}` }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Invalid response from OpenRouter API: No content returned.");
    }

    content = content.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```\n?$/, '').trim();

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse JSON:", content);
      throw new Error("Failed to parse JSON response from the AI model.");
    }

    // Validate structure
    const jd = parsedContent as Partial<PositionJD>;
    if (
      !jd.purpose ||
      !Array.isArray(jd.education) ||
      !Array.isArray(jd.experience) ||
      !Array.isArray(jd.responsibilities) ||
      !Array.isArray(jd.skills)
    ) {
      console.error("Unexpected JSON structure:", parsedContent);
      throw new Error("Invalid response format: The AI did not return the expected Job Description structure.");
    }

    return jd as PositionJD;

  } catch (error) {
    console.error("Error enhancing JD with OpenRouter:", error);
    throw error;
  }
}

export async function enhanceFullJDWithAI(rawJD: string): Promise<PositionJD> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API Key is missing. Please set VITE_OPENROUTER_API_KEY in your .env.local file.");
  }

  const systemPrompt = `You are an Elite Executive Technical Recruiter at a FAANG tier company. You write highly professional, expansive, and deeply engaging Job Descriptions. 
Your task is to take an ENTIRE existing, potentially unformatted, messy, or basic Job Description provided by the user, and completely rewrite it to an elite FAANG standard.
You must extract all the relevant information and structure it perfectly.

OUTPUT REQUIREMENTS:
- "purpose": 4-6 highly professional sentences detailing the role's strategic impact and core mission. Enhance the grammar and tone.
- "education": 4+ rigorous and detailed bullet points (degrees, preferred certifications) extracted or logically inferred.
- "experience": 6+ highly descriptive bullet points blending technical requirements, scale, and cross-functional leadership based on what is provided.
- "responsibilities": 8-10 expansive, action-oriented bullet points outlining daily tasks, ownership, and strategic deliverables.
- "skills": 10+ specific hard and soft skills, technologies, and traits.

You MUST respond strictly with a valid JSON object matching the exact format below. Do not include any markdown formatting or text outside the JSON object.

Required JSON format:
{
  "purpose": "string",
  "education": ["string", "string"],
  "experience": ["string", "string"],
  "responsibilities": ["string", "string"],
  "skills": ["string", "string"]
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please completely restructure and enhance this raw Job Description into an elite format:\n\n${rawJD}` }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Invalid response from OpenRouter API: No content returned.");
    }

    try {
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedContent = JSON.parse(content);
      
      const jd = parsedContent as Partial<PositionJD>;
      if (
        !jd.purpose ||
        !Array.isArray(jd.education) ||
        !Array.isArray(jd.experience) ||
        !Array.isArray(jd.responsibilities) ||
        !Array.isArray(jd.skills)
      ) {
        console.error("Unexpected JSON structure:", parsedContent);
        throw new Error("Invalid response format: The AI did not return the expected Job Description structure.");
      }

      return jd as PositionJD;
    } catch (parseError) {
      console.error("JSON Parsing Error:", content);
      throw new Error("Failed to parse the generated Job Description. The AI might not have returned valid JSON.");
    }
  } catch (error) {
    console.error("Error enhancing full JD:", error);
    throw error;
  }
}

export async function generateL1Questions(
  jobDescription: string,
  role: string,
  counts: { easy: number; medium: number; hard: number }
): Promise<ApiL1Question[]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API Key is missing. Please set VITE_OPENROUTER_API_KEY in your .env.local file.");
  }

  const total = counts.easy + counts.medium + counts.hard;
  if (total === 0) return [];

  const systemPrompt = `You are an expert HR Technical Recruiter. Your task is to generate a highly structured, professional set of exactly ${total} 1st Level (L1) interview questions for the role of "${role}".
The difficulty distribution MUST be exactly:
- ${counts.easy} "Easy" questions
- ${counts.medium} "Medium" questions
- ${counts.hard} "Hard" questions

Analyze the following Job Description (JD) to ensure the questions are tailored to the specific requirements and tech stack.
For each question, assign it to ONE of the following precise categories: ${QUESTION_CATEGORIES.join(", ")}. Ensure there is a good mix of categories represented.

You MUST respond strictly with a valid JSON object containing a single key "questions" which is an array of objects. Do not include any markdown formatting or explanations.

Example required format:
{
  "questions": [
    {
      "id": "unique-string-1",
      "text": "What is the primary advantage of using a virtual DOM in React?",
      "category": "Technical",
      "difficulty": "Easy"
    },
    {
      "id": "unique-string-2",
      "text": "Tell me about a time you had to lead a critical project under a tight deadline.",
      "category": "Leadership",
      "difficulty": "Medium"
    }
  ]
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please generate exactly ${total} interview questions (${counts.easy} Easy, ${counts.medium} Medium, ${counts.hard} Hard) based on this Job Description for the "${role}" role:\n\n${jobDescription}` }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Invalid response from OpenRouter API: No content returned.");
    }

    content = content.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```\n?$/, '').trim();

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse JSON:", content);
      throw new Error("Failed to parse JSON response from the AI model.");
    }

    let questionsArray: any[] = [];
    if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
      questionsArray = parsedContent.questions;
    } else if (Array.isArray(parsedContent)) {
      questionsArray = parsedContent;
    } else {
      throw new Error("Invalid response format: Expected an object with a 'questions' array.");
    }

    // Ensure all questions have an ID and match the ApiL1Question interface
    return questionsArray.map((q, index) => ({
      id: q.id || "gen-" + Date.now() + "-" + index,
      text: q.text || "Missing question text",
      category: q.category || "Technical",
      difficulty: ["Easy", "Medium", "Hard"].includes(q.difficulty) ? q.difficulty : "Medium"
    })) as ApiL1Question[];

  } catch (error) {
    console.error("Error generating L1 questions from OpenRouter:", error);
    throw error;
  }
}
