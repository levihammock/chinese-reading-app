'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationPanel from '@/app/components/NavigationPanel';
import { LessonManager } from '@/utils/lessonManager';

interface GrammarQuestion {
  chinese: string;
  pinyin: string;
  english: string;
  explanation?: string;
  aligned?: Array<{
    chinese: string;
    pinyin: string;
    english: string;
  }>;
}

// grammarQuiz is an array directly, not an object with questions property
type GrammarQuiz = GrammarQuestion[];

interface PageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default function GrammarQuizPage({ params }: PageProps) {
  const [grammarQuiz, setGrammarQuiz] = useState<GrammarQuiz | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lessonData, setLessonData] = useState<Record<string, unknown> | null>(null);
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

        const data = LessonManager.getLessonData(id);
        if (!data) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setLessonData(data.lessonData);
          console.log('Full lesson data:', data.lessonData); // Debug log
          console.log('Available fields in lessonData:', Object.keys(data.lessonData)); // Debug log
          const quiz = (data.lessonData.grammarQuiz as GrammarQuiz) || null;
          console.log('Grammar quiz data:', quiz); // Debug log
          console.log('Grammar quiz type:', typeof quiz); // Debug log
          console.log('Grammar quiz length:', quiz?.length); // Debug log
          setGrammarQuiz(quiz);
          if (quiz && quiz.length > 0) {
            setAnswers(new Array(quiz.length).fill(''));
          }
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

  const handleSubmit = async () => {
    if (!grammarQuiz) return;
    
    setSubmitting(true);
    try {
      const requestData = {
        questions: grammarQuiz,
        answers: answers,
        skillLevel: lessonData?.skillLevel || 'HSK1',
        topic: lessonData?.topic || 'General'
      };
      
      console.log('Sending quiz data to API:', requestData);
      
      const response = await fetch('/api/evaluate-grammar-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('API response data:', result);
        setEvaluations(result.evaluations || []);
        setSummary(result.summary || null);
      } else {
        const errorText = await response.text();
        console.error('API error response:', errorText);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    router.push(`/lesson/${lessonId}/lesson3`);
  };

  const handleGrammarReviewLesson = () => {
    router.push(`/lesson/${lessonId}/lesson2`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
          <p className="text-[#00AFB9]">Loading grammar quiz...</p>
        </div>
      </div>
    );
  }

  if (!grammarQuiz) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
          <p className="text-red-500 mb-4">Grammar quiz not available</p>
          <button
            onClick={handleGrammarReviewLesson}
            className="px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl"
          >
            Back to Grammar
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
          <h1 className="text-4xl font-bold text-[#0081A7] mb-8 text-center">Grammar Quiz</h1>
          
          {evaluations.length === 0 ? (
            <div className="space-y-6">
              {grammarQuiz && grammarQuiz.length > 0 ? (
                grammarQuiz.map((question, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#FED9B7]">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-[#0081A7] mb-2">
                        Question {index + 1}: {question.chinese}
                      </h3>
                      <p className="text-[#00AFB9] text-lg mb-2">({question.pinyin})</p>
                      <p className="text-gray-600">{question.explanation}</p>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#0081A7] mb-2">
                        Your translation:
                      </label>
                      <textarea
                        value={answers[index]}
                        onChange={(e) => {
                          const newAnswers = [...answers];
                          newAnswers[index] = e.target.value;
                          setAnswers(newAnswers);
                        }}
                        className="w-full px-4 py-3 border border-[#FED9B7] rounded-xl focus:ring-2 focus:ring-[#FED9B7] focus:border-transparent transition-all duration-200 bg-white text-[#0081A7] font-medium"
                        rows={3}
                        placeholder="Enter your English translation..."
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">No grammar quiz questions available</p>
                  <button
                    onClick={handleGrammarReviewLesson}
                    className="px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl"
                  >
                    Back to Grammar
                  </button>
                </div>
              )}
              
              {grammarQuiz && grammarQuiz.length > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {submitting ? 'Evaluating...' : 'Submit Quiz'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Section */}
              {summary && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#FED9B7] mb-8">
                  <h2 className="text-2xl font-bold text-[#0081A7] mb-4 text-center">Quiz Results</h2>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{summary.correctCount}</div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">{summary.partialCount}</div>
                      <div className="text-sm text-gray-600">Partial</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{summary.totalCount - summary.correctCount - summary.partialCount}</div>
                      <div className="text-sm text-gray-600">Incorrect</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#0081A7]">{summary.percentage}%</div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                  </div>
                  
                  {/* Overall Feedback */}
                  <div className="bg-[#FDFCDC] rounded-lg p-4 border border-[#FED9B7]">
                    <h3 className="text-lg font-semibold text-[#0081A7] mb-2">Overall Feedback</h3>
                    <p className="text-gray-700 leading-relaxed">{summary.overallFeedback}</p>
                  </div>
                </div>
              )}
              
              {/* Individual Evaluations */}
              {evaluations.map((evaluation, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#FED9B7]">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-[#0081A7] mb-2">
                      Question {index + 1}: {grammarQuiz[index]?.chinese || 'Unknown'} ({grammarQuiz[index]?.pinyin || 'Unknown'})
                    </h3>
                    <p className="text-gray-600 mb-2">{grammarQuiz[index]?.explanation || ''}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-[#0081A7] mb-2">Your Answer:</h4>
                      <p className="text-gray-700">{evaluation.studentAnswer}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0081A7] mb-2">Correct Answer:</h4>
                      <p className="text-gray-700">{evaluation.correctAnswer}</p>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${
                    evaluation.isCorrect ? 'bg-green-50 border border-green-200' :
                    evaluation.isPartiallyCorrect ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`font-medium ${
                      evaluation.isCorrect ? 'text-green-700' :
                      evaluation.isPartiallyCorrect ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {evaluation.explanation}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center">
                <button
                  onClick={handleContinue}
                  className="px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Continue to Reading
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 