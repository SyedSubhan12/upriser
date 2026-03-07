/**
 * MCQ AI Service — Solver + Generator
 * 
 * Pluggable AI layer for:
 * 1. Solving MCQs with explanations (RAG-style)
 * 2. Generating new MCQ questions from topic + difficulty
 * 3. Providing per-question feedback after student answers
 * 
 * Supports Google Gemini (default) or OpenAI. Set GEMINI_API_KEY or OPENAI_API_KEY.
 */

// ============================================================================
// AI Provider Abstraction
// ============================================================================

interface AIProvider {
    generateText(prompt: string, systemPrompt?: string): Promise<string>;
}

class GeminiProvider implements AIProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = "gemini-2.0-flash") {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const contents: any[] = [];
        if (systemPrompt) {
            contents.push({ role: "user", parts: [{ text: systemPrompt }] });
            contents.push({ role: "model", parts: [{ text: "Understood. I will follow these instructions." }] });
        }
        contents.push({ role: "user", parts: [{ text: prompt }] });

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                    topP: 0.9,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
}

class OpenAIProvider implements AIProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = "gpt-4o-mini") {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        const messages: any[] = [];
        if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
        messages.push({ role: "user", content: prompt });

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: 0.7,
                max_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    }
}

// ============================================================================
// Initialize Provider
// ============================================================================

function getAIProvider(): AIProvider | null {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) return new GeminiProvider(geminiKey);
    if (openaiKey) return new OpenAIProvider(openaiKey);

    return null;
}

let _provider: AIProvider | null | undefined;
function provider(): AIProvider {
    if (_provider === undefined) {
        _provider = getAIProvider();
    }
    if (!_provider) {
        throw new Error("No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env");
    }
    return _provider;
}

export function isAIConfigured(): boolean {
    return !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
}

// ============================================================================
// MCQ SOLVER — Solve a question with step-by-step explanation
// ============================================================================

interface SolveResult {
    selectedOptionIndex: number;
    explanation: string;
    confidence: number; // 0-100
    reasoning: string[];
}

const SOLVER_SYSTEM_PROMPT = `You are an expert exam tutor specializing in IGCSE, A-Level, and IB curricula.
When given an MCQ question, you must:
1. Analyze the question carefully
2. Consider each option
3. Provide step-by-step reasoning
4. Select the correct answer
5. Explain why the correct answer is right AND why others are wrong

Respond ONLY in this exact JSON format (no markdown, no code fences):
{
  "selectedOptionIndex": <number 0-3>,
  "explanation": "<clear explanation for students>",
  "confidence": <number 0-100>,
  "reasoning": ["<step 1>", "<step 2>", "..."]
}`;

export async function solveMcq(
    questionText: string,
    options: { label: string; text: string }[],
    context?: { subject?: string; topic?: string; board?: string },
): Promise<SolveResult> {
    const optionsStr = options.map((o, i) => `${o.label}. ${o.text}`).join("\n");
    const contextStr = context
        ? `\nContext: Subject: ${context.subject || "N/A"}, Topic: ${context.topic || "N/A"}, Board: ${context.board || "N/A"}`
        : "";

    const prompt = `Solve this MCQ question:
${contextStr}

Question: ${questionText}

Options:
${optionsStr}

Provide your answer in the specified JSON format.`;

    const raw = await provider().generateText(prompt, SOLVER_SYSTEM_PROMPT);

    try {
        // Extract JSON from response (handle markdown code fences if present)
        const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse solver response:", raw);
        throw new Error("AI solver returned invalid response format");
    }
}

// ============================================================================
// MCQ GENERATOR — Generate new questions from parameters
// ============================================================================

interface GenerateOptions {
    subject: string;
    topic: string;
    difficulty: "easy" | "medium" | "hard";
    count: number;
    board?: string;
    bloomsLevel?: string;
    style?: string; // e.g., "CAIE May/June style"
    existingQuestions?: string[]; // question texts to avoid duplication
}

interface GeneratedQuestion {
    questionText: string;
    options: { label: string; text: string }[];
    correctOptionIndex: number;
    explanation: string;
    difficulty: string;
    bloomsLevel: string;
    tags: string[];
}

const GENERATOR_SYSTEM_PROMPT = `You are an expert exam question writer for IGCSE, A-Level, and IB curricula.
Generate high-quality, exam-style MCQ questions that:
1. Are factually accurate and curriculum-aligned
2. Have plausible distractors (incorrect options)
3. Test specific learning objectives
4. Include clear, educational explanations
5. Vary in cognitive complexity (Bloom's taxonomy)

CRITICAL: Each question must have exactly 4 options (A, B, C, D).

Respond ONLY in this exact JSON format (no markdown, no code fences):
{
  "questions": [
    {
      "questionText": "<question>",
      "options": [
        {"label": "A", "text": "<option A>"},
        {"label": "B", "text": "<option B>"},
        {"label": "C", "text": "<option C>"},
        {"label": "D", "text": "<option D>"}
      ],
      "correctOptionIndex": <number 0-3>,
      "explanation": "<detailed explanation>",
      "difficulty": "<easy|medium|hard>",
      "bloomsLevel": "<remember|understand|apply|analyze|evaluate|create>",
      "tags": ["<tag1>", "<tag2>"]
    }
  ]
}`;

export async function generateMcqs(options: GenerateOptions): Promise<GeneratedQuestion[]> {
    const existingNotice = options.existingQuestions?.length
        ? `\nAvoid generating questions similar to these:\n${options.existingQuestions.slice(0, 5).map(q => `- ${q}`).join("\n")}`
        : "";

    const prompt = `Generate ${options.count} ${options.difficulty} difficulty MCQ question(s) for:
Subject: ${options.subject}
Topic: ${options.topic}
${options.board ? `Board/Curriculum: ${options.board}` : ""}
${options.bloomsLevel ? `Bloom's Level: ${options.bloomsLevel}` : ""}
${options.style ? `Style: ${options.style}` : ""}
${existingNotice}

Provide your response in the specified JSON format.`;

    const raw = await provider().generateText(prompt, GENERATOR_SYSTEM_PROMPT);

    try {
        const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(jsonStr);
        return parsed.questions || [];
    } catch (e) {
        console.error("Failed to parse generator response:", raw);
        throw new Error("AI generator returned invalid response format");
    }
}

// ============================================================================
// QUESTION FEEDBACK — Per-question AI feedback after student answers
// ============================================================================

interface FeedbackResult {
    isCorrect: boolean;
    feedback: string;
    hint?: string;
    relatedConcept?: string;
}

const FEEDBACK_SYSTEM_PROMPT = `You are a supportive, encouraging exam tutor.
When a student answers an MCQ question, provide:
1. Whether they got it right or wrong
2. A concise, educational explanation
3. If wrong: a hint for next time
4. A related concept they should review

Be encouraging but honest. Keep feedback under 150 words.

Respond ONLY in JSON (no markdown, no code fences):
{
  "isCorrect": <boolean>,
  "feedback": "<educational feedback>",
  "hint": "<hint if wrong, null if correct>",
  "relatedConcept": "<concept to review>"
}`;

export async function getQuestionFeedback(
    questionText: string,
    options: { label: string; text: string }[],
    correctIndex: number,
    selectedIndex: number,
    context?: { subject?: string; topic?: string },
): Promise<FeedbackResult> {
    const optionsStr = options.map((o, i) => `${o.label}. ${o.text}`).join("\n");
    const isCorrect = selectedIndex === correctIndex;

    const prompt = `A student just answered this MCQ:

Question: ${questionText}
${context?.subject ? `Subject: ${context.subject}` : ""}
${context?.topic ? `Topic: ${context.topic}` : ""}

Options:
${optionsStr}

Correct answer: ${options[correctIndex]?.label}
Student selected: ${options[selectedIndex]?.label} (${isCorrect ? "CORRECT" : "INCORRECT"})

Provide feedback.`;

    const raw = await provider().generateText(prompt, FEEDBACK_SYSTEM_PROMPT);

    try {
        const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        // Fallback: basic feedback without AI
        return {
            isCorrect,
            feedback: isCorrect
                ? "Correct! Well done."
                : `Incorrect. The correct answer is ${options[correctIndex]?.label}. ${options[correctIndex]?.text}`,
        };
    }
}
