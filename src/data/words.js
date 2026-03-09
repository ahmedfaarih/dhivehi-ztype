/**
 * Dhivehi Word Lists - dynamically loaded from text files
 * Files 5.txt to 36.txt contain words organized by difficulty
 * Wave 1 → 5.txt, Wave 2 → 6.txt, etc.
 */

// Import all word files at build time using Vite's glob import
// query: '?raw' imports file contents as string
const wordFiles = import.meta.glob('./words/*.txt', { eager: true, query: '?raw', import: 'default' });

// Parse and cache words by file number
const wordsByFileNumber = {};

// Process all imported files
for (const path in wordFiles) {
  // Extract file number from path (e.g., "./words/4.txt" → 4)
  const match = path.match(/\/(\d+)\.txt$/);
  if (match) {
    const fileNumber = parseInt(match[1]);
    const content = wordFiles[path];

    // Parse words: split by newlines, remove all trailing punctuation, filter empty
    const words = content
      .split('\n')
      .map(word => word.trim().replace(/[،.؟!;:،]+$/, '').trim())
      .filter(word => word.length > 0);

    wordsByFileNumber[fileNumber] = words;
  }
}

// Fallback word list in case files don't load
const fallbackWords = [
  'ދިވެހި', 'ރާއްޖެ', 'ބަހުރުވަ', 'ކުޑަ', 'ބޮޑު',
  'ރަނގަޅު', 'ފަހުން', 'މިހާރު', 'ކުރިން', 'މާލެ'
];

/**
 * Get word list for a specific wave
 * @param {number} wave - Current wave number
 * @returns {string[]} Array of words for this wave
 */
function getWordsForWave(wave) {
  // Map wave number to file number (wave 1 → file 5, wave 2 → file 6, etc.)
  const fileNumber = wave + 4;

  // Get words from file, or use fallback
  const words = wordsByFileNumber[fileNumber];

  if (words && words.length > 0) {
    return words;
  }

  // If file doesn't exist, try to use the last available file
  const availableFiles = Object.keys(wordsByFileNumber).map(Number).sort((a, b) => b - a);
  if (availableFiles.length > 0) {
    const lastFile = availableFiles[0];
    return wordsByFileNumber[lastFile] || fallbackWords;
  }

  return fallbackWords;
}

/**
 * Get a random word for the current wave
 * @param {number} wave - Current wave number
 * @param {number|null} maxLength - Optional maximum word length (for progression)
 * @returns {string} Random Dhivehi word
 */
export function getRandomWord(wave = 1, maxLength = null) {
  let wordList = getWordsForWave(wave);

  // Filter by length if specified
  if (maxLength !== null) {
    const filtered = wordList.filter(word => word.length <= maxLength);
    // Use filtered list if it has words, otherwise use full list as fallback
    if (filtered.length > 0) {
      wordList = filtered;
    }
  }

  return wordList[Math.floor(Math.random() * wordList.length)];
}

/**
 * Get difficulty level based on wave number
 * @param {number} wave - Current wave number
 * @returns {number} Wave number (used as difficulty indicator)
 */
export function getDifficultyForWave(wave) {
  // Return wave number itself as the difficulty
  return wave;
}

/**
 * Get information about loaded word files (for debugging)
 * @returns {Object} Stats about loaded files
 */
export function getWordStats() {
  const fileNumbers = Object.keys(wordsByFileNumber).map(Number).sort((a, b) => a - b);
  const stats = {
    totalFiles: fileNumbers.length,
    fileRange: fileNumbers.length > 0 ? `${fileNumbers[0]}-${fileNumbers[fileNumbers.length - 1]}` : 'none',
    files: {}
  };

  for (const fileNum of fileNumbers) {
    stats.files[fileNum] = {
      wordCount: wordsByFileNumber[fileNum].length,
      sampleWords: wordsByFileNumber[fileNum].slice(0, 3)
    };
  }

  return stats;
}
