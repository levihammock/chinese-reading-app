'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LessonManager } from '@/utils/lessonManager';

export default function SetupPage() {
  const [skillLevel, setSkillLevel] = useState('HSK1');
  const [subject, setSubject] = useState('');
  const [lessonLoading, setLessonLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleStartLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    
    setLessonLoading(true);
    try {
      const lessonId = LessonManager.generateLessonId();
      localStorage.setItem('skillLevel', skillLevel);
      localStorage.setItem('topic', subject.trim());
      
      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          skillLevel, 
          subject: subject.trim() 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson');
      }

      const lessonData = await response.json();
      LessonManager.storeLessonData(lessonId, lessonData, skillLevel, subject.trim());
      router.push(`/lesson/${lessonId}/lesson1`);
    } catch (error) {
      console.error('Error generating lesson:', error);
      setLessonLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Ribbon */}
      <div className="bg-gradient-to-r from-[#0081A7] to-[#00AFB9] h-16 flex items-center px-8 shadow-lg">
        <h1 className="text-3xl font-bold text-white">KanKan</h1>
      </div>
      
      {/* Loading Screen */}
      {lessonLoading ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            {/* Animated Logo */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-[#0081A7] to-[#00AFB9] rounded-full flex items-center justify-center mx-auto animate-pulse">
                <span className="text-white text-4xl">📚</span>
              </div>
            </div>
            
            {/* Loading Text */}
            <h2 className="text-3xl font-bold text-[#0081A7] mb-4">Creating Your Lesson</h2>
            <p className="text-xl text-gray-600 mb-8">This may take a few moments...</p>
            
            {/* Animated Dots */}
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-[#0081A7] rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-[#00AFB9] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-[#F07167] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-8 w-64 mx-auto">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-[#0081A7] to-[#00AFB9] h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Fun Facts */}
            <div className="mt-8 text-sm text-gray-500">
              <p className="animate-pulse">🤖 AI is analyzing your topic...</p>
              <p className="animate-pulse" style={{ animationDelay: '1s' }}>📝 Generating vocabulary...</p>
              <p className="animate-pulse" style={{ animationDelay: '2s' }}>🎯 Creating exercises...</p>
            </div>
          </div>
        </div>
      ) : (
        /* Main Content */
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md bg-[#FDFCDC] rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-[#0081A7] mb-6 text-center">Let's get started</h2>
            <p className="text-gray-600 mb-6 text-center">Choose your level and topic</p>
            
            <form onSubmit={handleStartLesson} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#0081A7] mb-2">
                  Choose your level
                </label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full px-4 py-3 border border-[#FED9B7] rounded-xl focus:ring-2 focus:ring-[#FED9B7] focus:border-transparent transition-all duration-200 bg-white text-[#0081A7] font-medium"
                >
                  <option value="HSK1">HSK1</option>
                  <option value="HSK2">HSK2</option>
                  <option value="HSK3">HSK3</option>
                  <option value="HSK4">HSK4</option>
                  <option value="HSK5">HSK5</option>
                  <option value="HSK6">HSK6</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0081A7] mb-2">
                  What would you like to learn about?
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter a topic (e.g., Travel, Food, Family)"
                  className="w-full px-4 py-3 border border-[#FED9B7] rounded-xl focus:ring-2 focus:ring-[#FED9B7] focus:border-transparent transition-all duration-200 bg-white text-[#0081A7] font-medium"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={lessonLoading || !subject.trim()}
                className="w-full px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lessonLoading ? 'Generating Lesson...' : 'Start Learning'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 