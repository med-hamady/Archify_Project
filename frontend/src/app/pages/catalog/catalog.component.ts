import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseSummary, MOCK_COURSES } from '../../shared/mock-data';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="container py-8">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-primary">Catalogue</h2>
        <div class="text-sm text-gray-500" *ngIf="filtered().length">{{ filtered().length }} résultats</div>
      </div>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select class="p-2 border rounded" (change)="onSemesterChange($event)">
          <option value="">Semestre</option>
          <option>S1</option><option>S2</option><option>S3</option><option>S4</option><option>S5</option><option>S6</option>
        </select>
        <select class="p-2 border rounded" (change)="onDeptChange($event)">
          <option value="">Département</option>
          <option>Informatique</option>
          <option>Gestion</option>
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

      <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <a *ngFor="let c of filtered()" [routerLink]="['/course', c.id]" class="card card-hover overflow-hidden">
          <div class="aspect-video relative bg-gray-100">
            <span *ngIf="c.premium" class="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Premium</span>
          </div>
          <div class="p-4">
            <div class="font-medium line-clamp-1">{{ c.title }}</div>
            <div class="text-sm text-gray-500">{{ c.professor }} • {{ c.semester }}</div>
            <div class="mt-2 flex flex-wrap gap-2">
              <span class="text-xs px-2 py-0.5 bg-gray-100 rounded" *ngFor="let t of c.tags">{{ t }}</span>
            </div>
          </div>
        </a>
      </div>
      <div *ngIf="filtered().length === 0" class="mt-16 text-center text-gray-500">
        <div class="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3"></div>
        <div>Aucun résultat</div>
      </div>
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
