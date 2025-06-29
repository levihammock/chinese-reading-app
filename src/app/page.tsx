'use client';

import { useState, useRef, useEffect } from 'react';
import { SkillLevel, ViewMode, StoryData, VocabularyWord } from '@/types';
import { cedictDictionary } from '@/data/cedict-dictionary';

// Build lookup maps for fast access
const pinyinMap = new Map();
const charMap = new Map();
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

export default function Home() {
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('easy');
  const [subject, setSubject] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [story, setStory] = useState<StoryData & { isAIGenerated?: boolean; note?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedVocabulary, setSavedVocabulary] = useState<VocabularyWord[]>([]);
  const [hoveredWord, setHoveredWord] = useState<{pinyin: string, chinese: string, english: string} | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Optimized function to get accurate translation for a Pinyin word using the Map
  const getAccurateTranslation = (pinyin: string, context?: { before?: string, after?: string }) => {
    const normalizedPinyin = pinyin.toLowerCase().replace(/[0-9]/g, '').replace(/\s+/g, '');
    return pinyinMap.get(normalizedPinyin) || null;
  };

  // Optimized function to get any available translation with fallback
  const getAnyAvailableTranslation = (pinyin: string, chineseChars?: string) => {
    const translation = getAccurateTranslation(pinyin);
    if (translation) return translation;
    if (chineseChars && charMap.has(chineseChars)) {
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

  // Render Pinyin text with hover functionality using accurate translations
  const renderPinyinText = (chinese: string, pinyin: string, english: string) => {
    // Split pinyin into words
    const pinyinWords = pinyin.split(' ');
    // Split Chinese into characters
    const chineseChars = chinese.split('');
    
    return pinyinWords.map((word, index) => {
      // Get context for better translation accuracy
      const context = {
        before: pinyinWords[index - 1],
        after: pinyinWords[index + 1]
      };
      
      // Try to get the corresponding Chinese characters for this pinyin word
      // This is a simplified approach - in a real app you'd need more sophisticated mapping
      const chineseForWord = chineseChars[index] || '';
      
      const translation = getAnyAvailableTranslation(word, chineseForWord);
      
      if (!translation) {
        // Word not in dictionary - show with different styling
        return (
          <span
            key={index}
            className="inline-block cursor-pointer hover:bg-gray-100 rounded px-1 transition-colors duration-200 text-gray-500"
            onMouseMove={(e) => {
              handleMouseMove(e, word, chineseForWord, "Translation not available", true);
            }}
            onMouseLeave={handleMouseLeave}
            title="Translation not available in dictionary"
          >
            {word}{' '}
          </span>
        );
      }
      
      return (
        <span
          key={index}
          className="inline-block cursor-pointer hover:bg-[#F694C1] hover:bg-opacity-20 rounded px-1 transition-colors duration-200"
          onMouseMove={(e) => {
            handleMouseMove(e, word, translation.chinese, translation.english);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {word}{' '}
        </span>
      );
    });
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
    if (!story) return;

    // Extract vocabulary from the story (simplified version)
    const newVocabulary: VocabularyWord = {
      chinese: story.chinese,
      pinyin: story.pinyin,
      english: story.english,
      timestamp: Date.now(),
    };

    setSavedVocabulary(prev => [...prev, newVocabulary]);
  };

  const renderStoryContent = () => {
    if (!story) return null;

    switch (viewMode) {
      case 'chinese':
        return (
          <div className="text-2xl leading-relaxed text-center p-6 bg-white rounded-2xl shadow-lg">
            {renderChineseText(story.chinese)}
          </div>
        );
      case 'pinyin':
        return (
          <div className="text-xl leading-relaxed text-center p-6 bg-white rounded-2xl shadow-lg">
            {renderPinyinText(story.chinese, story.pinyin, story.english)}
          </div>
        );
      case 'english':
        return (
          <div className="text-lg leading-relaxed text-center p-6 bg-white rounded-2xl shadow-lg">
            {story.english}
          </div>
        );
      case 'all':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-xl leading-relaxed p-6 bg-white rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-black">中文</h3>
              <div className="text-center">
                {renderChineseText(story.chinese)}
              </div>
            </div>
            <div className="text-lg leading-relaxed p-6 bg-white rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-black">Pinyin</h3>
              <div className="text-center">{renderPinyinText(story.chinese, story.pinyin, story.english)}</div>
            </div>
            <div className="text-lg leading-relaxed p-6 bg-white rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-black">English</h3>
              <div className="text-center">{story.english}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D3F8E2] via-[#A9DEF9] to-[#E4C1F9] p-4 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Chinese Reading Practice
          </h1>
          <p className="text-lg text-black">
            Learn Chinese through AI-generated stories tailored to your level
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-black mb-2">
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F694C1] focus:border-transparent transition-all duration-200"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-black mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., animals, food, travel..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F694C1] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <button
            onClick={generateStory}
            disabled={isLoading || !subject.trim()}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-[#F694C1] to-[#E4C1F9] text-white font-semibold rounded-xl hover:from-[#F694C1] hover:to-[#E4C1F9] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? 'Generating...' : 'Generate Story'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8">
            <div className="flex items-start">
              <div className="text-red-600 mr-3 mt-1">⚠️</div>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                <p className="text-red-700 mb-3">{error}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={generateStory}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                  >
                    {isLoading ? 'Retrying...' : 'Try Again'}
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                  >
                    Dismiss
                  </button>
                </div>
                {error.includes('complex topics') && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Tip:</strong> Try simpler topics like "cat", "food", "family", or "weather" for better results.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Story Display with Embedded View Toggle */}
        {story && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">
                Your Story
              </h2>
              <div className="flex items-center gap-2">
                {story.isAIGenerated ? (
                  <span className="px-3 py-1 bg-[#D3F8E2] text-black rounded-full text-sm font-medium">
                    AI Generated
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#EDE7B1] text-black rounded-full text-sm font-medium">
                    Sample Story
                  </span>
                )}
              </div>
            </div>
            
            {/* Fallback Notice */}
            {!story.isAIGenerated && story.note && (
              <div className="bg-[#EDE7B1] border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <div className="text-yellow-600 mr-3 mt-0.5">⚠️</div>
                  <div>
                    <h3 className="text-black font-semibold mb-1">Sample Story</h3>
                    <p className="text-black text-sm">{story.note}</p>
                  </div>
                </div>
              </div>
            )}

            {/* View Mode Toggle - Embedded */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-4">
                View Mode
              </label>
              <div className="flex flex-wrap gap-3">
                {(['chinese', 'pinyin', 'english', 'all'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                      viewMode === mode
                        ? 'bg-gradient-to-r from-[#F694C1] to-[#E4C1F9] text-white shadow-lg'
                        : 'bg-[#A9DEF9] text-black hover:bg-[#A9DEF9] hover:bg-opacity-80'
                    }`}
                  >
                    {mode === 'chinese' && '中文'}
                    {mode === 'pinyin' && 'Pinyin'}
                    {mode === 'english' && 'English'}
                    {mode === 'all' && 'All Three'}
                  </button>
                ))}
              </div>
            </div>
            
            {renderStoryContent()}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={saveVocabulary}
                className="flex-1 px-6 py-3 bg-[#D3F8E2] text-black font-semibold rounded-xl hover:bg-[#D3F8E2] hover:bg-opacity-80 transition-all duration-200 shadow-lg"
              >
                Save Vocabulary
              </button>
              <button
                onClick={() => {
                  const text = `Chinese: ${story.chinese}\nPinyin: ${story.pinyin}\nEnglish: ${story.english}`;
                  navigator.clipboard.writeText(text);
                }}
                className="flex-1 px-6 py-3 bg-[#E4C1F9] text-black font-semibold rounded-xl hover:bg-[#E4C1F9] hover:bg-opacity-80 transition-all duration-200 shadow-lg"
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
            className="fixed bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
          >
            <div className="text-sm">
              <div className="font-bold text-lg mb-1">{hoveredWord.pinyin}</div>
              <div className="text-blue-300 mb-1">{hoveredWord.chinese}</div>
              <div className={`${hoveredWord.english === "Translation not available" ? "text-red-300 italic" : "text-gray-300"}`}>
                {hoveredWord.english}
              </div>
              {hoveredWord.english === "Translation not available" && (
                <div className="text-yellow-300 text-xs mt-1">
                  ⚠️ Not in dictionary
                </div>
              )}
            </div>
            {/* Arrow pointing down to the word */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        )}

        {/* Saved Vocabulary */}
        {savedVocabulary.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-black mb-4">
              Saved Vocabulary ({savedVocabulary.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedVocabulary.map((vocab, index) => (
                <div
                  key={index}
                  className="p-4 bg-[#EDE7B1] rounded-xl border border-gray-200"
                >
                  <div className="font-bold text-lg text-black">{vocab.chinese}</div>
                  <div className="text-black">{vocab.pinyin}</div>
                  <div className="text-black text-sm">{vocab.english}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
