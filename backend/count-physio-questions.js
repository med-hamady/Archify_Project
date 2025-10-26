const fs = require('fs');
const path = require('path');

const physioDir = 'C:\\Users\\pc\\Desktop\\FAC GAME\\pcem1\\S inetrnational\\quiz pcem1\\physio';

const files = fs.readdirSync(physioDir).filter(f => f.endsWith('.txt'));

console.log('\n📊 Analyse des fichiers Physiologie PCEM1...\n');

let totalExpected = 0;
let totalFound = 0;

files.forEach(file => {
  const filePath = path.join(physioDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Compter les questions avec "Question :"
  const questions = content.match(/Question\s*:/g);
  const count = questions ? questions.length : 0;

  // Extraire le nombre attendu du titre (ex: "(30 QCM)" ou "(1 → 40)")
  const titleMatch = content.match(/\((\d+)\s*QCM\)/i) || content.match(/\(1\s*→\s*(\d+)\)/);
  const expected = titleMatch ? parseInt(titleMatch[1]) : count;

  console.log(`📄 ${file}`);
  console.log(`   Trouvé: ${count} questions`);
  console.log(`   Attendu: ${expected} questions`);
  if (count !== expected) {
    console.log(`   ⚠️  DIFFÉRENCE: ${count - expected}`);
  }
  console.log('');

  totalExpected += expected;
  totalFound += count;
});

console.log(`\n📊 TOTAL:`);
console.log(`   Questions trouvées: ${totalFound}`);
console.log(`   Questions attendues: ${totalExpected}`);
if (totalFound !== totalExpected) {
  console.log(`   ⚠️  DIFFÉRENCE: ${totalFound - totalExpected}`);
}
console.log('');
