const fs = require('fs');
const path = require('path');

// Import the dictionary
const completeHSKDictionary = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/complete-hsk-dictionary.json'), 'utf8'));

// Mock AI response for testing
const mockAIResponse = {
  vocabulary: [
    { chinese: "商业", pinyin: "shāngyè", english: "business" },
    { chinese: "公司", pinyin: "gōngsī", english: "company" },
    { chinese: "经济", pinyin: "jīngjì", english: "economy" },
    { chinese: "贸易", pinyin: "màoyì", english: "trade" },
    { chinese: "金融", pinyin: "jīnróng", english: "finance" },
    { chinese: "投资", pinyin: "tóuzī", english: "investment" },
    { chinese: "市场", pinyin: "shìchǎng", english: "market" },
    { chinese: "企业", pinyin: "qǐyè", english: "enterprise" },
    { chinese: "管理", pinyin: "guǎnlǐ", english: "management" },
    { chinese: "销售", pinyin: "xiāoshòu", english: "sales" }
  ],
  grammar: {
    name: "Business Vocabulary and Sentence Patterns",
    description: "Using business terms in subject-verb-object patterns",
    explanation: "This grammar pattern helps you discuss business topics by combining business vocabulary with basic sentence structures.",
    examples: [
      { chinese: "公司投资新技术", pinyin: "Gōngsī tóuzī xīn jìshù", english: "The company invests in new technology" },
      { chinese: "企业管理市场", pinyin: "Qǐyè guǎnlǐ shìchǎng", english: "The enterprise manages the market" },
      { chinese: "经济影响贸易", pinyin: "Jīngjì yǐngxiǎng màoyì", english: "The economy affects trade" },
      { chinese: "金融支持商业", pinyin: "Jīnróng zhīchí shāngyè", english: "Finance supports business" },
      { chinese: "销售促进增长", pinyin: "Xiāoshòu cùjìn zēngzhǎng", english: "Sales promote growth" }
    ]
  },
  grammarQuiz: [
    { chinese: "商业发展经济", pinyin: "Shāngyè fāzhǎn jīngjì", english: "Business develops the economy" },
    { chinese: "投资创造价值", pinyin: "Tóuzī chuàngzào jiàzhí", english: "Investment creates value" },
    { chinese: "管理提高效率", pinyin: "Guǎnlǐ tígāo xiàolǜ", english: "Management improves efficiency" },
    { chinese: "贸易促进合作", pinyin: "Màoyì cùjìn hézuò", english: "Trade promotes cooperation" },
    { chinese: "市场决定价格", pinyin: "Shìchǎng juédìng jiàgé", english: "The market determines prices" }
  ],
  writingQuiz: [
    { english: "The company invests in new technology", chinese: "公司投资新技术", pinyin: "Gōngsī tóuzī xīn jìshù" },
    { english: "Business develops the economy", chinese: "商业发展经济", pinyin: "Shāngyè fāzhǎn jīngjì" },
    { english: "Management improves efficiency", chinese: "管理提高效率", pinyin: "Guǎnlǐ tígāo xiàolǜ" },
    { english: "Trade promotes cooperation", chinese: "贸易促进合作", pinyin: "Màoyì cùjìn hézuò" },
    { english: "Investment creates value", chinese: "投资创造价值", pinyin: "Tóuzī chuàngzào jiàzhí" }
  ],
  story: {
    aligned: [
      { chinese: "在", pinyin: "zài", english: "in" },
      { chinese: "现代", pinyin: "xiàndài", english: "modern" },
      { chinese: "商业", pinyin: "shāngyè", english: "business" },
      { chinese: "环境", pinyin: "huánjìng", english: "environment" },
      { chinese: "中", pinyin: "zhōng", english: "in" },
      { chinese: "，", pinyin: "", english: "," },
      { chinese: "公司", pinyin: "gōngsī", english: "company" },
      { chinese: "需要", pinyin: "xūyào", english: "need" },
      { chinese: "投资", pinyin: "tóuzī", english: "invest" },
      { chinese: "新", pinyin: "xīn", english: "new" },
      { chinese: "技术", pinyin: "jìshù", english: "technology" },
      { chinese: "。", pinyin: "", english: "." },
      { chinese: "良好", pinyin: "liánghǎo", english: "good" },
      { chinese: "的", pinyin: "de", english: "of" },
      { chinese: "管理", pinyin: "guǎnlǐ", english: "management" },
      { chinese: "可以", pinyin: "kěyǐ", english: "can" },
      { chinese: "提高", pinyin: "tígāo", english: "improve" },
      { chinese: "效率", pinyin: "xiàolǜ", english: "efficiency" },
      { chinese: "。", pinyin: "", english: "." },
      { chinese: "贸易", pinyin: "màoyì", english: "trade" },
      { chinese: "促进", pinyin: "cùjìn", english: "promote" },
      { chinese: "经济", pinyin: "jīngjì", english: "economy" },
      { chinese: "发展", pinyin: "fāzhǎn", english: "development" },
      { chinese: "。", pinyin: "", english: "." }
    ],
    sentence: "In the modern business environment, companies need to invest in new technology. Good management can improve efficiency. Trade promotes economic development.",
    isAIGenerated: true
  }
};

// Test the validation logic from the API
function testValidationLogic() {
  console.log('=== TESTING API VALIDATION LOGIC ===\n');
  
  try {
    const lessonData = mockAIResponse;
    
    // Test basic structure validation
    console.log('Testing basic structure validation...');
    if (!lessonData.vocabulary || !lessonData.grammar || !lessonData.grammarQuiz || !lessonData.story) {
      console.log('❌ FAILED: Missing required sections');
      return false;
    }
    console.log('✅ PASSED: Basic structure validation');
    
    // Test array validation
    console.log('Testing array validation...');
    if (!Array.isArray(lessonData.vocabulary) || 
        !lessonData.grammar.examples || 
        !Array.isArray(lessonData.grammar.examples) ||
        !Array.isArray(lessonData.grammarQuiz) ||
        !Array.isArray(lessonData.writingQuiz) ||
        !lessonData.story.aligned || 
        !Array.isArray(lessonData.story.aligned) ||
        !lessonData.story.sentence) {
      console.log('❌ FAILED: Missing required arrays or fields');
      return false;
    }
    console.log('✅ PASSED: Array validation');
    
    // Test story length validation
    console.log('Testing story length validation...');
    const storyText = lessonData.story.sentence;
    const sentenceCount = (storyText.match(/[.!?]+/g) || []).length;
    const skillLevel = 'HSK4';
    const minSentences = skillLevel === 'HSK5' || skillLevel === 'HSK6' ? 5 : 3;
    const maxSentences = skillLevel === 'HSK5' || skillLevel === 'HSK6' ? 10 : 5;
    
    console.log(`Story has ${sentenceCount} sentences, requires ${minSentences}-${maxSentences} for ${skillLevel}`);
    
    if (sentenceCount < minSentences || sentenceCount > maxSentences) {
      console.log('❌ FAILED: Story length validation');
      return false;
    }
    console.log('✅ PASSED: Story length validation');
    
    // Test grammar examples count
    console.log('Testing grammar examples count...');
    const grammarExamplesCount = lessonData.grammar.examples.length;
    console.log(`Grammar has ${grammarExamplesCount} examples, requires exactly 5`);
    
    if (grammarExamplesCount !== 5) {
      console.log('❌ FAILED: Grammar examples count validation');
      return false;
    }
    console.log('✅ PASSED: Grammar examples count validation');
    
    // Test writing quiz count
    console.log('Testing writing quiz count...');
    const writingQuizCount = lessonData.writingQuiz.length;
    console.log(`Writing quiz has ${writingQuizCount} questions, requires exactly 5`);
    
    if (writingQuizCount !== 5) {
      console.log('❌ FAILED: Writing quiz count validation');
      return false;
    }
    console.log('✅ PASSED: Writing quiz count validation');
    
    console.log('\n🎉 ALL VALIDATIONS PASSED! The mock response would be accepted by the API.');
    return true;
    
  } catch (error) {
    console.error('❌ ERROR during validation:', error.message);
    return false;
  }
}

// Test what the client would receive
function testClientResponse() {
  console.log('\n=== TESTING CLIENT RESPONSE ===\n');
  
  try {
    const lessonData = mockAIResponse;
    
    // Simulate what the client would receive
    const clientResponse = {
      vocabulary: lessonData.vocabulary,
      grammar: lessonData.grammar,
      grammarQuiz: lessonData.grammarQuiz,
      writingQuiz: lessonData.writingQuiz,
      story: lessonData.story,
      isAIGenerated: true
    };
    
    console.log('Client would receive:');
    console.log(`- Vocabulary: ${clientResponse.vocabulary.length} words`);
    console.log(`- Grammar examples: ${clientResponse.grammar.examples.length} examples`);
    console.log(`- Grammar quiz: ${clientResponse.grammarQuiz.length} questions`);
    console.log(`- Writing quiz: ${clientResponse.writingQuiz.length} questions`);
    console.log(`- Story: ${clientResponse.story.aligned.length} aligned words`);
    console.log(`- Is AI generated: ${clientResponse.isAIGenerated}`);
    
    // Test vocabulary quality
    console.log('\nVocabulary quality check:');
    const businessWords = ['商业', '公司', '经济', '贸易', '金融', '投资', '市场', '企业', '管理', '销售'];
    const foundBusinessWords = clientResponse.vocabulary.filter(word => businessWords.includes(word.chinese));
    console.log(`Found ${foundBusinessWords.length}/10 business-related words: ${foundBusinessWords.map(w => w.chinese).join(', ')}`);
    
    if (foundBusinessWords.length >= 8) {
      console.log('✅ PASSED: High topic relevance');
    } else if (foundBusinessWords.length >= 5) {
      console.log('⚠️  WARNING: Moderate topic relevance');
    } else {
      console.log('❌ FAILED: Low topic relevance');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ ERROR testing client response:', error.message);
    return false;
  }
}

// Run tests
testValidationLogic();
testClientResponse(); 