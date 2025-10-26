"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkSubjects() {
    console.log('=== MATIÈRES DANS LA BASE ===\n');
    const subjects = await prisma.subject.findMany({
        select: {
            title: true,
            semester: true
        },
        orderBy: { semester: 'asc' }
    });
    subjects.forEach(s => {
        console.log(`  - ${s.title}: semester="${s.semester}"`);
    });
    console.log('\n=== RÉSUMÉ ===');
    const pcem1 = subjects.filter(s => s.semester === 'PCEM1');
    const pcem2 = subjects.filter(s => s.semester === 'PCEM2');
    const others = subjects.filter(s => s.semester !== 'PCEM1' && s.semester !== 'PCEM2');
    console.log(`PCEM1: ${pcem1.length} matières`);
    console.log(`PCEM2: ${pcem2.length} matières`);
    if (others.length > 0) {
        console.log(`AUTRES: ${others.length} matières`);
        others.forEach(s => console.log(`  - ${s.title}: "${s.semester}"`));
    }
    await prisma.$disconnect();
}
checkSubjects().catch(console.error);
//# sourceMappingURL=check-subjects-semester.js.map