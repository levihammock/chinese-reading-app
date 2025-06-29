'use client';

import { useState } from 'react';
import { SkillLevel, ViewMode, StoryData, VocabularyWord } from '@/types';

export default function Home() {
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('easy');
  const [subject, setSubject] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [story, setStory] = useState<StoryData & { isAIGenerated?: boolean; note?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedVocabulary, setSavedVocabulary] = useState<VocabularyWord[]>([]);
  const [hoveredWord, setHoveredWord] = useState<{char: string, pinyin: string, english: string} | null>(null);

  // Function to create character-to-translation mapping
  const createCharacterMapping = (chinese: string, pinyin: string, english: string) => {
    const chineseChars = chinese.split('');
    const pinyinWords = pinyin.split(' ');
    const englishWords = english.split(' ');
    
    const mapping: {[key: string]: {pinyin: string, english: string}} = {};
    
    // Simple mapping - each Chinese character gets the corresponding pinyin and english
    chineseChars.forEach((char, index) => {
      if (char.trim() && pinyinWords[index] && englishWords[index]) {
        mapping[char] = {
          pinyin: pinyinWords[index],
          english: englishWords[index]
        };
      }
    });
    
    return mapping;
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
        setError(data.error || 'Failed to generate story. Please try again.');
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

    // Create character mapping for hover functionality
    const charMapping = createCharacterMapping(story.chinese, story.pinyin, story.english);

    switch (viewMode) {
      case 'chinese':
        return (
          <div className="text-2xl leading-relaxed text-center p-6 bg-white rounded-2xl shadow-lg">
            {story.chinese.split('').map((char, index) => (
              <span
                key={index}
                className="inline-block cursor-pointer hover:bg-blue-100 rounded px-1 transition-colors duration-200"
                onMouseEnter={() => {
                  const translation = charMapping[char];
                  if (translation) {
                    setHoveredWord({
                      char: char,
                      pinyin: translation.pinyin,
                      english: translation.english
                    });
                  }
                }}
                onMouseLeave={() => setHoveredWord(null)}
              >
                {char}
              </span>
            ))}
          </div>
        );
      case 'pinyin':
        return (
          <div className="text-xl leading-relaxed text-center p-6 bg-white rounded-2xl shadow-lg">
            {story.pinyin}
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
              <h3 className="text-lg font-semibold mb-4 text-blue-600">中文</h3>
              <div className="text-center">
                {story.chinese.split('').map((char, index) => (
                  <span
                    key={index}
                    className="inline-block cursor-pointer hover:bg-blue-100 rounded px-1 transition-colors duration-200"
                    onMouseEnter={() => {
                      const translation = charMapping[char];
                      if (translation) {
                        setHoveredWord({
                          char: char,
                          pinyin: translation.pinyin,
                          english: translation.english
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredWord(null)}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-lg leading-relaxed p-6 bg-white rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-orange-500">拼音</h3>
              <div className="text-center">{story.pinyin}</div>
            </div>
            <div className="text-lg leading-relaxed p-6 bg-white rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-green-600">English</h3>
              <div className="text-center">{story.english}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎯 Chinese Reading Practice
          </h1>
          <p className="text-lg text-gray-600">
            Learn Chinese through AI-generated stories tailored to your level
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., animals, food, travel..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <button
            onClick={generateStory}
            disabled={isLoading || !subject.trim()}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? '✨ Generating...' : '✨ Generate Story'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        {story && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              View Mode
            </label>
            <div className="flex flex-wrap gap-3">
              {(['chinese', 'pinyin', 'english', 'all'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                    viewMode === mode
                      ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'chinese' && '中文'}
                  {mode === 'pinyin' && '拼音'}
                  {mode === 'english' && 'English'}
                  {mode === 'all' && 'All Three'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Story Display */}
        {story && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                📖 Your Story
              </h2>
              <div className="flex items-center gap-2">
                {story.isAIGenerated ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    🤖 AI Generated
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    📚 Sample Story
                  </span>
                )}
              </div>
            </div>
            
            {/* Fallback Notice */}
            {!story.isAIGenerated && story.note && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <div className="text-yellow-600 mr-3 mt-0.5">⚠️</div>
                  <div>
                    <h3 className="text-yellow-800 font-semibold mb-1">Sample Story</h3>
                    <p className="text-yellow-700 text-sm">{story.note}</p>
                  </div>
                </div>
              </div>
            )}
            
            {renderStoryContent()}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={saveVocabulary}
                className="flex-1 px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all duration-200 shadow-lg"
              >
                💾 Save Vocabulary
              </button>
              <button
                onClick={() => {
                  const text = `Chinese: ${story.chinese}\nPinyin: ${story.pinyin}\nEnglish: ${story.english}`;
                  navigator.clipboard.writeText(text);
                }}
                className="flex-1 px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-all duration-200 shadow-lg"
              >
                📤 Copy Story
              </button>
            </div>
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredWord && (
          <div className="fixed bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 pointer-events-none">
            <div className="text-sm">
              <div className="font-bold text-lg mb-1">{hoveredWord.char}</div>
              <div className="text-blue-300 mb-1">{hoveredWord.pinyin}</div>
              <div className="text-gray-300">{hoveredWord.english}</div>
            </div>
          </div>
        )}

        {/* Saved Vocabulary */}
        {savedVocabulary.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              💾 Saved Vocabulary ({savedVocabulary.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedVocabulary.map((vocab, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="font-bold text-lg">{vocab.chinese}</div>
                  <div className="text-gray-600">{vocab.pinyin}</div>
                  <div className="text-gray-500 text-sm">{vocab.english}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
