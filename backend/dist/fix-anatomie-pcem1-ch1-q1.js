"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixQuestion1Chapter1() {
    try {
        console.log('🔄 Correction de la question 1 du chapitre 1 - Anatomie PCEM1...');
        // Trouver le sujet Anatomie PCEM1
        const anatomieSubject = await prisma.subject.findFirst({
            where: {
                title: { contains: 'Anatomie', mode: 'insensitive' },
                semester: 'PCEM1'
            }
        });
        if (!anatomieSubject) {
            console.error('❌ Sujet Anatomie PCEM1 non trouvé');
            return;
        }
        // Trouver le chapitre 1
        const chapter1 = await prisma.chapter.findFirst({
            where: {
                subjectId: anatomieSubject.id,
                title: { contains: 'Chapitre 1', mode: 'insensitive' }
            }
        });
        if (!chapter1) {
            console.error('❌ Chapitre 1 non trouvé');
            return;
        }
        // Trouver la question 1
        const questions = await prisma.question.findMany({
            where: {
                chapterId: chapter1.id
            },
            orderBy: {
                orderIndex: 'asc'
            }
        });
        const question1 = questions[0]; // Index 0 = question 1
        console.log('✅ Question 1 trouvée:', question1.id);
        console.log('📝 Texte actuel:', question1.questionText);
        // Mise à jour de la question 1 avec la justification complète pour C
        const newQuestionText = 'À propos de la clavicule, indiquez la ou les affirmations exactes.';
        const newOptions = [
            {
                text: 'Elle relie le sternum à la scapula',
                isCorrect: true,
                justification: null
            },
            {
                text: 'Elle est un os pair et horizontal',
                isCorrect: true,
                justification: null
            },
            {
                text: 'Elle contient un canal médullaire',
                isCorrect: false,
                justification: 'Elle ne possède pas de canal médullaire, mais contient de la moelle rouge spongieuse.'
            },
            {
                text: 'Elle s\'articule avec l\'humérus',
                isCorrect: false,
                justification: 'L\'articulation se fait via la scapula.'
            },
            {
                text: 'Elle constitue la base du cou',
                isCorrect: false,
                justification: 'C\'est un os du membre supérieur.'
            }
        ];
        const newExplanation = 'La clavicule agit comme un hauban reliant le tronc au membre supérieur.';
        console.log('\n📋 NOUVELLES OPTIONS:');
        newOptions.forEach((opt, idx) => {
            console.log(`${String.fromCharCode(65 + idx)}. ${opt.text} - ${opt.isCorrect ? '✅ VRAI' : '❌ FAUX'}`);
            if (opt.justification) {
                console.log(`   Justification: ${opt.justification}`);
            }
        });
        // Mettre à jour la question
        const updatedQuestion = await prisma.question.update({
            where: { id: question1.id },
            data: {
                questionText: newQuestionText,
                options: newOptions,
                explanation: newExplanation
            }
        });
        console.log('\n✅ Question 1 corrigée avec succès!');
        console.log('📝 Nouveau texte:', updatedQuestion.questionText);
        console.log('💬 Nouvelle explication:', updatedQuestion.explanation);
        // Vérification
        const verifyQuestion = await prisma.question.findUnique({
            where: { id: question1.id }
        });
        console.log('\n🔍 VÉRIFICATION:');
        const opts = verifyQuestion?.options;
        opts?.forEach((opt, idx) => {
            console.log(`${String.fromCharCode(65 + idx)}. ${opt.text} - ${opt.isCorrect ? '✅' : '❌'}`);
            if (opt.justification) {
                console.log(`   Justification: ${opt.justification}`);
            }
        });
    }
    catch (error) {
        console.error('❌ Erreur:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixQuestion1Chapter1();
//# sourceMappingURL=fix-anatomie-pcem1-ch1-q1.js.map