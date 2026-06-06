import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { formatCFA } from '../../services/format';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bilan.html',
  styleUrl: './bilan.css'
})
export class BilanPage implements OnInit, OnDestroy {
  year: string;
  month: string;
  data: any = null;
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {
    const d = new Date();
    this.year = String(d.getFullYear());
    this.month = String(d.getMonth() + 1).padStart(2, '0');
  }

  ngOnInit() {
    const resolved = this.route.snapshot.data as { bilan?: any };
    if (resolved?.bilan) {
      this.data = resolved.bilan;
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        this.data = res['bilan'];
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  load() {
    this.data = null;
    this.api.getMonthlyReport(this.year, this.month).then(d => this.data = d);
  }

  format = formatCFA;

  getMonthLabel() {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[parseInt(this.month) - 1]} ${this.year}`;
  }

  getSavingsColor(rate: number) {
    if (rate >= 20) return 'var(--success)';
    if (rate >= 10) return 'var(--warning)';
    return 'var(--tertiary)';
  }
}
