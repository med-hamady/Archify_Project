import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration automatique pour corriger l'ordre des chapitres Anatomie PCEM2
 * S'exécute au démarrage du serveur
 */
export async function fixAnatomieChapterOrder() {
  try {
    console.log('🔧 [Migration] Vérification de l\'ordre des chapitres Anatomie PCEM2...');

    // Récupérer la matière Anatomie PCEM2
    const anatomie = await prisma.subject.findFirst({
      where: {
        title: { contains: 'Anatomie', mode: 'insensitive' },
        semester: 'PCEM2'
      },
      include: {
        chapters: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          }
        }
      }
    });

    if (!anatomie) {
      console.log('⏭️  [Migration] Anatomie PCEM2 non trouvée, skip');
      return;
    }

    // Mapping des titres vers le bon orderIndex
    const chapterOrderMapping: { [key: string]: number } = {
      // Groupe 1: Anatomie de la tête et du cou (chapitres 1-12)
      'OSTÉOLOGIE DU CRÂNE': 1,
      'CHAPITRE 2 — APPAREIL MANDUCATEUR': 2,
      'CHAPITRE 3 — LES MUSCLES DE LA TÊTE ET DU COU': 3,
      'CHAPITRE 4 — LES VAISSEAUX DE LA TÊTE ET DU COU': 4,
      'CHAPITRE 5 — LES LYMPHATIQUES DE LA TÊTE ET DU COU': 5,
      'CHAPITRE 6 — APPAREIL DE VISION': 6,
      'CHAPITRE 7 — LES FOSSES NASALES': 7,
      'CHAPITRE 8 — OREILLE': 8,
      'CHAPITRE 9 — PHARYNX ET LARYNX': 9,
      'CHAPITRE 10 — THYROÏDE ET LARYNX SUPÉRIEUR': 10,
      'CHAPITRE 11 — LES VOIES NERVEUSES': 11,
      'CHAPITRE 12 — EMBRYOLOGIE DU SYSTÈME NERVEUX': 12,

      // Groupe 2: Neuroanatomie (chapitres 13-22)
      'Chapitre 1 – Organisation générale du système nerveux': 13,
      'Chapitre 2 – Moelle épinière et voies nerveuses': 14,
      'Chapitre 3 – Tronc cérébral et nerfs crâniens': 15,
      'Chapitre 4 – Cervelet et coordination motrice (niveau sélectif : 0–2 réponses justes)': 16,
      'Chapitre 5 – Diencéphale (Thalamus, Hypothalamus, Épithalamus, Métathalamus)': 17,
      'Chapitre 6 – Télencéphale et cortex cérébral': 18,
      'Chapitre 7 – Système limbique et formation réticulée': 19,
      'Chapitre 8 – Système nerveux périphérique et autonome': 20,
      'Chapitre 9 – Vascularisation du système nerveux': 21,
      'Chapitre 10 – Méninges, Ventricules et Liquide Cérébrospinal': 22
    };

    // Vérifier si des chapitres ont besoin d'être corrigés
    const chaptersToFix = anatomie.chapters.filter(ch => {
      const expectedOrder = chapterOrderMapping[ch.title];
      return expectedOrder !== undefined && ch.orderIndex !== expectedOrder;
    });

    if (chaptersToFix.length === 0) {
      console.log('✅ [Migration] Ordre des chapitres Anatomie PCEM2 déjà correct');
      return;
    }

    console.log(`🔄 [Migration] ${chaptersToFix.length} chapitres à corriger...`);

    // Mettre à jour les chapitres
    for (const chapter of chaptersToFix) {
      const newOrderIndex = chapterOrderMapping[chapter.title];

      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { orderIndex: newOrderIndex }
      });

      console.log(`  ✓ "${chapter.title.substring(0, 50)}..." → orderIndex ${newOrderIndex}`);
    }

    console.log(`✅ [Migration] Ordre des chapitres Anatomie PCEM2 corrigé (${chaptersToFix.length} chapitres mis à jour)`);

  } catch (error) {
    console.error('❌ [Migration] Erreur lors de la correction de l\'ordre des chapitres:', error);
    // Ne pas faire échouer le démarrage du serveur
  }
}
