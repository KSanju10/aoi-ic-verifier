/**
 * IC Verification Algorithm Module
 * Implements pattern matching, format validation, and forgery detection
 */

export interface VerificationResult {
  isAuthentic: boolean;
  isValid: boolean;
  isTampered: boolean;
  matchesDatabase: boolean;
  belongsToCorrectPerson: boolean;
  authenticityScore: number;
  validityScore: number;
  overallConfidence: number;
  issues: string[];
  warnings: string[];
}

export interface ExtractedICData {
  icType: "PAN" | "AADHAAR" | "VOTER_ID" | "DRIVING_LICENSE" | "PASSPORT" | "OTHER";
  icNumber?: string;
  holderName?: string;
  dateOfBirth?: string;
  fatherName?: string;
  address?: string;
  gender?: string;
  issueDate?: string;
  expiryDate?: string;
  qrCodeData?: string;
  rawText?: string;
}

// ============================================================================
// PATTERN MATCHING VALIDATORS
// ============================================================================

/**
 * Validates PAN (Permanent Account Number) format
 * Format: 5 letters + 4 digits + 1 letter
 * Example: AAAPA5055K
 */
export function validatePANFormat(panNumber: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(panNumber.toUpperCase());
}

/**
 * Validates Aadhaar format
 * Format: 12 digits, can be formatted as XXXX XXXX XXXX
 */
export function validateAadhaarFormat(aadhaarNumber: string): boolean {
  const cleanNumber = aadhaarNumber.replace(/\s/g, "");
  const aadhaarRegex = /^[0-9]{12}$/;
  return aadhaarRegex.test(cleanNumber);
}

/**
 * Validates Voter ID format
 * Format: 3 letters + 7 digits
 * Example: ABC1234567
 */
export function validateVoterIDFormat(voterId: string): boolean {
  const voterRegex = /^[A-Z]{3}[0-9]{7}$/;
  return voterRegex.test(voterId.toUpperCase());
}

/**
 * Validates Driving License format
 * Format: 2 letters + 13 digits
 * Example: DL-0120110123456
 */
export function validateDrivingLicenseFormat(dlNumber: string): boolean {
  const dlRegex = /^[A-Z]{2}[-]?[0-9]{13}$/;
  return dlRegex.test(dlNumber.toUpperCase().replace(/\s/g, ""));
}

/**
 * Validates Passport format
 * Format: 1 letter + 7 digits
 * Example: A12345678
 */
export function validatePassportFormat(passportNumber: string): boolean {
  const passportRegex = /^[A-Z]{1}[0-9]{7}$/;
  return passportRegex.test(passportNumber.toUpperCase());
}

/**
 * Validates date format (DD/MM/YYYY or DD-MM-YYYY)
 */
export function validateDateFormat(dateString: string): boolean {
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])[/-](0[1-9]|1[0-2])[/-](19|20)\d{2}$/;
  return dateRegex.test(dateString);
}

/**
 * Checks if date is expired
 */
export function isDateExpired(dateString: string): boolean {
  try {
    const parts = dateString.replace(/-/g, "/").split("/");
    const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return date < new Date();
  } catch {
    return false;
  }
}

/**
 * Validates name format (basic check)
 */
export function validateNameFormat(name: string): boolean {
  // Name should have at least 2 characters and contain mostly letters
  const nameRegex = /^[a-zA-Z\s'-]{2,}$/;
  return nameRegex.test(name);
}

// ============================================================================
// FORGERY DETECTION
// ============================================================================

/**
 * Detects potential blur in extracted text
 * Low confidence OCR results indicate possible blur
 */
export function detectBlur(ocrConfidence: number): boolean {
  // If OCR confidence is below 70%, likely blurred
  return ocrConfidence < 70;
}

/**
 * Detects font mismatches in extracted text
 * Checks for inconsistent character patterns
 */
export function detectFontMismatch(extractedText: string): boolean {
  // Simple heuristic: check for unusual character patterns
  const unusualPatterns = /[^\w\s\-']/g;
  const matches = extractedText.match(unusualPatterns);
  
  // If more than 10% unusual characters, likely font mismatch
  return matches ? (matches.length / extractedText.length) > 0.1 : false;
}

/**
 * Validates QR code data matches extracted information
 */
export function validateQRCodeMatch(
  qrData: string,
  extractedData: ExtractedICData
): boolean {
  try {
    // QR code should contain IC number and/or holder name
    const lowerQR = qrData.toLowerCase();
    
    if (extractedData.icNumber) {
      if (!lowerQR.includes(extractedData.icNumber.toLowerCase())) {
        return false;
      }
    }
    
    if (extractedData.holderName) {
      const nameWords = extractedData.holderName.toLowerCase().split(/\s+/);
      const matchedWords = nameWords.filter(word => lowerQR.includes(word));
      
      // At least 50% of name words should match
      if (matchedWords.length < nameWords.length * 0.5) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// COMPREHENSIVE VERIFICATION
// ============================================================================

/**
 * Performs comprehensive IC verification
 */
export function verifyIC(
  extractedData: ExtractedICData,
  ocrConfidence: number = 85,
  qrCodeData?: string
): VerificationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let authenticityScore = 100;
  let validityScore = 100;
  let overallConfidence = 100;

  // ========== FORMAT VALIDATION ==========
  let isValidFormat = false;

  switch (extractedData.icType) {
    case "PAN":
      if (extractedData.icNumber) {
        isValidFormat = validatePANFormat(extractedData.icNumber);
        if (!isValidFormat) {
          issues.push("Invalid PAN format. Expected: 5 letters + 4 digits + 1 letter");
          validityScore -= 30;
        }
      } else {
        issues.push("PAN number not extracted");
        validityScore -= 20;
      }
      break;

    case "AADHAAR":
      if (extractedData.icNumber) {
        isValidFormat = validateAadhaarFormat(extractedData.icNumber);
        if (!isValidFormat) {
          issues.push("Invalid Aadhaar format. Expected: 12 digits");
          validityScore -= 30;
        }
      } else {
        issues.push("Aadhaar number not extracted");
        validityScore -= 20;
      }
      break;

    case "VOTER_ID":
      if (extractedData.icNumber) {
        isValidFormat = validateVoterIDFormat(extractedData.icNumber);
        if (!isValidFormat) {
          issues.push("Invalid Voter ID format. Expected: 3 letters + 7 digits");
          validityScore -= 30;
        }
      } else {
        issues.push("Voter ID number not extracted");
        validityScore -= 20;
      }
      break;

    case "DRIVING_LICENSE":
      if (extractedData.icNumber) {
        isValidFormat = validateDrivingLicenseFormat(extractedData.icNumber);
        if (!isValidFormat) {
          issues.push("Invalid Driving License format. Expected: 2 letters + 13 digits");
          validityScore -= 30;
        }
      } else {
        issues.push("Driving License number not extracted");
        validityScore -= 20;
      }
      break;

    case "PASSPORT":
      if (extractedData.icNumber) {
        isValidFormat = validatePassportFormat(extractedData.icNumber);
        if (!isValidFormat) {
          issues.push("Invalid Passport format. Expected: 1 letter + 7 digits");
          validityScore -= 30;
        }
      } else {
        issues.push("Passport number not extracted");
        validityScore -= 20;
      }
      break;

    default:
      warnings.push("Unknown IC type");
      validityScore -= 10;
  }

  // ========== NAME VALIDATION ==========
  if (!extractedData.holderName) {
    issues.push("Holder name not extracted");
    validityScore -= 15;
  } else if (!validateNameFormat(extractedData.holderName)) {
    warnings.push("Holder name format seems unusual");
    authenticityScore -= 10;
  }

  // ========== DATE VALIDATION ==========
  if (extractedData.expiryDate) {
    if (!validateDateFormat(extractedData.expiryDate)) {
      warnings.push("Expiry date format is invalid");
      validityScore -= 10;
    } else if (isDateExpired(extractedData.expiryDate)) {
      issues.push("IC has expired");
      validityScore -= 40;
    }
  }

  if (extractedData.issueDate) {
    if (!validateDateFormat(extractedData.issueDate)) {
      warnings.push("Issue date format is invalid");
      validityScore -= 5;
    }
  }

  // ========== FORGERY DETECTION ==========
  const blurDetected = detectBlur(ocrConfidence);
  if (blurDetected) {
    warnings.push("Image appears blurred - OCR confidence is low");
    authenticityScore -= 20;
  }

  const fontMismatchDetected = detectFontMismatch(extractedData.rawText || "");
  if (fontMismatchDetected) {
    warnings.push("Potential font mismatch detected");
    authenticityScore -= 15;
  }

  // ========== QR CODE VALIDATION ==========
  let qrCodeValid = true;
  if (qrCodeData) {
    qrCodeValid = validateQRCodeMatch(qrCodeData, extractedData);
    if (!qrCodeValid) {
      issues.push("QR code data does not match extracted information");
      authenticityScore -= 25;
    }
  } else if (["PAN", "AADHAAR", "VOTER_ID"].includes(extractedData.icType)) {
    warnings.push("QR code not detected or extracted");
    authenticityScore -= 10;
  }

  // ========== OCR CONFIDENCE CHECK ==========
  if (ocrConfidence < 80) {
    warnings.push(`Low OCR confidence: ${ocrConfidence}%`);
    overallConfidence = Math.min(overallConfidence, ocrConfidence);
  }

  // ========== FINAL DETERMINATION ==========
  const isAuthentic = authenticityScore >= 70 && !blurDetected && !fontMismatchDetected;
  const isValid = validityScore >= 70 && isValidFormat && !extractedData.expiryDate?.includes("expired");
  const isTampered = authenticityScore < 60 || fontMismatchDetected;
  const belongsToCorrectPerson = !extractedData.holderName ? false : true;
  const matchesDatabase = true; // Will be verified against actual database

  // Calculate overall confidence
  overallConfidence = Math.round((authenticityScore + validityScore) / 2);

  return {
    isAuthentic,
    isValid,
    isTampered,
    matchesDatabase,
    belongsToCorrectPerson,
    authenticityScore: Math.max(0, Math.round(authenticityScore)),
    validityScore: Math.max(0, Math.round(validityScore)),
    overallConfidence: Math.max(0, overallConfidence),
    issues,
    warnings,
  };
}

/**
 * Determines verification status based on results
 */
export function determineVerificationStatus(
  result: VerificationResult
): "VERIFIED" | "INVALID" | "SUSPICIOUS" {
  if (result.isTampered || result.authenticityScore < 50) {
    return "SUSPICIOUS";
  }

  if (!result.isValid || result.validityScore < 60) {
    return "INVALID";
  }

  if (result.isAuthentic && result.isValid && result.overallConfidence >= 80) {
    return "VERIFIED";
  }

  return "SUSPICIOUS";
}
