// Pinyin Dictionary for Chinese Reading App
// This dictionary maps Pinyin words to their Chinese characters and English translations

export interface DictionaryEntry {
  chinese: string;
  english: string;
  type: 'word' | 'character' | 'phrase';
  frequency: 'common' | 'medium' | 'rare';
}

export const pinyinDictionary: Record<string, DictionaryEntry> = {
  // Common words and phrases
  "xiǎo": { chinese: "小", english: "little/small", type: "character", frequency: "common" },
  "māo": { chinese: "猫", english: "cat", type: "character", frequency: "common" },
  "xǐhuān": { chinese: "喜欢", english: "like", type: "word", frequency: "common" },
  "wán": { chinese: "玩", english: "play", type: "character", frequency: "common" },
  "qiú": { chinese: "球", english: "ball", type: "character", frequency: "common" },
  "tā": { chinese: "他/她/它", english: "he/she/it", type: "character", frequency: "common" },
  "měi": { chinese: "每", english: "every", type: "character", frequency: "common" },
  "tiān": { chinese: "天", english: "day", type: "character", frequency: "common" },
  "dōu": { chinese: "都", english: "all/both", type: "character", frequency: "common" },
  "hěn": { chinese: "很", english: "very", type: "character", frequency: "common" },
  "kāixīn": { chinese: "开心", english: "happy", type: "word", frequency: "common" },
  
  // Time-related words
  "wǎnshang": { chinese: "晚上", english: "evening/night", type: "word", frequency: "common" },
  "bā": { chinese: "八", english: "eight", type: "character", frequency: "common" },
  "diǎn": { chinese: "点", english: "o'clock", type: "character", frequency: "common" },
  "shí": { chinese: "十", english: "ten", type: "character", frequency: "common" },
  "yī": { chinese: "一", english: "one", type: "character", frequency: "common" },
  "èr": { chinese: "二", english: "two", type: "character", frequency: "common" },
  "sān": { chinese: "三", english: "three", type: "character", frequency: "common" },
  "sì": { chinese: "四", english: "four", type: "character", frequency: "common" },
  "wǔ": { chinese: "五", english: "five", type: "character", frequency: "common" },
  "liù": { chinese: "六", english: "six", type: "character", frequency: "common" },
  "qī": { chinese: "七", english: "seven", type: "character", frequency: "common" },
  "jiǔ": { chinese: "九", english: "nine", type: "character", frequency: "common" },
  
  // Family and people
  "míng": { chinese: "明", english: "bright/clear", type: "character", frequency: "common" },
  "péngyou": { chinese: "朋友", english: "friend", type: "word", frequency: "common" },
  "jiārén": { chinese: "家人", english: "family", type: "word", frequency: "common" },
  "wǒ": { chinese: "我", english: "I/me", type: "character", frequency: "common" },
  "nǐ": { chinese: "你", english: "you", type: "character", frequency: "common" },
  
  // Places and locations
  "gōngyuán": { chinese: "公园", english: "park", type: "word", frequency: "common" },
  "bówùguǎn": { chinese: "博物馆", english: "museum", type: "word", frequency: "medium" },
  "cāntīng": { chinese: "餐厅", english: "restaurant", type: "word", frequency: "common" },
  "fùjìn": { chinese: "附近", english: "nearby", type: "word", frequency: "medium" },
  
  // Actions and verbs
  "qù": { chinese: "去", english: "go", type: "character", frequency: "common" },
  "kàn": { chinese: "看", english: "see/look", type: "character", frequency: "common" },
  "dào": { chinese: "到", english: "arrive/reach", type: "character", frequency: "common" },
  "le": { chinese: "了", english: "completed action marker", type: "character", frequency: "common" },
  "xué": { chinese: "学", english: "learn/study", type: "character", frequency: "common" },
  "chī": { chinese: "吃", english: "eat", type: "character", frequency: "common" },
  "zuò": { chinese: "坐", english: "sit", type: "character", frequency: "medium" },
  
  // Adjectives and descriptions
  "měilì": { chinese: "美丽", english: "beautiful", type: "word", frequency: "common" },
  "hǎo": { chinese: "好", english: "good", type: "character", frequency: "common" },
  "dà": { chinese: "大", english: "big/large", type: "character", frequency: "common" },
  "gāoxìng": { chinese: "高兴", english: "happy/glad", type: "word", frequency: "common" },
  "yǒuqù": { chinese: "有趣", english: "interesting", type: "word", frequency: "medium" },
  
  // Objects and things
  "huā": { chinese: "花", english: "flower", type: "character", frequency: "common" },
  "shū": { chinese: "书", english: "book", type: "character", frequency: "common" },
  "zhuōzi": { chinese: "桌子", english: "table", type: "word", frequency: "medium" },
  "yǐzi": { chinese: "椅子", english: "chair", type: "word", frequency: "medium" },
  
  // Time and sequence
  "zuótiān": { chinese: "昨天", english: "yesterday", type: "word", frequency: "common" },
  "jīntiān": { chinese: "今天", english: "today", type: "word", frequency: "common" },
  "míngtiān": { chinese: "明天", english: "tomorrow", type: "word", frequency: "common" },
  "xiàwǔ": { chinese: "下午", english: "afternoon", type: "word", frequency: "common" },
  "shàngwǔ": { chinese: "上午", english: "morning", type: "word", frequency: "common" },
  
  // Quantifiers and measure words
  "duō": { chinese: "多", english: "many/much", type: "character", frequency: "common" },
  "shǎo": { chinese: "少", english: "few/little", type: "character", frequency: "medium" },
  "gè": { chinese: "个", english: "measure word for people/objects", type: "character", frequency: "common" },
  
  // Connectors and particles
  "hé": { chinese: "和", english: "and", type: "character", frequency: "common" },
  "de": { chinese: "的", english: "possessive/descriptive particle", type: "character", frequency: "common" },
  "zài": { chinese: "在", english: "at/in/on", type: "character", frequency: "common" },
  "yě": { chinese: "也", english: "also/too", type: "character", frequency: "common" },
  
  // Question words
  "nǎlǐ": { chinese: "哪里", english: "where", type: "word", frequency: "common" },
  
  // Common phrases
  "yīqǐ": { chinese: "一起", english: "together", type: "word", frequency: "common" },
  "hòu": { chinese: "后", english: "after/behind", type: "character", frequency: "common" },
  "qián": { chinese: "前", english: "before/front", type: "character", frequency: "common" },
  "lǐ": { chinese: "里", english: "inside/in", type: "character", frequency: "common" },
  "wài": { chinese: "外", english: "outside", type: "character", frequency: "medium" },
};

// Helper function to get the best translation for a Pinyin word
export function getPinyinTranslation(pinyin: string): DictionaryEntry | null {
  const normalizedPinyin = pinyin.toLowerCase().trim();
  return pinyinDictionary[normalizedPinyin] || null;
}

// Helper function to get character-level translations as fallback
export function getCharacterTranslation(character: string): DictionaryEntry | null {
  // This would need to be expanded with character-level mappings
  // For now, return null to indicate no character-level translation available
  return null;
}

// Helper function to get context-aware translation
export function getContextAwareTranslation(
  pinyin: string, 
  context: { before?: string, after?: string }
): DictionaryEntry | null {
  const baseTranslation = getPinyinTranslation(pinyin);
  if (!baseTranslation) return null;
  
  // Add context-specific logic here if needed
  // For example, "tā" could mean "he", "she", or "it" depending on context
  return baseTranslation;
} 