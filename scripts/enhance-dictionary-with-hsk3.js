const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/sync');

// Paths
const hsk3Path = path.join(__dirname, '../data/hsk-3.0-word-list.csv');
const cedictPath = path.join(__dirname, '../src/data/cedict-dictionary-merged.json');
const outputPath = path.join(__dirname, '../src/data/enhanced-dictionary.json');

console.log('Enhancing dictionary with HSK 3.0 data...');

// Read HSK 3.0 data
console.log('Reading HSK 3.0 word list...');
const hsk3Csv = fs.readFileSync(hsk3Path, 'utf8');
const hsk3Rows = csvParse.parse(hsk3Csv, { columns: true });

// Build comprehensive HSK 3.0 map
const hsk3Map = new Map();
for (const row of hsk3Rows) {
  const level = parseInt(row['HSK_3_0_Level'], 10);
  const hanzi = row['Hanzi']?.trim();
  const hanziAlt = row['Hanzi_Alternate']?.trim();
  const usage = row['HSK_Level_Usage']?.trim();
  
  if (hanzi && level && !isNaN(level)) {
    // Store primary form
    if (!hsk3Map.has(hanzi) || hsk3Map.get(hanzi).level > level) {
      hsk3Map.set(hanzi, { level, usage, source: 'HSK3' });
    }
    
    // Store alternate forms
    if (hanziAlt) {
      const altForms = hanziAlt.split(/[,，]/).map(h => h.trim()).filter(h => h);
      for (const altForm of altForms) {
        if (!hsk3Map.has(altForm) || hsk3Map.get(altForm).level > level) {
          hsk3Map.set(altForm, { level, usage, source: 'HSK3_Alt' });
        }
      }
    }
  }
}

console.log(`HSK 3.0 map created with ${hsk3Map.size} entries`);

// Read existing CEDICT dictionary
console.log('Reading existing CEDICT dictionary...');
const cedictData = JSON.parse(fs.readFileSync(cedictPath, 'utf8'));

// Enhance CEDICT entries with HSK 3.0 data
console.log('Enhancing CEDICT entries...');
let enhanced = 0;
let newEntries = 0;

for (const entry of cedictData) {
  const hanzi = entry.chinese?.trim();
  if (hanzi && hsk3Map.has(hanzi)) {
    const hsk3Info = hsk3Map.get(hanzi);
    entry.hskLevel = hsk3Info.level;
    entry.hskUsage = hsk3Info.usage;
    entry.hskSource = hsk3Info.source;
    enhanced++;
  }
}

// Add HSK 3.0 entries that aren't in CEDICT
console.log('Adding missing HSK 3.0 entries...');
const existingHanzi = new Set(cedictData.map(entry => entry.chinese));

for (const [hanzi, hsk3Info] of hsk3Map) {
  if (!existingHanzi.has(hanzi)) {
    // Create basic entry for missing HSK 3.0 words
    cedictData.push({
      chinese: hanzi,
      pinyin: '', // Will need to be filled manually or via API
      english: `[HSK ${hsk3Info.level} word]`,
      hskLevel: hsk3Info.level,
      hskUsage: hsk3Info.usage,
      hskSource: hsk3Info.source
    });
    newEntries++;
  }
}

// Statistics
const hskLevelStats = {};
for (const entry of cedictData) {
  if (entry.hskLevel) {
    hskLevelStats[entry.hskLevel] = (hskLevelStats[entry.hskLevel] || 0) + 1;
  }
}

console.log('\n=== ENHANCEMENT STATISTICS ===');
console.log(`Enhanced existing entries: ${enhanced}`);
console.log(`Added new HSK 3.0 entries: ${newEntries}`);
console.log(`Total entries: ${cedictData.length}`);
console.log('\nHSK Level Distribution:');
for (const [level, count] of Object.entries(hskLevelStats).sort()) {
  console.log(`  HSK ${level}: ${count} words`);
}

// Write enhanced dictionary
console.log('\nWriting enhanced dictionary...');
fs.writeFileSync(outputPath, JSON.stringify(cedictData, null, 2), 'utf8');
console.log(`Enhanced dictionary written to: ${outputPath}`);

// Create a summary report
const summary = {
  totalEntries: cedictData.length,
  hskLevelStats,
  enhanced: enhanced,
  newEntries: newEntries,
  timestamp: new Date().toISOString()
};

fs.writeFileSync(
  path.join(__dirname, '../src/data/dictionary-summary.json'), 
  JSON.stringify(summary, null, 2), 
  'utf8'
);

console.log('\n=== ENHANCEMENT COMPLETE ===');
console.log('Enhanced dictionary is ready for use!'); 