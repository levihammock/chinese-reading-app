const fs = require('fs');
const path = require('path');
const https = require('https');

// Paths
const dataDir = path.join(__dirname, '../data');
const outputPath = path.join(__dirname, '../src/data/complete-hsk-dictionary.json');

console.log('Downloading Complete HSK Vocabulary...');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Download function
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file async
      reject(err);
    });
  });
}

// Download the complete HSK vocabulary
async function downloadCompleteHSKVocabulary() {
  console.log('Downloading complete.json from Complete HSK Vocabulary repository...');
  
  const url = 'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json';
  const filepath = path.join(dataDir, 'complete-hsk-vocabulary.json');
  
  try {
    await downloadFile(url, filepath);
    console.log('Successfully downloaded complete HSK vocabulary!');
    return filepath;
  } catch (error) {
    console.error('Failed to download complete HSK vocabulary:', error.message);
    throw error;
  }
}

// Parse and convert the complete HSK vocabulary to our format
function parseCompleteHSKVocabulary(filepath) {
  console.log('Parsing Complete HSK Vocabulary...');
  
  const rawData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const convertedEntries = [];
  
  for (const entry of rawData) {
    // Extract HSK level from the level array
    let hskLevel = null;
    if (entry.level && Array.isArray(entry.level)) {
      // Look for new HSK levels (new-1, new-2, etc.)
      for (const level of entry.level) {
        if (level.startsWith('new-')) {
          const levelNum = level.replace('new-', '');
          if (levelNum === '7+') {
            hskLevel = 7; // Map 7+ to 7
          } else {
            const num = parseInt(levelNum);
            if (!isNaN(num)) {
              hskLevel = num;
              break; // Use the first valid new HSK level
            }
          }
        }
      }
    }
    
    // Get the first form (simplified Chinese)
    const form = entry.forms && entry.forms[0];
    if (!form) continue;
    
    // Extract pinyin and meanings
    const pinyin = form.transcriptions && form.transcriptions.pinyin ? 
      form.transcriptions.pinyin : '';
    
    const english = form.meanings && form.meanings.length > 0 ? 
      form.meanings[0] : '';
    
    // Create our dictionary entry
    const convertedEntry = {
      chinese: entry.simplified,
      pinyin: pinyin,
      english: english,
      hskLevel: hskLevel,
      hskSource: 'CompleteHSK',
      priority: hskLevel && hskLevel <= 4 ? 'very_high' : 'high',
      frequency: entry.frequency || null,
      partsOfSpeech: entry.pos || [],
      radical: entry.radical || null,
      traditional: form.traditional || null,
      allMeanings: form.meanings || [],
      classifiers: form.classifiers || []
    };
    
    convertedEntries.push(convertedEntry);
  }
  
  console.log(`Converted ${convertedEntries.length} entries from Complete HSK Vocabulary`);
  
  // Debug: Show HSK level distribution
  const hskLevelStats = {};
  for (const entry of convertedEntries) {
    if (entry.hskLevel) {
      hskLevelStats[entry.hskLevel] = (hskLevelStats[entry.hskLevel] || 0) + 1;
    }
  }
  console.log('HSK Level distribution in Complete HSK Vocabulary:');
  for (const [level, count] of Object.entries(hskLevelStats).sort()) {
    console.log(`  HSK ${level}: ${count} words`);
  }
  
  return convertedEntries;
}

// Merge with existing comprehensive dictionary
function mergeWithExistingDictionary(completeHSKEntries) {
  console.log('Merging with existing comprehensive dictionary...');
  
  const existingDictPath = path.join(__dirname, '../src/data/comprehensive-dictionary.json');
  let existingDictionary = [];
  
  if (fs.existsSync(existingDictPath)) {
    existingDictionary = JSON.parse(fs.readFileSync(existingDictPath, 'utf8'));
    console.log(`Loaded ${existingDictionary.length} existing entries`);
  }
  
  // Create a map of existing Chinese characters
  const existingChinese = new Set(existingDictionary.map(entry => entry.chinese));
  
  // Add new entries from Complete HSK Vocabulary
  const mergedDictionary = [...existingDictionary];
  let addedCount = 0;
  let updatedCount = 0;
  
  for (const entry of completeHSKEntries) {
    if (!existingChinese.has(entry.chinese)) {
      mergedDictionary.push(entry);
      addedCount++;
    } else {
      // Update existing entry with Complete HSK data if it has better information
      const existingIndex = existingDictionary.findIndex(e => e.chinese === entry.chinese);
      if (existingIndex !== -1) {
        const existing = existingDictionary[existingIndex];
        let updated = false;
        
        // Update pinyin if missing or if CompleteHSK has better pinyin
        if ((!existing.pinyin || existing.pinyin === '') && entry.pinyin) {
          existing.pinyin = entry.pinyin;
          updated = true;
        }
        
        // Update HSK level if missing or if CompleteHSK has a level
        if (!existing.hskLevel && entry.hskLevel) {
          existing.hskLevel = entry.hskLevel;
          updated = true;
        }
        
        // Update priority if CompleteHSK has very_high priority
        if (entry.priority === 'very_high' && existing.priority !== 'very_high') {
          existing.priority = 'very_high';
          updated = true;
        }
        
        // Add CompleteHSK source information
        if (entry.hskSource === 'CompleteHSK') {
          existing.hskSource = 'CompleteHSK';
          existing.frequency = entry.frequency;
          existing.partsOfSpeech = entry.partsOfSpeech;
          existing.radical = entry.radical;
          existing.traditional = entry.traditional;
          existing.allMeanings = entry.allMeanings;
          existing.classifiers = entry.classifiers;
          updated = true;
        }
        
        if (updated) {
          mergedDictionary[existingIndex] = existing;
          updatedCount++;
        }
      }
    }
  }
  
  console.log(`Added ${addedCount} new entries from Complete HSK Vocabulary`);
  console.log(`Updated ${updatedCount} existing entries with Complete HSK data`);
  console.log(`Total entries after merge: ${mergedDictionary.length}`);
  
  return mergedDictionary;
}

// Generate statistics
function generateStatistics(dictionary) {
  const hskLevelStats = {};
  const sourceStats = {};
  const priorityStats = {};
  const hasPinyinStats = { yes: 0, no: 0 };
  
  for (const entry of dictionary) {
    if (entry.hskLevel) {
      hskLevelStats[entry.hskLevel] = (hskLevelStats[entry.hskLevel] || 0) + 1;
    }
    if (entry.hskSource) {
      sourceStats[entry.hskSource] = (sourceStats[entry.hskSource] || 0) + 1;
    }
    if (entry.priority) {
      priorityStats[entry.priority] = (priorityStats[entry.priority] || 0) + 1;
    }
    if (entry.pinyin && entry.pinyin.trim()) {
      hasPinyinStats.yes++;
    } else {
      hasPinyinStats.no++;
    }
  }
  
  console.log('\n=== COMPLETE HSK DICTIONARY STATISTICS ===');
  console.log(`Total entries: ${dictionary.length}`);
  
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
  
  console.log('\nPinyin Coverage:');
  console.log(`  With pinyin: ${hasPinyinStats.yes} words`);
  console.log(`  Without pinyin: ${hasPinyinStats.no} words`);
  console.log(`  Coverage: ${((hasPinyinStats.yes / dictionary.length) * 100).toFixed(1)}%`);
  
  return {
    totalEntries: dictionary.length,
    hskLevelStats,
    sourceStats,
    priorityStats,
    pinyinCoverage: hasPinyinStats,
    timestamp: new Date().toISOString()
  };
}

// Main execution
async function main() {
  try {
    // Download Complete HSK Vocabulary
    const downloadedFile = await downloadCompleteHSKVocabulary();
    
    // Parse the downloaded data
    const completeHSKEntries = parseCompleteHSKVocabulary(downloadedFile);
    
    // Merge with existing dictionary
    const mergedDictionary = mergeWithExistingDictionary(completeHSKEntries);
    
    // Generate statistics
    const statistics = generateStatistics(mergedDictionary);
    
    // Write merged dictionary
    fs.writeFileSync(outputPath, JSON.stringify(mergedDictionary, null, 2), 'utf8');
    console.log(`\nComplete HSK dictionary written to: ${outputPath}`);
    
    // Write summary
    fs.writeFileSync(
      path.join(__dirname, '../src/data/complete-hsk-dictionary-summary.json'), 
      JSON.stringify(statistics, null, 2), 
      'utf8'
    );
    
    console.log('\n=== COMPLETE HSK VOCABULARY INTEGRATION COMPLETE ===');
    console.log('High-quality HSK vocabulary with pinyin and meanings is ready!');
    
  } catch (error) {
    console.error('Error during Complete HSK Vocabulary integration:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, downloadCompleteHSKVocabulary, parseCompleteHSKVocabulary }; 