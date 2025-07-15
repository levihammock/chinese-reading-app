'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { SkillLevel, ViewMode, StoryData, VocabularyWord } from '@/types';
import type { DictionaryEntry } from '@/data/cedict-dictionary';
import { Quicksand } from 'next/font/google';

const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '500', '700'] });

// Lazy load the dictionary to prevent mobile memory issues
let cedictDictionary: DictionaryEntry[] = [];
let pinyinMap: Map<string, DictionaryEntry> | null = null;
let charMap: Map<string, DictionaryEntry> | null = null;
let dictionaryLoaded = false;

const loadDictionary = async () => {
  if (dictionaryLoaded) return;
  
  try {
    const { cedictDictionary: dict } = await import('@/data/cedict-dictionary');
    cedictDictionary = dict;
    
    // Build lookup maps for fast access
    pinyinMap = new Map();
    charMap = new Map();
    
    for (const entry of cedictDictionary) {
      // Normalize pinyin (remove tone numbers and spaces)
      const normalizedPinyin = entry.pinyin.toLowerCase().replace(/[0-9]/g, '').replace(/\s+/g, '');
      if (!pinyinMap.has(normalizedPinyin)) {
        pinyinMap.set(normalizedPinyin, entry);
      }
      // Only map single characters for charMap
      if (entry.chinese.length === 1 && !charMap.has(entry.chinese)) {
        charMap.set(entry.chinese, entry);
      }
    }
    
    dictionaryLoaded = true;
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    // Continue without dictionary - tooltips will show "not available"
  }
};

export default function Home() {
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('HSK1');
  const [subject, setSubject] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [story, setStory] = useState<StoryData & { isAIGenerated?: boolean; note?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedVocabulary, setSavedVocabulary] = useState<VocabularyWord[]>([]);
  const [hoveredWord, setHoveredWord] = useState<{pinyin: string, chinese: string, english: string} | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [dictionaryReady, setDictionaryReady] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  // Add state for showPinyin toggle (default true)
  const [showPinyin, setShowPinyin] = useState(true);

  // Load dictionary on component mount
  useEffect(() => {
    loadDictionary().then(() => {
      setDictionaryReady(true);
    });
  }, []);

  // Optimized function to get accurate translation for a Pinyin word using the Map
  const getAccurateTranslation = (pinyin: string, context?: { before?: string, after?: string }) => {
    if (!pinyinMap) return null;
    const normalizedPinyin = pinyin.toLowerCase().replace(/[0-9]/g, '').replace(/\s+/g, '');
    return pinyinMap.get(normalizedPinyin) || null;
  };

  // Optimized function to get any available translation with fallback
  const getAnyAvailableTranslation = (pinyin: string, chineseChars?: string) => {
    if (!dictionaryReady) return null;
    
    const translation = getAccurateTranslation(pinyin);
    if (translation) return translation;
    if (chineseChars && charMap && charMap.has(chineseChars)) {
      return charMap.get(chineseChars);
    }
    return null;
  };

  // Handle mouse move for tooltip positioning
  const handleMouseMove = (event: React.MouseEvent, pinyin: string, chinese: string, english: string, isFallback: boolean = false) => {
    setHoveredWord({ pinyin, chinese, english });
    // Position tooltip above the specific word being hovered
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({ 
      x: rect.left + (rect.width / 2), 
      y: rect.top - 10 
    });
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredWord(null);
  };

  // New: Render aligned story array with hover tooltips
  const renderAlignedStory = (storyArray: { chinese: string; pinyin: string; english: string }[], mode: ViewMode) => {
    return (
      <div className="text-center">
        {storyArray.map((item, idx) => (
          <span
            key={idx}
            className="inline-block cursor-pointer hover:bg-[#F694C1] hover:bg-opacity-20 rounded px-1 transition-colors duration-200"
            onMouseMove={e => handleMouseMove(e, item.pinyin, item.chinese, item.english)}
            onMouseLeave={handleMouseLeave}
          >
            {mode === 'chinese' && item.chinese}
            {mode === 'pinyin' && item.pinyin}
            {mode === 'english' && item.english}
            {' '}
          </span>
        ))}
      </div>
    );
  };

  // New: Render aligned story array with optional Pinyin above Chinese
  const renderChineseWithPinyin = (storyArray: { chinese: string; pinyin: string; english: string }[]) => {
    return (
      <div className="text-center flex flex-wrap justify-center">
        {storyArray.map((item, idx) => (
          <span
            key={idx}
            className="inline-block cursor-pointer hover:bg-[#F694C1] hover:bg-opacity-20 rounded px-1 transition-colors duration-200"
            onMouseMove={e => handleMouseMove(e, item.pinyin, item.chinese, item.english)}
            onMouseLeave={handleMouseLeave}
          >
            <span className="flex flex-col items-center">
              {showPinyin && (
                <span className="text-xs text-[#0081A7] mb-0.5 select-none">{item.pinyin}</span>
              )}
              <span>{item.chinese}</span>
            </span>
          </span>
        ))}
      </div>
    );
  };

  // Render Chinese text (no hover functionality)
  const renderChineseText = (chinese: string) => {
    return (
      <div className="text-center">
        {chinese.split('').map((char, index) => (
          <span key={index} className="inline-block">
            {char}
          </span>
        ))}
      </div>
    );
  };

  const generateStory = async () => {
    if (!subject.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillLevel, subject }),
      });

      const data = await response.json();

      if (response.ok) {
        setStory(data);
      } else {
        console.error('API Error:', data);
        
        // Provide more specific error messages based on the error type
        let errorMessage = data.error || 'Failed to generate story. Please try again.';
        
        if (data.error === 'Invalid story format received from AI') {
          errorMessage = 'The AI generated an invalid response format. This sometimes happens with complex topics. Please try a different subject or try again.';
        } else if (data.error === 'Failed to generate properly formatted story') {
          errorMessage = 'The AI response could not be parsed correctly. This is usually a temporary issue. Please try again with a simpler topic.';
        } else if (data.error === 'Rate limit exceeded') {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (data.error === 'Invalid API key') {
          errorMessage = 'API configuration error. Please contact support.';
        } else if (data.error === 'Network connection error. Please check your internet connection and try again.') {
          errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        } else if (data.details) {
          errorMessage = `${data.error}: ${data.details}`;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Network Error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveVocabulary = () => {
    if (!story || !Array.isArray(story.story) || story.story.length === 0) return;

    // Save the first word as a sample vocabulary entry (or you could expand this to save all words)
    const first = story.story[0];
    if (!first) return;
    const newVocabulary: VocabularyWord = {
      chinese: first.chinese,
      pinyin: first.pinyin,
      english: first.english,
      timestamp: Date.now(),
    };
    setSavedVocabulary(prev => [...prev, newVocabulary]);
  };

  const renderStoryContent = () => {
    if (!story || !Array.isArray(story.story)) return null;
    const storyArray = story.story;
    switch (viewMode) {
      case 'chinese':
        return (
          <div className="text-2xl leading-relaxed text-center p-6 bg-white rounded-2xl shadow-lg">
            {renderChineseWithPinyin(storyArray)}
          </div>
        );
      case 'english':
        return (
          <div className="text-lg leading-relaxed text-center p-6 bg-white rounded-2xl shadow-lg">
            {/* Show the natural sentence if available, else join the aligned array */}
            {story.sentence ? (
              <span>{story.sentence}</span>
            ) : (
              renderAlignedStory(storyArray, 'english')
            )}
          </div>
        );
      case 'all': // Change to 'both'
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-xl leading-relaxed p-6 bg-[#FDFCDC] text-[#0081A7] rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4">中文</h3>
              {renderChineseWithPinyin(storyArray)}
            </div>
            <div className="text-lg leading-relaxed p-6 bg-[#00AFB9] text-white rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4">English</h3>
              {story.sentence ? (
                <span>{story.sentence}</span>
              ) : (
                renderAlignedStory(storyArray, 'english')
              )}
            </div>
          </div>
        );
    }
  };

  // Toggle switch component for Show Pinyin
  const ToggleSwitch = ({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) => (
    <button
      id={id}
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AFB9] ${checked ? 'bg-[#00AFB9]' : 'bg-[#FED9B7]'}`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-7' : 'translate-x-1'}`}
      />
      <span className="absolute left-2 text-xs font-semibold text-[#0081A7] select-none" style={{ opacity: checked ? 1 : 0.5 }}>ON</span>
      <span className="absolute right-2 text-xs font-semibold text-[#F07167] select-none" style={{ opacity: checked ? 0.5 : 1 }}>OFF</span>
    </button>
  );

  return (
    <div className={`min-h-screen bg-white ${quicksand.className}`}>
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto min-h-screen">
        {/* Left Side Panel: Input Fields */}
        <div className="w-full md:w-1/3 bg-[#0081A7] p-8 flex flex-col justify-between shadow-lg">
          <div>
            <h1 className="text-4xl font-bold text-[#FDFCDC] mb-8 text-center md:text-left">KanKan</h1>
            {/* Input Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-[#FDFCDC] mb-2">Skill Level</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                className="w-full px-4 py-3 border border-[#FED9B7] rounded-xl focus:ring-2 focus:ring-[#FED9B7] focus:border-transparent transition-all duration-200 bg-[#FDFCDC] text-[#0081A7] font-medium"
              >
                <option value="HSK1">HSK1</option>
                <option value="HSK2">HSK2</option>
                <option value="HSK3">HSK3</option>
                <option value="HSK4">HSK4</option>
                <option value="HSK5">HSK5</option>
                <option value="HSK6">HSK6</option>
              </select>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-[#FDFCDC] mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., animals, food, travel..."
                className="w-full px-4 py-3 border border-[#FED9B7] rounded-xl focus:ring-2 focus:ring-[#FED9B7] focus:border-transparent transition-all duration-200 bg-[#FDFCDC] text-[#0081A7] font-medium"
              />
            </div>
            <button
              onClick={generateStory}
              disabled={isLoading || !subject.trim()}
              className="w-full px-8 py-3 bg-gradient-to-r from-[#FED9B7] to-[#F07167] text-[#0081A7] font-semibold rounded-xl hover:from-[#F07167] hover:to-[#FED9B7] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Generating...' : 'Generate Story'}
            </button>
          </div>
          {/* Saved Vocabulary */}
          {savedVocabulary.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold text-[#FDFCDC] mb-4">Saved Vocabulary ({savedVocabulary.length})</h3>
              <div className="grid grid-cols-1 gap-4">
                {savedVocabulary.map((vocab, index) => (
                  <div
                    key={index}
                    className="p-4 bg-[#00AFB9] rounded-xl border border-[#FDFCDC]"
                  >
                    <div className="font-bold text-lg text-[#FED9B7]">{vocab.chinese}</div>
                    <div className="text-[#FDFCDC]">{vocab.pinyin}</div>
                    <div className="text-[#F07167] text-sm">{vocab.english}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Right Side Panel: Translations and Story */}
        <div className="flex-1 bg-white p-8 flex flex-col justify-center">
          {/* Error Message */}
          {error && (
            <div className="bg-[#FED9B7] border border-[#F07167] rounded-2xl p-4 mb-8">
              <div className="flex items-start">
                <div className="text-[#F07167] mr-3 mt-1">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-[#F07167] font-semibold mb-2">Error</h3>
                  <p className="text-[#F07167] mb-3">{error}</p>
                  {/* Special message for non-fluent English translation */}
                  {error.includes('fluent English sentence') && (
                    <div className="mt-3 p-3 bg-[#FDFCDC] border border-[#FED9B7] rounded-lg">
                      <p className="text-[#F07167] text-sm">
                        <strong>Sorry!</strong> The AI could not generate a natural English translation. Please try again.<br />
                        This sometimes happens for complex or unusual topics.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={generateStory}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#F07167] text-white rounded-lg hover:bg-[#F07167] hover:bg-opacity-80 disabled:opacity-50 transition-colors duration-200"
                    >
                      {isLoading ? 'Retrying...' : 'Try Again'}
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="px-4 py-2 bg-[#00AFB9] text-white rounded-lg hover:bg-[#00AFB9] hover:bg-opacity-80 transition-colors duration-200"
                    >
                      Dismiss
                    </button>
                  </div>
                  {error.includes('complex topics') && (
                    <div className="mt-3 p-3 bg-[#FDFCDC] border border-[#FED9B7] rounded-lg">
                      <p className="text-[#F07167] text-sm">
                        <strong>Tip:</strong> Try simpler topics like “cat”, “food”, “family”, or “weather” for better results.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Story Display and View Toggle */}
          {story && (
            <div className="bg-[#FED9B7] rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#0081A7]">Your Story</h2>
                {/* Show Pinyin Toggle moved to right side */}
                <div className="flex items-center gap-2">
                  <span className="text-[#0081A7] font-medium mr-2">Show Pinyin</span>
                  <ToggleSwitch checked={showPinyin} onChange={() => setShowPinyin(v => !v)} id="show-pinyin-toggle" />
                </div>
              </div>
              {/* View Mode Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#0081A7] mb-4">View Mode</label>
                <div className="flex flex-wrap gap-3">
                  {(['chinese', 'english', 'all'] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                        viewMode === mode
                          ? 'bg-gradient-to-r from-[#00AFB9] to-[#F07167] text-white shadow-lg'
                          : 'bg-[#FDFCDC] text-[#0081A7] hover:bg-[#00AFB9] hover:text-white'
                      }`}
                    >
                      {mode === 'chinese' && '中文'}
                      {mode === 'english' && 'English'}
                      {mode === 'all' && 'Both'}
                    </button>
                  ))}
                </div>
              </div>
              {renderStoryContent()}
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={saveVocabulary}
                  className="flex-1 px-6 py-3 bg-[#0081A7] text-white font-semibold rounded-xl hover:bg-[#00AFB9] hover:bg-opacity-80 transition-all duration-200 shadow-lg"
                >
                  Save Vocabulary
                </button>
                <button
                  onClick={() => {
                    if (!story || !Array.isArray(story.story)) return;
                    const chinese = story.story.map(w => w.chinese).join(' ');
                    const pinyin = story.story.map(w => w.pinyin).join(' ');
                    const english = story.story.map(w => w.english).join(' ');
                    const text = `Chinese: ${chinese}\nPinyin: ${pinyin}\nEnglish: ${english}`;
                    navigator.clipboard.writeText(text);
                  }}
                  className="flex-1 px-6 py-3 bg-[#F07167] text-white font-semibold rounded-xl hover:bg-[#FED9B7] hover:text-[#F07167] transition-all duration-200 shadow-lg"
                >
                  Copy Story
                </button>
              </div>
            </div>
          )}
          {/* Hover Tooltip */}
          {hoveredWord && (
            <div
              ref={tooltipRef}
              className="fixed bg-[#0081A7] text-white px-4 py-3 rounded-lg shadow-lg z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
            >
              <div className="text-sm">
                <div className="font-bold text-lg mb-1">{hoveredWord.pinyin}</div>
                <div className="text-[#FDFCDC] mb-1">{hoveredWord.chinese}</div>
                <div className={`${hoveredWord.english === "Translation not available" ? "text-[#F07167] italic" : "text-[#FED9B7]"}`}>
                  {hoveredWord.english}
                </div>
                {hoveredWord.english === "Translation not available" && (
                  <div className="text-[#FED9B7] text-xs mt-1">
                    ⚠️ Not in dictionary
                  </div>
                )}
              </div>
              {/* Arrow pointing down to the word */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#0081A7]"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
