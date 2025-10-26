"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkUsers() {
    console.log('=== UTILISATEURS ===\n');
    const users = await prisma.user.findMany({
        select: {
            email: true,
            name: true,
            semester: true
        },
        orderBy: { semester: 'asc' }
    });
    console.log(`Total: ${users.length} utilisateurs\n`);
    users.forEach(u => {
        console.log(`  - ${u.name} (${u.email}): semester="${u.semester}"`);
    });
    console.log('\n=== RÉSUMÉ ===');
    const pcem1 = users.filter(u => u.semester === 'PCEM1');
    const pcem2 = users.filter(u => u.semester === 'PCEM2');
    const others = users.filter(u => u.semester !== 'PCEM1' && u.semester !== 'PCEM2');
    console.log(`PCEM1: ${pcem1.length} utilisateurs`);
    console.log(`PCEM2: ${pcem2.length} utilisateurs`);
    if (others.length > 0) {
        console.log(`AUTRES: ${others.length} utilisateurs`);
        others.forEach(u => console.log(`  - ${u.name}: "${u.semester}"`));
    }
    await prisma.$disconnect();
}
checkUsers().catch(console.error);
//# sourceMappingURL=check-users-semester.js.map