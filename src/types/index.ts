export type SkillLevel = 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6';

export type ViewMode = 'chinese' | 'pinyin' | 'english' | 'all';

export interface StoryData {
  chinese: string;
  pinyin: string;
  english: string;
}

export interface VocabularyWord {
  chinese: string;
  pinyin: string;
  english: string;
  timestamp: number;
}

export interface SavedStory {
  id: string;
  story: StoryData;
  skillLevel: SkillLevel;
  subject: string;
  timestamp: number;
  vocabulary: VocabularyWord[];
} 