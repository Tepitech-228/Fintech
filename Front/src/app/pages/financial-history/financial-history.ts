import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { formatCFA } from '../../services/format';

@Component({
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
<div class="page">
  <div class="flex items-center justify-between">
    <div><h1 class="page-title">Historique Financier</h1><p class="page-subtitle">Toutes les opérations filtrées par période</p></div>
  </div>

  <div class="card mb-4">
    <div class="flex items-center gap-4" style="flex-wrap:wrap">
      <div style="min-width:120px"><label>Période</label>
        <select [(ngModel)]="period" (change)="loadOverview()">
          <option value="day">Jour</option>
          <option value="week">Semaine</option>
          <option value="month">Mois</option>
          <option value="year">Année</option>
        </select>
      </div>
      <div><label>Date de référence</label><input type="date" [(ngModel)]="refDate" (change)="loadOverview()"></div>
    </div>

    @if (overview) {
      <div class="grid-4 gap-3 mt-4">
        <div class="card-stat"><span class="text-muted text-sm">Revenus</span><strong class="income">{{format(overview.totals?.income || 0)}}</strong></div>
        <div class="card-stat"><span class="text-muted text-sm">Dépenses</span><strong class="expense">{{format(overview.totals?.expense || 0)}}</strong></div>
        <div class="card-stat"><span class="text-muted text-sm">Investissements</span><strong>{{format(overview.totals?.investment || 0)}}</strong></div>
        <div class="card-stat"><span class="text-muted text-sm">Dettes</span><strong>{{format(overview.totals?.debt || 0)}}</strong></div>
      </div>
    }
  </div>

  <div class="card table-responsive">
    <table class="table">
      <thead>
        <tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Compte</th><th class="amount">Montant</th></tr>
      </thead>
      <tbody>
        @for (t of transactions; track t.id) {
          <tr>
            <td class="text-sm text-muted">{{t.date | date:'dd/MM/yyyy'}}</td>
            <td>{{t.description || '-'}}</td>
            <td><span class="badge badge-neutral">{{t.Category?.name || '-'}}</span></td>
            <td class="text-sm text-muted">{{t.Account?.name || '-'}}</td>
            <td class="amount" [class.income]="t.type==='income'" [class.expense]="t.type==='expense' || t.type==='debt'">
              {{(t.type==='income' ? '+' : '-')}}{{format(t.amount)}}
            </td>
          </tr>
        } @empty {
          <tr><td colspan="5"><div class="empty-state"><p>Aucune opération sur cette période</p></div></td></tr>
        }
      </tbody>
    </table>
  </div>
</div>`,
  styles: ['.income { color: var(--secondary) } .expense { color: var(--tertiary) }']
})
export class FinancialHistoryPage implements OnInit, OnDestroy {
  period = 'month';
  refDate = new Date().toISOString().slice(0, 10);
  overview: any = null;
  transactions: any[] = [];
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const resolved = this.route.snapshot.data as { financialHistory?: { overview: any; transactions: any[] } };
    if (resolved?.financialHistory) {
      this.overview = resolved.financialHistory.overview;
      this.transactions = resolved.financialHistory.transactions;
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        const d = res['financialHistory'];
        if (d) { this.overview = d.overview; this.transactions = d.transactions; }
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  loadOverview() {
    this.api.getTransactionOverview(this.period, this.refDate).then((res: any) => {
      this.overview = res;
      this.transactions = res.transactions || [];
    });
  }

  format = formatCFA;
}
