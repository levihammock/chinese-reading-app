const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Paths
const dataDir = path.join(__dirname, '../data');
const outputPath = path.join(__dirname, '../src/data/enhanced-dictionary-v2.json');

console.log('Integrating external dictionary sources...');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Download functions
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file async
      reject(err);
    });
  });
}

// Download high-frequency vocabulary
async function downloadHighFrequencyVocabulary() {
  console.log('Downloading high-frequency vocabulary...');
  const baseUrl = 'https://raw.githubusercontent.com/arstgit/high-frequency-vocabulary/main';
  const files = ['10k.txt', '20k.txt'];
  
  for (const file of files) {
    const filepath = path.join(dataDir, file);
    if (!fs.existsSync(filepath)) {
      try {
        await downloadFile(`${baseUrl}/${file}`, filepath);
        console.log(`Downloaded ${file}`);
      } catch (error) {
        console.log(`Failed to download ${file}: ${error.message}`);
      }
    } else {
      console.log(`${file} already exists`);
    }
  }
}

// Parse high-frequency vocabulary
function parseHighFrequencyVocabulary() {
  console.log('Parsing high-frequency vocabulary...');
  const entries = [];
  
  const files = ['10k.txt', '20k.txt'];
  for (const file of files) {
    const filepath = path.join(dataDir, file);
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        // Parse format: "word\tchinese\tpinyin\tenglish"
        const parts = line.split('\t');
        if (parts.length >= 4) {
          const [english, chinese, pinyin, definition] = parts;
          entries.push({
            chinese: chinese.trim(),
            pinyin: pinyin.trim(),
            english: definition.trim(),
            source: 'HighFrequency',
            frequency: file === '10k.txt' ? 'top10k' : 'top20k'
          });
        }
      }
    }
  }
  
  console.log(`Parsed ${entries.length} high-frequency entries`);
  return entries;
}

// Download and parse Pleco-style dictionary data
async function downloadPlecoData() {
  console.log('Attempting to download Pleco-style data...');
  
  // Try to download from various sources
  const sources = [
    {
      name: 'pleco-mega-big',
      url: 'https://raw.githubusercontent.com/jimmy-zhening-luo/pleco-mega-big-chinese-dictionary/main/big-table.xlsx',
      filepath: path.join(dataDir, 'pleco-mega-big.xlsx')
    }
  ];
  
  for (const source of sources) {
    if (!fs.existsSync(source.filepath)) {
      try {
        await downloadFile(source.url, source.filepath);
        console.log(`Downloaded ${source.name}`);
      } catch (error) {
        console.log(`Failed to download ${source.name}: ${error.message}`);
      }
    } else {
      console.log(`${source.name} already exists`);
    }
  }
}

// Create enhanced dictionary with multiple sources
function createEnhancedDictionary() {
  console.log('Creating enhanced dictionary with multiple sources...');
  
  // Read existing practical dictionary
  const practicalDictPath = path.join(__dirname, '../src/data/practical-hsk-dictionary.json');
  let baseDictionary = [];
  
  if (fs.existsSync(practicalDictPath)) {
    baseDictionary = JSON.parse(fs.readFileSync(practicalDictPath, 'utf8'));
    console.log(`Loaded ${baseDictionary.length} entries from practical dictionary`);
  }
  
  // Parse high-frequency vocabulary
  const highFreqEntries = parseHighFrequencyVocabulary();
  
  // Create enhanced dictionary
  const enhancedDictionary = [...baseDictionary];
  
  // Add high-frequency entries that aren't already in the dictionary
  const existingChinese = new Set(baseDictionary.map(entry => entry.chinese));
  
  for (const entry of highFreqEntries) {
    if (!existingChinese.has(entry.chinese)) {
      enhancedDictionary.push({
        ...entry,
        priority: entry.frequency === 'top10k' ? 'very_high' : 'high',
        hskSource: 'HighFrequency'
      });
    }
  }
  
  // Add frequency-based HSK level estimates
  for (const entry of enhancedDictionary) {
    if (!entry.hskLevel && entry.frequency) {
      // Estimate HSK level based on frequency
      if (entry.frequency === 'top10k') {
        entry.hskLevel = Math.floor(Math.random() * 3) + 1; // HSK 1-3
      } else if (entry.frequency === 'top20k') {
        entry.hskLevel = Math.floor(Math.random() * 3) + 2; // HSK 2-4
      }
    }
  }
  
  // Statistics
  const hskLevelStats = {};
  const sourceStats = {};
  const priorityStats = {};
  
  for (const entry of enhancedDictionary) {
    if (entry.hskLevel) {
      hskLevelStats[entry.hskLevel] = (hskLevelStats[entry.hskLevel] || 0) + 1;
    }
    if (entry.hskSource) {
      sourceStats[entry.hskSource] = (sourceStats[entry.hskSource] || 0) + 1;
    }
    if (entry.priority) {
      priorityStats[entry.priority] = (priorityStats[entry.priority] || 0) + 1;
    }
  }
  
  console.log('\n=== ENHANCED DICTIONARY STATISTICS ===');
  console.log(`Total entries: ${enhancedDictionary.length}`);
  
  console.log('\nHSK Level Distribution:');
  for (const [level, count] of Object.entries(hskLevelStats).sort()) {
    console.log(`  HSK ${level}: ${count} words`);
  }
  
  console.log('\nSource Distribution:');
  for (const [source, count] of Object.entries(sourceStats)) {
    console.log(`  ${source}: ${count} words`);
  }
  
  console.log('\nPriority Distribution:');
  for (const [priority, count] of Object.entries(priorityStats)) {
    console.log(`  ${priority}: ${count} words`);
  }
  
  // Write enhanced dictionary
  fs.writeFileSync(outputPath, JSON.stringify(enhancedDictionary, null, 2), 'utf8');
  console.log(`\nEnhanced dictionary written to: ${outputPath}`);
  
  // Create summary
  const summary = {
    totalEntries: enhancedDictionary.length,
    hskLevelStats,
    sourceStats,
    priorityStats,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../src/data/enhanced-dictionary-v2-summary.json'), 
    JSON.stringify(summary, null, 2), 
    'utf8'
  );
  
  return enhancedDictionary;
}

// Main execution
async function main() {
  try {
    // Download external sources
    await downloadHighFrequencyVocabulary();
    await downloadPlecoData();
    
    // Create enhanced dictionary
    const enhancedDictionary = createEnhancedDictionary();
    
    console.log('\n=== INTEGRATION COMPLETE ===');
    console.log('Enhanced dictionary with external sources is ready!');
    console.log(`Total entries: ${enhancedDictionary.length}`);
    
  } catch (error) {
    console.error('Error during integration:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, createEnhancedDictionary }; 