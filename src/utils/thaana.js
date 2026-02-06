/**
 * Thaana/Dhivehi Text Utilities
 * Unicode range for Thaana: U+0780 to U+07BF
 */

/**
 * Check if a character is a Thaana character
 * @param {string} char - Character to check
 * @returns {boolean} True if character is Thaana
 */
export function isThaana(char) {
  if (!char || char.length === 0) return false;
  const code = char.charCodeAt(0);
  return code >= 0x0780 && code <= 0x07bf;
}

/**
 * Check if a string contains only Thaana characters
 * @param {string} str - String to check
 * @returns {boolean} True if all characters are Thaana
 */
export function isAllThaana(str) {
  if (!str || str.length === 0) return false;
  return Array.from(str).every(char => isThaana(char) || char === ' ');
}

/**
 * Count Thaana characters in a string (excluding spaces)
 * @param {string} str - String to count
 * @returns {number} Number of Thaana characters
 */
export function countThaanaChars(str) {
  if (!str) return 0;
  return Array.from(str).filter(char => isThaana(char)).length;
}

/**
 * Remove non-Thaana characters from a string
 * @param {string} str - String to filter
 * @returns {string} String with only Thaana characters
 */
export function filterThaana(str) {
  if (!str) return '';
  return Array.from(str).filter(char => isThaana(char) || char === ' ').join('');
}

/**
 * Normalize Thaana text (trim spaces, normalize Unicode)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export function normalizeThaana(str) {
  if (!str) return '';
  return str.trim().normalize('NFC');
}

/**
 * Check if two Thaana strings match (case-insensitive, normalized)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {boolean} True if strings match
 */
export function thaanaMatch(str1, str2) {
  return normalizeThaana(str1) === normalizeThaana(str2);
}

/**
 * Check if a Thaana string starts with another (normalized)
 * @param {string} str - String to check
 * @param {string} prefix - Prefix to match
 * @returns {boolean} True if str starts with prefix
 */
export function thaanaStartsWith(str, prefix) {
  if (!prefix) return true;
  return normalizeThaana(str).startsWith(normalizeThaana(prefix));
}

/**
 * Get the visual width of Thaana text
 * Thaana characters can have varying widths
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to measure
 * @returns {number} Width in pixels
 */
export function measureThaanaText(ctx, text) {
  return ctx.measureText(text).width;
}

/**
 * Thaana keyboard layout mapping (phonetic)
 * Maps common keyboard keys to Thaana characters
 */
export const thaanaKeyMap = {
  'a': 'ަ',  // a fili
  'A': 'ާ',  // aa
  'i': 'ި',  // i fili
  'I': 'ީ',  // ee
  'u': 'ު',  // u fili
  'U': 'ޫ',  // oo
  'e': 'ެ',  // e fili
  'E': 'ޭ',  // ey
  'o': 'ޮ',  // o fili
  'O': 'ޯ',  // o
  // Add more mappings as needed
};

/**
 * Constants for Thaana text rendering
 */
export const THAANA_CONSTANTS = {
  // Unicode ranges
  THAANA_START: 0x0780,
  THAANA_END: 0x07bf,

  // Common Thaana characters
  SUKUN: 'ް',       // Sukun (vowel killer)
  ABAFILI: 'ަ',     // Abafili (short a)
  AABAAFILI: 'ާ',   // Aabaafili (long a)
  IBIFILI: 'ި',     // Ibifili (short i)
  EEBEEFILI: 'ީ',   // Eebeefili (long i)

  // Direction
  DIRECTION: 'rtl',  // Right-to-left
};
