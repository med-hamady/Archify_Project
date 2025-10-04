import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snack: MatSnackBar) {}
  success(message: string) {
    this.snack.open(message, 'OK', { duration: 3000, panelClass: ['bg-green-600','text-white'] as any });
  }
  error(message: string) {
    this.snack.open(message, 'OK', { duration: 4000, panelClass: ['bg-red-600','text-white'] as any });
  }
  info(message: string) {
    this.snack.open(message, undefined, { duration: 2500 });
  }
}
