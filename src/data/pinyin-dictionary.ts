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
  "tāmen": { chinese: "他们", english: "they/them", type: "word", frequency: "common" },
  "dàjiā": { chinese: "大家", english: "everyone", type: "word", frequency: "common" },
  
  // Places and locations
  "gōngyuán": { chinese: "公园", english: "park", type: "word", frequency: "common" },
  "bówùguǎn": { chinese: "博物馆", english: "museum", type: "word", frequency: "medium" },
  "cāntīng": { chinese: "餐厅", english: "restaurant", type: "word", frequency: "common" },
  "fùjìn": { chinese: "附近", english: "nearby", type: "word", frequency: "medium" },
  "nàlǐ": { chinese: "那里", english: "there", type: "word", frequency: "common" },
  
  // Actions and verbs
  "qù": { chinese: "去", english: "go", type: "character", frequency: "common" },
  "kàn": { chinese: "看", english: "see/look", type: "character", frequency: "common" },
  "dào": { chinese: "到", english: "arrive/reach", type: "character", frequency: "common" },
  "le": { chinese: "了", english: "completed action marker", type: "character", frequency: "common" },
  "xué": { chinese: "学", english: "learn/study", type: "character", frequency: "common" },
  "chī": { chinese: "吃", english: "eat", type: "character", frequency: "common" },
  "zuò": { chinese: "坐", english: "sit", type: "character", frequency: "medium" },
  "jiéshù": { chinese: "结束", english: "end/finish", type: "word", frequency: "medium" },
  "cānguān": { chinese: "参观", english: "visit/tour", type: "word", frequency: "medium" },
  
  // Adjectives and descriptions
  "měilì": { chinese: "美丽", english: "beautiful", type: "word", frequency: "common" },
  "hǎo": { chinese: "好", english: "good", type: "character", frequency: "common" },
  "dà": { chinese: "大", english: "big/large", type: "character", frequency: "common" },
  "gāoxìng": { chinese: "高兴", english: "happy/glad", type: "word", frequency: "common" },
  "yǒuqù": { chinese: "有趣", english: "interesting", type: "word", frequency: "medium" },
  "lìshǐ": { chinese: "历史", english: "history", type: "word", frequency: "medium" },
  "wénwù": { chinese: "文物", english: "cultural relics", type: "word", frequency: "rare" },
  "gǔdài": { chinese: "古代", english: "ancient", type: "word", frequency: "medium" },
  "zhīshi": { chinese: "知识", english: "knowledge", type: "word", frequency: "medium" },
  
  // Objects and things
  "huā": { chinese: "花", english: "flower", type: "character", frequency: "common" },
  "shū": { chinese: "书", english: "book", type: "character", frequency: "common" },
  "zhuōzi": { chinese: "桌子", english: "table", type: "word", frequency: "medium" },
  "yǐzi": { chinese: "椅子", english: "chair", type: "word", frequency: "medium" },
  "wǎnfàn": { chinese: "晚饭", english: "dinner", type: "word", frequency: "common" },
  
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
  "guānyú": { chinese: "关于", english: "about/concerning", type: "word", frequency: "medium" },
  
  // Question words
  "nǎlǐ": { chinese: "哪里", english: "where", type: "word", frequency: "common" },
  
  // Common phrases
  "yīqǐ": { chinese: "一起", english: "together", type: "word", frequency: "common" },
  "hòu": { chinese: "后", english: "after/behind", type: "character", frequency: "common" },
  "qián": { chinese: "前", english: "before/front", type: "character", frequency: "common" },
  "lǐ": { chinese: "里", english: "inside/in", type: "character", frequency: "common" },
  "wài": { chinese: "外", english: "outside", type: "character", frequency: "medium" },
  
  // Weather and environment
  "tiānqì": { chinese: "天气", english: "weather", type: "word", frequency: "common" },
  
  // Additional common words from stories
  "zhōngguó": { chinese: "中国", english: "China", type: "word", frequency: "common" },
};

// Character-level dictionary for fallback
export const characterDictionary: Record<string, DictionaryEntry> = {
  "小": { chinese: "小", english: "small/little", type: "character", frequency: "common" },
  "猫": { chinese: "猫", english: "cat", type: "character", frequency: "common" },
  "喜": { chinese: "喜", english: "like/joy", type: "character", frequency: "common" },
  "欢": { chinese: "欢", english: "happy/joyful", type: "character", frequency: "common" },
  "玩": { chinese: "玩", english: "play", type: "character", frequency: "common" },
  "球": { chinese: "球", english: "ball", type: "character", frequency: "common" },
  "它": { chinese: "它", english: "it", type: "character", frequency: "common" },
  "每": { chinese: "每", english: "every", type: "character", frequency: "common" },
  "天": { chinese: "天", english: "day/sky", type: "character", frequency: "common" },
  "都": { chinese: "都", english: "all/both", type: "character", frequency: "common" },
  "很": { chinese: "很", english: "very", type: "character", frequency: "common" },
  "开": { chinese: "开", english: "open", type: "character", frequency: "common" },
  "心": { chinese: "心", english: "heart", type: "character", frequency: "common" },
  "明": { chinese: "明", english: "bright/clear", type: "character", frequency: "common" },
  "朋": { chinese: "朋", english: "friend", type: "character", frequency: "common" },
  "友": { chinese: "友", english: "friend", type: "character", frequency: "common" },
  "家": { chinese: "家", english: "family/home", type: "character", frequency: "common" },
  "人": { chinese: "人", english: "person", type: "character", frequency: "common" },
  "我": { chinese: "我", english: "I/me", type: "character", frequency: "common" },
  "你": { chinese: "你", english: "you", type: "character", frequency: "common" },
  "他": { chinese: "他", english: "he/him", type: "character", frequency: "common" },
  "她": { chinese: "她", english: "she/her", type: "character", frequency: "common" },
  "们": { chinese: "们", english: "plural marker", type: "character", frequency: "common" },
  "公": { chinese: "公", english: "public", type: "character", frequency: "common" },
  "园": { chinese: "园", english: "garden", type: "character", frequency: "common" },
  "博": { chinese: "博", english: "extensive", type: "character", frequency: "medium" },
  "物": { chinese: "物", english: "thing/object", type: "character", frequency: "common" },
  "馆": { chinese: "馆", english: "building/hall", type: "character", frequency: "medium" },
  "餐": { chinese: "餐", english: "meal", type: "character", frequency: "medium" },
  "厅": { chinese: "厅", english: "hall", type: "character", frequency: "medium" },
  "附": { chinese: "附", english: "attach", type: "character", frequency: "medium" },
  "近": { chinese: "近", english: "near", type: "character", frequency: "common" },
  "那": { chinese: "那", english: "that", type: "character", frequency: "common" },
  "里": { chinese: "里", english: "inside", type: "character", frequency: "common" },
  "去": { chinese: "去", english: "go", type: "character", frequency: "common" },
  "看": { chinese: "看", english: "see/look", type: "character", frequency: "common" },
  "到": { chinese: "到", english: "arrive", type: "character", frequency: "common" },
  "了": { chinese: "了", english: "completed action", type: "character", frequency: "common" },
  "学": { chinese: "学", english: "learn", type: "character", frequency: "common" },
  "吃": { chinese: "吃", english: "eat", type: "character", frequency: "common" },
  "坐": { chinese: "坐", english: "sit", type: "character", frequency: "medium" },
  "结": { chinese: "结", english: "end/tie", type: "character", frequency: "medium" },
  "束": { chinese: "束", english: "end/bind", type: "character", frequency: "medium" },
  "参": { chinese: "参", english: "participate", type: "character", frequency: "medium" },
  "观": { chinese: "观", english: "observe", type: "character", frequency: "medium" },
  "美": { chinese: "美", english: "beautiful", type: "character", frequency: "common" },
  "丽": { chinese: "丽", english: "beautiful", type: "character", frequency: "medium" },
  "好": { chinese: "好", english: "good", type: "character", frequency: "common" },
  "大": { chinese: "大", english: "big", type: "character", frequency: "common" },
  "高": { chinese: "高", english: "high", type: "character", frequency: "common" },
  "兴": { chinese: "兴", english: "excited", type: "character", frequency: "common" },
  "有": { chinese: "有", english: "have", type: "character", frequency: "common" },
  "趣": { chinese: "趣", english: "interesting", type: "character", frequency: "medium" },
  "历": { chinese: "历", english: "history", type: "character", frequency: "medium" },
  "史": { chinese: "史", english: "history", type: "character", frequency: "medium" },
  "文": { chinese: "文", english: "culture", type: "character", frequency: "common" },
  "古": { chinese: "古", english: "ancient", type: "character", frequency: "medium" },
  "代": { chinese: "代", english: "generation", type: "character", frequency: "medium" },
  "知": { chinese: "知", english: "know", type: "character", frequency: "common" },
  "识": { chinese: "识", english: "knowledge", type: "character", frequency: "medium" },
  "花": { chinese: "花", english: "flower", type: "character", frequency: "common" },
  "书": { chinese: "书", english: "book", type: "character", frequency: "common" },
  "桌": { chinese: "桌", english: "table", type: "character", frequency: "medium" },
  "子": { chinese: "子", english: "child/suffix", type: "character", frequency: "common" },
  "椅": { chinese: "椅", english: "chair", type: "character", frequency: "medium" },
  "晚": { chinese: "晚", english: "evening", type: "character", frequency: "common" },
  "饭": { chinese: "饭", english: "meal", type: "character", frequency: "common" },
  "昨": { chinese: "昨", english: "yesterday", type: "character", frequency: "common" },
  "今": { chinese: "今", english: "today", type: "character", frequency: "common" },
  "下": { chinese: "下", english: "below", type: "character", frequency: "common" },
  "午": { chinese: "午", english: "noon", type: "character", frequency: "common" },
  "上": { chinese: "上", english: "above", type: "character", frequency: "common" },
  "多": { chinese: "多", english: "many", type: "character", frequency: "common" },
  "少": { chinese: "少", english: "few", type: "character", frequency: "medium" },
  "个": { chinese: "个", english: "measure word", type: "character", frequency: "common" },
  "和": { chinese: "和", english: "and", type: "character", frequency: "common" },
  "的": { chinese: "的", english: "possessive", type: "character", frequency: "common" },
  "在": { chinese: "在", english: "at", type: "character", frequency: "common" },
  "也": { chinese: "也", english: "also", type: "character", frequency: "common" },
  "关": { chinese: "关", english: "about", type: "character", frequency: "medium" },
  "于": { chinese: "于", english: "about", type: "character", frequency: "medium" },
  "起": { chinese: "起", english: "rise", type: "character", frequency: "common" },
  "后": { chinese: "后", english: "after", type: "character", frequency: "common" },
  "前": { chinese: "前", english: "before", type: "character", frequency: "common" },
  "外": { chinese: "外", english: "outside", type: "character", frequency: "medium" },
  "气": { chinese: "气", english: "air", type: "character", frequency: "common" },
  "中": { chinese: "中", english: "middle", type: "character", frequency: "common" },
  "国": { chinese: "国", english: "country", type: "character", frequency: "common" },
};

// Helper function to get the best translation for a Pinyin word
export function getPinyinTranslation(pinyin: string): DictionaryEntry | null {
  const normalizedPinyin = pinyin.toLowerCase().trim();
  return pinyinDictionary[normalizedPinyin] || null;
}

// Helper function to get character-level translations as fallback
export function getCharacterTranslation(character: string): DictionaryEntry | null {
  return characterDictionary[character] || null;
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

// Enhanced function to get any available translation (pinyin or character level)
export function getAnyTranslation(pinyin: string, chineseChars?: string): DictionaryEntry | null {
  // Try pinyin dictionary first
  const pinyinTranslation = getPinyinTranslation(pinyin);
  if (pinyinTranslation) return pinyinTranslation;
  
  // If we have Chinese characters, try character-level translation
  if (chineseChars) {
    const charTranslation = getCharacterTranslation(chineseChars);
    if (charTranslation) return charTranslation;
  }
  
  return null;
} 