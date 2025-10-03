import { AfterViewInit, Component, ElementRef, HostListener, inject, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-lesson',
  standalone: true,
  template: `
    <div class="p-6 max-w-4xl mx-auto select-none">
      <h2 class="text-2xl font-semibold text-blue-900">Leçon — Placeholder</h2>

      <!-- Video placeholder -->
      <div class="mt-4 aspect-video bg-gray-200 relative grid place-items-center rounded overflow-hidden">
        <video
          #videoEl
          class="w-full h-full object-cover"
          controls
          controlslist="nodownload noplaybackrate"
          playsinline
          disablepictureinpicture
          preload="metadata"
        >
          <!-- Intégration Vimeo à venir -->
        </video>
        <div class="absolute inset-0 pointer-events-none flex items-start justify-end p-2 opacity-80">
          <span class="text-[10px] bg-white/70 px-2 py-1 rounded shadow">Watermark — demo@archify • {{ watermarkNow }}</span>
        </div>
        <span class="absolute text-gray-600">Player vidéo (Vimeo) — à intégrer</span>
      </div>

      <!-- PDF placeholder -->
      <div class="mt-6 h-64 bg-gray-100 grid place-items-center rounded relative">
        <span class="text-gray-600">Visionneuse PDF — à intégrer</span>
        <div class="absolute inset-0 pointer-events-none flex items-start justify-end p-2 opacity-80">
          <span class="text-[10px] bg-white/70 px-2 py-1 rounded shadow">Watermark — demo@archify • {{ watermarkNow }}</span>
        </div>
      </div>

      <p class="mt-4 text-sm text-gray-500">PiP/AirPlay désactivés (si supportés), clic droit et téléchargement masqués côté UI.</p>
    </div>
  `
})
export class LessonComponent implements AfterViewInit {
  private readonly renderer = inject(Renderer2);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected watermarkNow = new Date().toLocaleString();

  ngAfterViewInit(): void {
    // Empêche Picture-in-Picture si possible
    const video = this.host.nativeElement.querySelector('video') as HTMLVideoElement | null;
    if (video) {
      try {
        // Certains navigateurs supportent disablePictureInPicture via attr + prop
        (video as any).disablePictureInPicture = true;
        // Désactiver AirPlay quand possible
        this.renderer.setAttribute(video, 'x-webkit-airplay', 'deny');
      } catch {
        // no-op
      }
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(e: Event) {
    e.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    // Bloque quelques captures basiques (non garanti)
    const blocked = ['PrintScreen'];
    if (blocked.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}
