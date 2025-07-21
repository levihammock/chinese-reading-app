'use client';

import { useState, useRef } from 'react';
import { SkillLevel } from '@/types';
import { Quicksand } from 'next/font/google';

const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '500', '700'] });

interface VocabWord {
  chinese: string;
  pinyin: string;
  english: string;
}

// Simulate AI vocabulary generation
async function generateVocab(skillLevel: SkillLevel, topic: string): Promise<VocabWord[]> {
  // In production, replace with real API call
  // For now, return mock data with 7-10 words, 3-4 related to topic
  const topicWords = [
    { chinese: '动物', pinyin: 'dòngwù', english: 'animal' },
    { chinese: '猫', pinyin: 'māo', english: 'cat' },
    { chinese: '狗', pinyin: 'gǒu', english: 'dog' },
    { chinese: '森林', pinyin: 'sēnlín', english: 'forest' },
  ];
  const genericWords = [
    { chinese: '学习', pinyin: 'xuéxí', english: 'study' },
    { chinese: '朋友', pinyin: 'péngyǒu', english: 'friend' },
    { chinese: '快乐', pinyin: 'kuàilè', english: 'happy' },
    { chinese: '时间', pinyin: 'shíjiān', english: 'time' },
    { chinese: '老师', pinyin: 'lǎoshī', english: 'teacher' },
    { chinese: '学校', pinyin: 'xuéxiào', english: 'school' },
  ];
  // Pick 3-4 topic words and fill with generic words
  const n = Math.floor(Math.random() * 4) + 3; // 3-6 topic words
  const m = 7 + Math.floor(Math.random() * 4) - n; // total 7-10
  const shuffledTopic = topicWords.sort(() => 0.5 - Math.random()).slice(0, n);
  const shuffledGeneric = genericWords.sort(() => 0.5 - Math.random()).slice(0, m);
  return [...shuffledTopic, ...shuffledGeneric].sort(() => 0.5 - Math.random());
}

export default function Home() {
  const [page, setPage] = useState(1);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('HSK1');
  const [subject, setSubject] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Lesson 1 state
  const [vocab, setVocab] = useState<VocabWord[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handler for HSK selection
  const handleContinue = () => {
    setPage(2);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Handler for topic submission (start lesson)
  const handleStartLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(3);
    // Simulate AI call
    const words = await generateVocab(skillLevel, subject);
    setVocab(words);
    setRevealed(Array(words.length).fill(false));
    setShowAll(false);
    setLoading(false);
  };

  // Reveal a single word
  const handleReveal = (idx: number) => {
    setRevealed(prev => prev.map((r, i) => (i === idx ? true : r)));
  };

  // Reveal all
  const handleShowAll = () => {
    setShowAll(true);
    setRevealed(Array(vocab.length).fill(true));
  };

  // Handler for continue (to next lesson, not implemented yet)
  const handleContinueLesson = () => {
    // TODO: Go to next lesson
  };

  return (
    <div className={`min-h-screen bg-white ${quicksand.className}`}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">KanKan</h1>
        <h2 className="text-lg text-[#00AFB9] mb-10 font-medium">Improve your Chinese skills with one simple lesson a day</h2>
        {page === 1 && (
          <div className="w-full max-w-md bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center">
            <label className="block text-lg font-semibold text-[#0081A7] mb-4">Choose your level</label>
            <select
              value={skillLevel}
              onChange={e => setSkillLevel(e.target.value as SkillLevel)}
              className="w-full px-4 py-3 border border-[#FED9B7] rounded-xl focus:ring-2 focus:ring-[#FED9B7] focus:border-transparent transition-all duration-200 bg-white text-[#0081A7] font-medium mb-8"
            >
              <option value="HSK1">HSK1</option>
              <option value="HSK2">HSK2</option>
              <option value="HSK3">HSK3</option>
              <option value="HSK4">HSK4</option>
              <option value="HSK5">HSK5</option>
              <option value="HSK6">HSK6</option>
            </select>
            <button
              onClick={handleContinue}
              className="w-full px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Continue
            </button>
          </div>
        )}
        {page === 2 && (
          <form
            className="w-full max-w-md bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center"
            onSubmit={handleStartLesson}
          >
            <label className="block text-lg font-semibold text-[#0081A7] mb-4">Choose a topic</label>
            <input
              ref={inputRef}
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g., animals, food, travel..."
              className="w-full px-4 py-3 border border-[#FED9B7] rounded-xl focus:ring-2 focus:ring-[#FED9B7] focus:border-transparent transition-all duration-200 bg-white text-[#0081A7] font-medium mb-8"
            />
            <button
              type="submit"
              className="w-full px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={!subject.trim() || loading}
            >
              {loading ? 'Loading...' : 'Start lesson'}
            </button>
          </form>
        )}
        {page === 3 && (
          <div className="w-full max-w-2xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">Lesson 1: Vocabulary</h3>
            {loading ? (
              <div className="text-[#0081A7] text-lg">Loading vocabulary...</div>
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
                <button
                  className="mt-8 px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={handleShowAll}
                  disabled={showAll}
                >
                  Show All
                </button>
                <button
                  className="fixed bottom-8 right-8 px-8 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl shadow-lg hover:bg-[#0081A7] transition-all duration-200"
                  onClick={handleContinueLesson}
                >
                  Continue
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
