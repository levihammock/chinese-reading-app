export type SkillLevel = 'easy' | 'medium' | 'hard';

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