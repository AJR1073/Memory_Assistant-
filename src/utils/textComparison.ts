// Simple Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  return track[str2.length][str1.length];
}

// List of common synonyms in Biblical context
const SYNONYMS: { [key: string]: string[] } = {
  'lord': ['god', 'master', 'sovereign'],
  'father': ['dad', 'creator'],
  'jesus': ['christ', 'messiah', 'savior', 'saviour'],
  'holy spirit': ['spirit', 'comforter', 'helper'],
  'mankind': ['man', 'humanity', 'humankind'],
  // Add more synonyms as needed
};

// Normalize text by removing extra spaces and converting to lowercase
export function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize spaces
    .trim();
}

// Check if two words are synonyms
function areSynonyms(word1: string, word2: string): boolean {
  const w1 = word1.toLowerCase();
  const w2 = word2.toLowerCase();
  
  if (w1 === w2) return true;
  
  // Check direct synonyms
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if ((key === w1 && synonyms.includes(w2)) ||
        (key === w2 && synonyms.includes(w1)) ||
        (synonyms.includes(w1) && synonyms.includes(w2))) {
      return true;
    }
  }
  
  // Check for minor typos (allowing 1-2 character differences)
  const distance = levenshteinDistance(w1, w2);
  return distance <= Math.min(2, Math.floor(w1.length / 3));
}

// Compare two texts and return detailed analysis
export function compareTexts(input: string, reference: string) {
  const normalizedInput = normalizeText(input);
  const normalizedRef = normalizeText(reference);
  
  const inputWords = normalizedInput.split(' ');
  const refWords = normalizedRef.split(' ');
  
  const analysis = {
    matches: [] as boolean[],
    score: 0,
    missingWords: [] as string[],
    extraWords: [] as string[],
    synonymsUsed: [] as Array<{ used: string, reference: string }>,
  };
  
  // Track matching words
  analysis.matches = refWords.map((refWord, index) => {
    const inputWord = inputWords[index];
    if (!inputWord) {
      analysis.missingWords.push(refWord);
      return false;
    }
    
    if (areSynonyms(inputWord, refWord)) {
      if (inputWord !== refWord) {
        analysis.synonymsUsed.push({ used: inputWord, reference: refWord });
      }
      return true;
    }
    
    return false;
  });
  
  // Track extra words
  if (inputWords.length > refWords.length) {
    analysis.extraWords = inputWords.slice(refWords.length);
  }
  
  // Calculate score (weighted by word importance)
  const totalWords = refWords.length;
  const correctWords = analysis.matches.filter(match => match).length;
  analysis.score = Math.round((correctWords / totalWords) * 100);
  
  return analysis;
}

// Generate HTML with highlighting
export function generateHighlightedText(input: string, reference: string) {
  const analysis = compareTexts(input, reference);
  const refWords = reference.split(' ');
  const inputWords = input.split(' ');
  
  let html = '';
  refWords.forEach((word, index) => {
    if (analysis.matches[index]) {
      html += `<span class="correct">${inputWords[index]}</span> `;
    } else if (inputWords[index]) {
      html += `<span class="incorrect">${inputWords[index]}</span> `;
    } else {
      html += `<span class="missing">${word}</span> `;
    }
  });
  
  // Add extra words in red
  analysis.extraWords.forEach(word => {
    html += `<span class="extra">${word}</span> `;
  });
  
  return html.trim();
}
