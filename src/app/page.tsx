'use client';

import { useState, useRef } from 'react';
import { SkillLevel } from '@/types';
import { Quicksand } from 'next/font/google';
import React from 'react'; // Added for useEffect

const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '500', '700'] });

interface VocabWord {
  chinese: string;
  pinyin: string;
  english: string;
}

interface GrammarExample {
  chinese: string;
  pinyin: string;
  english: string;
}

interface GrammarConcept {
  name: string;
  description: string;
  examples: GrammarExample[];
}

// Simulate AI vocabulary generation
async function generateVocab(skillLevel: SkillLevel, topic: string): Promise<VocabWord[]> {
  // For now, return 4 topic-related and 6 generic words, shuffled
  const topicRelated: VocabWord[] = [
    { chinese: topic, pinyin: 'tǐcái', english: topic.charAt(0).toUpperCase() + topic.slice(1) },
    { chinese: '主题', pinyin: 'zhǔtí', english: 'topic' },
    { chinese: '相关', pinyin: 'xiāngguān', english: 'related' },
    { chinese: '例子', pinyin: 'lìzi', english: 'example' },
  ];
  const genericWords: VocabWord[] = [
    { chinese: '学习', pinyin: 'xuéxí', english: 'study' },
    { chinese: '朋友', pinyin: 'péngyǒu', english: 'friend' },
    { chinese: '快乐', pinyin: 'kuàilè', english: 'happy' },
    { chinese: '时间', pinyin: 'shíjiān', english: 'time' },
    { chinese: '老师', pinyin: 'lǎoshī', english: 'teacher' },
    { chinese: '学校', pinyin: 'xuéxiào', english: 'school' },
    { chinese: '动物', pinyin: 'dòngwù', english: 'animal' },
    { chinese: '猫', pinyin: 'māo', english: 'cat' },
    { chinese: '狗', pinyin: 'gǒu', english: 'dog' },
    { chinese: '森林', pinyin: 'sēnlín', english: 'forest' },
  ];
  // Remove any duplicates (e.g., if topic is already in generic)
  const usedChinese = new Set(topicRelated.map(w => w.chinese));
  const filteredGeneric = genericWords.filter(w => !usedChinese.has(w.chinese));
  // Pick 6 generic words
  const shuffledGeneric = filteredGeneric.sort(() => 0.5 - Math.random()).slice(0, 6);
  // Combine and shuffle all
  const allWords = [...topicRelated, ...shuffledGeneric].sort(() => 0.5 - Math.random());
  return allWords;
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

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizMatches, setQuizMatches] = useState<(string | null)[]>([]); // index: vocab idx, value: matched english
  const [quizFeedback, setQuizFeedback] = useState<(null | 'correct' | 'incorrect')[]>([]); // index: vocab idx
  const [dragged, setDragged] = useState<{ type: 'eng' | 'chi', idx: number } | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [congratsMsg, setCongratsMsg] = useState('');
  const congratsOptions = ['You did it!', 'Well done!', 'Good job!'];
  const [showCongrats, setShowCongrats] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<{ type: 'eng' | 'chi', idx: number } | null>(null);

  // Multiple choice quiz state
  const [multipleChoiceStarted, setMultipleChoiceStarted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    chinese: string;
    correctAnswer: string;
    options: string[];
  }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [quizResults, setQuizResults] = useState<{
    correct: number;
    total: number;
    percentage: number;
  } | null>(null);

  // Grammar lesson state
  const [grammarConcept, setGrammarConcept] = useState<GrammarConcept | null>(null);
  const [grammarRevealed, setGrammarRevealed] = useState<boolean[]>([]);
  const [grammarShowAll, setGrammarShowAll] = useState(false);
  const [grammarLoading, setGrammarLoading] = useState(false);

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

  // Handler for continue (to next lesson, now starts quiz)
  const handleContinueLesson = () => {
    setQuizStarted(true);
    setPage(4);
    setQuizMatches(Array(vocab.length).fill(null));
    setQuizFeedback(Array(vocab.length).fill(null));
    setQuizComplete(false);
  };

  // Quiz drag handlers (bidirectional)
  const handleDragStart = (type: 'eng' | 'chi', idx: number) => {
    setDragged({ type, idx });
  };
  const handleDragEnd = () => {
    setDragged(null);
    setHoveredCard(null);
  };
  const handleDragOver = (type: 'eng' | 'chi', idx: number) => {
    setHoveredCard({ type, idx });
  };
  const handleDrop = (targetType: 'eng' | 'chi', targetIdx: number) => {
    if (!dragged) return;
    // Only allow dropping on the opposite type
    if (dragged.type === targetType) return;
    // If already matched, do nothing
    if (quizMatches[targetType === 'chi' ? targetIdx : dragged.idx]) return;
    const chiIdx = targetType === 'chi' ? targetIdx : dragged.idx;
    const engIdx = targetType === 'eng' ? targetIdx : dragged.idx;
    const english = quizShuffledEnglish[engIdx];
    if (english === vocab[chiIdx].english) {
      // Correct match
      const newMatches = [...quizMatches];
      newMatches[chiIdx] = english;
      setQuizMatches(newMatches);
      const newFeedback = [...quizFeedback];
      newFeedback[chiIdx] = 'correct';
      setQuizFeedback(newFeedback);
      // Check for win
      if (newMatches.every((val, i) => val === vocab[i].english)) {
        setQuizComplete(true);
        // Show congrats animation
        const msg = congratsOptions[Math.floor(Math.random() * congratsOptions.length)];
        setCongratsMsg(msg);
        setShowCongrats(true);
        setTimeout(() => setShowCongrats(false), 1500);
      }
    } else {
      // Incorrect match
      const newFeedback = [...quizFeedback];
      newFeedback[chiIdx] = 'incorrect';
      setQuizFeedback(newFeedback);
      setTimeout(() => {
        setQuizFeedback(fb => {
          const reset = [...fb];
          if (reset[chiIdx] === 'incorrect') reset[chiIdx] = null;
          return reset;
        });
      }, 1000);
    }
    setDragged(null);
    setHoveredCard(null);
  };

  // Shuffle English words for quiz
  const [quizShuffledEnglish, setQuizShuffledEnglish] = useState<string[]>([]);
  React.useEffect(() => {
    if (quizStarted) {
      const shuffled = [...vocab.map(w => w.english)].sort(() => 0.5 - Math.random());
      setQuizShuffledEnglish(shuffled);
    }
  }, [quizStarted, vocab]);

  // Handler for next game (reset quiz)
  const handleNextGame = () => {
    handleStartMultipleChoice();
  };

  // Generate multiple choice questions from vocabulary
  const generateMultipleChoiceQuestions = (vocabWords: VocabWord[]) => {
    const questions = vocabWords.map(word => {
      // Get all other English translations as potential wrong answers
      const otherAnswers = vocabWords
        .filter(v => v.english !== word.english)
        .map(v => v.english);
      
      // Shuffle and take 3 wrong answers
      const wrongAnswers = otherAnswers
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      // Combine correct and wrong answers, then shuffle
      const allOptions = [word.english, ...wrongAnswers]
        .sort(() => 0.5 - Math.random());
      
      return {
        chinese: word.chinese,
        correctAnswer: word.english,
        options: allOptions
      };
    });
    
    return questions;
  };

  // Start multiple choice quiz
  const handleStartMultipleChoice = () => {
    const questions = generateMultipleChoiceQuestions(vocab);
    setQuizQuestions(questions);
    setSelectedAnswers(Array(questions.length).fill(''));
    setCurrentQuestionIndex(0);
    setMultipleChoiceStarted(true);
    setPage(5);
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Submit quiz answers
  const handleSubmitQuiz = () => {
    let correct = 0;
    quizQuestions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    
    const percentage = Math.round((correct / quizQuestions.length) * 100);
    setQuizResults({ correct, total: quizQuestions.length, percentage });
    setPage(6);
  };

  // Handle quiz retry
  const handleQuizRetry = () => {
    setSelectedAnswers(Array(quizQuestions.length).fill(''));
    setCurrentQuestionIndex(0);
    setQuizResults(null);
    setPage(5);
  };

  // Handle review lesson
  const handleReviewLesson = () => {
    setMultipleChoiceStarted(false);
    setQuizQuestions([]);
    setSelectedAnswers([]);
    setCurrentQuestionIndex(0);
    setQuizResults(null);
    setPage(3); // Go back to vocabulary lesson
  };

  // Generate grammar concept based on HSK level
  const generateGrammarConcept = (skillLevel: SkillLevel, topic: string): GrammarConcept => {
    const concepts = {
      HSK1: {
        name: "Basic Subject-Verb-Object",
        description: "Subject + Verb + Object",
        examples: [
          { chinese: "我喜欢猫", pinyin: "Wǒ xǐhuān māo", english: "I like cats" },
          { chinese: "他学习中文", pinyin: "Tā xuéxí zhōngwén", english: "He studies Chinese" },
          { chinese: "她吃苹果", pinyin: "Tā chī píngguǒ", english: "She eats apples" },
          { chinese: "我们看电影", pinyin: "Wǒmen kàn diànyǐng", english: "We watch movies" },
          { chinese: "你喝咖啡", pinyin: "Nǐ hē kāfēi", english: "You drink coffee" }
        ]
      },
      HSK2: {
        name: "Time + Subject + Verb + Object",
        description: "Time + Subject + Verb + Object",
        examples: [
          { chinese: "今天我去学校", pinyin: "Jīntiān wǒ qù xuéxiào", english: "Today I go to school" },
          { chinese: "明天他学习中文", pinyin: "Míngtiān tā xuéxí zhōngwén", english: "Tomorrow he studies Chinese" },
          { chinese: "昨天她看电影", pinyin: "Zuótiān tā kàn diànyǐng", english: "Yesterday she watched a movie" },
          { chinese: "现在你喝咖啡", pinyin: "Xiànzài nǐ hē kāfēi", english: "Now you drink coffee" },
          { chinese: "晚上我们吃饭", pinyin: "Wǎnshang wǒmen chīfàn", english: "In the evening we eat dinner" }
        ]
      },
      HSK3: {
        name: "Subject + 不/没 + Verb + Object",
        description: "Subject + 不/没 (bù/méi) + Verb + Object",
        examples: [
          { chinese: "我不喜欢狗", pinyin: "Wǒ bù xǐhuān gǒu", english: "I don't like dogs" },
          { chinese: "他没学习中文", pinyin: "Tā méi xuéxí zhōngwén", english: "He didn't study Chinese" },
          { chinese: "她不看电影", pinyin: "Tā bù kàn diànyǐng", english: "She doesn't watch movies" },
          { chinese: "你不喝咖啡", pinyin: "Nǐ bù hē kāfēi", english: "You don't drink coffee" },
          { chinese: "我们没吃饭", pinyin: "Wǒmen méi chīfàn", english: "We didn't eat dinner" }
        ]
      },
      HSK4: {
        name: "Subject + 一 + Measure Word + Object + 也/都 + 不/没 + Verb",
        description: "Subject + 一(yī) + Measure Word + Object + 也/都(yě/dōu) + 不/没(bù/méi) + Verb",
        examples: [
          { chinese: "我一个苹果也不吃", pinyin: "Wǒ yī gè píngguǒ yě bù chī", english: "I don't eat even one apple" },
          { chinese: "他一本中文书都没读", pinyin: "Tā yī běn zhōngwén shū dōu méi dú", english: "He didn't read even one Chinese book" },
          { chinese: "她一部电影都不看", pinyin: "Tā yī bù diànyǐng dōu bù kàn", english: "She doesn't watch even one movie" },
          { chinese: "你一杯咖啡也不喝", pinyin: "Nǐ yī bēi kāfēi yě bù hē", english: "You don't drink even one cup of coffee" },
          { chinese: "我们一顿饭都没吃", pinyin: "Wǒmen yī dùn fàn dōu méi chī", english: "We didn't eat even one meal" }
        ]
      },
      HSK5: {
        name: "Subject + 把 + Object + Verb + 了",
        description: "Subject + 把(bǎ) + Object + Verb + 了(le)",
        examples: [
          { chinese: "我把苹果吃了", pinyin: "Wǒ bǎ píngguǒ chī le", english: "I ate the apple" },
          { chinese: "他把中文书读了", pinyin: "Tā bǎ zhōngwén shū dú le", english: "He read the Chinese book" },
          { chinese: "她把电影看了", pinyin: "Tā bǎ diànyǐng kàn le", english: "She watched the movie" },
          { chinese: "你把咖啡喝了", pinyin: "Nǐ bǎ kāfēi hē le", english: "You drank the coffee" },
          { chinese: "我们把饭吃了", pinyin: "Wǒmen bǎ fàn chī le", english: "We ate the meal" }
        ]
      },
      HSK6: {
        name: "Subject + 被 + Object + Verb + 了",
        description: "Subject + 被(bèi) + Object + Verb + 了(le)",
        examples: [
          { chinese: "苹果被我吃了", pinyin: "Píngguǒ bèi wǒ chī le", english: "The apple was eaten by me" },
          { chinese: "中文书被他读了", pinyin: "Zhōngwén shū bèi tā dú le", english: "The Chinese book was read by him" },
          { chinese: "电影被她看了", pinyin: "Diànyǐng bèi tā kàn le", english: "The movie was watched by her" },
          { chinese: "咖啡被你喝了", pinyin: "Kāfēi bèi nǐ hē le", english: "The coffee was drunk by you" },
          { chinese: "饭被我们吃了", pinyin: "Fàn bèi wǒmen chī le", english: "The meal was eaten by us" }
        ]
      }
    };

    return concepts[skillLevel] || concepts.HSK1;
  };

  // Start grammar lesson
  const handleStartGrammarLesson = async () => {
    setGrammarLoading(true);
    const concept = generateGrammarConcept(skillLevel, subject);
    setGrammarConcept(concept);
    setGrammarRevealed(Array(concept.examples.length).fill(false));
    setGrammarShowAll(false);
    setGrammarLoading(false);
    setPage(7);
  };

  // Reveal a single grammar example
  const handleGrammarReveal = (idx: number) => {
    setGrammarRevealed(prev => prev.map((r, i) => (i === idx ? true : r)));
  };

  // Reveal all grammar examples
  const handleGrammarShowAll = () => {
    setGrammarShowAll(true);
    setGrammarRevealed(Array(grammarConcept!.examples.length).fill(true));
  };

  // Render header and subheader based on current page
  const renderHeader = () => {
    if (page === 1) {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">KanKan</h1>
          <h2 className="text-lg text-[#00AFB9] mb-10 font-medium">Improve your Chinese skills with one simple lesson a day</h2>
        </>
      );
    } else if (page === 3) {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">Lesson 1: Vocabulary</h1>
          <h2 className="text-lg text-[#00AFB9] mb-10 font-medium">Let&apos;s start by learning some new words</h2>
        </>
      );
    } else if (page === 4) {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">Exercise #1</h1>
        </>
      );
    } else if (page === 5) {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">Exercise #2</h1>
        </>
      );
    } else if (page === 6) {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">Exercise #2</h1>
        </>
      );
    } else if (page === 7) {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">Lesson 2: Grammar</h1>
          <h2 className="text-lg text-[#00AFB9] mb-10 font-medium">Now, let&apos;s work on some full sentences</h2>
        </>
      );
    } else {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">KanKan</h1>
          <h2 className="text-lg text-[#00AFB9] mb-10 font-medium">Improve your Chinese skills with one simple lesson a day</h2>
        </>
      );
    }
  };

  return (
    <div className={`min-h-screen bg-white ${quicksand.className}`}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        {renderHeader()}
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
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">New Vocabulary</h3>
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
          )}
        {page === 4 && quizStarted && (
          <div className="w-full max-w-2xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">Match the English and Chinese</h3>
            <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
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
                        ${isHovered && dragged && dragged.type === 'chi' && !isMatched ? 'ring-2 ring-[#00AFB9]' : ''}
                        ${(isMatched || (chiIdx !== -1 && quizFeedback[chiIdx] === 'correct')) ? 'border-green-500' : 'border-transparent'}`}
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
                      {/* Feedback icon for matched */}
                      {(isMatched || (chiIdx !== -1 && quizFeedback[chiIdx] === 'correct')) && <span className="ml-2 text-green-600 text-2xl">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Congrats animation */}
            {showCongrats && (
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="text-5xl font-extrabold text-[#00AFB9] animate-bounce drop-shadow-lg" style={{textShadow:'0 2px 8px #fff'}}>
                  {congratsMsg}
                </div>
              </div>
            )}
            {quizComplete && !showCongrats && (
              <div className="mt-8 flex flex-col items-center">
                <div className="text-2xl text-green-600 font-bold mb-4">🎉 Congrats! You matched all the words!</div>
                <button
                  className="px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={handleNextGame}
                >
                  Next game
                </button>
                      </div>
                    )}
                  </div>
          )}
        {page === 4 && quizStarted && (
          <div className="mt-6">
            <button
              className="px-6 py-2 bg-[#FED9B7] text-[#0081A7] font-medium rounded-lg hover:bg-[#F07167] hover:text-white transition-all duration-200"
              onClick={handleStartMultipleChoice}
            >
              Skip to next exercise
            </button>
          </div>
        )}
        {page === 5 && multipleChoiceStarted && (
          <div className="w-full max-w-2xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">Quiz: Guess the right translations</h3>
            {quizQuestions.length > 0 && (
              <div className="w-full">
                <div className="text-center mb-8">
                  <div className="text-4xl text-[#0081A7] font-bold mb-4">
                    {quizQuestions[currentQuestionIndex].chinese}
                  </div>
                  <div className="text-sm text-[#00AFB9]">
                    Question {currentQuestionIndex + 1} of {quizQuestions.length}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 mb-8">
                  {quizQuestions[currentQuestionIndex].options.map((option, idx) => (
                    <button
                      key={idx}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left
                        ${selectedAnswers[currentQuestionIndex] === option 
                          ? 'border-[#00AFB9] bg-[#00AFB9] text-white' 
                          : 'border-[#FED9B7] bg-white text-[#0081A7] hover:border-[#00AFB9] hover:bg-[#00AFB9] hover:text-white'}`}
                      onClick={() => handleAnswerSelect(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  {currentQuestionIndex > 0 && (
                    <button
                      className="px-6 py-3 bg-[#FED9B7] text-[#0081A7] font-semibold rounded-xl hover:bg-[#F07167] hover:text-white transition-all duration-200"
                      onClick={handlePreviousQuestion}
                    >
                      Back
                    </button>
                  )}
                  <div className="flex-1"></div>
                  {currentQuestionIndex < quizQuestions.length - 1 ? (
                    <button
                      className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200
                        ${selectedAnswers[currentQuestionIndex] 
                          ? 'bg-[#00AFB9] text-white hover:bg-[#0081A7]' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      onClick={handleNextQuestion}
                      disabled={!selectedAnswers[currentQuestionIndex]}
                    >
                      Next question
                    </button>
                  ) : (
                    <button
                      className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200
                        ${selectedAnswers.every(answer => answer !== '') 
                          ? 'bg-[#00AFB9] text-white hover:bg-[#0081A7]' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      onClick={handleSubmitQuiz}
                      disabled={!selectedAnswers.every(answer => answer !== '')}
                    >
                      Submit Answers
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {page === 6 && quizResults && (
          <div className="w-full max-w-2xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">Quiz Results</h3>
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-[#0081A7] mb-4">
                {quizResults.correct}/{quizResults.total} correct
              </div>
              <div className="text-xl text-[#00AFB9] mb-6">
                {quizResults.percentage}% accuracy
              </div>
              
              {quizResults.percentage >= 90 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <div className="text-2xl font-bold text-[#0081A7] mb-6">Good job!</div>
                  <button
                    className="px-8 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl hover:bg-[#0081A7] transition-all duration-200"
                    onClick={handleStartGrammarLesson}
                  >
                    Next Lesson
                  </button>
                </div>
              )}
              
              {quizResults.percentage >= 60 && quizResults.percentage < 90 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">😐</div>
                  <div className="text-2xl font-bold text-[#0081A7] mb-6">Almost there!</div>
                  <button
                    className="px-8 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl hover:bg-[#0081A7] transition-all duration-200"
                    onClick={handleQuizRetry}
                  >
                    Try again
                  </button>
                </div>
              )}
              
              {quizResults.percentage < 60 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">😢</div>
                  <div className="text-2xl font-bold text-[#0081A7] mb-6">Keep practicing!</div>
                  <div className="flex gap-4">
                    <button
                      className="px-6 py-3 bg-[#FED9B7] text-[#0081A7] font-semibold rounded-xl hover:bg-[#F07167] hover:text-white transition-all duration-200"
                      onClick={handleQuizRetry}
                    >
                      Try again
                    </button>
                    <button
                      className="px-6 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl hover:bg-[#0081A7] transition-all duration-200"
                      onClick={handleReviewLesson}
                    >
                      Review lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {page === 7 && grammarConcept && (
          <div className="w-full max-w-2xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">New Grammar Concept</h3>
            {grammarLoading ? (
              <div className="text-[#0081A7] text-lg">Loading grammar concept...</div>
            ) : (
              <>
                <div className="w-full mb-8">
                  <div className="text-lg font-semibold text-[#0081A7] mb-2">{grammarConcept.name}</div>
                  <div className="text-base text-[#00AFB9]">{grammarConcept.description}</div>
                </div>
                
                <div className="flex flex-col gap-4 w-full">
                  {grammarConcept.examples.map((example, idx) => (
                    <div key={idx} className="flex items-center gap-6 w-full">
                      <div className="flex flex-col items-start min-w-[200px]">
                        <span className="text-xl text-[#0081A7] font-bold">{example.chinese}</span>
                        <span className="text-[#00AFB9] text-sm">{example.pinyin}</span>
                      </div>
                      <button
                        type="button"
                        className="ml-4 px-6 py-2 rounded-lg bg-[#FED9B7] text-[#F07167] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#F07167] transition-all duration-200"
                        style={{ minWidth: 150 }}
                        onClick={() => handleGrammarReveal(idx)}
                        disabled={grammarRevealed[idx] || grammarShowAll}
                      >
                        <span
                          style={{
                            filter: grammarRevealed[idx] || grammarShowAll ? 'none' : 'blur(6px)',
                            transition: 'filter 0.2s',
                            cursor: grammarRevealed[idx] || grammarShowAll ? 'default' : 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          {example.english}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col items-center w-full mt-8 gap-4">
                  <button
                    className={`px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl transition-all duration-200 shadow-lg w-full max-w-xs
                      ${!(grammarShowAll || grammarRevealed.every(Boolean)) ? 'hover:from-[#F07167] hover:to-[#FED9B7] hover:shadow-xl' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={handleGrammarShowAll}
                    disabled={grammarShowAll || grammarRevealed.every(Boolean)}
                  >
                    Show All
                  </button>
                  <button
                    className={`px-8 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl shadow-lg w-full max-w-xs text-lg transition-all duration-200
                      ${grammarRevealed.every(Boolean) ? 'hover:bg-[#0081A7]' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={() => setPage(1)}
                    disabled={!grammarRevealed.every(Boolean)}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
