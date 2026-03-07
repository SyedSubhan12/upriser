/**
 * MCQ Extractor — youlearn.ai-style RAG Pipeline
 *
 * Pipeline: PDF → Text Extraction → Chunking → LLM Key Concept ID → MCQ Generation
 *
 * Uses the same AI provider as mcq-ai.ts (Gemini/OpenAI).
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number; info: any }>;

// ============================================================================
// AI Provider (reused from mcq-ai.ts)
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
            contents.push({ role: "model", parts: [{ text: "Understood." }] });
        }
        contents.push({ role: "user", parts: [{ text: prompt }] });

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents,
                generationConfig: { temperature: 0.6, maxOutputTokens: 8192, topP: 0.9 },
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${err}`);
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
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: 0.6,
                max_tokens: 8192,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${err}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    }
}

function getProvider(): AIProvider | null {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (geminiKey) return new GeminiProvider(geminiKey);
    if (openaiKey) return new OpenAIProvider(openaiKey);
    return null;
}

let _provider: AIProvider | null | undefined;
function ai(): AIProvider {
    if (_provider === undefined) _provider = getProvider();
    if (!_provider) throw new Error("No AI configured. Set GEMINI_API_KEY or OPENAI_API_KEY.");
    return _provider;
}

// ============================================================================
// Step 1: PDF → Text
// ============================================================================

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
}

// ============================================================================
// Step 2: Text → Chunks (paragraph-aware, ~500 token overlapping)
// ============================================================================

export interface TextChunk {
    index: number;
    text: string;
    startChar: number;
    endChar: number;
}

export function chunkText(
    text: string,
    opts: { chunkSize?: number; overlap?: number } = {},
): TextChunk[] {
    const chunkSize = opts.chunkSize || 1500; // ~500 tokens ≈ 1500 chars
    const overlap = opts.overlap || 200;

    // Normalize whitespace
    const clean = text
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim();

    if (clean.length <= chunkSize) {
        return [{ index: 0, text: clean, startChar: 0, endChar: clean.length }];
    }

    const chunks: TextChunk[] = [];
    let pos = 0;
    let index = 0;

    while (pos < clean.length) {
        let end = Math.min(pos + chunkSize, clean.length);

        // Try to break at paragraph boundary
        if (end < clean.length) {
            const paragraphBreak = clean.lastIndexOf("\n\n", end);
            if (paragraphBreak > pos + chunkSize * 0.5) {
                end = paragraphBreak;
            } else {
                // Break at sentence boundary
                const sentenceBreak = clean.lastIndexOf(". ", end);
                if (sentenceBreak > pos + chunkSize * 0.5) {
                    end = sentenceBreak + 1;
                }
            }
        }

        chunks.push({
            index,
            text: clean.slice(pos, end).trim(),
            startChar: pos,
            endChar: end,
        });

        pos = end - overlap;
        if (pos >= clean.length) break;
        index++;
    }

    return chunks;
}

// ============================================================================
// Step 3: Chunks → MCQs via LLM
// ============================================================================

export interface ExtractedQuestion {
    questionText: string;
    options: { label: string; text: string }[];
    correctOptionIndex: number;
    explanation: string;
    difficulty: string;
    bloomsLevel: string;
    tags: string[];
    sourceChunkIndex: number;
}

export interface ExtractionOptions {
    subjectId?: string;
    topicId?: string;
    boardId?: string;
    subject?: string; // Human-readable name
    topic?: string;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
    questionsPerChunk?: number;
    maxQuestions?: number;
}

const EXTRACT_SYSTEM_PROMPT = `You are an expert exam question writer. You specialize in extracting testable MCQ questions from educational content.

Given a passage of text from an educational document, your job is to:
1. Identify the key concepts and facts that can be tested
2. Create high-quality MCQ questions that test understanding (not just recall)
3. Write plausible distractors that students commonly pick
4. Provide clear, educational explanations

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Questions should be standalone (don't reference "the passage")
- Distractors should be plausible but clearly wrong
- Explanations should teach, not just state the answer
- Cover different cognitive levels (remember, understand, apply, analyze)

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
}

If the passage does not contain enough educational content to generate questions, return: {"questions": []}`;

async function extractFromChunk(
    chunk: TextChunk,
    options: ExtractionOptions,
): Promise<ExtractedQuestion[]> {
    const count = options.questionsPerChunk || 3;
    const difficultyInstruction =
        options.difficulty && options.difficulty !== "mixed"
            ? `All questions should be ${options.difficulty} difficulty.`
            : "Mix difficulties: some easy, some medium, some hard.";

    const contextParts: string[] = [];
    if (options.subject) contextParts.push(`Subject: ${options.subject}`);
    if (options.topic) contextParts.push(`Topic: ${options.topic}`);
    const contextStr = contextParts.length > 0 ? contextParts.join(", ") : "";

    const prompt = `Extract ${count} MCQ question(s) from this educational content.
${contextStr ? `\nContext: ${contextStr}` : ""}
${difficultyInstruction}

Content:
"""
${chunk.text}
"""

Generate questions that test understanding of the key concepts in this passage.`;

    try {
        const raw = await ai().generateText(prompt, EXTRACT_SYSTEM_PROMPT);
        const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(jsonStr);
        const questions: ExtractedQuestion[] = (parsed.questions || []).map(
            (q: any) => ({
                ...q,
                sourceChunkIndex: chunk.index,
            }),
        );
        return questions;
    } catch (e) {
        console.error(`Failed to extract from chunk ${chunk.index}:`, e);
        return [];
    }
}

// ============================================================================
// Step 4: Validation — Ensure question quality
// ============================================================================

function validateQuestion(q: ExtractedQuestion): boolean {
    if (!q.questionText || q.questionText.length < 10) return false;
    if (!Array.isArray(q.options) || q.options.length !== 4) return false;
    if (
        q.correctOptionIndex === undefined ||
        q.correctOptionIndex < 0 ||
        q.correctOptionIndex > 3
    )
        return false;
    if (q.options.some((o) => !o.text || !o.label)) return false;

    // Check for duplicate options
    const optTexts = q.options.map((o) => o.text.toLowerCase().trim());
    if (new Set(optTexts).size !== 4) return false;

    return true;
}

// ============================================================================
// Step 5: Deduplication — Remove similar questions
// ============================================================================

function deduplicateQuestions(
    questions: ExtractedQuestion[],
): ExtractedQuestion[] {
    const seen = new Set<string>();
    return questions.filter((q) => {
        // Normalize question text for comparison
        const key = q.questionText
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 80);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ============================================================================
// Main Pipeline: PDF Buffer → Extracted MCQs
// ============================================================================

export interface ExtractionResult {
    questions: ExtractedQuestion[];
    metadata: {
        totalChunks: number;
        chunksProcessed: number;
        rawQuestionsGenerated: number;
        afterValidation: number;
        afterDedup: number;
        extractedTextLength: number;
        processingTimeMs: number;
    };
}

export async function extractMcqsFromPdf(
    pdfBuffer: Buffer,
    options: ExtractionOptions = {},
): Promise<ExtractionResult> {
    const startTime = Date.now();

    // Step 1: Extract text
    console.log("🔍 Extracting text from PDF...");
    const text = await extractTextFromPdf(pdfBuffer);
    if (text.length < 100) {
        throw new Error(
            "PDF contains insufficient text for MCQ extraction. The file may be scanned/image-based.",
        );
    }
    console.log(` → ${text.length} characters extracted`);

    // Step 2: Chunk text
    const chunks = chunkText(text);
    console.log(` → ${chunks.length} chunks created`);

    // Step 3: Extract MCQs from each chunk (parallel with rate limiting)
    const maxQuestions = options.maxQuestions || 20;
    const maxChunks = Math.min(
        chunks.length,
        Math.ceil(maxQuestions / (options.questionsPerChunk || 3)) + 1,
    );
    const selectedChunks = chunks.slice(0, maxChunks);

    console.log(` → Processing ${selectedChunks.length} chunks...`);

    // Process chunks in batches of 3 to avoid rate limits
    const allQuestions: ExtractedQuestion[] = [];
    const batchSize = 3;

    for (let i = 0; i < selectedChunks.length; i += batchSize) {
        const batch = selectedChunks.slice(i, i + batchSize);
        const results = await Promise.all(
            batch.map((chunk) => extractFromChunk(chunk, options)),
        );
        allQuestions.push(...results.flat());

        // Stop if we have enough
        if (allQuestions.length >= maxQuestions * 1.5) break;
    }

    console.log(` → ${allQuestions.length} raw questions generated`);

    // Step 4: Validate
    const validated = allQuestions.filter(validateQuestion);
    console.log(` → ${validated.length} passed validation`);

    // Step 5: Deduplicate
    const deduped = deduplicateQuestions(validated);
    console.log(` → ${deduped.length} after deduplication`);

    // Trim to maxQuestions
    const final = deduped.slice(0, maxQuestions);

    return {
        questions: final,
        metadata: {
            totalChunks: chunks.length,
            chunksProcessed: selectedChunks.length,
            rawQuestionsGenerated: allQuestions.length,
            afterValidation: validated.length,
            afterDedup: deduped.length,
            extractedTextLength: text.length,
            processingTimeMs: Date.now() - startTime,
        },
    };
}

// ============================================================================
// Text-only extraction (for non-PDF content)
// ============================================================================

export async function extractMcqsFromText(
    text: string,
    options: ExtractionOptions = {},
): Promise<ExtractionResult> {
    const startTime = Date.now();

    if (text.length < 50) {
        throw new Error("Text is too short for MCQ extraction.");
    }

    const chunks = chunkText(text);
    const maxQuestions = options.maxQuestions || 10;
    const maxChunks = Math.min(
        chunks.length,
        Math.ceil(maxQuestions / (options.questionsPerChunk || 3)) + 1,
    );
    const selectedChunks = chunks.slice(0, maxChunks);

    const allQuestions: ExtractedQuestion[] = [];
    for (const chunk of selectedChunks) {
        const questions = await extractFromChunk(chunk, options);
        allQuestions.push(...questions);
        if (allQuestions.length >= maxQuestions * 1.5) break;
    }

    const validated = allQuestions.filter(validateQuestion);
    const deduped = deduplicateQuestions(validated);
    const final = deduped.slice(0, maxQuestions);

    return {
        questions: final,
        metadata: {
            totalChunks: chunks.length,
            chunksProcessed: selectedChunks.length,
            rawQuestionsGenerated: allQuestions.length,
            afterValidation: validated.length,
            afterDedup: deduped.length,
            extractedTextLength: text.length,
            processingTimeMs: Date.now() - startTime,
        },
    };
}
