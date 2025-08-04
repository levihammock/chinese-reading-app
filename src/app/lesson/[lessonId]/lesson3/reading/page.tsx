'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationPanel from '@/app/components/NavigationPanel';
import { LessonManager } from '@/utils/lessonManager';

interface AlignedWord {
  chinese: string;
  pinyin: string;
  english: string;
}

interface Story {
  aligned: AlignedWord[];
  sentence: string;
}

interface PageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default function ReadingPage({ params }: PageProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [lessonData, setLessonData] = useState<Record<string, unknown> | null>(null);
  const [lessonId, setLessonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hoveredWord, setHoveredWord] = useState<{ word: AlignedWord; position: { x: number; y: number } } | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.error('Loading timeout - setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout
    
    const loadParams = async () => {
      try {
        console.log('Starting to load params...'); // Debug log
        const resolvedParams = await params;
        console.log('Params resolved:', resolvedParams); // Debug log
        const { lessonId: id } = resolvedParams;
        
        if (!isMounted) return;
        
        setLessonId(id);

        const data = LessonManager.getLessonData(id);
        console.log('Lesson data found:', !!data); // Debug log
        if (!data) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setLessonData(data.lessonData);
          const storyData = (data.lessonData.story as Story) || null;
          setStory(storyData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading reading page:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadParams();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [params]);

  // Clean up tooltip when story changes
  useEffect(() => {
    setHoveredWord(null);
  }, [story]);

  const handleContinueToWriting = () => {
    router.push(`/lesson/${lessonId}/lesson4`);
  };

  // Helper function to build Chinese text from aligned words
  const buildChineseText = (aligned: AlignedWord[]) => {
    return aligned.map(word => word.chinese).join('');
  };

  // Helper function to build pinyin from aligned words
  const buildPinyinText = (aligned: AlignedWord[]) => {
    return aligned.map(word => word.pinyin).join(' ');
  };

  // Helper function to render interactive Chinese text with hover tooltips
  const renderInteractiveChineseText = (aligned: AlignedWord[]) => {
    return (
      <div className="text-lg leading-relaxed relative">
        {aligned.map((word, index) => (
          <span
            key={index}
            className="inline-block cursor-pointer hover:bg-yellow-200 hover:bg-opacity-50 rounded px-1 transition-colors duration-200 border-b border-dotted border-gray-300 hover:border-yellow-400 hover:border-solid"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              
              // Calculate tooltip position
              let x = rect.left + rect.width / 2;
              let y = rect.top - 10;
              
              // Adjust if tooltip would go off-screen
              if (x < 100) x = 100;
              if (x > viewportWidth - 100) x = viewportWidth - 100;
              if (y < 50) y = rect.bottom + 10; // Show below if not enough space above
              
              setHoveredWord({
                word,
                position: { x, y }
              });
            }}
            onMouseLeave={() => setHoveredWord(null)}
            style={{ 
              position: 'relative',
              zIndex: 1
            }}
          >
            {word.chinese}
          </span>
        ))}
        
        {/* Custom tooltip */}
        {hoveredWord && (
          <div
            className="fixed bg-black text-white px-3 py-2 rounded-lg text-sm shadow-lg z-50 pointer-events-none"
            style={{
              left: hoveredWord.position.x,
              top: hoveredWord.position.y,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="font-medium">{hoveredWord.word.pinyin}</div>
            <div className="text-gray-300">{hoveredWord.word.english}</div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-[#0081A7] to-[#00AFB9] rounded-full flex items-center justify-center mb-6 animate-pulse">
            <span className="text-white text-3xl">📖</span>
          </div>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
          <p className="text-xl text-[#00AFB9]">Loading reading lesson...</p>
        </div>
      </div>
    );
  }

  if (!story || !story.aligned || story.aligned.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-white text-3xl">📚</span>
          </div>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
          <p className="text-red-500 mb-6 text-lg">Lesson not found or reading content not available</p>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/setup')}
              className="px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🚀 Start New Lesson
            </button>
            <div className="text-sm text-gray-500 bg-white rounded-lg p-4 shadow-md">
              <p className="font-medium mb-2">Debug Information:</p>
              <p>Available lesson IDs: {LessonManager.getAllLessonIds().join(', ') || 'None'}</p>
              <p>Current lesson ID: {lessonId}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {lessonData && <NavigationPanel lessonData={lessonData} />}
      <div className="ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-[#0081A7] mb-4">📖 Reading Practice</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Practice reading Chinese with interactive word translations
            </p>
          </div>
          
          {/* Main Story Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 mb-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#0081A7] mb-2">📚 Reading Story</h2>
              <p className="text-gray-600">Hover over any word to see its translation</p>
            </div>
            
            {/* Chinese Text Section */}
            <div className="mb-10">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-[#0081A7] rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">中</span>
                </div>
                <h3 className="text-2xl font-bold text-[#0081A7]">Chinese Text</h3>
              </div>
              <div className="bg-gradient-to-r from-[#FDFCDC] to-[#FEF7E0] rounded-2xl p-8 border-2 border-[#FED9B7] shadow-lg">
                {renderInteractiveChineseText(story.aligned)}
              </div>
            </div>
            
            {/* Pinyin Section */}
            <div className="mb-10">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-[#00AFB9] rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">拼</span>
                </div>
                <h3 className="text-2xl font-bold text-[#0081A7]">Pinyin</h3>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-[#00AFB9] shadow-lg">
                <p className="text-xl leading-relaxed text-gray-700 font-medium">{buildPinyinText(story.aligned)}</p>
              </div>
            </div>
            
            {/* English Translation Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-[#F07167] rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">英</span>
                </div>
                <h3 className="text-2xl font-bold text-[#0081A7]">English Translation</h3>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-8 border-2 border-[#F07167] shadow-lg">
                <p className="text-xl leading-relaxed text-gray-700 font-medium">{story.sentence}</p>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={handleContinueToWriting}
              className="px-12 py-4 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-bold text-xl rounded-2xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              ✍️ Continue to Writing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 