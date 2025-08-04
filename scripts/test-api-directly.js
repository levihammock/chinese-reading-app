const fs = require('fs');
const path = require('path');

// Import the dictionary
const completeHSKDictionary = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/complete-hsk-dictionary.json'), 'utf8'));

// Copy the helper functions from the API route
const getTargetLevelWords = (skillLevel, subject) => {
  const hskLevelMap = {
    'HSK1': 1, 'HSK2': 2, 'HSK3': 3, 'HSK4': 4, 'HSK5': 5, 'HSK6': 6, 'HSK7': 7
  };
  
  const targetHskLevel = hskLevelMap[skillLevel];
  
  if (!targetHskLevel) {
    return completeHSKDictionary.slice(0, 200).map(entry => entry.chinese);
  }
  
  // Get words from the target HSK level ONLY
  let targetLevelWords = completeHSKDictionary
    .filter(entry => entry.hskLevel === targetHskLevel)
    .map(entry => entry.chinese);
  
  // Prioritize high-priority practical words
  const highPriorityWords = completeHSKDictionary
    .filter(entry => entry.hskLevel === targetHskLevel && (entry.priority === 'high' || entry.priority === 'very_high'))
    .map(entry => entry.chinese);
  
  // Put high-priority words first
  targetLevelWords = [...highPriorityWords, ...targetLevelWords.filter(word => !highPriorityWords.includes(word))];
  
  console.log(`Found ${targetLevelWords.length} words for HSK${targetHskLevel} level (${highPriorityWords.length} high-priority)`);
  
  return targetLevelWords;
};

const getTopicRelevantVocabulary = (skillLevel, subject) => {
  const hskLevelMap = {
    'HSK1': 1, 'HSK2': 2, 'HSK3': 3, 'HSK4': 4, 'HSK5': 5, 'HSK6': 6, 'HSK7': 7
  };
  
  const targetHskLevel = hskLevelMap[skillLevel];
  
  if (!targetHskLevel) {
    return [];
  }
  
  // Define topic keywords for different subjects
  const topicKeywords = {
    'Food': ['食物', '菜', '饭', '吃', '餐厅', '厨房', '味道', '营养', '健康', '水果', '蔬菜', '肉类', '海鲜', '饮料', '咖啡', '茶', '酒', '甜点', '零食'],
    'Travel': ['旅行', '旅游', '飞机', '火车', '酒店', '景点', '导游', '护照', '签证', '机场', '车站', '地图', '行李', '相机', '纪念品', '风景', '文化'],
    'Technology': ['科技', '电脑', '手机', '软件', '网络', '数据', '信息', '互联网', '人工智能', '程序', '系统', '设备', '技术', '创新', '数字', '智能'],
    'Business': ['商业', '公司', '经济', '贸易', '金融', '投资', '市场', '企业', '管理', '销售', '营销', '客户', '产品', '服务', '利润', '竞争', '合作'],
    'Environment': ['环境', '自然', '保护', '污染', '气候', '生态', '绿色', '可持续发展', '能源', '资源', '森林', '海洋', '动物', '植物', '地球'],
    'Education': ['教育', '学习', '学校', '大学', '老师', '学生', '课程', '知识', '技能', '考试', '成绩', '研究', '学术', '文化', '语言', '科学'],
    'Health': ['健康', '医疗', '医生', '医院', '治疗', '药物', '疾病', '预防', '营养', '运动', '休息', '心理', '身体', '检查', '康复'],
    'Sports': ['运动', '体育', '比赛', '训练', '团队', '胜利', '失败', '技能', '身体', '健康', '竞争', '合作', '教练', '运动员', '场地'],
    'Music': ['音乐', '歌曲', '乐器', '演奏', '歌手', '乐队', '旋律', '节奏', '艺术', '文化', '表演', '创作', '欣赏', '古典', '流行'],
    'Art': ['艺术', '绘画', '作品', '创作', '文化', '历史', '博物馆', '展览', '风格', '色彩', '设计', '美学', '传统', '现代', '表达']
  };
  
  const relevantKeywords = topicKeywords[subject] || [];
  
  // Find words that match the topic keywords
  const relevantWords = completeHSKDictionary
    .filter(entry => 
      entry.hskLevel === targetHskLevel && 
      (relevantKeywords.includes(entry.chinese) || 
       entry.english.toLowerCase().includes(subject.toLowerCase()) ||
       relevantKeywords.some(keyword => entry.english.toLowerCase().includes(keyword.toLowerCase())))
    )
    .map(entry => entry.chinese);
  
  console.log(`Found ${relevantWords.length} topic-relevant words for "${subject}" in HSK${targetHskLevel}`);
  
  return relevantWords;
};

const getAllowedWords = (skillLevel) => {
  // Map skill levels to HSK numbers
  const hskLevelMap = {
    'HSK1': 1,
    'HSK2': 2,
    'HSK3': 3,
    'HSK4': 4,
    'HSK5': 5,
    'HSK6': 6,
    'HSK7': 7
  };
  
  const targetHskLevel = hskLevelMap[skillLevel];
  
  if (!targetHskLevel) {
    // If no HSK level mapping, return all words (fallback)
    return completeHSKDictionary.slice(0, 500).map(entry => entry.chinese);
  }
  
  // Get words from the target HSK level (prioritize these)
  const targetLevelWords = completeHSKDictionary
    .filter(entry => entry.hskLevel === targetHskLevel)
    .map(entry => entry.chinese);
  
  // Prioritize high-priority practical words
  const highPriorityWords = completeHSKDictionary
    .filter(entry => entry.hskLevel === targetHskLevel && (entry.priority === 'high' || entry.priority === 'very_high'))
    .map(entry => entry.chinese);
  
  // Get words from lower levels (limit these to avoid too much basic vocabulary)
  const lowerLevelWords = completeHSKDictionary
    .filter(entry => entry.hskLevel && entry.hskLevel < targetHskLevel)
    .map(entry => entry.chinese);
  
  // For higher levels, limit lower-level words to avoid overwhelming with basic vocabulary
  const maxLowerLevelWords = targetHskLevel <= 2 ? 200 : 100; // More lower-level words for HSK1-2
  const limitedLowerLevelWords = lowerLevelWords.slice(0, maxLowerLevelWords);
  
  // Combine words, prioritizing high-priority words first, then target level, then lower levels
  const combinedWords = [...highPriorityWords, ...targetLevelWords.filter(word => !highPriorityWords.includes(word)), ...limitedLowerLevelWords];
  
  // If we don't have enough HSK words, add some common words without HSK level
  if (combinedWords.length < 100) {
    const commonWords = completeHSKDictionary
      .filter(entry => !entry.hskLevel)
      .map(entry => entry.chinese)
      .slice(0, 500 - combinedWords.length);
    
    return [...combinedWords, ...commonWords];
  }
  
  return combinedWords.slice(0, 500);
};

// Test the API logic
function testAPILogic() {
  console.log('=== TESTING API LOGIC DIRECTLY ===\n');
  
  const testCases = [
    { skillLevel: 'HSK4', subject: 'Business' },
    { skillLevel: 'HSK3', subject: 'Technology' },
    { skillLevel: 'HSK2', subject: 'Travel' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n--- Testing ${testCase.skillLevel} for "${testCase.subject}" ---`);
    
    try {
      // Test vocabulary selection
      const targetLevelWords = getTargetLevelWords(testCase.skillLevel, testCase.subject);
      const topicRelevantWords = getTopicRelevantVocabulary(testCase.skillLevel, testCase.subject);
      const allowedWords = getAllowedWords(testCase.skillLevel);
      
      console.log(`✅ Target level words: ${targetLevelWords.length}`);
      console.log(`✅ Topic relevant words: ${topicRelevantWords.length}`);
      console.log(`✅ Allowed words: ${allowedWords.length}`);
      
      // Test vocabulary prioritization
      const prioritizedTargetWords = [...topicRelevantWords, ...targetLevelWords.filter(word => !topicRelevantWords.includes(word))];
      const shuffledTargetWords = [...prioritizedTargetWords].sort(() => Math.random() - 0.5);
      
      console.log(`✅ Prioritized vocabulary sample: ${shuffledTargetWords.slice(0, 10).join(', ')}`);
      
      // Test prompt generation (simplified)
      const targetLevelSample = shuffledTargetWords.slice(0, 50).join(', ');
      const generalSample = allowedWords.slice(0, 80).join(', ');
      
      console.log(`✅ Target level sample length: ${targetLevelSample.length} characters`);
      console.log(`✅ General sample length: ${generalSample.length} characters`);
      
      // Check for potential issues
      if (targetLevelWords.length < 20) {
        console.log(`⚠️  WARNING: Very few target-level words (${targetLevelWords.length})`);
      }
      
      if (topicRelevantWords.length === 0) {
        console.log(`⚠️  WARNING: No topic-relevant words found`);
      }
      
      if (targetLevelSample.length > 2000) {
        console.log(`⚠️  WARNING: Target level sample might be too long for API`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${testCase.skillLevel}/${testCase.subject}:`, error.message);
    }
  }
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('\n=== TESTING ENVIRONMENT VARIABLES ===\n');
  
  try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const apiKeyMatch = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
      
      if (apiKeyMatch && apiKeyMatch[1]) {
        const apiKey = apiKeyMatch[1].trim();
        console.log(`✅ API key found: ${apiKey.substring(0, 20)}...`);
        console.log(`✅ API key length: ${apiKey.length} characters`);
        
        if (apiKey.startsWith('sk-ant-')) {
          console.log(`✅ API key format appears valid`);
        } else {
          console.log(`⚠️  WARNING: API key format may be invalid`);
        }
      } else {
        console.log(`❌ ERROR: No API key found in .env.local`);
      }
    } else {
      console.log(`❌ ERROR: .env.local file not found`);
    }
  } catch (error) {
    console.error(`❌ Error reading environment variables:`, error.message);
  }
}

// Test dictionary data
function testDictionaryData() {
  console.log('\n=== TESTING DICTIONARY DATA ===\n');
  
  try {
    console.log(`✅ Dictionary loaded: ${completeHSKDictionary.length} entries`);
    
    // Check HSK level distribution
    const hskDistribution = {};
    completeHSKDictionary.forEach(entry => {
      if (entry.hskLevel) {
        hskDistribution[entry.hskLevel] = (hskDistribution[entry.hskLevel] || 0) + 1;
      }
    });
    
    console.log('HSK level distribution:');
    Object.keys(hskDistribution).sort().forEach(level => {
      console.log(`  HSK${level}: ${hskDistribution[level]} words`);
    });
    
    // Check for entries with missing data
    const missingPinyin = completeHSKDictionary.filter(entry => !entry.pinyin || entry.pinyin === '').length;
    const missingEnglish = completeHSKDictionary.filter(entry => !entry.english || entry.english === '').length;
    
    console.log(`⚠️  Entries missing pinyin: ${missingPinyin}`);
    console.log(`⚠️  Entries missing english: ${missingEnglish}`);
    
  } catch (error) {
    console.error(`❌ Error testing dictionary data:`, error.message);
  }
}

// Run all tests
testEnvironmentVariables();
testDictionaryData();
testAPILogic(); 