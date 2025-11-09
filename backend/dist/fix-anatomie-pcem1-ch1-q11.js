"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixQuestion11Chapter1() {
    try {
        console.log('🔄 Correction de la question 11 du chapitre 1 - Anatomie PCEM1...');
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
        // Trouver la question 11
        const questions = await prisma.question.findMany({
            where: {
                chapterId: chapter1.id
            },
            orderBy: {
                orderIndex: 'asc'
            }
        });
        const question11 = questions[10]; // Index 10 = question 11
        console.log('✅ Question 11 trouvée:', question11.id);
        console.log('📝 Texte actuel:', question11.questionText);
        // Mise à jour de la question 11 avec la justification complète pour E
        const newQuestionText = 'Concernant la clavicule.';
        const newOptions = [
            {
                text: 'Elle se fracture souvent au tiers moyen',
                isCorrect: true,
                justification: null
            },
            {
                text: 'Elle relie le tronc au membre supérieur',
                isCorrect: true,
                justification: null
            },
            {
                text: 'Elle est un os plat',
                isCorrect: false,
                justification: 'C\'est un os long.'
            },
            {
                text: 'Elle s\'articule avec le scapula via l\'acromion',
                isCorrect: true,
                justification: null
            },
            {
                text: 'Elle n\'a pas de moelle osseuse',
                isCorrect: false,
                justification: 'Elle en contient'
            }
        ];
        const newExplanation = 'La clavicule stabilise la ceinture scapulaire.';
        console.log('\n📋 NOUVELLES OPTIONS:');
        newOptions.forEach((opt, idx) => {
            console.log(`${String.fromCharCode(65 + idx)}. ${opt.text} - ${opt.isCorrect ? '✅ VRAI' : '❌ FAUX'}`);
            if (opt.justification) {
                console.log(`   Justification: ${opt.justification}`);
            }
        });
        // Mettre à jour la question
        const updatedQuestion = await prisma.question.update({
            where: { id: question11.id },
            data: {
                questionText: newQuestionText,
                options: newOptions,
                explanation: newExplanation
            }
        });
        console.log('\n✅ Question 11 corrigée avec succès!');
        console.log('📝 Nouveau texte:', updatedQuestion.questionText);
        console.log('💬 Nouvelle explication:', updatedQuestion.explanation);
        // Vérification
        const verifyQuestion = await prisma.question.findUnique({
            where: { id: question11.id }
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
fixQuestion11Chapter1();
//# sourceMappingURL=fix-anatomie-pcem1-ch1-q11.js.map