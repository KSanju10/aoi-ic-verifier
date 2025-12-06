import { describe, it, expect } from "vitest";
import {
  validatePANFormat,
  validateAadhaarFormat,
  validateVoterIDFormat,
  validateDrivingLicenseFormat,
  validatePassportFormat,
  validateDateFormat,
  isDateExpired,
  validateNameFormat,
  detectBlur,
  detectFontMismatch,
  validateQRCodeMatch,
  verifyIC,
  determineVerificationStatus,
} from "./verification";

describe("IC Format Validators", () => {
  describe("PAN Format Validation", () => {
    it("should validate correct PAN format", () => {
      expect(validatePANFormat("AAAPA5055K")).toBe(true);
      expect(validatePANFormat("ABCDE1234F")).toBe(true);
    });

    it("should reject invalid PAN format", () => {
      expect(validatePANFormat("AAAP5055K")).toBe(false); // Too short
      expect(validatePANFormat("AAAPA5055")).toBe(false); // Missing letter
      expect(validatePANFormat("AAAPA505K5")).toBe(false); // Extra character
    });
  });

  describe("Aadhaar Format Validation", () => {
    it("should validate correct Aadhaar format", () => {
      expect(validateAadhaarFormat("123456789012")).toBe(true);
      expect(validateAadhaarFormat("1234 5678 9012")).toBe(true); // With spaces
    });

    it("should reject invalid Aadhaar format", () => {
      expect(validateAadhaarFormat("12345678901")).toBe(false); // 11 digits
      expect(validateAadhaarFormat("1234567890123")).toBe(false); // 13 digits
      expect(validateAadhaarFormat("ABCDEFGHIJKL")).toBe(false); // Letters
    });
  });

  describe("Voter ID Format Validation", () => {
    it("should validate correct Voter ID format", () => {
      expect(validateVoterIDFormat("ABC1234567")).toBe(true);
      expect(validateVoterIDFormat("XYZ9876543")).toBe(true);
    });

    it("should reject invalid Voter ID format", () => {
      expect(validateVoterIDFormat("AB1234567")).toBe(false); // Only 2 letters
      expect(validateVoterIDFormat("ABCD1234567")).toBe(false); // 4 letters
      expect(validateVoterIDFormat("ABC123456")).toBe(false); // Only 6 digits
    });
  });

  describe("Driving License Format Validation", () => {
    it("should validate correct Driving License format", () => {
      expect(validateDrivingLicenseFormat("DL0120110123456")).toBe(true);
      expect(validateDrivingLicenseFormat("DL-0120110123456")).toBe(true);
    });

    it("should reject invalid Driving License format", () => {
      expect(validateDrivingLicenseFormat("DL012011012345")).toBe(false); // 12 digits
      expect(validateDrivingLicenseFormat("D0120110123456")).toBe(false); // Only 1 letter
    });
  });

  describe("Passport Format Validation", () => {
    it("should validate correct Passport format", () => {
      expect(validatePassportFormat("A1234567")).toBe(true);
      expect(validatePassportFormat("Z9876543")).toBe(true);
    });

    it("should reject invalid Passport format", () => {
      expect(validatePassportFormat("AB1234567")).toBe(false);
      expect(validatePassportFormat("A12345678")).toBe(false);
    });
  });

  describe("Date Format Validation", () => {
    it("should validate correct date format", () => {
      expect(validateDateFormat("15/03/1990")).toBe(true);
      expect(validateDateFormat("01-01-2000")).toBe(true);
      expect(validateDateFormat("31/12/2025")).toBe(true);
    });

    it("should reject invalid date format", () => {
      expect(validateDateFormat("15-3-1990")).toBe(false); // Missing leading zero
      expect(validateDateFormat("2025/12/31")).toBe(false); // Wrong order
      expect(validateDateFormat("32/01/2000")).toBe(false); // Invalid day
    });
  });

  describe("Date Expiry Check", () => {
    it("should detect expired dates", () => {
      expect(isDateExpired("01/01/2020")).toBe(true);
      expect(isDateExpired("31/12/2023")).toBe(true);
    });

    it("should detect non-expired dates", () => {
      expect(isDateExpired("01/01/2030")).toBe(false);
      expect(isDateExpired("31/12/2099")).toBe(false);
    });
  });

  describe("Name Format Validation", () => {
    it("should validate correct name format", () => {
      expect(validateNameFormat("John Doe")).toBe(true);
      expect(validateNameFormat("Mary-Jane Smith")).toBe(true);
      expect(validateNameFormat("O'Brien")).toBe(true);
    });

    it("should reject invalid name format", () => {
      expect(validateNameFormat("J")).toBe(false); // Too short
      expect(validateNameFormat("123 456")).toBe(false); // Numbers
      expect(validateNameFormat("")).toBe(false); // Empty
    });
  });
});

describe("Forgery Detection", () => {
  describe("Blur Detection", () => {
    it("should detect blur with low confidence", () => {
      expect(detectBlur(60)).toBe(true);
      expect(detectBlur(50)).toBe(true);
    });

    it("should not detect blur with high confidence", () => {
      expect(detectBlur(85)).toBe(false);
      expect(detectBlur(100)).toBe(false);
    });
  });

  describe("Font Mismatch Detection", () => {
    it("should detect unusual character patterns", () => {
      expect(detectFontMismatch("Normal text here")).toBe(false);
      expect(detectFontMismatch("Text with @#$%^&*() symbols")).toBe(true);
    });
  });

  describe("QR Code Validation", () => {
    it("should validate matching QR code data", () => {
      const qrData = "PAN:AAAPA5055K:John Doe:15/03/1990";
      const extractedData = {
        icType: "PAN" as const,
        icNumber: "AAAPA5055K",
        holderName: "John Doe",
        dateOfBirth: "15/03/1990",
      };

      expect(validateQRCodeMatch(qrData, extractedData)).toBe(true);
    });

    it("should reject mismatched QR code data", () => {
      const qrData = "PAN:AAAPA5055K:Alice Smith:15/03/1990";
      const extractedData = {
        icType: "PAN" as const,
        icNumber: "AAAPA5055K",
        holderName: "John Doe",
        dateOfBirth: "15/03/1990",
      };

      expect(validateQRCodeMatch(qrData, extractedData)).toBe(false);
    });
  });

  it("should accept partial name match in QR code", () => {
    const qrData = "PAN:AAAPA5055K:Jane Doe:15/03/1990";
    const extractedData = {
      icType: "PAN" as const,
      icNumber: "AAAPA5055K",
      holderName: "John Doe",
      dateOfBirth: "15/03/1990",
    };

    expect(validateQRCodeMatch(qrData, extractedData)).toBe(true);
  });
});

describe("Comprehensive IC Verification", () => {
  it("should verify a valid PAN card", () => {
    const extractedData = {
      icType: "PAN" as const,
      icNumber: "AAAPA5055K",
      holderName: "John Doe",
      dateOfBirth: "15/03/1990",
      rawText: "PAN Card with valid information",
    };

    const result = verifyIC(extractedData, 90);

    expect(result.isValid).toBe(true);
    expect(result.authenticityScore).toBeGreaterThan(70);
    expect(result.validityScore).toBeGreaterThan(70);
  });

  it("should detect invalid IC format", () => {
    const extractedData = {
      icType: "PAN" as const,
      icNumber: "INVALID123",
      holderName: "John Doe",
      rawText: "Invalid PAN format",
    };

    const result = verifyIC(extractedData, 85);

    expect(result.isValid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("should detect expired IC", () => {
    const extractedData = {
      icType: "DRIVING_LICENSE" as const,
      icNumber: "DL0120110123456",
      holderName: "John Doe",
      expiryDate: "01/01/2020",
      rawText: "Expired driving license",
    };

    const result = verifyIC(extractedData, 85);

    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("expired"))).toBe(true);
  });

  it("should detect blurred images", () => {
    const extractedData = {
      icType: "AADHAAR" as const,
      icNumber: "123456789012",
      holderName: "John Doe",
      rawText: "Blurred text",
    };

    const result = verifyIC(extractedData, 60); // Low confidence

    expect(result.authenticityScore).toBeLessThan(100);
    expect(result.warnings.some((w) => w.includes("blurred"))).toBe(true);
  });

  it("should detect font mismatches", () => {
    const extractedData = {
      icType: "PAN" as const,
      icNumber: "AAAPA5055K",
      holderName: "John Doe",
      rawText: "Text with @#$%^&*() unusual characters throughout",
    };

    const result = verifyIC(extractedData, 85);

    expect(result.warnings.some((w) => w.includes("font"))).toBe(true);
  });
});

describe("Verification Status Determination", () => {
  it("should determine VERIFIED status", () => {
    const result = {
      isAuthentic: true,
      isValid: true,
      isTampered: false,
      matchesDatabase: true,
      belongsToCorrectPerson: true,
      authenticityScore: 95,
      validityScore: 90,
      overallConfidence: 92,
      issues: [],
      warnings: [],
    };

    const status = determineVerificationStatus(result);
    expect(status).toBe("VERIFIED");
  });

  it("should determine INVALID status", () => {
    const result = {
      isAuthentic: true,
      isValid: false,
      isTampered: false,
      matchesDatabase: true,
      belongsToCorrectPerson: true,
      authenticityScore: 85,
      validityScore: 40,
      overallConfidence: 62,
      issues: ["IC has expired"],
      warnings: [],
    };

    const status = determineVerificationStatus(result);
    expect(status).toBe("INVALID");
  });

  it("should determine SUSPICIOUS status", () => {
    const result = {
      isAuthentic: false,
      isValid: true,
      isTampered: true,
      matchesDatabase: false,
      belongsToCorrectPerson: false,
      authenticityScore: 45,
      validityScore: 75,
      overallConfidence: 60,
      issues: ["QR code data does not match"],
      warnings: ["Potential font mismatch detected"],
    };

    const status = determineVerificationStatus(result);
    expect(status).toBe("SUSPICIOUS");
  });
});
