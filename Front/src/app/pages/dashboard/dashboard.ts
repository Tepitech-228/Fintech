import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChartConfiguration } from 'chart.js';
import { ApiService } from '../../services/api.service';
import { ChartComponent } from '../../components/chart/chart';
import { formatCFA } from '../../services/format';
import type { DashboardData, Task } from '../../models';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, ChartComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardPage implements OnInit, OnDestroy {
  data?: DashboardData;
  loading = true;
  month = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  trendConfig!: ChartConfiguration<'line'>;
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.dataSub = this.route.data.subscribe(res => {
      this.setup(res['dashboard']);
    });
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  private setup(d: DashboardData & { trendData?: { label: string; inc: number; exp: number }[] }) {
    this.data = d;
    this.loading = false;
    this.buildChart(d.trendData);
  }

  private buildChart(trendData?: { label: string; inc: number; exp: number }[]) {
    const months = trendData ?? [];
    if (months.length === 0) {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
        months[i] = { label, inc: 0, exp: 0 };
      }

      Promise.allSettled(
        months.map((_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const y = String(d.getFullYear());
          return this.api.getMonthlyTransactions(y, m).catch(() => ({ transactions: [] }));
        })
      ).then((results) => {
        results.forEach((res: any, i: number) => {
          const txns = res.value?.transactions || res?.transactions || [];
          months[i].inc = txns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
          months[i].exp = txns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
        });

        this.trendConfig = this.buildTrendConfig(months);
      });
    } else {
      this.trendConfig = this.buildTrendConfig(months);
    }
  }

  private buildTrendConfig(months: { label: string; inc: number; exp: number }[]): ChartConfiguration<'line'> {
    return {
      type: 'line',
      data: {
        labels: months.map(m => m.label),
        datasets: [{
          label: 'Dépenses',
          data: months.map(m => m.exp),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#6366f1', borderWidth: 2
        }, {
          label: 'Revenus',
          data: months.map(m => m.inc),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#10b981', borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 8, padding: 8, font: { size: 10, family: 'Inter' } } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y || 0).toLocaleString('fr-FR')} FCFA` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10, family: 'Inter' } } },
          y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 9, family: 'Inter' }, callback: (v: any) => `${(Number(v)/1000).toFixed(0)}k` } }
        }
      }
    };
  }

  format = formatCFA;

  toggleTask(t: Task) {
    const newStatus = t.status === 'done' ? 'todo' : 'done';
    this.api.updateTask(t.id, { status: newStatus }).then(() => {
      t.status = newStatus;
    });
  }
}
