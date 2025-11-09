"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixQuestion2Chapter2() {
    try {
        console.log('🔄 Correction de la question 2 du chapitre 2 - Anatomie PCEM1...');
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
        // Trouver le chapitre 2
        const chapter2 = await prisma.chapter.findFirst({
            where: {
                subjectId: anatomieSubject.id,
                title: { contains: 'Chapitre 2', mode: 'insensitive' }
            }
        });
        if (!chapter2) {
            console.error('❌ Chapitre 2 non trouvé');
            return;
        }
        // Trouver la question 2
        const questions = await prisma.question.findMany({
            where: {
                chapterId: chapter2.id
            },
            orderBy: {
                orderIndex: 'asc'
            }
        });
        const question2 = questions[1]; // Index 1 = question 2
        console.log('✅ Question 2 trouvée:', question2.id);
        console.log('📝 Texte actuel:', question2.questionText);
        // Mise à jour de la question 2 avec la justification complète pour C
        const newQuestionText = 'Concernant la cavité glénoïde.';
        const newOptions = [
            {
                text: 'Elle appartient à la scapula',
                isCorrect: true,
                justification: null
            },
            {
                text: 'Elle s\'articule avec la tête humérale',
                isCorrect: true,
                justification: null
            },
            {
                text: 'Elle est recouverte de fibrocartilage',
                isCorrect: false,
                justification: 'La cavité glénoïde est recouverte de cartilage hyalin, pas fibrocartilage.'
            },
            {
                text: 'Elle appartient à la clavicule',
                isCorrect: false,
                justification: 'Non.'
            },
            {
                text: 'Elle est dépourvue de labrum',
                isCorrect: false,
                justification: 'Présence du bourrelet glénoïdien.'
            }
        ];
        const newExplanation = 'La cavité glénoïde est une surface peu profonde augmentée par le labrum.';
        console.log('\n📋 NOUVELLES OPTIONS:');
        newOptions.forEach((opt, idx) => {
            console.log(`${String.fromCharCode(65 + idx)}. ${opt.text} - ${opt.isCorrect ? '✅ VRAI' : '❌ FAUX'}`);
            if (opt.justification) {
                console.log(`   Justification: ${opt.justification}`);
            }
        });
        // Mettre à jour la question
        const updatedQuestion = await prisma.question.update({
            where: { id: question2.id },
            data: {
                questionText: newQuestionText,
                options: newOptions,
                explanation: newExplanation
            }
        });
        console.log('\n✅ Question 2 corrigée avec succès!');
        console.log('📝 Nouveau texte:', updatedQuestion.questionText);
        console.log('💬 Nouvelle explication:', updatedQuestion.explanation);
        // Vérification
        const verifyQuestion = await prisma.question.findUnique({
            where: { id: question2.id }
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
fixQuestion2Chapter2();
//# sourceMappingURL=fix-anatomie-pcem1-ch2-q2.js.map