/**
 * Cambridge MCQ Format Parser
 * 
 * Parses MCQ questions in Cambridge examination format:
 * 
 * Example Cambridge Format:
 * ```
 * 1. What is the chemical formula for water?
 * A. H2O2
 * B. H2O
 * C. HO2
 * D. H2O3
 * Answer: B
 * 
 * 2. Which planet is closest to the Sun?
 * A. Venus
 * B. Mars
 * C. Mercury
 * D. Earth
 * Answer: C
 * ```
 * 
 * Also supports tabular format:
 * ```
 * Q No | Question | A | B | C | D | Answer
 * 1 | What is...? | H2O2 | H2O | HO2 | H2O3 | B
 * ```
 */

export interface ParsedMcqQuestion {
  questionNumber: number;
  questionText: string;
  options: { label: string; text: string }[];
  correctAnswer: string; // A, B, C, D
  explanation?: string;
}

export interface CambridgeMcqMetadata {
  subject?: string;
  topic?: string;
  year?: number;
  session?: string; // "May/June", "Oct/Nov"
  paper?: number;
  variant?: number;
  difficulty?: "easy" | "medium" | "hard";
  questions: ParsedMcqQuestion[];
}

/**
 * Parse Cambridge format MCQ text into structured questions
 */
export function parseCambridgeMcq(text: string): CambridgeMcqMetadata {
  const questions: ParsedMcqQuestion[] = [];
  const metadata: CambridgeMcqMetadata = { questions };

  // Extract metadata from header comments
  const lines = text.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("// Subject:")) {
      metadata.subject = trimmed.replace("// Subject:", "").trim();
    } else if (trimmed.startsWith("// Topic:")) {
      metadata.topic = trimmed.replace("// Topic:", "").trim();
    } else if (trimmed.startsWith("// Year:")) {
      metadata.year = parseInt(trimmed.replace("// Year:", "").trim(), 10);
    } else if (trimmed.startsWith("// Session:")) {
      metadata.session = trimmed.replace("// Session:", "").trim();
    } else if (trimmed.startsWith("// Paper:")) {
      metadata.paper = parseInt(trimmed.replace("// Paper:", "").trim(), 10);
    } else if (trimmed.startsWith("// Variant:")) {
      metadata.variant = parseInt(trimmed.replace("// Variant:", "").trim(), 10);
    } else if (trimmed.startsWith("// Difficulty:")) {
      const diff = trimmed.replace("// Difficulty:", "").trim().toLowerCase();
      if (["easy", "medium", "hard"].includes(diff)) {
        metadata.difficulty = diff as "easy" | "medium" | "hard";
      }
    }
  }

  // Parse questions in standard Cambridge format
  // Pattern: number. question text \n A. option \n B. option \n C. option \n D. option \n Answer: X
  const questionBlocks = text.split(/\n(?=\d+\.)/);
  
  for (const block of questionBlocks) {
    const trimmed = block.trim();
    if (!trimmed || !/^\d+\./.test(trimmed)) continue;

    const questionMatch = trimmed.match(/^(\d+)\.\s+([\s\S]*?)(?=\n[A-D]\.)/);
    if (!questionMatch) continue;

    const questionNumber = parseInt(questionMatch[1], 10);
    let questionText = questionMatch[2].trim();

    // Extract options
    const options: { label: string; text: string }[] = [];
    const optionRegex = /^([A-D])\.\s+(.+?)(?=\n[A-D]\.|\nAnswer:|$)/gm;
    let optionMatch;
    while ((optionMatch = optionRegex.exec(trimmed)) !== null) {
      options.push({ label: optionMatch[1], text: optionMatch[2].trim() });
    }

    // Extract answer
    const answerMatch = trimmed.match(/Answer:\s*([A-D])/);
    if (!answerMatch || options.length === 0) continue;

    const correctAnswer = answerMatch[1];

    // Extract explanation (optional)
    let explanation: string | undefined;
    const explanationRegex = /Explanation:\s*([\s\S]*?)(?=\n\d+\.|$)/;
    const explanationResult = explanationRegex.exec(trimmed);
    if (explanationResult) {
      explanation = explanationResult[1].trim();
    }

    // Remove explanation from question text if present
    if (explanation) {
      questionText = questionText.replace(/Explanation:\s*[\s\S]*$/, "").trim();
    }

    questions.push({
      questionNumber,
      questionText,
      options,
      correctAnswer,
      explanation,
    });
  }

  // If no questions found, try tabular format
  if (questions.length === 0) {
    return parseTabularMcq(text);
  }

  return metadata;
}

/**
 * Parse tabular MCQ format (CSV-like)
 * Q No | Question | A | B | C | D | Answer | Explanation (optional)
 */
function parseTabularMcq(text: string): CambridgeMcqMetadata {
  const questions: ParsedMcqQuestion[] = [];
  const metadata: CambridgeMcqMetadata = { questions };

  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  
  // Find header row
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/q\s*no/i.test(lines[i]) || /^q\s*\|/i.test(lines[i])) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    // Try parsing as simple numbered list
    return parseSimpleListMcq(text);
  }

  // Determine delimiter
  const headerLine = lines[headerIndex];
  const delimiter = headerLine.includes("|") ? "|" : headerLine.includes("\t") ? "\t" : ",";

  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());
  const questionIdx = headers.findIndex((h) => h === "question" || h === "q");
  const optionAIdx = headers.findIndex((h) => h === "a");
  const optionBIdx = headers.findIndex((h) => h === "b");
  const optionCIdx = headers.findIndex((h) => h === "c");
  const optionDIdx = headers.findIndex((h) => h === "d");
  const answerIdx = headers.findIndex((h) => h === "answer");
  const explanationIdx = headers.findIndex((h) => h === "explanation");

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim());
    
    const questionNumber = parseInt(cells[0], 10);
    if (isNaN(questionNumber)) continue;

    const questionText = cells[questionIdx] || "";
    const options = [
      { label: "A", text: cells[optionAIdx] || "" },
      { label: "B", text: cells[optionBIdx] || "" },
      { label: "C", text: cells[optionCIdx] || "" },
      { label: "D", text: cells[optionDIdx] || "" },
    ].filter((o) => o.text);

    const correctAnswer = cells[answerIdx]?.toUpperCase() || "";
    if (!correctAnswer || !["A", "B", "C", "D"].includes(correctAnswer)) continue;

    const explanation = explanationIdx >= 0 ? cells[explanationIdx] : undefined;

    questions.push({
      questionNumber,
      questionText,
      options,
      correctAnswer,
      explanation: explanation || undefined,
    });
  }

  return metadata;
}

/**
 * Parse simple numbered list format
 * 1. Question text
 *    A) Option  B) Option  C) Option  D) Option
 *    Answer: X
 */
function parseSimpleListMcq(text: string): CambridgeMcqMetadata {
  const questions: ParsedMcqQuestion[] = [];
  const metadata: CambridgeMcqMetadata = { questions };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  
  let currentQuestion: Partial<ParsedMcqQuestion> = {};
  let options: { label: string; text: string }[] = [];

  for (const line of lines) {
    // New question
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (questionMatch) {
      if (currentQuestion.questionText && currentQuestion.correctAnswer) {
        questions.push({
          questionNumber: currentQuestion.questionNumber!,
          questionText: currentQuestion.questionText!,
          options,
          correctAnswer: currentQuestion.correctAnswer!,
          explanation: currentQuestion.explanation,
        });
      }
      currentQuestion = {
        questionNumber: parseInt(questionMatch[1], 10),
        questionText: questionMatch[2],
      };
      options = [];
      continue;
    }

    // Options
    const optionMatch = line.match(/^([A-D])[)]\s+(.+)/);
    if (optionMatch) {
      options.push({ label: optionMatch[1], text: optionMatch[2].trim() });
      continue;
    }

    // Answer
    const answerMatch = line.match(/^[aA]nswer:\s*([A-D])/i);
    if (answerMatch) {
      currentQuestion.correctAnswer = answerMatch[1];
      continue;
    }

    // Explanation
    const explanationMatch = line.match(/^[eE]xplanation:\s*(.+)/);
    if (explanationMatch) {
      currentQuestion.explanation = explanationMatch[1];
    }
  }

  // Push last question
  if (currentQuestion.questionText && currentQuestion.correctAnswer) {
    questions.push({
      questionNumber: currentQuestion.questionNumber!,
      questionText: currentQuestion.questionText!,
      options,
      correctAnswer: currentQuestion.correctAnswer!,
      explanation: currentQuestion.explanation,
    });
  }

  return metadata;
}

/**
 * Validate parsed MCQ questions
 */
export function validateMcqQuestions(metadata: CambridgeMcqMetadata): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (metadata.questions.length === 0) {
    errors.push("No questions found");
    return { valid: false, errors };
  }

  metadata.questions.forEach((q, idx) => {
    if (!q.questionText) {
      errors.push(`Question ${q.questionNumber || idx + 1}: Missing question text`);
    }
    if (q.options.length < 2) {
      errors.push(`Question ${q.questionNumber || idx + 1}: At least 2 options required`);
    }
    if (!q.correctAnswer || !["A", "B", "C", "D"].includes(q.correctAnswer)) {
      errors.push(`Question ${q.questionNumber || idx + 1}: Invalid correct answer (must be A, B, C, or D)`);
    }
    const correctOption = q.options.find((o) => o.label === q.correctAnswer);
    if (!correctOption) {
      errors.push(`Question ${q.questionNumber || idx + 1}: Correct answer option not found`);
    }
  });

  return { valid: errors.length === 0, errors };
}
