const fs = require('fs');
const path = require('path');

// Paths
const enhancedDictPath = path.join(__dirname, '../src/data/enhanced-dictionary.json');
const outputPath = path.join(__dirname, '../src/data/enhanced-dictionary-with-pinyin.json');

console.log('Adding pinyin to HSK 3.0 entries...');

// Read enhanced dictionary
const dictionary = JSON.parse(fs.readFileSync(enhancedDictPath, 'utf8'));

// Find entries missing pinyin
const missingPinyin = dictionary.filter(entry => 
  entry.hskSource && !entry.pinyin
);

console.log(`Found ${missingPinyin.length} entries missing pinyin`);

// Basic pinyin mapping for common characters
// This is a simplified approach - in production you might want to use a pinyin API
const basicPinyinMap = {
  // Common HSK 1-2 characters
  '我': 'wǒ', '你': 'nǐ', '他': 'tā', '她': 'tā', '它': 'tā',
  '们': 'men', '的': 'de', '了': 'le', '在': 'zài', '是': 'shì',
  '有': 'yǒu', '和': 'hé', '不': 'bù', '也': 'yě', '都': 'dōu',
  '很': 'hěn', '好': 'hǎo', '大': 'dà', '小': 'xiǎo', '多': 'duō',
  '少': 'shǎo', '新': 'xīn', '老': 'lǎo', '高': 'gāo', '低': 'dī',
  '长': 'cháng', '短': 'duǎn', '快': 'kuài', '慢': 'màn', '热': 'rè',
  '冷': 'lěng', '红': 'hóng', '白': 'bái', '黑': 'hēi', '黄': 'huáng',
  '蓝': 'lán', '绿': 'lǜ', '紫': 'zǐ', '灰': 'huī', '粉': 'fěn',
  
  // Common verbs
  '去': 'qù', '来': 'lái', '到': 'dào', '回': 'huí', '进': 'jìn',
  '出': 'chū', '上': 'shàng', '下': 'xià', '左': 'zuǒ', '右': 'yòu',
  '前': 'qián', '后': 'hòu', '里': 'lǐ', '外': 'wài', '中': 'zhōng',
  '东': 'dōng', '西': 'xī', '南': 'nán', '北': 'běi', '看': 'kàn',
  '听': 'tīng', '说': 'shuō', '读': 'dú', '写': 'xiě', '学': 'xué',
  '教': 'jiāo', '买': 'mǎi', '卖': 'mài', '给': 'gěi', '拿': 'ná',
  '放': 'fàng', '开': 'kāi', '关': 'guān', '找': 'zhǎo', '见': 'jiàn',
  
  // Common nouns
  '人': 'rén', '家': 'jiā', '学校': 'xuéxiào', '医院': 'yīyuàn',
  '商店': 'shāngdiàn', '餐厅': 'cāntīng', '公园': 'gōngyuán',
  '图书馆': 'túshūguǎn', '博物馆': 'bówùguǎn', '电影院': 'diànyǐngyuàn',
  '火车站': 'huǒchēzhàn', '飞机场': 'fēijīchǎng', '银行': 'yínháng',
  '邮局': 'yóujú', '警察局': 'jǐngchájú', '消防局': 'xiāofángjú',
  
  // Numbers
  '一': 'yī', '二': 'èr', '三': 'sān', '四': 'sì', '五': 'wǔ',
  '六': 'liù', '七': 'qī', '八': 'bā', '九': 'jiǔ', '十': 'shí',
  '百': 'bǎi', '千': 'qiān', '万': 'wàn', '亿': 'yì',
  
  // Time
  '年': 'nián', '月': 'yuè', '日': 'rì', '天': 'tiān', '星期': 'xīngqī',
  '小时': 'xiǎoshí', '分钟': 'fēnzhōng', '秒': 'miǎo', '早上': 'zǎoshang',
  '中午': 'zhōngwǔ', '下午': 'xiàwǔ', '晚上': 'wǎnshang', '夜里': 'yèlǐ',
  
  // Family
  '爸爸': 'bàba', '妈妈': 'māma', '哥哥': 'gēge', '姐姐': 'jiějie',
  '弟弟': 'dìdi', '妹妹': 'mèimei', '儿子': 'érzi', '女儿': 'nǚér',
  '爷爷': 'yéye', '奶奶': 'nǎinai', '外公': 'wàigōng', '外婆': 'wàipó',
  
  // Food
  '饭': 'fàn', '菜': 'cài', '肉': 'ròu', '鱼': 'yú', '鸡': 'jī',
  '蛋': 'dàn', '牛奶': 'niúnǎi', '面包': 'miànbāo', '水果': 'shuǐguǒ',
  '苹果': 'píngguǒ', '香蕉': 'xiāngjiāo', '橙子': 'chéngzi', '葡萄': 'pútáo',
  
  // Common adjectives
  '漂亮': 'piàoliang', '聪明': 'cōngmíng', '勇敢': 'yǒnggǎn', '善良': 'shànliáng',
  '友好': 'yǒuhǎo', '热情': 'rèqíng', '认真': 'rènzhēn', '努力': 'nǔlì',
  '快乐': 'kuàilè', '高兴': 'gāoxìng', '开心': 'kāixīn', '难过': 'nánguò',
  '生气': 'shēngqì', '害怕': 'hàipà', '担心': 'dānxīn', '紧张': 'jǐnzhāng',
  
  // Common adverbs
  '非常': 'fēicháng', '特别': 'tèbié', '比较': 'bǐjiào', '稍微': 'shāowēi',
  '几乎': 'jīhū', '大概': 'dàgài', '可能': 'kěnéng', '一定': 'yīdìng',
  '当然': 'dāngrán', '确实': 'quèshí', '真的': 'zhēnde', '其实': 'qíshí',
  
  // Common conjunctions
  '因为': 'yīnwèi', '所以': 'suǒyǐ', '但是': 'dànshì', '如果': 'rúguǒ',
  '虽然': 'suīrán', '而且': 'érqiě', '或者': 'huòzhě', '还是': 'háishì',
  
  // Common measure words
  '个': 'gè', '只': 'zhī', '条': 'tiáo', '张': 'zhāng', '本': 'běn',
  '支': 'zhī', '双': 'shuāng', '对': 'duì', '套': 'tào', '件': 'jiàn',
  '台': 'tái', '辆': 'liàng', '架': 'jià', '艘': 'sōu', '座': 'zuò',
  '间': 'jiān', '层': 'céng', '楼': 'lóu', '门': 'mén', '窗': 'chuāng',
  
  // Common question words
  '什么': 'shénme', '谁': 'shéi', '哪里': 'nǎlǐ', '什么时候': 'shénme shíhòu',
  '为什么': 'wèishénme', '怎么': 'zěnme', '多少': 'duōshao', '几个': 'jǐ gè',
  
  // Common pronouns
  '这': 'zhè', '那': 'nà', '这里': 'zhèlǐ', '那里': 'nàlǐ', '这个': 'zhège',
  '那个': 'nàge', '这些': 'zhèxiē', '那些': 'nàxiē', '自己': 'zìjǐ',
  '别人': 'biérén', '大家': 'dàjiā', '每': 'měi', '各': 'gè'
};

// Add pinyin to entries
let addedPinyin = 0;
for (const entry of dictionary) {
  if (entry.hskSource && !entry.pinyin) {
    if (basicPinyinMap[entry.chinese]) {
      entry.pinyin = basicPinyinMap[entry.chinese];
      addedPinyin++;
    } else {
      // For entries without pinyin, mark them for manual review
      entry.pinyin = '[NEEDS_PINYIN]';
    }
  }
}

console.log(`Added pinyin to ${addedPinyin} entries`);
console.log(`Entries still needing pinyin: ${dictionary.filter(e => e.pinyin === '[NEEDS_PINYIN]').length}`);

// Write enhanced dictionary with pinyin
fs.writeFileSync(outputPath, JSON.stringify(dictionary, null, 2), 'utf8');
console.log(`Enhanced dictionary with pinyin written to: ${outputPath}`);

// Create a report of entries still needing pinyin
const needsPinyin = dictionary.filter(entry => entry.pinyin === '[NEEDS_PINYIN]');
if (needsPinyin.length > 0) {
  console.log('\nEntries still needing pinyin:');
  needsPinyin.slice(0, 20).forEach(entry => {
    console.log(`  ${entry.chinese} (HSK ${entry.hskLevel})`);
  });
  if (needsPinyin.length > 20) {
    console.log(`  ... and ${needsPinyin.length - 20} more`);
  }
} 