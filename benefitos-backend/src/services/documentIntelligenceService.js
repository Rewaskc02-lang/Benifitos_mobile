const path = require("node:path");

const MIN_OCR_CONFIDENCE = 0.55;

const DOCUMENT_RULES = {
  "Aadhaar Card": {
    aliases: ["aadhaar", "aadhar", "uidai"],
    required: ["aadhaar", "uidai"],
    identifiers: [/\b\d{4}\s?\d{4}\s?\d{4}\b/],
  },
  "PAN Card": {
    aliases: ["pan", "permanent account number"],
    required: ["income tax", "permanent account number"],
    identifiers: [/\b[A-Z]{5}\d{4}[A-Z]\b/],
  },
  Passport: {
    aliases: ["passport"],
    required: ["passport", "republic of india"],
    identifiers: [/\b[A-Z]\d{7}\b/],
  },
  "Driving Licence": {
    aliases: ["driving licence", "driving license", "dl"],
    required: ["driving", "licence"],
    identifiers: [/\b[A-Z]{2}\d{2}\s?\d{11}\b/, /\b[A-Z]{2}-?\d{13}\b/],
  },
  "Income Certificate": {
    aliases: ["income certificate"],
    required: ["income certificate", "annual income"],
    identifiers: [/\b(income|certificate)\b/i],
  },
  "Birth Certificate": {
    aliases: ["birth certificate"],
    required: ["birth certificate", "date of birth"],
    identifiers: [/\b\d{2}[/-]\d{2}[/-]\d{4}\b/],
  },
  "Domicile Certificate": {
    aliases: ["domicile certificate", "residence certificate"],
    required: ["domicile", "certificate"],
    identifiers: [/\b(domicile|residence)\b/i],
  },
  "Disability Certificate": {
    aliases: ["disability certificate", "pwd certificate"],
    required: ["disability", "certificate"],
    identifiers: [/\b(disability|divyang|pwd)\b/i],
  },
  "Widow Certificate": {
    aliases: ["widow certificate"],
    required: ["widow", "certificate"],
    identifiers: [/\b(widow|widowed)\b/i],
  },
  "Farmer Certificate": {
    aliases: ["farmer certificate", "kisan certificate"],
    required: ["farmer", "certificate"],
    identifiers: [/\b(farmer|kisan|agricultur)\b/i],
  },
};

const normalize = (value = "") => value.trim().replace(/\s+/g, " ");
const lower = (value = "") => normalize(value).toLowerCase();

const canonicalizeDocumentName = (documentName) => {
  const requested = lower(documentName);
  return Object.keys(DOCUMENT_RULES).find((name) => {
    const rule = DOCUMENT_RULES[name];
    return lower(name) === requested || rule.aliases.some((alias) => lower(alias) === requested);
  });
};

const scoreRule = (rule, ocrText) => {
  const normalizedText = lower(ocrText);
  const requiredHits = rule.required.filter((term) => normalizedText.includes(lower(term))).length;
  const aliasHit = rule.aliases.some((term) => normalizedText.includes(lower(term))) ? 1 : 0;
  const identifierHit = rule.identifiers.some((pattern) => pattern.test(ocrText)) ? 1 : 0;
  const requiredScore = rule.required.length > 0 ? requiredHits / rule.required.length : 0;
  return Math.min(1, (requiredScore * 0.55) + (aliasHit * 0.2) + (identifierHit * 0.25));
};

exports.validateUploadedDocument = ({ file, documentName, ocrText, ocrConfidence }) => {
  console.log("[Document Intelligence] Upload received", {
    documentName,
    originalName: file?.originalname,
    mimetype: file?.mimetype,
    size: file?.size,
  });

  if (!file) {
    return { valid: false, reason: "No document image was uploaded." };
  }

  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    return { valid: false, reason: "Only image uploads are supported for document verification." };
  }

  if (!documentName || !normalize(documentName)) {
    return { valid: false, reason: "Document type is required." };
  }

  console.log("[Document Intelligence] Compression received from client");
  console.log("[Document Intelligence] OCR started");

  const extractedText = normalize(ocrText || "");
  if (!extractedText) {
    console.log("[Document Intelligence] OCR completed", { confidence: 0, textLength: 0 });
    return {
      valid: false,
      reason: "OCR text was not extracted. Upload a clear scan of the actual document.",
    };
  }

  const confidence = Number.isFinite(Number(ocrConfidence))
    ? Number(ocrConfidence)
    : Math.min(0.95, Math.max(0.1, extractedText.length / 600));

  console.log("[Document Intelligence] OCR completed", {
    confidence,
    textLength: extractedText.length,
  });

  if (confidence < MIN_OCR_CONFIDENCE) {
    return {
      valid: false,
      reason: "OCR confidence is too low. Please upload a clearer document image.",
    };
  }

  const canonicalName = canonicalizeDocumentName(documentName);
  if (!canonicalName) {
    return {
      valid: false,
      reason: `Unsupported document type: ${documentName}.`,
    };
  }

  const scores = Object.entries(DOCUMENT_RULES)
    .map(([name, rule]) => ({ name, confidence: scoreRule(rule, extractedText) }))
    .sort((a, b) => b.confidence - a.confidence);
  const classification = scores[0];

  console.log("[Document Intelligence] Document classified", classification);

  if (!classification || classification.name !== canonicalName || classification.confidence < MIN_OCR_CONFIDENCE) {
    return {
      valid: false,
      reason: `Uploaded image does not match ${canonicalName}.`,
      canonicalName,
      classification,
    };
  }

  const extension = path.extname(file.originalname || "").toLowerCase();
  const fields = {
    documentType: canonicalName,
    fileExtension: extension || null,
    textLength: extractedText.length,
  };

  console.log("[Document Intelligence] Extracted fields", fields);
  console.log("[Document Intelligence] Validation result", { valid: true, canonicalName });

  return {
    valid: true,
    canonicalName,
    classification,
    fields,
    ocrConfidence: confidence,
  };
};

