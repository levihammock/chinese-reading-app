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
  explanation: string;
  examples: GrammarExample[];
}

interface AlignedWord {
  chinese: string;
  pinyin: string;
  english: string;
}

interface StoryData {
  aligned: AlignedWord[];
  sentence: string;
  isAIGenerated: boolean;
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

// Generate complete lesson using AI
const generateCompleteLesson = async (skillLevel: SkillLevel, subject: string) => {
  console.log('generateCompleteLesson called with:', { skillLevel, subject });
  try {
    console.log('Making API call to /api/generate-lesson...');
    const response = await fetch('/api/generate-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ skillLevel, subject }),
    });

    console.log('API response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response not ok:', errorText);
      throw new Error(`Failed to generate lesson: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    
    // Validate the response structure
    if (!data.vocabulary || !data.grammar || !data.story) {
      throw new Error('Invalid lesson data structure received from API');
    }
    
    return data;
  } catch (error) {
    console.error('Error generating lesson:', error);
    // Fallback lesson data
    console.log('Using fallback lesson data');
    return {
      vocabulary: [
        { chinese: "我", pinyin: "wǒ", english: "I" },
        { chinese: "喜欢", pinyin: "xǐhuān", english: "like" },
        { chinese: "学习", pinyin: "xuéxí", english: "study" },
        { chinese: "中文", pinyin: "zhōngwén", english: "Chinese" },
        { chinese: "朋友", pinyin: "péngyǒu", english: "friend" },
        { chinese: "快乐", pinyin: "kuàilè", english: "happy" },
        { chinese: "时间", pinyin: "shíjiān", english: "time" },
        { chinese: "老师", pinyin: "lǎoshī", english: "teacher" },
        { chinese: "学校", pinyin: "xuéxiào", english: "school" },
        { chinese: "动物", pinyin: "dòngwù", english: "animal" },
      ],
      grammar: {
        name: "Basic Subject-Verb-Object",
        description: "Subject + Verb + Object",
        explanation: "This is the most basic way to make sentences in Chinese. You put the person doing the action first, then the action, then what they're doing it to.",
        examples: [
          { chinese: "我喜欢猫", pinyin: "Wǒ xǐhuān māo", english: "I like cats" },
          { chinese: "他学习中文", pinyin: "Tā xuéxí zhōngwén", english: "He studies Chinese" },
          { chinese: "她吃苹果", pinyin: "Tā chī píngguǒ", english: "She eats apples" },
          { chinese: "我们看电影", pinyin: "Wǒmen kàn diànyǐng", english: "We watch movies" },
          { chinese: "你喝咖啡", pinyin: "Nǐ hē kāfēi", english: "You drink coffee" }
        ]
      },
      grammarQuiz: [
        { chinese: "我学习英语", pinyin: "Wǒ xuéxí yīngyǔ", english: "I study English" },
        { chinese: "他喜欢狗", pinyin: "Tā xǐhuān gǒu", english: "He likes dogs" },
        { chinese: "她看电影", pinyin: "Tā kàn diànyǐng", english: "She watches movies" },
        { chinese: "我们吃午饭", pinyin: "Wǒmen chī wǔfàn", english: "We eat lunch" },
        { chinese: "你读报纸", pinyin: "Nǐ dú bàozhǐ", english: "You read newspapers" }
      ],
      story: {
        story: [
          { chinese: "我", pinyin: "wǒ", english: "I" },
          { chinese: "喜欢", pinyin: "xǐhuān", english: "like" },
          { chinese: "学习", pinyin: "xuéxí", english: "study" },
          { chinese: "中文", pinyin: "zhōngwén", english: "Chinese" },
        ],
        sentence: "I like studying Chinese.",
        isAIGenerated: false,
      },
      isAIGenerated: false,
    };
  }
};

export default function Home() {
  const [page, setPage] = useState(1);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('HSK1');
  const [subject, setSubject] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Lesson 1 state
  const [vocab, setVocab] = useState<VocabWord[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [showAll, setShowAll] = useState(false);

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

  // Grammar quiz state
  const [grammarQuizStarted, setGrammarQuizStarted] = useState(false);
  const [grammarQuizQuestions, setGrammarQuizQuestions] = useState<GrammarExample[]>([]);
  const [grammarQuizAnswers, setGrammarQuizAnswers] = useState<string[]>([]);
  const [currentGrammarQuestionIndex, setCurrentGrammarQuestionIndex] = useState(0);
  const [grammarQuizResults, setGrammarQuizResults] = useState<{
    correct: number;
    total: number;
    percentage: number;
  } | null>(null);
  const [grammarQuizEvaluations, setGrammarQuizEvaluations] = useState<Array<{
    questionIndex: number;
    isCorrect: boolean;
    explanation: string;
    correctAnswer: string;
    studentAnswer: string;
  }>>([]);
  const [grammarQuizLoading, setGrammarQuizLoading] = useState(false);

  // Reading lesson state
  const [readingStarted, setReadingStarted] = useState(false);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [readingRevealed, setReadingRevealed] = useState<boolean[]>([]);
  const [readingShowAll, setReadingShowAll] = useState(false);

  // Unified lesson data state
  const [lessonData, setLessonData] = useState<{
    vocabulary: VocabWord[];
    grammar: GrammarConcept;
    grammarQuiz: GrammarExample[];
    story: StoryData;
  } | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lesson overview states
  const [currentLesson, setCurrentLesson] = useState<number | null>(null); // 1, 2, 3, or 4
  
  // Loading page state
  const [showLoadingPage, setShowLoadingPage] = useState(false);

  // Debug useEffect
  React.useEffect(() => {
    console.log('State changed - lessonLoading:', lessonLoading, 'vocab length:', vocab.length, 'page:', page);
  }, [lessonLoading, vocab.length, page]);

  // Error boundary effect
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      console.error('Error details:', {
        message: event.error?.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      setError('Something went wrong! Please try refreshing the page.');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError('Something went wrong! Please try refreshing the page.');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
    console.log('Starting lesson generation...');
    setLessonLoading(true);
    setShowLoadingPage(true); // Show loading page immediately
    
    try {
      // Generate complete lesson content
      console.log('Calling generateCompleteLesson...');
      const completeLesson = await generateCompleteLesson(skillLevel, subject);
      console.log('Lesson generated successfully:', completeLesson);
      
      setLessonData(completeLesson);
      
      // Set up vocabulary lesson state
      setVocab(completeLesson.vocabulary);
      setRevealed(Array(completeLesson.vocabulary.length).fill(false));
      setShowAll(false);
      
      // Set up grammar lesson state
      setGrammarConcept(completeLesson.grammar);
      setGrammarRevealed(Array(completeLesson.grammar.examples.length).fill(false));
      setGrammarShowAll(false);
      
      // Set up reading lesson state
      setStoryData(completeLesson.story);
      setReadingRevealed(Array(completeLesson.story.aligned.length).fill(false));
      setReadingShowAll(false);
      
      console.log('Setting lessonLoading to false...');
      setLessonLoading(false);
      setShowLoadingPage(false); // Hide loading page
      console.log('Lesson setup complete');
      
      // Navigate to lesson overview
      setCurrentLesson(1);
      setPage(101);
    } catch (error) {
      console.error('Error in handleStartLesson:', error);
      setLessonLoading(false);
      setShowLoadingPage(false); // Hide loading page even on error
      // Still navigate to lesson overview even if there's an error
      setCurrentLesson(1);
      setPage(101);
    }
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
        explanation: "This is the most basic way to make sentences in Chinese. You put the person doing the action first, then the action, then what they're doing it to.",
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
        explanation: "When you want to say when something happens, put the time at the beginning of the sentence.",
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
        explanation: "To say 'not' or 'don't', put 不 or 没 before the verb. Use 不 for general negatives and 没 for past negatives.",
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
        explanation: "This pattern emphasizes that you don't do something at all. It's like saying 'not even one' in English.",
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
        explanation: "The 把 pattern shows that something is done to an object. It's like saying 'I did something to something' in English.",
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
        explanation: "The 被 pattern is like passive voice in English. It shows that something was done to the subject by someone else.",
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
    // Grammar concept should already be available from lessonData
    if (lessonData) {
      setPage(7);
    } else {
      // Fallback: generate lesson if not available
      setLessonLoading(true);
      const completeLesson = await generateCompleteLesson(skillLevel, subject);
      setLessonData(completeLesson);
      setGrammarConcept(completeLesson.grammar);
      setGrammarRevealed(Array(completeLesson.grammar.examples.length).fill(false));
      setGrammarShowAll(false);
      setLessonLoading(false);
      setPage(7);
    }
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

  // Start grammar quiz
  const handleStartGrammarQuiz = () => {
    console.log('Starting grammar quiz, grammarQuiz questions:', lessonData?.grammarQuiz);
    setGrammarQuizStarted(true);
    setGrammarQuizQuestions(lessonData?.grammarQuiz || []);
    setGrammarQuizAnswers(Array(lessonData?.grammarQuiz?.length || 0).fill(''));
    setCurrentGrammarQuestionIndex(0);
    setGrammarQuizResults(null);
    setGrammarQuizEvaluations([]);
    setGrammarQuizLoading(false);
    setPage(8);
  };

  // Update grammar quiz answer
  const handleGrammarAnswerChange = (answer: string) => {
    const newAnswers = [...grammarQuizAnswers];
    newAnswers[currentGrammarQuestionIndex] = answer;
    setGrammarQuizAnswers(newAnswers);
  };

  // Handle "I'm not sure" button
  const handleNotSure = () => {
    // Mark current question as not sure (empty answer = incorrect)
    const newAnswers = [...grammarQuizAnswers];
    newAnswers[currentGrammarQuestionIndex] = '';
    setGrammarQuizAnswers(newAnswers);
    
    // Move to next question
    if (currentGrammarQuestionIndex < grammarQuizQuestions.length - 1) {
      setCurrentGrammarQuestionIndex(currentGrammarQuestionIndex + 1);
    } else {
      // If it's the last question, submit the quiz
      handleSubmitGrammarQuiz();
    }
  };

  // Navigate to next grammar question
  const handleNextGrammarQuestion = () => {
    if (currentGrammarQuestionIndex < grammarQuizQuestions.length - 1) {
      setCurrentGrammarQuestionIndex(currentGrammarQuestionIndex + 1);
    }
  };

  // Navigate to previous grammar question
  const handlePreviousGrammarQuestion = () => {
    if (currentGrammarQuestionIndex > 0) {
      setCurrentGrammarQuestionIndex(currentGrammarQuestionIndex - 1);
    }
  };

  // Fuzzy match function for checking answers
  const fuzzyMatch = (userAnswer: string, correctAnswer: string): boolean => {
    const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const user = normalize(userAnswer);
    const correct = normalize(correctAnswer);
    
    // Exact match
    if (user === correct) return true;
    
    // Check if user answer contains the main words from correct answer
    const correctWords = correct.split(' ').filter(word => word.length > 2);
    const userWords = user.split(' ').filter(word => word.length > 2);
    
    // If user has at least 80% of the important words, consider it correct
    const matchingWords = correctWords.filter(word => userWords.includes(word));
    return matchingWords.length >= correctWords.length * 0.8;
  };

  // Submit grammar quiz with AI evaluation
  const handleSubmitGrammarQuiz = async () => {
    try {
      console.log('Submitting grammar quiz for AI evaluation...');
      setGrammarQuizLoading(true);
      
      const response = await fetch('/api/evaluate-grammar-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: grammarQuizQuestions,
          answers: grammarQuizAnswers,
          skillLevel,
          topic: subject
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate quiz');
      }

      const evaluationData = await response.json();
      console.log('Quiz evaluation received:', evaluationData);
      
      setGrammarQuizEvaluations(evaluationData.evaluations);
      setGrammarQuizResults({
        correct: evaluationData.summary.correctCount,
        total: evaluationData.summary.totalCount,
        percentage: evaluationData.summary.percentage
      });
      setGrammarQuizLoading(false);
      setPage(9);
    } catch (error) {
      console.error('Error evaluating grammar quiz:', error);
      setGrammarQuizLoading(false);
      // Fallback to simple evaluation
      let correct = 0;
      grammarQuizQuestions.forEach((question, index) => {
        if (fuzzyMatch(grammarQuizAnswers[index], question.english)) {
          correct++;
        }
      });
      
      const percentage = Math.round((correct / grammarQuizQuestions.length) * 100);
      setGrammarQuizResults({ correct, total: grammarQuizQuestions.length, percentage });
      setPage(9);
    }
  };

  // Retry grammar quiz
  const handleGrammarQuizRetry = () => {
    setGrammarQuizAnswers(Array(grammarQuizQuestions.length).fill(''));
    setCurrentGrammarQuestionIndex(0);
    setGrammarQuizResults(null);
    setGrammarQuizEvaluations([]);
    setGrammarQuizLoading(false);
    setPage(8);
  };

  // Review grammar lesson
  const handleGrammarReviewLesson = () => {
    setGrammarQuizStarted(false);
    setGrammarQuizQuestions([]);
    setGrammarQuizAnswers([]);
    setCurrentGrammarQuestionIndex(0);
    setGrammarQuizResults(null);
    setGrammarQuizEvaluations([]);
    setGrammarQuizLoading(false);
    setPage(7); // Go back to grammar lesson
  };

  // Generate story using LLM
  const generateStory = async (skillLevel: SkillLevel, subject: string): Promise<StoryData> => {
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillLevel, subject }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating story:', error);
      // Fallback story
      return {
        aligned: [
          { chinese: "我", pinyin: "wǒ", english: "I" },
          { chinese: "喜欢", pinyin: "xǐhuān", english: "like" },
          { chinese: "学习", pinyin: "xuéxí", english: "study" },
          { chinese: "中文", pinyin: "zhōngwén", english: "Chinese" },
        ],
        sentence: "I like studying Chinese.",
        isAIGenerated: false,
      };
    }
  };

  // Start reading lesson
  const handleStartReadingLesson = async () => {
    // Story should already be available from lessonData
    if (lessonData) {
      setReadingStarted(true);
      setPage(10);
    } else {
      // Fallback: generate lesson if not available
      setLessonLoading(true);
      const completeLesson = await generateCompleteLesson(skillLevel, subject);
      setLessonData(completeLesson);
      setStoryData(completeLesson.story);
      setReadingRevealed(Array(completeLesson.story.aligned.length).fill(false));
      setReadingShowAll(false);
      setReadingStarted(true);
      setLessonLoading(false);
      setPage(10);
    }
  };

  // Reveal a single word in reading
  const handleReadingReveal = (idx: number) => {
    setReadingRevealed(prev => {
      if (!prev || !Array.isArray(prev)) {
        console.warn('readingRevealed is not properly initialized, creating new array');
        return Array(storyData?.aligned?.length || 0).fill(false).map((_, i) => i === idx ? true : false);
      }
      return prev.map((r, i) => (i === idx ? true : r));
    });
  };

  // Reveal all words in reading
  const handleReadingShowAll = () => {
    setReadingShowAll(true);
    setReadingRevealed(Array(storyData?.aligned?.length || 0).fill(true));
  };

  // Navigation menu component
  const NavigationMenu = () => {
    if (page === 1 || page === 2) return null; // Don't show on HSK selection and topic input pages
    // Main lesson structure (no nested pages)
    const menu = [
      {
        name: 'Lesson 1: Vocabulary',
        lessonNumber: 1,
      },
      {
        name: 'Lesson 2: Grammar',
        lessonNumber: 2,
      },
      {
        name: 'Lesson 3: Reading',
        lessonNumber: 3,
      },
      {
        name: 'Lesson 4: Writing',
        lessonNumber: 4,
      },
    ];

    const handleLessonNavigation = async (lessonNumber: number) => {
      try {
        console.log('Navigating to lesson overview:', lessonNumber);
        
        // Generate lesson data if not available
        if (!lessonData) {
          console.log('Generating lesson data...');
          setShowLoadingPage(true); // Show loading page
          const completeLesson = await generateCompleteLesson(skillLevel, subject);
          setLessonData(completeLesson);
          setVocab(completeLesson.vocabulary);
          setRevealed(Array(completeLesson.vocabulary.length).fill(false));
          setShowAll(false);
          setGrammarConcept(completeLesson.grammar);
          setGrammarRevealed(Array(completeLesson.grammar.examples.length).fill(false));
          setGrammarShowAll(false);
          setStoryData(completeLesson.story);
          setReadingRevealed(Array(completeLesson.story.aligned.length).fill(false));
          setReadingShowAll(false);
          setShowLoadingPage(false); // Hide loading page
        }
        
        setCurrentLesson(lessonNumber);
        setPage(100 + lessonNumber); // Use page numbers 101, 102, 103, 104 for lesson overviews
      } catch (error) {
        console.error('Error in handleLessonNavigation:', error);
        setShowLoadingPage(false); // Hide loading page on error
        setCurrentLesson(lessonNumber);
        setPage(100 + lessonNumber);
      }
    };

    const handlePageNavigation = async (targetPage: number) => {
      try {
        console.log('Navigating to page:', targetPage);
        
        // Initialize required state for certain pages
        if (targetPage === 3 && !lessonData) {
          console.log('Generating lesson for page 3...');
          setShowLoadingPage(true); // Show loading page
          const completeLesson = await generateCompleteLesson(skillLevel, subject);
          setLessonData(completeLesson);
          setVocab(completeLesson.vocabulary);
          setRevealed(Array(completeLesson.vocabulary.length).fill(false));
          setShowAll(false);
          setGrammarConcept(completeLesson.grammar);
          setGrammarRevealed(Array(completeLesson.grammar.examples.length).fill(false));
          setGrammarShowAll(false);
          setStoryData(completeLesson.story);
          setReadingRevealed(Array(completeLesson.story.aligned.length).fill(false));
          setReadingShowAll(false);
          setShowLoadingPage(false); // Hide loading page
        }
        
        if (targetPage === 4) {
          // Initialize matching game state
          if (!lessonData) {
            console.log('Generating lesson for page 4...');
            setShowLoadingPage(true); // Show loading page
            const completeLesson = await generateCompleteLesson(skillLevel, subject);
            setLessonData(completeLesson);
            setVocab(completeLesson.vocabulary);
            setRevealed(Array(completeLesson.vocabulary.length).fill(false));
            setShowAll(false);
            setQuizStarted(true);
            setQuizMatches(Array(completeLesson.vocabulary.length).fill(null));
            setQuizFeedback(Array(completeLesson.vocabulary.length).fill(null));
            setQuizComplete(false);
            setShowLoadingPage(false); // Hide loading page
            setPage(targetPage);
            return;
          } else {
            setQuizStarted(true);
            setQuizMatches(Array(lessonData.vocabulary.length).fill(null));
            setQuizFeedback(Array(lessonData.vocabulary.length).fill(null));
            setQuizComplete(false);
          }
        }
        
        if (targetPage === 5) {
          // Initialize multiple choice quiz state
          if (!lessonData) {
            console.log('Generating lesson for page 5...');
            setShowLoadingPage(true); // Show loading page
            const completeLesson = await generateCompleteLesson(skillLevel, subject);
            setLessonData(completeLesson);
            setVocab(completeLesson.vocabulary);
            setRevealed(Array(completeLesson.vocabulary.length).fill(false));
            setShowAll(false);
            const questions = generateMultipleChoiceQuestions(completeLesson.vocabulary);
            setQuizQuestions(questions);
            setSelectedAnswers(Array(questions.length).fill(''));
            setCurrentQuestionIndex(0);
            setMultipleChoiceStarted(true);
            setShowLoadingPage(false); // Hide loading page
            setPage(targetPage);
            return;
          } else {
            const questions = generateMultipleChoiceQuestions(lessonData.vocabulary);
            setQuizQuestions(questions);
            setSelectedAnswers(Array(questions.length).fill(''));
            setCurrentQuestionIndex(0);
            setMultipleChoiceStarted(true);
          }
        }
        
        if (targetPage === 7 && !lessonData) {
          console.log('Generating lesson for page 7...');
          setShowLoadingPage(true); // Show loading page
          const completeLesson = await generateCompleteLesson(skillLevel, subject);
          setLessonData(completeLesson);
          setGrammarConcept(completeLesson.grammar);
          setGrammarRevealed(Array(completeLesson.grammar.examples.length).fill(false));
          setGrammarShowAll(false);
          setShowLoadingPage(false); // Hide loading page
        }
        
        if (targetPage === 8) {
          // Initialize grammar quiz state
          if (!lessonData) {
            console.log('Generating lesson for page 8...');
            setShowLoadingPage(true); // Show loading page
            const completeLesson = await generateCompleteLesson(skillLevel, subject);
            setLessonData(completeLesson);
            setGrammarConcept(completeLesson.grammar);
            setGrammarRevealed(Array(completeLesson.grammar.examples.length).fill(false));
            setGrammarShowAll(false);
            setGrammarQuizQuestions(completeLesson.grammarQuiz);
            setGrammarQuizStarted(true);
            setGrammarQuizAnswers(Array(completeLesson.grammarQuiz.length).fill(''));
            setCurrentGrammarQuestionIndex(0);
            setGrammarQuizResults(null);
            setGrammarQuizEvaluations([]);
            setGrammarQuizLoading(false);
            setPage(targetPage);
            return;
          } else {
            setGrammarQuizQuestions(lessonData.grammarQuiz);
            setGrammarQuizStarted(true);
            setGrammarQuizAnswers(Array(lessonData.grammarQuiz.length).fill(''));
            setCurrentGrammarQuestionIndex(0);
            setGrammarQuizResults(null);
            setGrammarQuizEvaluations([]);
            setGrammarQuizLoading(false);
          }
        }
        
        if (targetPage === 10 && !lessonData) {
          console.log('Generating lesson for page 10...');
          setShowLoadingPage(true); // Show loading page
          const completeLesson = await generateCompleteLesson(skillLevel, subject);
          setLessonData(completeLesson);
          setStoryData(completeLesson.story);
          setReadingRevealed(Array(completeLesson.story.aligned.length).fill(false));
          setReadingShowAll(false);
          setReadingStarted(true);
          setShowLoadingPage(false); // Hide loading page
          setPage(targetPage);
          return;
        }
        
        if (targetPage === 10 && lessonData) {
          // If lessonData exists but readingStarted is not set, set it
          if (!readingStarted) {
            console.log('Setting up reading state for page 10...');
            setReadingStarted(true);
            setStoryData(lessonData.story);
            setReadingRevealed(Array(lessonData.story.aligned.length).fill(false));
            setReadingShowAll(false);
          }
        }
        
        console.log('Setting page to:', targetPage);
        setPage(targetPage);
      } catch (error) {
        console.error('Error in handlePageNavigation:', error);
        // Fallback: try to set the page anyway
        setPage(targetPage);
      }
    };

    return (
      <div className="fixed left-0 top-0 h-full w-64 bg-[#FDFCDC] shadow-lg border-r border-[#FED9B7] overflow-y-auto z-10">
        <div className="p-6">
          {/* Level and Topic */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg font-bold text-[#0081A7]">Level: {skillLevel}</span>
              <button
                onClick={() => setPage(1)}
                className="text-xs text-[#F07167] hover:text-[#0081A7] transition-colors ml-2"
              >
                Change Level
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#0081A7]">Topic: {subject || '—'}</span>
              <button
                onClick={() => setPage(2)}
                className="text-xs text-[#F07167] hover:text-[#0081A7] transition-colors ml-2"
              >
                Try new topic
              </button>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="mt-8">
            {menu.map((lesson, i) => (
              <div key={lesson.name} className="mb-2">
                <button
                  onClick={() => handleLessonNavigation(lesson.lessonNumber)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 font-semibold text-sm mb-1
                    ${page === 100 + lesson.lessonNumber ? 'bg-[#00AFB9] text-white shadow-md' : 'bg-white text-[#0081A7] hover:bg-[#FED9B7] hover:text-[#F07167] border border-[#FED9B7]'}`}
                >
                  {lesson.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
    } else if (page === 8) {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">Lesson 2: Grammar</h1>
          <h2 className="text-lg text-[#00AFB9] mb-10 font-medium">Now, let&apos;s work on some full sentences</h2>
        </>
      );
    } else if (page === 9) {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">Lesson 2: Grammar</h1>
          <h2 className="text-lg text-[#00AFB9] mb-10 font-medium">Now, let&apos;s work on some full sentences</h2>
        </>
      );
    } else if (page === 10) {
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">Lesson 3: Reading</h1>
          <h2 className="text-lg text-[#00AFB9] mb-10 font-medium">Let&apos;s read a story together</h2>
        </>
      );
    } else if (page >= 101 && page <= 104) {
      const lessonNames = ['', 'Vocabulary', 'Grammar', 'Reading', 'Writing'];
      const lessonNumber = page - 100;
      return (
        <>
          <h1 className="text-4xl font-bold text-[#0081A7] mb-4 mt-8">Lesson {lessonNumber}: {lessonNames[lessonNumber]}</h1>
          <h2 className="text-lg text-[#00AFB9] mb-10 font-medium">Choose an exercise to get started</h2>
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
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Something went wrong!</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )}
      {showLoadingPage && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-40">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
              <h2 className="text-lg text-[#00AFB9] font-medium">Creating your personalized lesson...</h2>
            </div>
            
            {/* Animated loading indicator */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Outer spinning circle */}
                <div className="w-16 h-16 border-4 border-[#FED9B7] border-t-[#F07167] rounded-full animate-spin"></div>
                
                {/* Inner pulsing circle */}
                <div className="absolute inset-2 bg-[#00AFB9] rounded-full animate-pulse"></div>
                
                {/* Center dot */}
                <div className="absolute inset-6 bg-[#0081A7] rounded-full"></div>
              </div>
            </div>
            
            {/* Loading text with dots animation */}
            <div className="text-[#0081A7] text-lg font-medium">
              <span>Generating vocabulary</span>
              <span className="animate-pulse">...</span>
            </div>
            
            {/* Progress steps */}
            <div className="mt-8 space-y-2 text-sm text-[#00AFB9]">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#00AFB9] rounded-full animate-pulse"></div>
                <span>Creating grammar examples</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#FED9B7] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>Writing a story</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#F07167] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>Preparing exercises</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {grammarQuizLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
              <h2 className="text-lg text-[#00AFB9] font-medium">Evaluating your answers...</h2>
            </div>
            
            {/* Animated loading indicator */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Outer spinning circle */}
                <div className="w-16 h-16 border-4 border-[#FED9B7] border-t-[#F07167] rounded-full animate-spin"></div>
                
                {/* Inner pulsing circle */}
                <div className="absolute inset-2 bg-[#00AFB9] rounded-full animate-pulse"></div>
                
                {/* Center dot */}
                <div className="absolute inset-6 bg-[#0081A7] rounded-full"></div>
              </div>
            </div>
            
            {/* Loading text */}
            <div className="text-[#0081A7] text-lg font-medium">
              <span>Analyzing your translations</span>
              <span className="animate-pulse">...</span>
            </div>
            
            {/* Progress steps */}
            <div className="mt-8 space-y-2 text-sm text-[#00AFB9]">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#00AFB9] rounded-full animate-pulse"></div>
                <span>Checking grammar accuracy</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#FED9B7] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>Evaluating meaning</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#F07167] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>Preparing feedback</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={`flex flex-col items-center justify-center min-h-screen ${page >= 3 ? 'ml-64' : ''}`}>
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
              disabled={!subject.trim() || lessonLoading}
            >
              {lessonLoading ? 'Generating lesson...' : 'Start lesson'}
            </button>
          </form>
        )}
        {page === 3 && (
          <div className="w-full max-w-2xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
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
            {lessonLoading ? (
              <div className="text-[#0081A7] text-lg">Generating your lesson...</div>
            ) : (
              <>
                <div className="w-full mb-8">
                  <div className="text-lg font-semibold text-[#0081A7] mb-2">{grammarConcept.name}</div>
                  <div className="text-base text-[#00AFB9] mb-2">{grammarConcept.description}</div>
                  <div className="text-sm text-gray-600 italic">{grammarConcept.explanation}</div>
                </div>
                
                <div className="flex flex-col gap-4 w-full">
                  {grammarConcept.examples.map((example, idx) => (
                    <div key={idx} className="flex items-center gap-6 w-full">
                      <div className="flex flex-col items-start min-w-[200px] flex-shrink-0">
                        <span className="text-xl text-[#0081A7] font-bold">{example.chinese}</span>
                        <span className="text-[#00AFB9] text-sm">{example.pinyin}</span>
                      </div>
                      <div className="flex-1 flex justify-start">
                        <button
                          type="button"
                          className="px-6 py-3 rounded-lg bg-[#FED9B7] text-[#F07167] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#F07167] transition-all duration-200 flex items-center justify-center text-center"
                          style={{ minWidth: 200, minHeight: 60 }}
                          onClick={() => handleGrammarReveal(idx)}
                          disabled={grammarRevealed[idx] || grammarShowAll}
                        >
                          <span
                            style={{
                              filter: grammarRevealed[idx] || grammarShowAll ? 'none' : 'blur(6px)',
                              transition: 'filter 0.2s',
                              cursor: grammarRevealed[idx] || grammarShowAll ? 'default' : 'pointer',
                              userSelect: 'none',
                              wordWrap: 'break-word',
                              maxWidth: '100%',
                            }}
                          >
                            {example.english}
                          </span>
                        </button>
                      </div>
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
                    onClick={handleStartGrammarQuiz}
                    disabled={!grammarRevealed.every(Boolean)}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {page === 8 && grammarQuizStarted && (
          <div className="w-full max-w-2xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">Grammar Quiz: Translate to English</h3>
            {grammarQuizQuestions.length > 0 ? (
              <div className="w-full">
                <div className="text-center mb-8">
                  <div className="text-2xl text-[#0081A7] font-bold mb-2">
                    {grammarQuizQuestions[currentGrammarQuestionIndex].chinese}
                  </div>
                  <div className="text-lg text-[#00AFB9] mb-4">
                    {grammarQuizQuestions[currentGrammarQuestionIndex].pinyin}
                  </div>
                  <div className="text-sm text-[#00AFB9]">
                    Question {currentGrammarQuestionIndex + 1} of {grammarQuizQuestions.length}
                  </div>
                </div>
                
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-[#0081A7] mb-4">Enter the English translation:</label>
                  <input
                    type="text"
                    value={grammarQuizAnswers[currentGrammarQuestionIndex]}
                    onChange={(e) => handleGrammarAnswerChange(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-[#FED9B7] rounded-xl focus:ring-2 focus:ring-[#FED9B7] focus:border-transparent transition-all duration-200 bg-white text-[#0081A7] font-medium text-lg"
                    placeholder="Type your answer here..."
                    autoFocus
                  />
                </div>
                
                <div className="flex flex-col gap-3 mb-6">
                  <button
                    onClick={handleNotSure}
                    className="px-6 py-3 bg-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-400 transition-all duration-200"
                  >
                    I'm not sure
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  {currentGrammarQuestionIndex > 0 && (
                    <button
                      className="px-6 py-3 bg-[#FED9B7] text-[#0081A7] font-semibold rounded-xl hover:bg-[#F07167] hover:text-white transition-all duration-200"
                      onClick={handlePreviousGrammarQuestion}
                    >
                      Back
                    </button>
                  )}
                  <div className="flex-1"></div>
                  {currentGrammarQuestionIndex < grammarQuizQuestions.length - 1 ? (
                    <button
                      className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200
                        ${grammarQuizAnswers[currentGrammarQuestionIndex].trim() 
                          ? 'bg-[#00AFB9] text-white hover:bg-[#0081A7]' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      onClick={handleNextGrammarQuestion}
                      disabled={!grammarQuizAnswers[currentGrammarQuestionIndex].trim()}
                    >
                      Next question
                    </button>
                  ) : (
                    <button
                      className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200
                        ${grammarQuizAnswers.every(answer => answer.trim() !== '') 
                          ? 'bg-[#00AFB9] text-white hover:bg-[#0081A7]' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      onClick={handleSubmitGrammarQuiz}
                      disabled={!grammarQuizAnswers.every(answer => answer.trim() !== '')}
                    >
                      Submit Answers
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[#0081A7] text-lg">Loading grammar quiz...</div>
            )}
          </div>
        )}
        {page === 9 && grammarQuizResults && (
          <div className="w-full max-w-4xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">Grammar Quiz Results</h3>
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-[#0081A7] mb-4">
                {grammarQuizResults.correct}/{grammarQuizResults.total} correct
              </div>
              <div className="text-xl text-[#00AFB9] mb-6">
                {grammarQuizResults.percentage}% accuracy
              </div>
              
              {/* Detailed evaluations */}
              {grammarQuizEvaluations.length > 0 && (
                <div className="w-full mb-8">
                  <h4 className="text-lg font-semibold text-[#0081A7] mb-4">Question Breakdown:</h4>
                  <div className="space-y-4">
                    {grammarQuizEvaluations.map((evaluation, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-2 ${
                        evaluation.isCorrect 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-lg font-semibold text-[#0081A7]">
                            Question {idx + 1}: {grammarQuizQuestions[idx]?.chinese}
                          </div>
                          <div className={`text-2xl ${evaluation.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {evaluation.isCorrect ? '✓' : '✗'}
                          </div>
                        </div>
                        <div className="text-sm text-[#00AFB9] mb-2">
                          {grammarQuizQuestions[idx]?.pinyin}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Your answer:</strong> {evaluation.studentAnswer}
                        </div>
                        {!evaluation.isCorrect && (
                          <div className="text-sm text-green-600 mb-2">
                            <strong>Correct answer:</strong> {evaluation.correctAnswer}
                          </div>
                        )}
                        <div className="text-sm text-gray-700 italic">
                          {evaluation.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {grammarQuizResults.percentage >= 80 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <div className="text-2xl font-bold text-[#0081A7] mb-6">Great job!</div>
                  <div className="flex gap-4 justify-center">
                    <button
                      className="px-6 py-3 bg-[#FED9B7] text-[#0081A7] font-semibold rounded-xl hover:bg-[#F07167] hover:text-white transition-all duration-200"
                      onClick={() => setPage(1)}
                    >
                      Start Over
                    </button>
                    <button
                      className="px-6 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl hover:bg-[#0081A7] transition-all duration-200"
                      onClick={handleStartReadingLesson}
                    >
                      Next Lesson
                    </button>
                  </div>
                </div>
              )}
              
              {grammarQuizResults.percentage < 80 && (
                <div className="text-center">
                  <div className="text-6xl mb-4">😐</div>
                  <div className="text-2xl font-bold text-[#0081A7] mb-6">Keep practicing!</div>
                  <div className="flex gap-4 justify-center">
                    <button
                      className="px-6 py-3 bg-[#FED9B7] text-[#0081A7] font-semibold rounded-xl hover:bg-[#F07167] hover:text-white transition-all duration-200"
                      onClick={handleGrammarQuizRetry}
                    >
                      Try again
                    </button>
                    <button
                      className="px-6 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl hover:bg-[#0081A7] transition-all duration-200"
                      onClick={handleGrammarReviewLesson}
                    >
                      Review lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {page === 10 && lessonData && readingStarted && storyData && (
          <div className="w-full max-w-4xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">Read the Story</h3>
            {lessonLoading ? (
              <div className="text-[#0081A7] text-lg">Generating your lesson...</div>
            ) : (
              <>
                {/* Full English translation */}
                <div className="w-full mb-8 p-4 bg-white rounded-xl border-2 border-[#FED9B7]">
                  <div className="text-sm text-[#00AFB9] font-medium mb-2">Full Translation</div>
                  <div className="text-lg text-[#0081A7]">{lessonData.story.sentence}</div>
                </div>
                
                {/* Story content */}
                <div className="w-full mb-8">
                  <div className="text-sm text-[#00AFB9] font-medium mb-4">Story (Click words to reveal translations)</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(() => {
                      try {
                        console.log('Rendering story content');
                        console.log('lessonData.story:', lessonData.story);
                        console.log('lessonData.story.aligned:', lessonData.story.aligned);
                        console.log('readingRevealed:', readingRevealed);
                        
                        if (!lessonData.story || !lessonData.story.aligned || !Array.isArray(lessonData.story.aligned)) {
                          console.error('Invalid story data structure');
                          return <div className="text-red-500">Error: Invalid story data</div>;
                        }
                        
                        return lessonData.story.aligned.map((word, idx) => {
                          try {
                            // Safety check for readingRevealed array
                            const isRevealed = readingRevealed && Array.isArray(readingRevealed) && readingRevealed[idx];
                            
                            if (!word || !word.chinese) {
                              console.error('Invalid word data at index', idx, word);
                              return null;
                            }
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => handleReadingReveal(idx)}
                                className={`p-3 rounded-lg transition-all duration-200 text-center min-w-[80px] ${
                                  isRevealed || readingShowAll
                                    ? 'bg-[#00AFB9] text-white shadow-md'
                                    : 'bg-white text-[#0081A7] hover:bg-[#FED9B7] hover:text-[#F07167] border border-[#FED9B7]'
                                }`}
                                disabled={isRevealed || readingShowAll}
                              >
                                <div className="text-xl font-bold mb-1">{word.chinese}</div>
                                {(isRevealed || readingShowAll) && (
                                  <>
                                    <div className="text-sm opacity-90">{word.pinyin}</div>
                                    <div className="text-xs opacity-80">{word.english}</div>
                                  </>
                                )}
                              </button>
                            );
                          } catch (wordError) {
                            console.error('Error rendering word at index', idx, wordError);
                            return null;
                          }
                        });
                      } catch (storyError) {
                        console.error('Error rendering story content:', storyError);
                        return <div className="text-red-500">Error rendering story content</div>;
                      }
                    })()}
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex flex-col items-center w-full gap-4">
                  <button
                    className={`px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl transition-all duration-200 shadow-lg w-full max-w-xs
                      ${!(readingShowAll || (readingRevealed && readingRevealed.every(Boolean))) ? 'hover:from-[#F07167] hover:to-[#FED9B7] hover:shadow-xl' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={handleReadingShowAll}
                    disabled={readingShowAll || (readingRevealed && readingRevealed.every(Boolean))}
                  >
                    Show All Translations
                  </button>
                  <button
                    className={`px-8 py-3 bg-[#00AFB9] text-white font-semibold rounded-xl shadow-lg w-full max-w-xs text-lg transition-all duration-200
                      ${readingRevealed && readingRevealed.every(Boolean) ? 'hover:bg-[#0081A7]' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={() => setPage(1)}
                    disabled={!readingRevealed || !readingRevealed.every(Boolean)}
                  >
                    Complete Lesson
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Fallback loading state for page 10 */}
        {page === 10 && (!lessonData || !readingStarted || !storyData) && (
          <div className="w-full max-w-4xl bg-[#FDFCDC] rounded-2xl shadow-lg p-8 flex flex-col items-center relative min-h-[400px]">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-6">Read the Story</h3>
            <div className="text-[#0081A7] text-lg mb-4">Loading reading lesson...</div>
            <div className="text-sm text-[#00AFB9] space-y-1">
              <div>Debug info:</div>
              <div>lessonData: {lessonData ? '✓' : '✗'}</div>
              <div>readingStarted: {readingStarted ? '✓' : '✗'}</div>
              <div>storyData: {storyData ? '✓' : '✗'}</div>
              {lessonData && <div>story exists: {lessonData.story ? '✓' : '✗'}</div>}
              {lessonData?.story && <div>story array length: {lessonData.story.aligned?.length || 'undefined'}</div>}
            </div>
          </div>
        )}
        
        {/* Lesson Overview Pages */}
        {page === 101 && currentLesson === 1 && (
          <div className="w-full max-w-4xl">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-8 text-center">Lesson 1: Vocabulary</h3>
            <div className="grid gap-6">
              <button
                onClick={() => setPage(3)}
                className="w-full p-6 bg-[#FDFCDC] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-[#FED9B7] hover:border-[#F07167]"
              >
                <h4 className="text-xl font-bold text-[#0081A7] mb-2">New Vocabulary</h4>
                <p className="text-[#00AFB9]">Learn new words related to your chosen topic</p>
              </button>
              
              <button
                onClick={() => {
                  setQuizStarted(true);
                  setPage(4);
                  setQuizMatches(Array(lessonData!.vocabulary.length).fill(null));
                  setQuizFeedback(Array(lessonData!.vocabulary.length).fill(null));
                  setQuizComplete(false);
                }}
                className="w-full p-6 bg-[#FDFCDC] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-[#FED9B7] hover:border-[#F07167]"
              >
                <h4 className="text-xl font-bold text-[#0081A7] mb-2">Vocabulary Exercise 1: Match the new words to the correct meanings</h4>
                <p className="text-[#00AFB9]">Drag and drop to match Chinese words with their English translations</p>
              </button>
              
              <button
                onClick={() => {
                  const questions = generateMultipleChoiceQuestions(lessonData!.vocabulary);
                  setQuizQuestions(questions);
                  setSelectedAnswers(Array(questions.length).fill(''));
                  setCurrentQuestionIndex(0);
                  setMultipleChoiceStarted(true);
                  setPage(5);
                }}
                className="w-full p-6 bg-[#FDFCDC] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-[#FED9B7] hover:border-[#F07167]"
              >
                <h4 className="text-xl font-bold text-[#0081A7] mb-2">Vocabulary Exercise 2: Quiz Me!</h4>
                <p className="text-[#00AFB9]">Test your knowledge with multiple choice questions</p>
              </button>
            </div>
          </div>
        )}

        {page === 102 && currentLesson === 2 && (
          <div className="w-full max-w-4xl">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-8 text-center">Lesson 2: Grammar</h3>
            <div className="grid gap-6">
              <button
                onClick={() => setPage(7)}
                className="w-full p-6 bg-[#FDFCDC] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-[#FED9B7] hover:border-[#F07167]"
              >
                <h4 className="text-xl font-bold text-[#0081A7] mb-2">New Grammar Concept</h4>
                <p className="text-[#00AFB9]">Learn a new grammar pattern with examples</p>
              </button>
              
              <button
                onClick={() => {
                  setGrammarQuizQuestions(lessonData!.grammarQuiz);
                  setGrammarQuizStarted(true);
                  setGrammarQuizAnswers(Array(lessonData!.grammarQuiz.length).fill(''));
                  setCurrentGrammarQuestionIndex(0);
                  setGrammarQuizResults(null);
                  setGrammarQuizEvaluations([]);
                  setGrammarQuizLoading(false);
                  setPage(8);
                }}
                className="w-full p-6 bg-[#FDFCDC] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-[#FED9B7] hover:border-[#F07167]"
              >
                <h4 className="text-xl font-bold text-[#0081A7] mb-2">Grammar Exercise 1: Practice translating Chinese phrases to English</h4>
                <p className="text-[#00AFB9]">Type English translations for Chinese sentences</p>
              </button>
            </div>
          </div>
        )}

        {page === 103 && currentLesson === 3 && (
          <div className="w-full max-w-4xl">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-8 text-center">Lesson 3: Reading</h3>
            <div className="grid gap-6">
              <button
                onClick={() => {
                  try {
                    console.log('Clicking New short story button');
                    console.log('lessonData:', lessonData);
                    console.log('lessonData.story:', lessonData?.story);
                    
                    // Ensure reading state is properly initialized
                    if (lessonData && lessonData.story) {
                      console.log('Setting story data and reading state');
                      setStoryData(lessonData.story);
                      setReadingRevealed(Array(lessonData.story.aligned.length).fill(false));
                      setReadingShowAll(false);
                      setReadingStarted(true);
                      setPage(10);
                    } else {
                      console.error('lessonData or lessonData.story is missing');
                      // Fallback: try to navigate anyway
                      setReadingStarted(true);
                      setPage(10);
                    }
                  } catch (error) {
                    console.error('Error in New short story button click:', error);
                    // Fallback: try to navigate anyway
                    setReadingStarted(true);
                    setPage(10);
                  }
                }}
                className="w-full p-6 bg-[#FDFCDC] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-[#FED9B7] hover:border-[#F07167]"
              >
                <h4 className="text-xl font-bold text-[#0081A7] mb-2">New short story</h4>
                <p className="text-[#00AFB9]">Read an interactive story with click-to-reveal translations</p>
              </button>
              
              <button
                onClick={() => {
                  // TODO: Add reading exercise functionality later
                  alert('Reading Exercise 1: Quiz Me! - Coming soon!');
                }}
                className="w-full p-6 bg-[#FDFCDC] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-[#FED9B7] hover:border-[#F07167] opacity-50 cursor-not-allowed"
              >
                <h4 className="text-xl font-bold text-[#0081A7] mb-2">Reading Exercise 1: Quiz Me!</h4>
                <p className="text-[#00AFB9]">Test your reading comprehension (Coming soon)</p>
              </button>
            </div>
          </div>
        )}

        {page === 104 && currentLesson === 4 && (
          <div className="w-full max-w-4xl">
            <h3 className="text-2xl font-bold text-[#0081A7] mb-8 text-center">Lesson 4: Writing</h3>
            <div className="text-center">
              <p className="text-[#00AFB9] text-lg mb-4">Writing lessons coming soon!</p>
              <p className="text-[#0081A7]">This lesson will include writing exercises and practice.</p>
            </div>
          </div>
        )}
      </div>
      {NavigationMenu()}
    </div>
  );
}
