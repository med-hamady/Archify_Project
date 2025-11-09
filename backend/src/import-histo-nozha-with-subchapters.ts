/**
 * Import Histo Nozha avec sous-chapitres
 * Réorganise les 249 QCMs en chapitres et sous-chapitres
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Types
type AnswerState = 'correct' | 'incorrect' | 'partial';

interface ParsedOption {
  letter: string;
  text: string;
  answerState: AnswerState;
  justification?: string;
}

interface ParsedQuestion {
  number: number;
  questionText: string;
  options: ParsedOption[];
  conclusion?: string;
}

interface Section {
  title: string;
  questions: ParsedQuestion[];
}

interface ChapterData {
  fileName: string;
  chapterTitle: string;
  sections: Section[];
}

// ============================================
// PARSING DES FICHIERS
// ============================================

/**
 * Détermine l'état de la réponse basé sur les symboles
 */
function detectAnswerState(line: string): AnswerState {
  if (line.includes('✅') || line.includes('(✅)')) return 'correct';
  if (line.includes('⚠️') || line.includes('(⚠️)')) return 'partial';
  if (line.includes('❌') || line.includes('(❌)')) return 'incorrect';
  return 'incorrect'; // Par défaut
}

/**
 * Parse une ligne d'option
 * Formats supportés:
 * - A. Texte (✅)
 * - A- Texte ❌ → Justification
 * - a. Texte ⚠️
 */
function parseOption(line: string): ParsedOption | null {
  // Format 1: "A. Texte ..." ou "a. Texte ..." (majuscules et minuscules)
  let match = line.match(/^([A-Fa-f])\.\s+(.+?)(?:\s*\((?:✅|❌|⚠️)\))?\s*(?:→\s*(.+))?$/);

  // Format 2: "A-Texte ..." ou "a-Texte ..." (majuscules et minuscules)
  if (!match) {
    match = line.match(/^([A-Fa-f])-(.+?)(?:\s+(?:✅|❌|⚠️))?\s*(?:→\s*(.+))?$/);
  }

  if (!match) return null;

  const letter = match[1].toUpperCase();
  let fullText = match[2].trim();
  const justification = match[3]?.trim();

  // Nettoyer les symboles du texte (les détecter d'abord pour l'état)
  const answerState = detectAnswerState(line);

  fullText = fullText
    .replace(/\s*\(✅\)\s*$/g, '')  // (✅)
    .replace(/\s*\(❌\)\s*$/g, '')  // (❌)
    .replace(/\s*\(⚠️\)\s*$/g, '')  // (⚠️)
    .replace(/\s*✅\s*$/g, '')      // ✅
    .replace(/\s*❌\s*$/g, '')      // ❌
    .replace(/\s*⚠️\s*$/g, '')      // ⚠️
    .trim();

  return {
    letter,
    text: fullText,
    answerState,
    justification
  };
}

/**
 * Parse un fichier complet et extrait les sections
 */
function parseFile(filePath: string): ChapterData {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const fileName = path.basename(filePath);
  const chapterTitle = lines[0]; // Première ligne = titre du chapitre

  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentQuestion: ParsedQuestion | null = null;
  let currentConclusion: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Détection des sections (A — TITRE, B – TITRE, A- TITRE, B.TITRE)
    // IMPORTANT: Ne pas matcher les options de réponse
    const sectionMatch = line.match(/^([A-Z])[\s]*([—–\-\.])\s*(.+)$/);

    if (sectionMatch) {
      const sectionTitle = sectionMatch[3];

      // Exclure les options de réponse:
      // - Options commencent toujours par une lettre minuscule ou majuscule suivie d'un point + espace
      // - Ou lettre + tiret court + espace suivi d'une minuscule
      const isOption = /^[A-Fa-f][\.\-]\s+[a-z]/.test(line);

      // Exclure les justifications et réponses annotées:
      // - Contiennent des symboles de réponse: ✅ ❌ ⚠️ (✅) (❌) (⚠️)
      // - Contiennent des flèches de justification: →
      const hasAnswerSymbols = /[✅❌⚠️→]/.test(sectionTitle);

      // Les vraies sections ont TOUT EN MAJUSCULES (au moins 4 lettres consécutives)
      const isSection = /[A-Z]{4,}/.test(sectionTitle);

      if (isSection && !isOption && !hasAnswerSymbols) {
        // Sauvegarder la section précédente
        if (currentSection && currentQuestion) {
          if (currentConclusion.length > 0) {
            currentQuestion.conclusion = currentConclusion.join(' ').trim();
          }
          currentSection.questions.push(currentQuestion);
          currentQuestion = null;
          currentConclusion = [];
        }
        if (currentSection) {
          sections.push(currentSection);
        }

        // Nouvelle section
        currentSection = {
          title: sectionMatch[3].trim(),
          questions: []
        };
        continue;
      }
    }

    // Détection des QCMs avec texte optionnel sur la même ligne
    // Format 1: "QCM 1 — Les neurones parvocellulaires :"
    // Format 2: "QCM 1 —" (texte sur ligne suivante)
    const qcmMatch = line.match(/^QCM\s+(\d+)\s*[—–-]\s*(.*)$/);
    if (qcmMatch) {
      // Sauvegarder la question précédente
      if (currentQuestion && currentSection) {
        if (currentConclusion.length > 0) {
          currentQuestion.conclusion = currentConclusion.join(' ').trim();
        }
        currentSection.questions.push(currentQuestion);
        currentConclusion = [];
      }

      // Nouvelle question avec le texte extrait (s'il existe)
      const questionText = qcmMatch[2].trim();
      currentQuestion = {
        number: parseInt(qcmMatch[1]),
        questionText: questionText && questionText.endsWith(':') ? questionText.slice(0, -1).trim() : questionText,
        options: []
      };
      continue;
    }

    // Texte de la question (ligne après QCM X —) - pour les cas où le texte est sur une ligne séparée
    if (currentQuestion && currentQuestion.questionText === '' && !line.match(/^[A-Fa-f][\.\-]/)) {
      currentQuestion.questionText = line;
      continue;
    }

    // Options de réponse
    const option = parseOption(line);
    if (option && currentQuestion) {
      currentQuestion.options.push(option);
      continue;
    }

    // Conclusion
    if (line.startsWith('🩵 Conclusion')) {
      const conclusionText = line.replace('🩵 Conclusion :', '').replace('🩵 Conclusion:', '').trim();
      if (conclusionText) {
        currentConclusion.push(conclusionText);
      }
      continue;
    }

    // Suite de la conclusion
    if (currentConclusion.length > 0 && !line.match(/^QCM/) && !line.match(/^[A-Z][\s]*[—–\-\.]/)) {
      currentConclusion.push(line);
    }
  }

  // Sauvegarder la dernière question et section
  if (currentQuestion && currentSection) {
    if (currentConclusion.length > 0) {
      currentQuestion.conclusion = currentConclusion.join(' ').trim();
    }
    currentSection.questions.push(currentQuestion);
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    fileName,
    chapterTitle,
    sections
  };
}

// ============================================
// IMPORT DANS LA BASE DE DONNÉES
// ============================================

async function importHistoNozhaWithSubchapters() {
  console.log('📚 Import de Histo Nozha avec sous-chapitres...\n');

  try {
    // 1. Vérifier/créer le sujet Histo Nozha
    let subject = await prisma.subject.findFirst({
      where: {
        title: 'Histo Nozha',
        semester: 'PCEM2'
      }
    });

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          title: 'Histo Nozha',
          description: 'Histologie PCEM2 - QCMs avec sous-chapitres organisés',
          semester: 'PCEM2',
          tags: ['Histologie', 'PCEM2'],
          totalQCM: 249
        }
      });
      console.log('✅ Sujet "Histo Nozha" créé');
    } else {
      console.log('✅ Sujet "Histo Nozha" trouvé:', subject.id);
    }

    // 2. Parser tous les fichiers
    const sourceDir = 'C:\\Users\\pc\\Desktop\\FAC GAME\\pcem2\\Histo Nozha';
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.txt'));

    console.log(`\n📁 Fichiers trouvés: ${files.length}\n`);

    let totalQuestionsImported = 0;
    let totalSubchaptersCreated = 0;

    for (let chapterIndex = 0; chapterIndex < files.length; chapterIndex++) {
      const file = files[chapterIndex];
      const filePath = path.join(sourceDir, file);

      console.log(`\n📖 Traitement: ${file}`);

      const chapterData = parseFile(filePath);
      console.log(`   Titre: ${chapterData.chapterTitle}`);
      console.log(`   Sections: ${chapterData.sections.length}`);

      // 3. Créer ou récupérer le chapitre
      let chapter = await prisma.chapter.findFirst({
        where: {
          subjectId: subject.id,
          title: chapterData.chapterTitle
        }
      });

      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: {
            subjectId: subject.id,
            title: chapterData.chapterTitle,
            orderIndex: chapterIndex
          }
        });
        console.log(`   ✅ Chapitre créé`);
      } else {
        console.log(`   ✅ Chapitre existant:`, chapter.id);
      }

      // 4. Créer les sous-chapitres et leurs questions
      for (let sectionIndex = 0; sectionIndex < chapterData.sections.length; sectionIndex++) {
        const section = chapterData.sections[sectionIndex];

        console.log(`\n      📌 Section: ${section.title} (${section.questions.length} QCMs)`);

        // Créer le sous-chapitre
        const subchapter = await prisma.subchapter.create({
          data: {
            chapterId: chapter.id,
            title: section.title,
            orderIndex: sectionIndex
          }
        });
        totalSubchaptersCreated++;

        // Créer les questions pour ce sous-chapitre
        for (let qIndex = 0; qIndex < section.questions.length; qIndex++) {
          const q = section.questions[qIndex];

          await prisma.question.create({
            data: {
              chapterId: chapter.id,
              subchapterId: subchapter.id,
              questionText: q.questionText,
              options: q.options.map(opt => ({
                text: opt.text,
                isCorrect: opt.answerState === 'correct',
                isPartial: opt.answerState === 'partial',
                justification: opt.justification
              })),
              explanation: q.conclusion,
              orderIndex: qIndex
            }
          });
          totalQuestionsImported++;
        }

        console.log(`         ✅ ${section.questions.length} questions importées`);
      }
    }

    console.log('\n\n✅ Import terminé!');
    console.log(`📊 Statistiques:`);
    console.log(`   - Chapitres: ${files.length}`);
    console.log(`   - Sous-chapitres: ${totalSubchaptersCreated}`);
    console.log(`   - Questions: ${totalQuestionsImported}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
importHistoNozhaWithSubchapters()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
