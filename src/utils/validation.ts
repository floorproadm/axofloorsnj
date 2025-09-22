import DOMPurify from 'dompurify';

// Email validation with standard regex pattern
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Phone validation for US and E.164 formats
export const isValidPhone = (phone: string): boolean => {
  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '');
  
  // US phone: 10 digits (with or without country code)
  // E.164: 7-15 digits with country code
  return (
    (cleanPhone.length === 10) || // US without country code
    (cleanPhone.length === 11 && cleanPhone.startsWith('1')) || // US with country code
    (cleanPhone.length >= 7 && cleanPhone.length <= 15) // E.164 format
  );
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  }
  
  if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
    const usPhone = cleanPhone.slice(1);
    return `+1 (${usPhone.slice(0, 3)}) ${usPhone.slice(3, 6)}-${usPhone.slice(6)}`;
  }
  
  return phone; // Return original if doesn't match expected formats
};

// Sanitize text input to prevent XSS
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Use DOMPurify to sanitize HTML content
  const sanitized = DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep text content
  });
  
  return sanitized;
};

// Validate required fields
export const isRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

// Validate name (letters, spaces, common punctuation only)
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
};

// Validate city name
export const isValidCity = (city: string): boolean => {
  const cityRegex = /^[a-zA-Z\s\-'\.]+$/;
  return cityRegex.test(city.trim()) && city.trim().length >= 2;
};

// Validate ZIP code (5 digits for US)
export const isValidZipCode = (zipCode: string): boolean => {
  const zipRegex = /^\d{5}$/;
  return zipRegex.test(zipCode.trim());
};

// Rate limiting utilities
interface SubmissionTracker {
  count: number;
  lastSubmission: number;
  blocked: boolean;
}

const submissionMap = new Map<string, SubmissionTracker>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_SUBMISSIONS = 5;

export const checkRateLimit = (identifier: string): { allowed: boolean; remainingTime?: number } => {
  // Bypass rate limiting for localhost in development
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return { allowed: true };
  }

  const now = Date.now();
  const tracker = submissionMap.get(identifier);

  if (!tracker) {
    // First submission
    submissionMap.set(identifier, {
      count: 1,
      lastSubmission: now,
      blocked: false
    });
    return { allowed: true };
  }

  // Reset counter if window has passed
  if (now - tracker.lastSubmission > RATE_LIMIT_WINDOW) {
    tracker.count = 1;
    tracker.lastSubmission = now;
    tracker.blocked = false;
    return { allowed: true };
  }

  // Check if limit exceeded
  if (tracker.count >= MAX_SUBMISSIONS) {
    const remainingTime = RATE_LIMIT_WINDOW - (now - tracker.lastSubmission);
    tracker.blocked = true;
    return { allowed: false, remainingTime: Math.ceil(remainingTime / 1000) };
  }

  // Increment counter
  tracker.count++;
  tracker.lastSubmission = now;
  return { allowed: true };
};

// Get client identifier for rate limiting
export const getClientIdentifier = (): string => {
  // Use combination of IP (when available) and browser fingerprint
  return `${navigator.userAgent}-${window.screen.width}x${window.screen.height}`;
};

// Comprehensive form validation
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateForm = (data: Record<string, any>, rules: Record<string, string[]>): FormValidationResult => {
  const errors: Record<string, string> = {};

  for (const [field, validationRules] of Object.entries(rules)) {
    const value = data[field] || '';

    for (const rule of validationRules) {
      switch (rule) {
        case 'required':
          if (!isRequired(value)) {
            errors[field] = 'This field is required';
          }
          break;
        case 'email':
          if (value && !isValidEmail(value)) {
            errors[field] = 'Please enter a valid email address';
          }
          break;
        case 'phone':
          if (value && !isValidPhone(value)) {
            errors[field] = 'Please enter a valid phone number';
          }
          break;
        case 'name':
          if (value && !isValidName(value)) {
            errors[field] = 'Please enter a valid name (letters only)';
          }
          break;
        case 'city':
          if (value && !isValidCity(value)) {
            errors[field] = 'Please enter a valid city name';
          }
          break;
        case 'zipCode':
          if (value && !isValidZipCode(value)) {
            errors[field] = 'Please enter a valid ZIP code (5 digits)';
          }
          break;
      }
      
      // Stop at first error for this field
      if (errors[field]) break;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Real-time validation hook
export const useFieldValidation = () => {
  const validateField = (value: string, rules: string[]): string => {
    for (const rule of rules) {
      switch (rule) {
        case 'required':
          if (!isRequired(value)) return 'This field is required';
          break;
        case 'email':
          if (value && !isValidEmail(value)) return 'Please enter a valid email address';
          break;
        case 'phone':
          if (value && !isValidPhone(value)) return 'Please enter a valid phone number';
          break;
        case 'name':
          if (value && !isValidName(value)) return 'Please enter a valid name (letters only)';
          break;
        case 'city':
          if (value && !isValidCity(value)) return 'Please enter a valid city name';
          break;
        case 'zipCode':
          if (value && !isValidZipCode(value)) return 'Please enter a valid ZIP code (5 digits)';
          break;
      }
    }
    return '';
  };

  return { validateField };
};