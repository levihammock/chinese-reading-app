'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SkillLevel } from '@/types';
import NavigationPanel from '@/app/components/NavigationPanel';
import { LessonManager } from '@/utils/lessonManager';

interface VocabWord {
  chinese: string;
  pinyin: string;
  english: string;
}

interface PageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default function LessonPage({ params }: PageProps) {
  const [vocab, setVocab] = useState<VocabWord[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState<Record<string, unknown> | null>(null);
  const [lessonId, setLessonId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const loadLesson = async () => {
      try {
        const resolvedParams = await params;
        const { lessonId: id } = resolvedParams;
        setLessonId(id);

        // Try to migrate old data first
        const migratedLessonId = LessonManager.migrateOldData();
        const currentLessonId = migratedLessonId || id;

        // Get lesson data
        const data = LessonManager.getLessonData(currentLessonId);
        if (!data) {
          setError('Lesson not found');
          setLessonLoading(false);
          return;
        }

        setLessonData(data.lessonData);
        setVocab((data.lessonData.vocabulary as VocabWord[]) || []);
        setRevealed(new Array((data.lessonData.vocabulary as VocabWord[])?.length || 0).fill(false));
        setLessonLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLessonLoading(false);
      }
    };

    loadLesson();
  }, [params, router]);

  const handleReveal = (idx: number) => {
    setRevealed(prev => {
      const newRevealed = [...prev];
      newRevealed[idx] = true;
      return newRevealed;
    });
  };

  const handleShowAll = () => {
    setShowAll(true);
  };

  const handleContinueLesson = () => {
    router.push(`/lesson/${lessonId}/lesson1/quiz`);
  };

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
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {lessonData && <NavigationPanel lessonData={lessonData} />}
      <div className="ml-64 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-8">KanKan</h1>
          <h3 className="text-2xl font-bold text-[#0081A7] mb-6">New Vocabulary</h3>
          {lessonLoading ? (
            <div className="text-[#0081A7] text-lg">Generating your lesson...</div>
          ) : (
            <>
              <div className="flex flex-col gap-4 w-full">
                {vocab.map((word, idx) => (
                  <div key={idx} className="flex items-center gap-6 w-full">
                    <div className="flex flex-col items-start min-w-[100px]">
                      <span className="text-2xl text-[#0081A7] font-bold">{word.chinese}</span>
                      <span className="text-[#00AFB9] text-base">{word.pinyin}</span>
                    </div>
                    <button
                      type="button"
                      className="ml-4 px-6 py-2 rounded-lg bg-[#FED9B7] text-[#F07167] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#F07167] transition-all duration-200"
                      style={{ minWidth: 120 }}
                      onClick={() => handleReveal(idx)}
                      disabled={revealed[idx] || showAll}
                    >
                      <span
                        style={{
                          filter: revealed[idx] || showAll ? 'none' : 'blur(6px)',
                          transition: 'filter 0.2s',
                          cursor: revealed[idx] || showAll ? 'default' : 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        {word.english}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center w-full mt-8 gap-4">
                <button
                  className={`px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl transition-all duration-200 shadow-lg w-full max-w-xs
                    ${!(showAll || revealed.every(Boolean)) ? 'hover:from-[#F07167] hover:to-[#FED9B7] hover:shadow-xl' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={handleShowAll}
                  disabled={showAll || revealed.every(Boolean)}
                >
                  Show All
                </button>
                <button
                  className={`px-8 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl shadow-lg w-full max-w-xs text-lg transition-all duration-200
                    ${revealed.every(Boolean) ? 'hover:bg-[#0081A7]' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={handleContinueLesson}
                  disabled={!revealed.every(Boolean)}
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 