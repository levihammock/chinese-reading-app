const fs = require('fs');
const path = require('path');

// Import the dictionary
const completeHSKDictionary = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/complete-hsk-dictionary.json'), 'utf8'));

// Helper function to get target HSK level vocabulary only (for Lesson 1 vocabulary list)
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

// Helper function to get topic-relevant vocabulary
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

// Test vocabulary selection for different HSK levels
function testVocabularySelection() {
  console.log('=== TESTING VOCABULARY SELECTION ===\n');
  
  const testCases = [
    { level: 'HSK1', topic: 'Food' },
    { level: 'HSK2', topic: 'Travel' },
    { level: 'HSK3', topic: 'Technology' },
    { level: 'HSK4', topic: 'Business' },
    { level: 'HSK5', topic: 'Environment' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n--- Testing ${testCase.level} for topic: "${testCase.topic}" ---`);
    
    const targetWords = getTargetLevelWords(testCase.level, testCase.topic);
    const topicRelevantWords = getTopicRelevantVocabulary(testCase.level, testCase.topic);
    
    // Show first 20 words
    console.log(`First 20 target-level words: ${targetWords.slice(0, 20).join(', ')}`);
    
    // Show topic-relevant words
    console.log(`Topic-relevant words: ${topicRelevantWords.slice(0, 10).join(', ')}`);
    
    // Show prioritized vocabulary (topic-relevant first, then others)
    const prioritizedWords = [...topicRelevantWords, ...targetWords.filter(word => !topicRelevantWords.includes(word))];
    console.log(`Prioritized vocabulary (first 20): ${prioritizedWords.slice(0, 20).join(', ')}`);
    
    // Show random sample of 10 words
    const shuffled = [...prioritizedWords].sort(() => Math.random() - 0.5);
    console.log(`Random sample of 10 words: ${shuffled.slice(0, 10).join(', ')}`);
    
    // Check if any words might be related to the topic
    const topicKeywords = {
      'Food': ['食物', '菜', '饭', '吃', '餐厅', '厨房', '味道', '营养', '健康'],
      'Travel': ['旅行', '旅游', '飞机', '火车', '酒店', '景点', '导游', '护照', '签证'],
      'Technology': ['科技', '电脑', '手机', '软件', '网络', '数据', '信息', '互联网', '人工智能'],
      'Business': ['商业', '公司', '经济', '贸易', '金融', '投资', '市场', '企业', '管理'],
      'Environment': ['环境', '自然', '保护', '污染', '气候', '生态', '绿色', '可持续发展']
    };
    
    const relevantWords = topicKeywords[testCase.topic] || [];
    const foundRelevant = targetWords.filter(word => relevantWords.includes(word));
    console.log(`Topic-relevant words found: ${foundRelevant.length > 0 ? foundRelevant.join(', ') : 'None'}`);
  }
}

// Test the actual dictionary content
function testDictionaryContent() {
  console.log('\n=== TESTING DICTIONARY CONTENT ===\n');
  
  // Check HSK4 content
  const hsk4Words = completeHSKDictionary.filter(entry => entry.hskLevel === 4);
  console.log(`Total HSK4 words: ${hsk4Words.length}`);
  
  // Show some HSK4 words with their details
  console.log('\nSample HSK4 words:');
  hsk4Words.slice(0, 10).forEach(entry => {
    console.log(`${entry.chinese} (${entry.pinyin}) - ${entry.english} [${entry.hskSource}]`);
  });
  
  // Check CompleteHSK source
  const completeHSKWords = completeHSKDictionary.filter(entry => entry.hskSource === 'CompleteHSK');
  console.log(`\nTotal CompleteHSK words: ${completeHSKWords.length}`);
  
  const completeHSKHSK4 = completeHSKWords.filter(entry => entry.hskLevel === 4);
  console.log(`CompleteHSK HSK4 words: ${completeHSKHSK4.length}`);
}

// Run tests
testVocabularySelection();
testDictionaryContent(); 