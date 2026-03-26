/**
 * Console Security Utility
 * This file overrides console methods to prevent sensitive information
 * from being exposed in the browser console for security purposes.
 * 
 * In production builds, all console output is suppressed.
 * In development, only verbose debug logs are suppressed while errors/warnings are preserved.
 */

// Check if we're in production mode
const isProduction = import.meta.env.PROD;

if (isProduction) {
  // Override console methods in production to prevent information leakage
  // Override all console methods to do nothing in production
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
  console.table = () => {};
  console.trace = () => {};
  console.dir = () => {};
  console.dirxml = () => {};
  console.group = () => {};
  console.groupEnd = () => {};
  console.groupCollapsed = () => {};
  console.time = () => {};
  console.timeEnd = () => {};
  console.timeLog = () => {};
  console.assert = () => {};
  console.clear = () => {};
  console.count = () => {};
  console.countReset = () => {};
  console.profile = () => {};
  console.profileEnd = () => {};

  // Also override window.console to ensure it's completely hidden
  if (typeof window !== 'undefined') {
    window.console = console;
  }
} else {
  // In development, suppress only verbose debug logs but keep errors/warnings
  // This helps reduce noise while still allowing important debugging
  
  // Store original
  const originalDebug = console.debug;
  const originalTable = console.table;
  
  // Override verbose methods that leak too much information
  console.debug = (...args: unknown[]) => {
    // Filter out sensitive data patterns
    const message = args[0];
    if (typeof message === 'string') {
      // Suppress verbose API response logging
      if (message.includes('API Response:') || 
          message.includes('All referrals:') || 
          message.includes('Fetched referrals:') ||
          message.includes('Form Data before validation:') ||
          message.includes('Sending registration data:') ||
          message.includes('Sample referral data:') ||
          message.includes('=== DASHBOARD DEBUG ===') ||
          message.includes('=== END DEBUG ===') ||
          message.includes('Referrers data:') ||
          message.includes('Doctors data:') ||
          message.includes('Fetching accounts...') ||
          message.includes('Filtered ')) {
        return;
      }
    }
    originalDebug.apply(console, args);
  };

  console.table = (...args: unknown[]) => {
    // Suppress table logging of sensitive data
    const message = args[0];
    if (Array.isArray(message) && message.length > 0) {
      // Don't show tables for referral data
      if (message[0]?.referral_id || message[0]?.patient_full_name) {
        return;
      }
    }
    originalTable.apply(console, args as [tabularData: any, properties?: readonly string[] | undefined]);
  };
}

// Export a function to safely log errors that won't expose sensitive data
export const safeErrorLog = (context: string) => {
  if (isProduction) {
    // In production, don't log anything
    return;
  }
  // In development, log a sanitized version
  console.error(`[${context}] An error occurred`);
};

export default {};
