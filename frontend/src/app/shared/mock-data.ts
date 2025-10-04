export interface CourseSummary {
  id: string;
  title: string;
  professor: string;
  department: string;
  semester: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';
  tags: string[];
  premium: boolean;
}

export const MOCK_COURSES: CourseSummary[] = [
  {
    id: '1',
    title: "Introduction — Analyse",
    professor: 'Prof. Dupont',
    department: 'Département A',
    semester: 'S1',
    tags: ['Analyse', 'Math'],
    premium: true
  },
  {
    id: '2',
    title: "Algorithme — Bases",
    professor: 'Prof. Martin',
    department: 'Département A',
    semester: 'S1',
    tags: ['Algorithme', 'Programmation'],
    premium: true
  },
  {
    id: '3',
    title: "Logique — Fondamentaux",
    professor: 'Prof. Bernard',
    department: 'Département B',
    semester: 'S2',
    tags: ['Logique'],
    premium: true
  }
];
