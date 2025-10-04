import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  mobileMenuOpen = signal(false);

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(e: Event) {
    e.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    // Best-effort prevention for some capture keys (non-guaranteed)
    const blockedKeys = ['PrintScreen'];
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }
}