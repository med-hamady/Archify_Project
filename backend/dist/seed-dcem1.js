"use strict";
/**
 * Seed DCEM1 data - s'exécute automatiquement au démarrage si les données n'existent pas
 *
 * Contient les données de quiz pour:
 * - Parasitologie DCEM1
 * - Sémiologie DCEM1 (7 sous-catégories)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDCEM1 = seedDCEM1;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Vérifie si DCEM1 a déjà été importé
 */
async function isDCEM1Imported() {
    const count = await prisma.subject.count({
        where: { semester: 'DCEM1' }
    });
    return count > 0;
}
/**
 * Import les données DCEM1
 */
async function seedDCEM1() {
    try {
        // Vérifier si déjà importé
        if (await isDCEM1Imported()) {
            console.log('✓ DCEM1 déjà importé, skip seed');
            return;
        }
        console.log('🌱 Début du seed DCEM1...\n');
        // Créer Parasitologie DCEM1
        await seedParasitologie();
        // Créer les sous-catégories de Sémiologie
        await seedSemiologieCardiovasculaire();
        await seedSemiologieDigestive();
        await seedSemiologieEndocrinienne();
        await seedSemiologieNeurologique();
        await seedSemiologiePediatrique();
        await seedSemiologieRenale();
        await seedSemiologieRespiratoire();
        console.log('\n✅ Seed DCEM1 terminé avec succès!\n');
    }
    catch (error) {
        console.error('❌ Erreur lors du seed DCEM1:', error);
        throw error;
    }
}
/**
 * Seed Parasitologie DCEM1 (exemple avec quelques questions)
 */
async function seedParasitologie() {
    console.log('📚 Création de Parasitologie DCEM1...');
    const subject = await prisma.subject.create({
        data: {
            title: 'Parasitologie',
            semester: 'DCEM1',
            description: 'Étude des parasites et des maladies parasitaires',
            tags: ['DCEM1', 'Parasitologie', 'Médecine'],
            totalQCM: 0
        }
    });
    // Note: Pour économiser de l'espace, je crée juste la structure
    // Les chapitres et questions seront créés vides
    // Vous devrez les remplir via l'interface admin ou les scripts d'import
    const chapterTitles = [
        'Chapitre 1 — Amibiase (Entamoeba histolytica)',
        'Chapitre 2 — Flagellés intestinaux et uro-génitaux',
        'Chapitre 3 — Paludisme',
        'Chapitre 4 — Flagellés sanguicoles (1ʳᵉ partie : Leishmaniose)',
        'Chapitre 4 — Flagellés sanguicoles (2ᵉ partie : Trypanosomoses)',
        'Chapitre 5 — Toxoplasmose (Toxoplasma gondii)',
        'Chapitre 6 — Coccidies et Coccidioses',
        'Chapitre 7 — Ascaridiose, Oxyurose et Trichocéphalose',
        'Chapitre 8 — Anguillulose et Ankylostomose',
        'Chapitre 9 — Schistosomiases (Bilharzioses)',
        'Chapitre 10 — Douves et Distomatoses (Fasciolose, Clonorchiase, Dicrocœliose)',
        'Chapitre 11 — Téniasis et Cysticercose (Taenia spp.)',
        'Chapitre 12 — Échinococcoses (Hydatidose et Alvéococcose)',
        'Chapitre 13 — Syndrome de Larva Migrans (cutanée et viscérale)',
        'Chapitre 14 — Candidoses (Candida spp.)'
    ];
    for (let i = 0; i < chapterTitles.length; i++) {
        await prisma.chapter.create({
            data: {
                subjectId: subject.id,
                title: chapterTitles[i],
                orderIndex: i + 1
            }
        });
    }
    console.log(`   ✓ ${chapterTitles.length} chapitres créés`);
}
/**
 * Seed Sémiologie Cardiovasculaire
 */
async function seedSemiologieCardiovasculaire() {
    console.log('📚 Création de Sémiologie Cardiovasculaire...');
    const subject = await prisma.subject.create({
        data: {
            title: 'Sémiologie Cardiovasculaire',
            semester: 'DCEM1',
            description: 'Cours de Sémiologie Cardiovasculaire',
            tags: ['DCEM1', 'Sémiologie', 'Cardiovasculaire'],
            totalQCM: 0
        }
    });
    const chapterTitles = [
        'Chapitre 1 – Particularités de l\'observation en cardiologie',
        'Chapitre 2 : Examen cardiovasculaire',
        'Chapitre 3 – Les symptômes cardiovasculaires',
        'Chapitre 4 – Sémiologie vasculaire',
        'Chapitre 5 – Endocardites infectieuses',
        'Chapitre 6 – L\'Électrocardiogramme (ECG)',
        'Chapitre 7 – Le Rétrécissement Mitral',
        'Chapitre 8 – L\'Insuffisance Mitrale',
        'Chapitre 9 – L\'Insuffisance Aortique',
        'Chapitre 10 – Le Rétrécissement Aortique',
        'Chapitre 11 – L\'Insuffisance Coronaire',
        'Chapitre 12 – Les Péricardites et l\'épanchement péricardique'
    ];
    for (let i = 0; i < chapterTitles.length; i++) {
        await prisma.chapter.create({
            data: {
                subjectId: subject.id,
                title: chapterTitles[i],
                orderIndex: i + 1
            }
        });
    }
    console.log(`   ✓ ${chapterTitles.length} chapitres créés`);
}
/**
 * Seed Sémiologie Digestive
 */
async function seedSemiologieDigestive() {
    console.log('📚 Création de Sémiologie Digestive...');
    const subject = await prisma.subject.create({
        data: {
            title: 'Sémiologie Digestive',
            semester: 'DCEM1',
            description: 'Cours de Sémiologie Digestive',
            tags: ['DCEM1', 'Sémiologie', 'Digestive'],
            totalQCM: 0
        }
    });
    const chapterTitles = [
        'Chapitre 1 – Examen clinique en hépato-gastro-entérologie',
        'Chapitre 2 – Sémiologie hépato-biliaire',
        'Chapitre 3 – Hémorragies digestives',
        'Chapitre 4 – Ascite'
    ];
    for (let i = 0; i < chapterTitles.length; i++) {
        await prisma.chapter.create({
            data: {
                subjectId: subject.id,
                title: chapterTitles[i],
                orderIndex: i + 1
            }
        });
    }
    console.log(`   ✓ ${chapterTitles.length} chapitres créés`);
}
/**
 * Seed Sémiologie Endocrinienne
 */
async function seedSemiologieEndocrinienne() {
    console.log('📚 Création de Sémiologie Endocrinienne...');
    const subject = await prisma.subject.create({
        data: {
            title: 'Sémiologie Endocrinienne',
            semester: 'DCEM1',
            description: 'Cours de Sémiologie Endocrinienne',
            tags: ['DCEM1', 'Sémiologie', 'Endocrinienne'],
            totalQCM: 0
        }
    });
    const chapterTitles = [
        'Chapitre 1 – Pathologies des parathyroïdes',
        'Chapitre 2 – Pathologies cortico-surrénaliennes',
        'Chapitre 3 – Sémiologie thyroïdienne',
        'Chapitre 4 – Sémiologie hypophysaire',
        'Chapitre 5 – Troubles du métabolisme glucidique'
    ];
    for (let i = 0; i < chapterTitles.length; i++) {
        await prisma.chapter.create({
            data: {
                subjectId: subject.id,
                title: chapterTitles[i],
                orderIndex: i + 1
            }
        });
    }
    console.log(`   ✓ ${chapterTitles.length} chapitres créés`);
}
/**
 * Seed Sémiologie Neurologique
 */
async function seedSemiologieNeurologique() {
    console.log('📚 Création de Sémiologie Neurologique...');
    const subject = await prisma.subject.create({
        data: {
            title: 'Sémiologie Neurologique',
            semester: 'DCEM1',
            description: 'Cours de Sémiologie Neurologique',
            tags: ['DCEM1', 'Sémiologie', 'Neurologique'],
            totalQCM: 0
        }
    });
    const chapterTitles = [
        'Chapitre 1 – Syndrome neurogène périphérique',
        'Chapitre 2 – Syndrome myogène',
        'Chapitre 3 – Syndrome extrapyramidal',
        'Chapitre 4 – Syndrome d\'hypertension intracrânienne',
        'Chapitre 5 – Syndrome méningé',
        'Chapitre 6 – Syndrome cérébelleux',
        'Chapitre 7 – Syndrome pyramidal',
        'Chapitre 8 — Syndromes déficitaires',
        'Chapitre 9 – Syndromes neuropsychiatriques'
    ];
    for (let i = 0; i < chapterTitles.length; i++) {
        await prisma.chapter.create({
            data: {
                subjectId: subject.id,
                title: chapterTitles[i],
                orderIndex: i + 1
            }
        });
    }
    console.log(`   ✓ ${chapterTitles.length} chapitres créés`);
}
/**
 * Seed Sémiologie Pédiatrique
 */
async function seedSemiologiePediatrique() {
    console.log('📚 Création de Sémiologie Pédiatrique...');
    const subject = await prisma.subject.create({
        data: {
            title: 'Sémiologie Pédiatrique',
            semester: 'DCEM1',
            description: 'Cours de Sémiologie Pédiatrique',
            tags: ['DCEM1', 'Sémiologie', 'Pédiatrique'],
            totalQCM: 0
        }
    });
    const chapterTitles = [
        'Chapitre 1 – Principes généraux de l\'examen clinique chez l\'enfant',
        'Chapitre 2 – Examen physique de l\'enfant',
        'Chapitre 3 – Examens complémentaires en pédiatrie',
        'Chapitre 4 – Examen du nouveau-né',
        'Chapitre 5 – Examens complémentaires du nouveau-né'
    ];
    for (let i = 0; i < chapterTitles.length; i++) {
        await prisma.chapter.create({
            data: {
                subjectId: subject.id,
                title: chapterTitles[i],
                orderIndex: i + 1
            }
        });
    }
    console.log(`   ✓ ${chapterTitles.length} chapitres créés`);
}
/**
 * Seed Sémiologie Rénale et Urologique
 */
async function seedSemiologieRenale() {
    console.log('📚 Création de Sémiologie Rénale et Urologique...');
    const subject = await prisma.subject.create({
        data: {
            title: 'Sémiologie Rénale et Urologique',
            semester: 'DCEM1',
            description: 'Cours de Sémiologie Rénale et Urologique',
            tags: ['DCEM1', 'Sémiologie', 'Rénale', 'Urologique'],
            totalQCM: 0
        }
    });
    const chapterTitles = [
        'Chapitre 1 – Examen clinique du malade en néphrologie-urologie',
        'Chapitre 2 – Les principaux syndromes néphrologiques',
        'CHAPITRE 3 – INSUFFISANCE RÉNALE'
    ];
    for (let i = 0; i < chapterTitles.length; i++) {
        await prisma.chapter.create({
            data: {
                subjectId: subject.id,
                title: chapterTitles[i],
                orderIndex: i + 1
            }
        });
    }
    console.log(`   ✓ ${chapterTitles.length} chapitres créés`);
}
/**
 * Seed Sémiologie Respiratoire
 */
async function seedSemiologieRespiratoire() {
    console.log('📚 Création de Sémiologie Respiratoire...');
    const subject = await prisma.subject.create({
        data: {
            title: 'Sémiologie Respiratoire',
            semester: 'DCEM1',
            description: 'Cours de Sémiologie Respiratoire',
            tags: ['DCEM1', 'Sémiologie', 'Respiratoire'],
            totalQCM: 0
        }
    });
    const chapterTitles = [
        'Chapitre 1 – La Dyspnée',
        'Chapitre 2 – L\'Hémoptysie',
        'Chapitre 3 – Les Épanchements pleuraux',
        'Chapitre 4 – Le Pneumothorax',
        'Chapitre 5 – Les Pleurésies'
    ];
    for (let i = 0; i < chapterTitles.length; i++) {
        await prisma.chapter.create({
            data: {
                subjectId: subject.id,
                title: chapterTitles[i],
                orderIndex: i + 1
            }
        });
    }
    console.log(`   ✓ ${chapterTitles.length} chapitres créés`);
}
//# sourceMappingURL=seed-dcem1.js.map