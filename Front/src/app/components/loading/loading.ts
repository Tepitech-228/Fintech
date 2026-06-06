import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-loading',
  template: '<div class="loading-spinner" [style.height.px]="height"><div class="spinner"></div><p class="loading-text">{{text}}</p></div>',
  styles: [`
    .loading-spinner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; }
    .spinner { width: 1.5rem; height: 1.5rem; border: 2px solid var(--surface-container-high); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.6s linear infinite; }
    .loading-text { font-size: 0.8125rem; color: var(--on-surface-variant); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingComponent {
  @Input() height = 200;
  @Input() text = 'Chargement...';
}
