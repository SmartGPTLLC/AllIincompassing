/**
 * Validation utilities for form inputs
 */

/**
 * Validates if a string is a valid URL
 * Accepts URLs with or without protocol
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return true;
  
  // If URL doesn't have a protocol, add https:// for validation
  const urlToValidate = url.match(/^https?:\/\//) ? url : `https://${url}`;
  
  try {
    new URL(urlToValidate);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Formats a URL by ensuring it has a protocol
 */
export const formatUrl = (url: string): string => {
  if (!url) return '';
  return url.match(/^https?:\/\//) ? url : `https://${url}`;
};

/**
 * Validates if a string is a valid email address
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return true;
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
};

/**
 * Validates if a string is a valid phone number
 * Accepts various formats
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return true;
  return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(phone);
};

/**
 * Prepares form data for submission by formatting URLs
 */
export const prepareFormData = <T extends Record<string, any>>(data: T): T => {
  const result = { ...data };
  
  // Format URL fields if they exist
  if ('website' in result && result.website) {
    result.website = formatUrl(result.website);
  }
  
  if ('logo_url' in result && result.logo_url) {
    result.logo_url = formatUrl(result.logo_url);
  }
  
  // Ensure arrays are properly formatted
  if ('service_preference' in result) {
    if (typeof result.service_preference === 'string') {
      result.service_preference = result.service_preference
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(result.service_preference)) {
      result.service_preference = [];
    }
  }
  
  if ('service_type' in result) {
    if (typeof result.service_type === 'string') {
      result.service_type = result.service_type
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(result.service_type)) {
      result.service_type = [];
    }
  }
  
  if ('specialties' in result) {
    if (typeof result.specialties === 'string') {
      result.specialties = result.specialties
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(result.specialties)) {
      result.specialties = [];
    }
  }
  
  if ('preferred_areas' in result) {
    if (typeof result.preferred_areas === 'string') {
      result.preferred_areas = result.preferred_areas
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(result.preferred_areas)) {
      result.preferred_areas = [];
    }
  }
  
  // Handle JSON fields
  if ('insurance_info' in result && typeof result.insurance_info === 'string') {
    try {
      result.insurance_info = JSON.parse(result.insurance_info);
    } catch (e) {
      result.insurance_info = {};
    }
  }
  
  // Handle availability_hours
  if ('availability_hours' in result && typeof result.availability_hours === 'string') {
    try {
      result.availability_hours = JSON.parse(result.availability_hours);
    } catch (e) {
      // Default availability hours
      result.availability_hours = {
        monday: { start: "06:00", end: "21:00" },
        tuesday: { start: "06:00", end: "21:00" },
        wednesday: { start: "06:00", end: "21:00" },
        thursday: { start: "06:00", end: "21:00" },
        friday: { start: "06:00", end: "21:00" },
        saturday: { start: "06:00", end: "21:00" }
      };
    }
  }
  
  return result;
};