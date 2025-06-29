const fs = require('fs');
const path = require('path');

console.log('=== BUILD SCRIPT STARTED ===');

const cedictPath = path.join(__dirname, '../data/cc-cedict.txt');
const outputPath = path.join(__dirname, '../src/data/cedict-dictionary.ts');

console.log('CC-CEDICT path:', cedictPath);
console.log('Output path:', outputPath);

function parseCedictLine(line) {
  if (!line || line.startsWith('#')) return null;
  
  const match = line.match(/^(\S+)\s+(\S+)\s+\[(.+?)\]\s*\/(.+?)(?:\/|$)/);
  if (!match) return null;
  
  const [, trad, simp, pinyin, englishRaw] = match;
  
  let hskLevel = undefined;
  const hskMatch = englishRaw.match(/HSK (\d)/);
  if (hskMatch) hskLevel = parseInt(hskMatch[1], 10);
  
  const english = englishRaw.replace(/\/?HSK \d\/?/g, '').replace(/\/+$/, '').trim();
  
  return {
    chinese: simp,
    pinyin,
    english,
    hskLevel,
  };
}

function buildDictionary() {
  console.log('Reading CC-CEDICT file...');
  const lines = fs.readFileSync(cedictPath, 'utf8').split('\n');
  console.log(`Read ${lines.length} lines`);
  
  const entries = [];
  let processedCount = 0;
  
  for (const line of lines) {
    const entry = parseCedictLine(line);
    if (entry) {
      entries.push(entry);
      if (entries.length <= 3) {
        console.log('Sample entry:', entry);
      }
    }
    processedCount++;
    
    if (processedCount % 10000 === 0) {
      console.log(`Processed ${processedCount} lines, found ${entries.length} entries`);
    }
  }
  
  console.log(`Total entries found: ${entries.length}`);
  
  if (entries.length === 0) {
    console.error('No entries found!');
    process.exit(1);
  }
  
  console.log('Writing TypeScript file...');
  const ts = `// Auto-generated from CC-CEDICT\nexport interface DictionaryEntry {\n  chinese: string;\n  pinyin: string;\n  english: string;\n  hskLevel?: number;\n}\n\nexport const cedictDictionary: DictionaryEntry[] = ${JSON.stringify(entries, null, 2)};\n`;
  fs.writeFileSync(outputPath, ts, 'utf8');
  console.log(`Dictionary written with ${entries.length} entries.`);
  console.log('=== BUILD SCRIPT COMPLETED ===');
}

buildDictionary();
