import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseSummary, MOCK_COURSES } from '../../shared/mock-data';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-6 max-w-6xl mx-auto">
      <h2 class="text-2xl font-semibold text-blue-900">Catalogue</h2>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select class="p-2 border rounded" (change)="onSemesterChange($event)">
          <option value="">Semestre</option>
          <option>S1</option><option>S2</option><option>S3</option><option>S4</option><option>S5</option><option>S6</option>
        </select>
        <select class="p-2 border rounded" (change)="onDeptChange($event)">
          <option value="">Département</option>
          <option>Département A</option>
          <option>Département B</option>
        </select>
        <select class="p-2 border rounded" (change)="onSubjectChange($event)">
          <option value="">Matière</option>
          <option>Analyse</option><option>Algorithme</option><option>Logique</option>
        </select>
        <select class="p-2 border rounded" (change)="onSortChange($event)">
          <option value="">Tri</option>
          <option value="title">Titre (A→Z)</option>
        </select>
        <input type="text" class="p-2 border rounded" placeholder="Recherche…" (input)="onQueryChange($event)" />
      </div>

      <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a *ngFor="let c of filtered()" [routerLink]="['/course', c.id]" class="border rounded overflow-hidden shadow-sm hover:shadow p-4">
          <div class="aspect-video bg-gray-100"></div>
          <div class="mt-3">
            <div class="font-medium">{{ c.title }}</div>
            <div class="text-sm text-gray-500">{{ c.professor }} • {{ c.premium ? 'Premium' : 'Gratuit' }}</div>
          </div>
        </a>
      </div>
      <div *ngIf="filtered().length === 0" class="mt-8 text-center text-gray-500">Aucun résultat.</div>
    </div>
  `
})
export class CatalogComponent {
  private all = signal<CourseSummary[]>(MOCK_COURSES);
  private semester = signal<string>('');
  private dept = signal<string>('');
  private subject = signal<string>('');
  private sort = signal<string>('');
  private query = signal<string>('');

  protected filtered = computed(() => {
    let list = this.all();
    const q = this.query().toLowerCase();
    if (q) list = list.filter(c => c.title.toLowerCase().includes(q) || c.professor.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)));
    if (this.semester()) list = list.filter(c => c.semester === this.semester());
    if (this.dept()) list = list.filter(c => c.department === this.dept());
    if (this.subject()) list = list.filter(c => c.tags.some(t => t === this.subject()));
    if (this.sort() === 'title') list = [...list].sort((a,b) => a.title.localeCompare(b.title));
    return list;
  });

  onSemesterChange(e: Event){ this.semester.set((e.target as HTMLSelectElement).value); }
  onDeptChange(e: Event){ this.dept.set((e.target as HTMLSelectElement).value); }
  onSubjectChange(e: Event){ this.subject.set((e.target as HTMLSelectElement).value); }
  onSortChange(e: Event){ this.sort.set((e.target as HTMLSelectElement).value); }
  onQueryChange(e: Event){ this.query.set((e.target as HTMLInputElement).value); }
}
