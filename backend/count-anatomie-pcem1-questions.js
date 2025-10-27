const fs = require('fs');
const path = require('path');

const anatomieDir = 'C:\\Users\\pc\\Desktop\\FAC GAME\\pcem1\\S inetrnational\\quiz pcem1\\anatomie';

console.log('\n📊 Comptage des questions Anatomie PCEM1...\n');

const files = fs.readdirSync(anatomieDir).filter(f => f.endsWith('.txt'));

let totalExpected = 0;

files.forEach(file => {
  const filePath = path.join(anatomieDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Compter les questions avec le pattern emoji + "Question :"
  const questionMatches = content.match(/([0-9]️⃣|🔟|1[0-9]️⃣|20️⃣|30️⃣|40️⃣)\s*Question\s*:/g);
  const count = questionMatches ? questionMatches.length : 0;

  console.log(`📄 ${file}`);
  console.log(`   Trouvé: ${count} questions\n`);

  totalExpected += count;
});

console.log(`📊 TOTAL:`);
console.log(`   Questions trouvées: ${totalExpected}\n`);
