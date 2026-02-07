/**
 * Dhivehi Word Lists organized by difficulty
 * Easy: 3-5 letters
 * Medium: 6-8 letters
 * Hard: 9+ letters
 */

export const words = {
  easy: [
    // Common 3-5 letter words
    'ދިވެހި',    // Dhivehi
    'ރާއްޖެ',    // Raajje (Maldives)
    'ބަހުރުވަ',  // Bahuruvaa (language)
    'ކުޑަ',      // Kuda (small)
    'ބޮޑު',      // Bodu (big)
    'ރަނގަޅު',   // Rangalhu (good)
    'ފަހުން',     // Fahun (later)
    'މިހާރު',     // Miharu (now)
    'ކުރިން',     // Kurin (before)
    'މާލެ',      // Male (capital city)
    'ފޮތް',      // Foth (book)
    'ގަނޑު',     // Gandu (mountain)
    'ރަށް',      // Rash (island)
    'ފަރު',      // Faru (reef)
    'ފެން',      // Fen (water)
    'ކައްކާ',    // Kakka (eat)
    'މަސް',      // Mas (fish)
    'ބަތް',      // Bath (rice)
    'ރޮށި',      // Roshi (bread)
    'ހުސް',      // Hus (empty)
    'ފުރާ',      // Furaa (full)
    'ދުރު',      // Dhuru (far)
    'ހިތް',      // Hith (heart)
    'ފައި',      // Fai (foot)
    'އަތް',  
  ],

  medium: [
    // 6-8 letter words
    'މަގުބޫލް',   // Magubool (popular)
    'ފަރުވާ',     // Faruvaa (care)
    'ދަރިވަރުން',  // Dharivarun (children)
    'މަސައްކަތް', // Masakkath (work)
    'ސަރުކާރު',   // Sarukaru (government)
    'ދަރުސް',     // Dharus (lesson)
    'ސުކޫލް',     // Sukool (school)
    'ކުޅިވަރު',   // Kulivaru (sports)
    'ކުލަވަރު',   // Kulavaru (color/variety)
    'ފިލްމު',     // Filmu (film)
    'މައުސޫމް',   // Mausoonu (innocent)
    'ފުރަތަމަ',   // Furathama (first)
    'ފަހުންތަ',   // Fahuntha (last)
    'ދިރާސާ',    // Dhiraasaa (study)
    'ޚިދުމަތް',   // Khidhumathi (service)
    'ސަރަހައްދު',  // Sarahadhdhu (area)
    'މުހިއްމު',   // Muhimmu (important)
    'ބާރުވެރި',   // Baaruveri (powerful)
    'ސަލާމަތް',   // Salaamathi (safe/goodbye)
    'މާރުހަބާ',   // Maaruhaba (welcome)
    'ސުޕާރކޯ',    // Supaarko (market)
    'ޖަޒީރާ',    // Jazeeraa (island)
    'ބަންދަރު',    // Bandharu (port)
    'އަސާސީ',     // Asaasee (basic)
    'ފުށުން',      // Fushun (beginning)
  ],

  hard: [
    // 9+ letter words
    'ބައިނަލްއަގުވާމީ', // Bainalaguwaamee (international)
    'ސަޤާފަތް',         // Saqaafath (culture)
    'ތަފާތުވުން',        // Tafaathuvun (difference)
    'ރައީސުލްޖުމްހޫރިއްޔާ', // Raeesuljumhooriyyaa (president)
    'މުވައްޒަފުން',      // Muvazzafun (employees)
    'ފަރުދީވެރި',        // Farudhee veri (individual)
    'މުހިއްމުކަން',       // Muhimmukam (importance)
    'ބަދަލުވުން',        // Badhaluvun (change)
    'ސައިންސް',          // Saiense (science)
    'ޓެކްނޮލޮޖީ',        // Technology
    'އިޖުތިމާއީ',        // Ijthimaa'ee (social)
    'އިގުތިސާދީ',        // Iguthisaadhee (economic)
    'ސިޔާސީގޮތުން',      // Siyaasee gothun (politically)
    'ތަރައްޤީ',          // Tharaqqee (development)
    'ސަރަހައްދީ',        // Sarahaddhee (regional)
    'ޑިމޮކްރަސީ',        // Democracy
    'އިންތިޚާބު',        // Inthikhaab (election)
    'ފުރިހަމަ',          // Furihama (complete/perfect)
  ],
};

/**
 * Get a random word from the specified difficulty level
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {string} Random Dhivehi word
 */
export function getRandomWord(difficulty = 'easy') {
  const wordList = words[difficulty] || words.easy;
  return wordList[Math.floor(Math.random() * wordList.length)];
}

/**
 * Get difficulty level based on wave number
 * @param {number} wave - Current wave number
 * @returns {string} Difficulty level
 */
export function getDifficultyForWave(wave) {
  if (wave < 5) return 'easy';
  if (wave < 10) return 'medium';
  return 'hard';
}

/**
 * Get a mix of words from multiple difficulty levels
 * @param {number} wave - Current wave number
 * @returns {string[]} Array of words
 */
export function getWordMix(wave) {
  const difficulty = getDifficultyForWave(wave);
  const mix = [];

  // Add words based on wave progression
  if (difficulty === 'easy') {
    mix.push(...words.easy.slice(0, 10));
  } else if (difficulty === 'medium') {
    mix.push(...words.easy.slice(0, 5));
    mix.push(...words.medium.slice(0, 10));
  } else {
    mix.push(...words.easy.slice(0, 3));
    mix.push(...words.medium.slice(0, 5));
    mix.push(...words.hard.slice(0, 10));
  }

  return mix;
}
