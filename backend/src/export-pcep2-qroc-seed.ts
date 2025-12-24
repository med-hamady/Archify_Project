/**
 * Export Script - PCEP2 QROC Seed Data
 *
 * Lit les fichiers QROC locaux et génère un fichier JSON
 * pour être embarqué dans le projet et utilisé en production
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIGURATION
// ============================================

const BASE_SOURCE_DIR = 'C:\\Users\\pc\\Desktop\\FAC GAME\\PCEP2\\QROC';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'pcep2', 'pcep2-qroc-seed.json');

const SUBJECTS_CONFIG: Record<string, { description: string }> = {
  'Biochimie': { description: 'QROC Biochimie - PCEP2' },
  'Biologie': { description: 'QROC Biologie - PCEP2' },
  'Botanique': { description: 'QROC Botanique - PCEP2' },
  'Chimie organique': { description: 'QROC Chimie organique - PCEP2' },
  'Pharmacie Galénique': { description: 'QROC Pharmacie Galénique - PCEP2' }
};

// ============================================
// TYPES
// ============================================

interface QrocItem {
  question: string;
  answer: string;
  category: string | null;
  orderIndex: number;
}

interface SubjectQrocData {
  title: string;
  description: string;
  qrocs: QrocItem[];
}

interface SeedData {
  semester: string;
  subjects: SubjectQrocData[];
  exportedAt: string;
  totalQrocs: number;
}

// ============================================
// FONCTIONS DE PARSING
// ============================================

function parseQrocFile(filePath: string, category: string): QrocItem[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim());

  const qrocs: QrocItem[] = [];
  let currentQuestion: string | null = null;
  let currentAnswer: string[] = [];
  let questionNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Détection d'une nouvelle question: "Q1 – Question" ou "Q1 : Question"
    const qMatch = line.match(/^Q(\d+)\s*[–—:\-]\s*(.+)$/i);
    if (qMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion && currentAnswer.length > 0) {
        qrocs.push({
          question: currentQuestion,
          answer: currentAnswer.join('\n').trim(),
          category,
          orderIndex: questionNumber - 1
        });
      }

      questionNumber = parseInt(qMatch[1]);
      currentQuestion = qMatch[2].trim();
      currentAnswer = [];
      continue;
    }

    // Détection de la réponse: "Réponse : ..."
    const rMatch = line.match(/^Réponse\s*:\s*(.*)$/i);
    if (rMatch) {
      if (rMatch[1]) {
        currentAnswer.push(rMatch[1]);
      }
      continue;
    }

    // Si on a une question en cours et la ligne n'est pas vide, c'est la suite de la réponse
    if (currentQuestion && line.length > 0 && !line.match(/^Q\d+/i)) {
      // Ignorer le titre du chapitre (première ligne)
      if (i > 0 || !line.match(/^Chapitre/i)) {
        currentAnswer.push(line);
      }
    }
  }

  // Sauvegarder la dernière question
  if (currentQuestion && currentAnswer.length > 0) {
    qrocs.push({
      question: currentQuestion,
      answer: currentAnswer.join('\n').trim(),
      category,
      orderIndex: questionNumber - 1
    });
  }

  return qrocs;
}

// ============================================
// EXPORT
// ============================================

function exportPCEP2QrocSeed() {
  console.log('📦 Exporting PCEP2 QROC seed data...\n');

  const subjects: SubjectQrocData[] = [];
  let totalQrocs = 0;

  for (const [subjectName, config] of Object.entries(SUBJECTS_CONFIG)) {
    const subjectDir = path.join(BASE_SOURCE_DIR, subjectName);

    if (!fs.existsSync(subjectDir)) {
      console.log(`⚠️  Directory not found: ${subjectName}`);
      continue;
    }

    console.log(`📚 Processing: ${subjectName}`);

    const qrocs: QrocItem[] = [];
    const files = fs.readdirSync(subjectDir).filter(f => f.endsWith('.txt') || f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(subjectDir, file);
      // Extraire le nom du chapitre comme catégorie
      const category = file.replace(/\.(txt|md)$/, '').trim();

      const fileQrocs = parseQrocFile(filePath, category);
      qrocs.push(...fileQrocs);

      console.log(`  ✅ ${category}: ${fileQrocs.length} QROCs`);
    }

    // Réindexer les QROCs pour cette matière
    qrocs.forEach((q, idx) => {
      q.orderIndex = idx;
    });

    subjects.push({
      title: subjectName,
      description: config.description,
      qrocs
    });

    totalQrocs += qrocs.length;
  }

  const seedData: SeedData = {
    semester: 'PCEP2',
    subjects,
    exportedAt: new Date().toISOString(),
    totalQrocs
  };

  // Créer le dossier si nécessaire
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(seedData, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Export complete!`);
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  console.log(`📊 Total: ${totalQrocs} QROCs`);
  console.log('='.repeat(50));
}

exportPCEP2QrocSeed();
