"use strict";
/**
 * Check all PCEM2 subjects
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkAllSubjects() {
    console.log('🔍 Vérification de toutes les matières PCEM2...\n');
    try {
        const subjects = await prisma.subject.findMany({
            where: { semester: 'PCEM2' },
            include: {
                _count: {
                    select: { chapters: true }
                }
            }
        });
        console.log(`📚 Nombre total de matières PCEM2: ${subjects.length}\n`);
        for (const subject of subjects) {
            console.log(`   - ${subject.title} (ID: ${subject.id}, Chapitres: ${subject._count.chapters})`);
        }
        console.log('');
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
checkAllSubjects()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=check-all-subjects.js.map