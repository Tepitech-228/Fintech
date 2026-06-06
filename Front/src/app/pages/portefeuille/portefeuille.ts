import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChartConfiguration } from 'chart.js';
import { ChartComponent } from '../../components/chart/chart';
import { ApiService } from '../../services/api.service';
import { formatCFA } from '../../services/format';
import type { Project, Task } from '../../models';
import type { PortefeuilleData } from '../../resolvers/data.resolver';

@Component({
  standalone: true,
  imports: [RouterLink, ChartComponent],
  templateUrl: './portefeuille.html',
  styleUrl: './portefeuille.css'
})
export class PortefeuillePage implements OnInit, OnDestroy {
  loading = true;
  dailyExpense = 0;
  monthlyExpense = 0;
  totalValue = 0;
  projects: Project[] = [];
  tasks: Task[] = [];
  accounts: any[] = [];
  distribution: { label: string; pct: number; color: string }[] = [];
  categorySummary: { name: string; color: string; total: number; pct: number }[] = [];
  movements: any[] = [];

  donutConfig?: ChartConfiguration<'doughnut'>;
  barConfig?: ChartConfiguration<'bar'>;
  distConfig?: ChartConfiguration<'doughnut'>;
  cashflowConfig?: ChartConfiguration<'line'>;

  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const resolved = this.route.snapshot.data as { portefeuille?: PortefeuilleData & { monthlyCashflow?: { label: string; inc: number; exp: number }[] } };
    if (resolved?.portefeuille) {
      this.setup(resolved.portefeuille);
    } else {
      this.dataSub = this.route.data.subscribe((data: any) => {
        this.setup(data['portefeuille']);
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  private setup(d: PortefeuilleData & { monthlyCashflow?: { label: string; inc: number; exp: number }[] }) {
    if (!d) return;

    this.monthlyExpense = d.dashboard.monthlyExpense || 0;
    this.dailyExpense = Math.round((d.dashboard.monthlyExpense || 0) / 30);

    this.accounts = d.accounts;
    this.totalValue = d.accounts.reduce((s: number, a: any) => s + Math.max(parseFloat(a.balance), 0), 0);
    const positive = d.accounts.filter((a: any) => parseFloat(a.balance) > 0);
    const total = positive.reduce((s: number, a: any) => s + parseFloat(a.balance), 0) || 1;
    this.distribution = positive.map((a: any) => ({
      label: a.name, pct: Math.round((parseFloat(a.balance) / total) * 100), color: a.color || '#6366f1'
    }));
    this.movements = d.accounts.map((a: any) => ({
      name: a.name, category: a.type === 'checking' ? 'Courant' : a.type === 'savings' ? 'Épargne' : a.type === 'credit' ? 'Crédit' : 'Autre',
      icon: a.type === 'checking' ? '🏦' : a.type === 'savings' ? '🐷' : '💳',
      value: Math.abs(parseFloat(a.balance)), status: parseFloat(a.balance) >= 0 ? 'Stable' : 'Volatil'
    }));
    this.distConfig = {
      type: 'doughnut',
      data: {
        labels: this.distribution.map(d => d.label),
        datasets: [{ data: this.distribution.map(d => d.pct), backgroundColor: this.distribution.map(d => d.color), borderWidth: 0, hoverOffset: 4 }]
      },
      options: { responsive: true, cutout: '70%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed}%` } } } }
    };

    const catTotal = d.categorySummary.reduce((s: number, c: any) => s + c.total, 0) || 1;
    this.categorySummary = d.categorySummary.slice(0, 5).map((c: any) => ({
      name: c.name, color: c.color, total: c.total, pct: Math.round((c.total / catTotal) * 100)
    }));
    this.donutConfig = {
      type: 'doughnut',
      data: {
        labels: this.categorySummary.map(c => c.name),
        datasets: [{ data: this.categorySummary.map(c => c.pct), backgroundColor: this.categorySummary.map(c => c.color), borderWidth: 0, hoverOffset: 4 }]
      },
      options: { responsive: true, cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed}%` } } } }
    };

    this.projects = d.projects.slice(0, 3);
    this.tasks = d.tasks.filter((t: any) => t.status !== 'done').slice(0, 3);

    this.loading = false;
    this.buildMonthlyChart();
  }

  private buildMonthlyChart() {
    const now = new Date();
    const months: { label: string; exp: number; inc: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
      months[i] = { label, exp: 0, inc: 0 };
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

      this.barConfig = {
        type: 'bar',
        data: {
          labels: months.map(m => m.label),
          datasets: [{
            label: 'Dépenses', data: months.map(m => m.exp),
            backgroundColor: months.map((_, idx) => idx === 5 ? 'var(--primary)' : 'var(--primary-fixed-dim)'),
            borderRadius: 6, borderSkipped: false
          }]
        },
        options: {
          responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${Number(ctx.raw).toLocaleString('fr-FR')} FCFA` } } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => `${Number(Number(v)/1000).toFixed(0)}k` } } }
        }
      };
      this.cashflowConfig = {
        type: 'line',
        data: {
          labels: months.map(m => m.label),
          datasets: [
            { label: 'Revenus', data: months.map(m => m.inc), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 },
            { label: 'Dépenses', data: months.map(m => m.exp), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 }
          ]
        },
        options: {
          responsive: true, interaction: { intersect: false, mode: 'index' },
          plugins: { legend: { position: 'top', labels: { boxWidth: 10, padding: 10, font: { size: 10, family: 'Inter' } } }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('fr-FR')} FCFA` } } },
          scales: { x: { grid: { display: false }, ticks: { font: { size: 9, family: 'Inter' } } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 9, family: 'Inter' }, callback: (v: any) => `${(Number(v)/1000).toFixed(0)}k` } } }
        }
      };
    });
  }

  private buildPortfolioCharts(months: { label: string; exp: number; inc: number }[]) {
    this.barConfig = {
      type: 'bar',
      data: {
        labels: months.map(m => m.label),
        datasets: [{
          label: 'Dépenses', data: months.map(m => m.exp),
          backgroundColor: months.map((_, idx) => idx === 5 ? 'var(--primary)' : 'var(--primary-fixed-dim)'),
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${Number(ctx.raw).toLocaleString('fr-FR')} FCFA` } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => `${Number(Number(v)/1000).toFixed(0)}k` } } }
      }
    };
    this.cashflowConfig = {
      type: 'line',
      data: {
        labels: months.map(m => m.label),
        datasets: [
          { label: 'Revenus', data: months.map(m => m.inc), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 },
          { label: 'Dépenses', data: months.map(m => m.exp), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { position: 'top', labels: { boxWidth: 10, padding: 10, font: { size: 10, family: 'Inter' } } }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('fr-FR')} FCFA` } } },
        scales: { x: { grid: { display: false }, ticks: { font: { size: 9, family: 'Inter' } } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 9, family: 'Inter' }, callback: (v: any) => `${(Number(v)/1000).toFixed(0)}k` } } }
      }
    };
  }

  formatFCFA(v: number) { return formatCFA(v); }

  getDeadlineLabel(t: any) {
    if (!t.dueDate) return 'Pas de date';
    const diff = Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Aujourd\'hui';
    if (diff === 1) return 'Demain';
    return `${diff} jours`;
  }
}
