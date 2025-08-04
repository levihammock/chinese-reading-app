'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import NavigationPanel from '@/app/components/NavigationPanel';
import { LessonManager } from '@/utils/lessonManager';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  status: 'available' | 'locked' | 'completed';
}

interface PageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default function Lesson3Page({ params }: PageProps) {
  const [lessonData, setLessonData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        const { lessonId: id } = resolvedParams;
        
        if (!isMounted) return;
        
        setLessonId(id);

        // Get lesson data directly without migration check on every load
        const data = LessonManager.getLessonData(id);
        if (!data) {
          if (isMounted) {
            setError('Lesson not found');
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setLessonData(data.lessonData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load lesson');
          setLoading(false);
        }
      }
    };

    loadParams();

    return () => {
      isMounted = false;
    };
  }, [params]);

  // Memoize modules to prevent unnecessary re-renders
  const modules: ModuleCard[] = useMemo(() => [
    {
      id: 'reading-story',
      title: 'New Story',
      description: 'Read a short story with interactive word-by-word translations',
      path: `/lesson/${lessonId}/lesson3/reading`,
      icon: '1',
      status: 'available'
    },
    {
      id: 'reading-comprehension',
      title: 'Reading Practice',
      description: 'Test your understanding of the story with questions',
      path: `/lesson/${lessonId}/lesson3/reading`,
      icon: '2',
      status: 'available'
    },
    {
      id: 'reading-practice',
      title: 'Reading Quiz',
      description: 'Practice reading fluency with guided exercises',
      path: `/lesson/${lessonId}/lesson3/reading`,
      icon: '3',
      status: 'locked'
    }
  ], [lessonId]);

  const handleModuleClick = (module: ModuleCard) => {
    try {
      if (module.status === 'available') {
        router.push(module.path);
      }
    } catch (error) {
      console.error('Module navigation error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
          <p className="text-[#00AFB9]">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/setup')}
            className="px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl"
          >
            Start New Lesson
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {lessonData && <NavigationPanel lessonData={lessonData} />}
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-8 text-center">Lesson 3: Reading</h1>
          <p className="text-[#00AFB9] text-lg text-center mb-12">
            Improve your reading comprehension with engaging stories
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module) => (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className={`h-64 p-8 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex flex-col ${
                  module.status === 'available'
                    ? 'bg-white hover:bg-[#FED9B7] hover:shadow-xl border-2 border-[#FED9B7]'
                    : module.status === 'completed'
                    ? 'bg-green-50 border-2 border-green-300'
                    : 'bg-gray-100 border-2 border-gray-300 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl font-bold text-[#00AFB9]">{module.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-[#0081A7]">{module.title}</h3>
                    <p className="text-base text-[#00AFB9] mt-2">{module.description}</p>
                  </div>
                </div>
                
                <div className="flex-1"></div>
                
                <div className="flex justify-center">
                  {module.status === 'available' && (
                    <button className="px-6 py-3 bg-[#00AFB9] text-white rounded-xl hover:bg-[#0081A7] transition-colors font-semibold">
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 