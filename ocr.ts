/**
 * OCR Service Module
 * Handles text extraction from IC images using LLM vision capabilities
 */

import { invokeLLM } from "./_core/llm";
import { ExtractedICData } from "./verification";

export interface OCRResult {
  success: boolean;
  confidence: number;
  extractedData: Partial<ExtractedICData>;
  rawText: string;
  error?: string;
}

/**
 * Extract text and data from IC image using LLM vision
 */
export async function extractICData(
  imageUrl: string,
  icType: string
): Promise<OCRResult> {
  try {
    const systemPrompt = `You are an expert OCR system specialized in extracting information from identity cards.
Your task is to carefully analyze the provided image and extract all visible text and information.

For the ${icType} card, extract the following information if present:
- ID Number/Reference Number
- Holder's Full Name
- Date of Birth (in DD/MM/YYYY format)
- Father's Name (if applicable)
- Address
- Gender
- Issue Date (if visible)
- Expiry Date (if visible)
- Any QR code data or text

Return the extracted information in a structured JSON format.
If you cannot read certain fields clearly, mark them as null.
Provide a confidence score (0-100) for the overall extraction accuracy.`;

    const userPrompt = `Please extract all information from this ${icType} card image. 
Return a JSON object with the following structure:
{
  "icNumber": "extracted ID number",
  "holderName": "full name",
  "dateOfBirth": "DD/MM/YYYY",
  "fatherName": "father's name if present",
  "address": "full address",
  "gender": "M/F/O",
  "issueDate": "DD/MM/YYYY if visible",
  "expiryDate": "DD/MM/YYYY if visible",
  "qrCodeData": "any QR code text if present",
  "confidence": 85,
  "rawText": "all visible text from the card"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const responseText =
      typeof response.choices[0].message.content === "string"
        ? response.choices[0].message.content
        : "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        confidence: 0,
        extractedData: {},
        rawText: responseText,
        error: "Could not parse JSON from OCR response",
      };
    }

    const extractedJson = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      confidence: extractedJson.confidence || 85,
      extractedData: {
        icType: icType as any,
        icNumber: extractedJson.icNumber,
        holderName: extractedJson.holderName,
        dateOfBirth: extractedJson.dateOfBirth,
        fatherName: extractedJson.fatherName,
        address: extractedJson.address,
        gender: extractedJson.gender,
        issueDate: extractedJson.issueDate,
        expiryDate: extractedJson.expiryDate,
        qrCodeData: extractedJson.qrCodeData,
        rawText: extractedJson.rawText,
      },
      rawText: responseText,
    };
  } catch (error) {
    console.error("[OCR] Error extracting IC data:", error);
    return {
      success: false,
      confidence: 0,
      extractedData: {},
      rawText: "",
      error: error instanceof Error ? error.message : "Unknown OCR error",
    };
  }
}

/**
 * Detect QR code in image (mock implementation)
 * In production, use a QR code detection library
 */
export async function detectQRCode(imageUrl: string): Promise<string | null> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert at detecting and reading QR codes from images.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this image and extract any QR code data you can see. If there is a QR code, describe what information it contains. If there is no QR code, respond with 'NO_QR_CODE'.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const responseText =
      typeof response.choices[0].message.content === "string"
        ? response.choices[0].message.content
        : "";

    if (
      responseText.includes("NO_QR_CODE") ||
      responseText.includes("no QR code")
    ) {
      return null;
    }

    return responseText;
  } catch (error) {
    console.error("[QR Detection] Error:", error);
    return null;
  }
}

/**
 * Analyze image quality and detect potential issues
 */
export async function analyzeImageQuality(imageUrl: string): Promise<{
  isBlurred: boolean;
  hasGlare: boolean;
  isWellLit: boolean;
  isRotated: boolean;
  qualityScore: number;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing document image quality for OCR and verification purposes.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this identity card image and provide quality assessment. 
Return a JSON object with:
{
  "isBlurred": boolean,
  "hasGlare": boolean,
  "isWellLit": boolean,
  "isRotated": boolean,
  "qualityScore": number (0-100)
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const responseText =
      typeof response.choices[0].message.content === "string"
        ? response.choices[0].message.content
        : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      isBlurred: false,
      hasGlare: false,
      isWellLit: true,
      isRotated: false,
      qualityScore: 75,
    };
  } catch (error) {
    console.error("[Image Quality Analysis] Error:", error);
    return {
      isBlurred: false,
      hasGlare: false,
      isWellLit: true,
      isRotated: false,
      qualityScore: 50,
    };
  }
}
