'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function QuizPage({ params }: PageProps) {
  const [vocab, setVocab] = useState<VocabWord[]>([]);
  const [quizShuffledEnglish, setQuizShuffledEnglish] = useState<string[]>([]);
  const [quizMatches, setQuizMatches] = useState<string[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<('correct' | 'incorrect' | null)[]>([]);
  const [dragged, setDragged] = useState<{ type: 'eng' | 'chi'; idx: number } | null>(null);
  const [hoveredCard, setHoveredCard] = useState<{ type: 'eng' | 'chi'; idx: number } | null>(null);
  const [lessonData, setLessonData] = useState<Record<string, unknown> | null>(null);
  const [lessonId, setLessonId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      const { lessonId: id } = resolvedParams;
      setLessonId(id);

      // Try to migrate old data first
      const migratedLessonId = LessonManager.migrateOldData();
      const currentLessonId = migratedLessonId || id;

      // Get lesson data
      const data = LessonManager.getLessonData(currentLessonId);
      if (!data) {
        router.push('/setup');
        return;
      }

      setLessonData(data.lessonData);
      setVocab((data.lessonData.vocabulary as VocabWord[]) || []);
      
      // Shuffle English words for the quiz
      const englishWords = (data.lessonData.vocabulary as VocabWord[])?.map((word: VocabWord) => word.english) || [];
      setQuizShuffledEnglish([...englishWords].sort(() => 0.5 - Math.random()));
      setQuizMatches(new Array(englishWords.length).fill(''));
      setQuizFeedback(new Array(englishWords.length).fill(null));
      
      if (!(data.lessonData.vocabulary as VocabWord[]) || (data.lessonData.vocabulary as VocabWord[]).length === 0) {
        console.error('No vocabulary data found in lesson data:', data.lessonData);
      }
    };

    loadParams();
  }, [params, router]);

  const handleDragStart = (type: 'eng' | 'chi', idx: number) => {
    setDragged({ type, idx });
  };

  const handleDragEnd = () => {
    setDragged(null);
  };

  const handleDragOver = (type: 'eng' | 'chi', idx: number) => {
    setHoveredCard({ type, idx });
  };

  const handleDrop = (targetType: 'eng' | 'chi', targetIdx: number) => {
    if (!dragged) return;

    const newMatches = [...quizMatches];
    const newFeedback = [...quizFeedback];

    if (dragged.type === 'eng' && targetType === 'chi') {
      // English word dropped on Chinese card
      const englishWord = quizShuffledEnglish[dragged.idx];
      const chineseWord = vocab[targetIdx];
      
      if (englishWord === chineseWord.english) {
        newMatches[targetIdx] = englishWord;
        newFeedback[targetIdx] = 'correct';
      } else {
        newFeedback[targetIdx] = 'incorrect';
      }
    } else if (dragged.type === 'chi' && targetType === 'eng') {
      // Chinese word dropped on English card
      const chineseWord = vocab[dragged.idx];
      const englishWord = quizShuffledEnglish[targetIdx];
      
      if (chineseWord.english === englishWord) {
        newMatches[targetIdx] = englishWord;
        newFeedback[targetIdx] = 'correct';
      } else {
        newFeedback[targetIdx] = 'incorrect';
      }
    }

    setQuizMatches(newMatches);
    setQuizFeedback(newFeedback);
    setDragged(null);
    setHoveredCard(null);
  };

  const handleContinue = () => {
    router.push(`/lesson/${lessonId}/lesson2`);
  };

  return (
    <div className="min-h-screen bg-white">
      {lessonData && <NavigationPanel lessonData={lessonData} />}
      <div className="ml-64 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-8">KanKan</h1>
          <h3 className="text-2xl font-bold text-[#0081A7] mb-6">Match the English and Chinese</h3>
          <div className="flex flex-col md:flex-row gap-8 w-full justify-center max-h-[400px] overflow-y-auto">
            {/* Chinese/Pinyin column */}
            <div className="flex flex-col gap-4 flex-1">
              {vocab.map((word, idx) => {
                const matchedEng = quizMatches[idx];
                const isHovered = hoveredCard?.type === 'chi' && hoveredCard?.idx === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-3 rounded-xl bg-white shadow-md min-h-[60px] border-2 transition-all duration-200
                      ${quizFeedback[idx] === 'correct' || matchedEng ? 'border-green-500' : quizFeedback[idx] === 'incorrect' ? 'border-red-500' : 'border-transparent'}
                      ${isHovered && dragged && dragged.type === 'eng' && !quizMatches[idx] ? 'ring-2 ring-[#00AFB9]' : ''}`}
                    draggable={!quizMatches[idx]}
                    onDragStart={() => !quizMatches[idx] && handleDragStart('chi', idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => {
                      e.preventDefault();
                      handleDragOver('chi', idx);
                    }}
                    onDrop={() => handleDrop('chi', idx)}
                  >
                    <div className="flex flex-col items-start min-w-[100px]">
                      <span className="text-2xl text-[#0081A7] font-bold">{word.chinese}</span>
                      <span className="text-[#00AFB9] text-base">{word.pinyin}</span>
                    </div>
                    {/* Feedback icon */}
                    {(quizFeedback[idx] === 'correct' || matchedEng) && <span className="ml-2 text-green-600 text-2xl">✓</span>}
                    {quizFeedback[idx] === 'incorrect' && <span className="ml-2 text-red-500 text-2xl">✗</span>}
                  </div>
                );
              })}
            </div>
            {/* English draggable column */}
            <div className="flex flex-col gap-4 flex-1">
              {quizShuffledEnglish.map((eng, idx) => {
                // If already matched, disable drag
                const isMatched = quizMatches.includes(eng);
                // Find the index of the match if matched
                const chiIdx = quizMatches.findIndex(e => e === eng);
                const isHovered = hoveredCard?.type === 'eng' && hoveredCard?.idx === idx;
                return (
                  <div
                    key={eng}
                    className={`p-3 rounded-xl bg-white shadow-md min-h-[60px] flex items-center justify-center border-2 transition-all duration-200 text-[#F07167] text-lg font-semibold select-none
                      ${isMatched ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
                      ${isHovered && dragged && dragged.type === 'chi' && !isMatched ? 'ring-2 ring-[#00AFB9]' : ''}`}
                    draggable={!isMatched}
                    onDragStart={() => !isMatched && handleDragStart('eng', idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => {
                      e.preventDefault();
                      handleDragOver('eng', idx);
                    }}
                    onDrop={() => handleDrop('eng', idx)}
                  >
                    {eng}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-8">
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl shadow-lg text-lg transition-all duration-200 hover:bg-[#0081A7]"
            >
              Continue to Grammar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 