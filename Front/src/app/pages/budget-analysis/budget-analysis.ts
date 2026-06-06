import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChartConfiguration } from 'chart.js';
import { ChartComponent } from '../../components/chart/chart';
import { ApiService } from '../../services/api.service';
import { formatCFA } from '../../services/format';
import type { Account } from '../../models';
import type { BudgetAnalysisData } from '../../resolvers/data.resolver';

@Component({
  standalone: true,
  imports: [FormsModule, ChartComponent],
  templateUrl: './budget-analysis.html'
})
export class BudgetAnalysisPage implements OnInit, OnDestroy {
  tab: 'analyse' | 'budgets' = 'analyse';

  summary: any[] = [];
  maxTotal = 0;
  donutConfig?: ChartConfiguration<'doughnut'>;

  budgets: any[] = [];
  month: string;
  barConfig?: ChartConfiguration<'bar'>;

  private resolvedBudgetAnalysis?: BudgetAnalysisData;

  showAddCat = false;
  newCat: any = { name: '', type: 'expense', color: '#6366f1', icon: 'category', accountId: '', monthlyBudget: '' };
  accounts: Account[] = [];

  showEditCat: any = null;
  editCat: any = {};

  showAddBudget = false;
  budgetForm = { categoryId: '', amount: 0 };

  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {
    const d = new Date();
    this.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  ngOnInit() {
    const resolved = this.route.snapshot.data as { budgetAnalysis?: BudgetAnalysisData };
    if (resolved?.budgetAnalysis) {
      this.applyBudgetData(resolved.budgetAnalysis);
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        const d = res['budgetAnalysis'] as BudgetAnalysisData;
        this.applyBudgetData(d);
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  private refreshAll() {
    if (this.resolvedBudgetAnalysis) {
      this.applyBudgetData(this.resolvedBudgetAnalysis);
    } else {
      this.loadSummary();
      this.loadBudgets();
    }
  }

  private buildDonut(d: any[]) {
    this.donutConfig = {
      type: 'doughnut',
      data: {
        labels: d.map(x => x.name),
        datasets: [{ data: d.map((x: any) => x.total), backgroundColor: d.map(x => x.color), borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        responsive: true, cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 10, padding: 12, font: { size: 10, family: 'Inter' } } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const val = typeof ctx.parsed === 'number' ? ctx.parsed : 0;
                return `${ctx.label}: ${this.format(val)} (${((val / total) * 100).toFixed(1)}%)`;
              }
            }
          }
        }
      }
    };
  }

  private buildBudgetBar(d: any[]) {
    this.barConfig = {
      type: 'bar',
      data: {
        labels: d.map((b: any) => b.Category?.name || '?'),
        datasets: [
          { label: 'Budget', data: d.map((b: any) => parseFloat(b.amount)), backgroundColor: '#6366f1', borderRadius: 4 },
          {
            label: 'Dépensé', data: d.map((b: any) => parseFloat(b.spent || 0)),
            backgroundColor: d.map((b: any) => {
              const p = b.amount ? ((b.spent || 0) / b.amount) * 100 : 0;
              return p > 90 ? '#ef4444' : p > 70 ? '#f59e0b' : '#10b981';
            }),
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { boxWidth: 8, padding: 8, font: { size: 10, family: 'Inter' } } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9, family: 'Inter' } } },
          y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 9, family: 'Inter' }, callback: (v: any) => `${(Number(v)/1000).toFixed(0)}k` } }
        }
      }
    };
  }

  private applyBudgetData(d: BudgetAnalysisData) {
    this.resolvedBudgetAnalysis = d;
    this.accounts = d.accounts;
    this.summary = d.categorySummary;
    this.maxTotal = Math.max(...this.summary.map((x: any) => x.total), 1);
    this.buildDonut(this.summary);
    this.budgets = d.budgetOverview;
    this.buildBudgetBar(this.budgets);
  }

  loadSummary() {
    this.api.getCategorySummary().then(d => {
      this.summary = d;
      this.maxTotal = Math.max(...d.map((x: any) => x.total), 1);
      this.buildDonut(d);
    });
  }

  loadBudgets() {
    const [y, m] = this.month.split('-');
    this.api.getBudgetOverview(y, m).then(d => {
      this.budgets = d;
      this.buildBudgetBar(d);
    });
  }

  addCategory() {
    const data: any = { name: this.newCat.name, type: this.newCat.type, color: this.newCat.color, icon: this.newCat.icon };
    if (this.newCat.accountId) data.accountId = Number(this.newCat.accountId);
    if (this.newCat.monthlyBudget) data.monthlyBudget = parseFloat(this.newCat.monthlyBudget);
    this.api.createCategory(data).then(() => {
      this.showAddCat = false;
      this.newCat = { name: '', type: 'expense', color: '#6366f1', icon: 'category', accountId: '', monthlyBudget: '' };
      this.loadSummary();
    });
  }

  startEdit(c: any) {
    this.showEditCat = c;
    this.editCat = {
      name: c.name, type: c.type, color: c.color, icon: c.icon,
      accountId: c.accountId || '',
      monthlyBudget: c.monthlyBudget || ''
    };
  }

  saveEdit() {
    const data: any = { name: this.editCat.name, type: this.editCat.type, color: this.editCat.color, icon: this.editCat.icon };
    if (this.editCat.accountId) data.accountId = Number(this.editCat.accountId); else data.accountId = null;
    if (this.editCat.monthlyBudget) data.monthlyBudget = parseFloat(this.editCat.monthlyBudget); else data.monthlyBudget = 0;
    this.api.updateCategory(this.showEditCat.id, data).then(() => {
      this.showEditCat = null;
      this.loadSummary();
    });
  }

  createBudget() {
    const [y, m] = this.month.split('-');
    const data = {
      categoryId: Number(this.budgetForm.categoryId),
      month: this.month,
      amount: this.budgetForm.amount
    };
    this.api.createBudget(data).then(() => {
      this.showAddBudget = false;
      this.budgetForm = { categoryId: '', amount: 0 };
      this.loadBudgets();
    });
  }

  getBudgetPct(c: any) {
    return c.monthlyBudget > 0 ? Math.min((c.monthlySpent / c.monthlyBudget) * 100, 100) : 0;
  }
  getBudgetColor(c: any) {
    const p = this.getBudgetPct(c);
    return p > 90 ? 'var(--error)' : p > 70 ? 'var(--warning)' : 'var(--secondary)';
  }

  getPercent(b: any) { return b.amount ? Math.min((b.spent || 0) / b.amount * 100, 100) : 0; }
  getColor(b: any) { const p = this.getPercent(b); return p > 90 ? 'var(--error)' : p > 70 ? 'var(--warning)' : 'var(--secondary)'; }
  format = formatCFA;
}
