import { v4 as uuidv4 } from 'uuid';

export interface LessonData {
  skillLevel: string;
  topic: string;
  lessonData: Record<string, unknown>;
  createdAt: number;
}

const MAX_LOCAL_LESSONS = 10;
const LESSON_DATA_PREFIX = 'lessonData-';
const TIMESTAMP_SUFFIX = '-timestamp';

export class LessonManager {
  // Generate a new lesson ID
  static generateLessonId(): string {
    return uuidv4();
  }

  // Store lesson data with timestamp
  static storeLessonData(lessonId: string, lessonData: Record<string, unknown>, skillLevel: string, topic: string): void {
    const data: LessonData = {
      skillLevel,
      topic,
      lessonData,
      createdAt: Date.now()
    };

    localStorage.setItem(`${LESSON_DATA_PREFIX}${lessonId}`, JSON.stringify(data));
    localStorage.setItem(`${lessonId}${TIMESTAMP_SUFFIX}`, data.createdAt.toString());
    localStorage.setItem('currentLessonId', lessonId);

    // Clean up old lessons
    this.cleanupOldLessons();
  }

  // Get lesson data by ID
  static getLessonData(lessonId: string): LessonData | null {
    const data = localStorage.getItem(`${LESSON_DATA_PREFIX}${lessonId}`);
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // Get current lesson ID
  static getCurrentLessonId(): string | null {
    return localStorage.getItem('currentLessonId');
  }

  // Get current lesson data
  static getCurrentLessonData(): LessonData | null {
    const lessonId = this.getCurrentLessonId();
    if (!lessonId) return null;
    return this.getLessonData(lessonId);
  }

  // Clean up old lessons (keep only the most recent MAX_LOCAL_LESSONS)
  static cleanupOldLessons(): void {
    const lessonKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(LESSON_DATA_PREFIX))
      .map(key => key.replace(LESSON_DATA_PREFIX, ''));

    if (lessonKeys.length <= MAX_LOCAL_LESSONS) return;

    // Sort by timestamp (newest first)
    const lessonsWithTimestamps = lessonKeys
      .map(lessonId => ({
        lessonId,
        timestamp: parseInt(localStorage.getItem(`${lessonId}${TIMESTAMP_SUFFIX}`) || '0')
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    // Remove old lessons
    const lessonsToRemove = lessonsWithTimestamps.slice(MAX_LOCAL_LESSONS);
    lessonsToRemove.forEach(({ lessonId }) => {
      localStorage.removeItem(`${LESSON_DATA_PREFIX}${lessonId}`);
      localStorage.removeItem(`${lessonId}${TIMESTAMP_SUFFIX}`);
    });
  }

  // Migrate old data format to new format
  static migrateOldData(): string | null {
    const oldLessonData = localStorage.getItem('lessonData');
    const skillLevel = localStorage.getItem('skillLevel');
    const topic = localStorage.getItem('topic');
    
    if (oldLessonData && skillLevel && topic) {
      try {
        const lessonData = JSON.parse(oldLessonData);
        const lessonId = this.generateLessonId();
        
        // Store in new format
        this.storeLessonData(lessonId, lessonData, skillLevel, topic);
        
        // Clean up old format
        localStorage.removeItem('lessonData');
        
        return lessonId;
      } catch (error) {
        console.error('Failed to migrate old lesson data:', error);
        return null;
      }
    }
    
    return null;
  }

  // Clear current lesson (for starting fresh)
  static clearCurrentLesson(): void {
    localStorage.removeItem('currentLessonId');
    localStorage.removeItem('skillLevel');
    localStorage.removeItem('topic');
  }

  // Get all lesson IDs (for debugging/admin)
  static getAllLessonIds(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(LESSON_DATA_PREFIX))
      .map(key => key.replace(LESSON_DATA_PREFIX, ''));
  }

  // Delete a specific lesson
  static deleteLesson(lessonId: string): void {
    localStorage.removeItem(`${LESSON_DATA_PREFIX}${lessonId}`);
    localStorage.removeItem(`${lessonId}${TIMESTAMP_SUFFIX}`);
    
    // If this was the current lesson, clear current
    const currentLessonId = this.getCurrentLessonId();
    if (currentLessonId === lessonId) {
      localStorage.removeItem('currentLessonId');
    }
  }
} 