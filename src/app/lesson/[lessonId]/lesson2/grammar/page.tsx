'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationPanel from '@/app/components/NavigationPanel';
import { LessonManager } from '@/utils/lessonManager';

interface GrammarExample {
  chinese: string;
  pinyin: string;
  english: string;
  explanation: string;
}

interface GrammarConcept {
  title: string;
  explanation: string;
  examples: GrammarExample[];
}

interface PageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default function GrammarPage({ params }: PageProps) {
  const [grammar, setGrammar] = useState<GrammarConcept | null>(null);
  const [lessonData, setLessonData] = useState<Record<string, unknown> | null>(null);
  const [lessonId, setLessonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        const { lessonId: id } = resolvedParams;
        
        if (!isMounted) return;
        
        setLessonId(id);

        const data = LessonManager.getLessonData(id);
        if (!data) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setLessonData(data.lessonData);
          const grammarData = (data.lessonData.grammar as GrammarConcept) || null;
          setGrammar(grammarData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadParams();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const handleStartGrammarQuiz = () => {
    router.push(`/lesson/${lessonId}/lesson2/quiz`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
          <p className="text-[#00AFB9]">Loading grammar lesson...</p>
        </div>
      </div>
    );
  }

  if (!grammar) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
          <p className="text-red-500 mb-4">Grammar lesson not available</p>
          <button
            onClick={() => router.push(`/lesson/${lessonId}/lesson1`)}
            className="px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl"
          >
            Back to Vocabulary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {lessonData && <NavigationPanel lessonData={lessonData} />}
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-8 text-center">Grammar Lesson</h1>
          
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-[#FED9B7] mb-8">
            <h2 className="text-2xl font-bold text-[#0081A7] mb-4">{grammar.title}</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">{grammar.explanation}</p>
            
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-[#0081A7] mb-4">Examples:</h3>
              {grammar.examples.map((example, index) => (
                <div key={index} className="bg-[#FDFCDC] rounded-lg p-6 border border-[#FED9B7]">
                  <div className="mb-3">
                    <p className="text-xl font-medium text-[#0081A7]">{example.chinese}</p>
                    <p className="text-[#00AFB9] text-lg">{example.pinyin}</p>
                  </div>
                  <p className="text-gray-700 mb-2">{example.english}</p>
                  <p className="text-gray-600 text-sm italic">{example.explanation}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleStartGrammarQuiz}
              className="px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Grammar Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 