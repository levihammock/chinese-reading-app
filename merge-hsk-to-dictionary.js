const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/sync');

// Paths
const hskCsvPath = path.join(__dirname, 'data/hsk-3.0-word-list.csv');
const cedictPath = path.join(__dirname, 'src/data/cedict-dictionary.ts');
const outputPath = path.join(__dirname, 'src/data/cedict-dictionary-merged.json');

// Read and parse HSK CSV
const hskCsv = fs.readFileSync(hskCsvPath, 'utf8');
const hskRows = csvParse.parse(hskCsv, { columns: true });

// Build Hanzi -> HSK level map (handle alternate forms)
const hskMap = new Map();
for (const row of hskRows) {
  // Hanzi and alternate forms, split on ｜ and comma, strip whitespace
  const hanziForms = [row['Hanzi'], row['Hanzi_Alternate']]
    .filter(Boolean)
    .flatMap(hz => hz.split(/[｜,]/))
    .map(hz => hz.trim())
    .filter(Boolean);
  const level = parseInt(row['HSK_3_0_Level'], 10);
  for (const hanzi of hanziForms) {
    if (hanzi && level && !isNaN(level)) {
      if (!hskMap.has(hanzi) || hskMap.get(hanzi) > level) {
        hskMap.set(hanzi, level);
      }
    }
  }
}

// Read and parse cedict-dictionary.ts
const cedictRaw = fs.readFileSync(cedictPath, 'utf8');
const arrStart = cedictRaw.indexOf('= [');
const arrEnd = cedictRaw.lastIndexOf('];');
if (arrStart === -1 || arrEnd === -1) {
  throw new Error('Could not find cedictDictionary array in cedict-dictionary.ts');
}
const arrText = cedictRaw.slice(arrStart + 2, arrEnd + 1).trim();
const cedictArray = JSON.parse(arrText);

// Merge HSK levels with logging
let matched = 0;
let unmatched = 0;
let unmatchedSamples = [];
for (const entry of cedictArray) {
  const hanzi = entry.chinese.trim();
  if (hskMap.has(hanzi)) {
    entry.hskLevel = hskMap.get(hanzi);
    matched++;
    // Uncomment for detailed match logging:
    // console.log(`MATCHED: ${hanzi} => HSK ${entry.hskLevel}`);
  } else {
    unmatched++;
    if (unmatchedSamples.length < 20) {
      unmatchedSamples.push(hanzi);
    }
    // Uncomment for detailed unmatched logging:
    // console.log(`NO MATCH: ${hanzi}`);
  }
}

console.log(`Total entries: ${cedictArray.length}`);
console.log(`Matched HSK: ${matched}`);
console.log(`Unmatched: ${unmatched}`);
if (unmatchedSamples.length > 0) {
  console.log('Sample unmatched entries:', unmatchedSamples);
}

// Write merged dictionary to new file
const output = JSON.stringify(cedictArray, null, 2);
fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Merged dictionary written to ${outputPath}`); 