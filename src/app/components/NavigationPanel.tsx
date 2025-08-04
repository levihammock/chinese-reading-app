'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LessonManager } from '@/utils/lessonManager';

interface NavigationPanelProps {
  lessonData: Record<string, unknown>;
}

export default function NavigationPanel({ lessonData }: NavigationPanelProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Extract lesson ID from pathname
  const getLessonIdFromPath = (pathname: string): string | null => {
    const match = pathname.match(/\/lesson\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const currentLessonId = getLessonIdFromPath(pathname);

  const navigationItems = [
    {
      id: 'lesson1',
      title: 'Lesson 1: Vocabulary',
      path: currentLessonId ? `/lesson/${currentLessonId}/lesson1` : '/lesson/lesson1',
      icon: '📚',
      description: 'Learn new words'
    },
    {
      id: 'lesson2',
      title: 'Lesson 2: Grammar',
      path: currentLessonId ? `/lesson/${currentLessonId}/lesson2` : '/lesson/lesson2',
      icon: '📝',
      description: 'Learn a new grammar pattern'
    },
    {
      id: 'lesson3',
      title: 'Lesson 3: Reading',
      path: currentLessonId ? `/lesson/${currentLessonId}/lesson3` : '/lesson/lesson3',
      icon: '📖',
      description: 'Read and practice'
    },
    {
      id: 'lesson4',
      title: 'Lesson 4: Writing',
      path: currentLessonId ? `/lesson/${currentLessonId}/lesson4` : '/lesson/lesson4',
      icon: '✏️',
      description: 'Write characters'
    }
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleNavigation = (path: string) => {
    try {
      router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleStartNewLesson = () => {
    try {
      // Clear current lesson data but keep the lesson itself
      LessonManager.clearCurrentLesson();
      router.push('/setup');
    } catch (error) {
      console.error('Start new lesson error:', error);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-[#FDFCDC] shadow-lg border-r border-[#FED9B7] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-[#0081A7] mb-6">Lesson Sections</h2>
        
        <div className="space-y-3">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full h-24 p-4 rounded-xl text-left transition-all duration-200 flex items-center ${
                isActive(item.path)
                  ? 'bg-[#00AFB9] text-white shadow-md'
                  : 'bg-white text-[#0081A7] hover:bg-[#FED9B7] hover:text-[#F07167] border border-[#FED9B7]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-sm opacity-75">{item.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-[#FED9B7]">
          <button
            onClick={handleStartNewLesson}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200"
          >
            Create New Lesson
          </button>
        </div>
      </div>
    </div>
  );
} 