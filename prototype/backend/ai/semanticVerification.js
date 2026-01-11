const fs = require("fs");
const path = require("path");

function guessMimeType(filePath) {
  const ext = String(path.extname(filePath) || "").toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

function imageToGenerativePart(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: guessMimeType(imagePath)
    }
  };
}

function tryParseJson(text) {
  if (typeof text !== "string") return null;

  try {
    return JSON.parse(text);
  } catch (_err) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (_err2) {
        return null;
      }
    }
    return null;
  }
}

async function semanticVerification(imagePath, claim) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are analyzing an image submitted as evidence for an environmental task.

Task claim:
"${String(claim || "").trim()}"

Instructions:
- Do NOT decide approval or rejection.
- ONLY assess semantic consistency between the image and the claim.
- Output must be valid JSON.
- semantic_score must be a number between 0.00 and 1.00, not just 0 or 1.

Output format:
{
  "semantic_score": <float between 0 and 1>,
  "explanation": "<one or two sentence explanation of what is visible>"
}
`;

  const imagePart = imageToGenerativePart(imagePath);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, imagePart]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });

  const responseText = result?.response?.text ? result.response.text() : "";
  const parsed = tryParseJson(responseText);
  if (!parsed) throw new Error("Gemini did not return valid JSON");

  const semanticScore = parsed.semantic_score;
  if (typeof semanticScore !== "number" || Number.isNaN(semanticScore)) {
    throw new Error("Gemini response missing semantic_score");
  }

  return {
    semantic_score: Math.max(0, Math.min(1, semanticScore)),
    explanation: typeof parsed.explanation === "string" ? parsed.explanation : ""
  };
}

async function fraudDetection(imagePath, userDescription) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are analyzing an image for potential fraud indicators in an environmental task submission.

User submitted description:
"${String(userDescription || "").trim()}"

Instructions:
- Do NOT assess semantic consistency or task completion.
- ONLY look for signs of manipulation, staging, or deception.
- Output must be valid JSON.
- fraud_score must be a number between 0.00 and 1.00 (0.00 = definitely authentic, 1.00 = definitely fraudulent).

Look for:
- Stock photos, watermarks, or internet-sourced images
- Inconsistent lighting, shadows, or perspective
- Signs of digital manipulation
- Staged or unnatural scenarios

Output format:
{
  "fraud_score": <float between 0.00 and 1.00>,
  "explanation": "<brief explanation of fraud indicators or lack thereof>"
}
`;

  const imagePart = imageToGenerativePart(imagePath);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, imagePart]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  });

  const responseText = result?.response?.text ? result.response.text() : "";
  const parsed = tryParseJson(responseText);
  if (!parsed) throw new Error("Gemini did not return valid JSON");

  const fraudScore = parsed.fraud_score;
  if (typeof fraudScore !== "number" || Number.isNaN(fraudScore)) {
    throw new Error("Gemini response missing fraud_score");
  }

  return {
    fraud_score: Math.max(0, Math.min(1, fraudScore)),
    explanation: typeof parsed.explanation === "string" ? parsed.explanation : ""
  };
}

module.exports = { semanticVerification, fraudDetection };
