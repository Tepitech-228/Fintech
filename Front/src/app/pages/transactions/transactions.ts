import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { formatCFA } from '../../services/format';
import type { Transaction, Category, Account, InvestmentPlan } from '../../models';
import type { SavingGoal } from '../../models';
import type { TransactionsData } from '../../resolvers/data.resolver';

@Component({
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './transactions.html'
})
export class TransactionsPage implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  categories: Category[] = [];
  accounts: Account[] = [];
  goals: SavingGoal[] = [];
  categorySummary: any[] = [];
  investmentPlans: InvestmentPlan[] = [];
  filters = { type: '', categoryId: '', startDate: '', endDate: '' };

  showForm = false;
  showPlanForm = false;
  form: any = { type: 'expense', amount: null, description: '', categoryId: '', accountId: '', goalId: '', date: new Date().toISOString().slice(0, 10) };
  planForm: any = { name: '', amount: null, frequency: 'monthly', startDate: new Date().toISOString().slice(0, 10), endDate: '', targetAmount: null, savingGoalId: '', isActive: true };
  transactionError = '';

  overviewPeriod = 'month';
  overviewDate = new Date().toISOString().slice(0, 10);
  overview: any = { totals: { income: 0, expense: 0, investment: 0, debt: 0 }, balance: 0, count: 0 };
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const resolved = this.route.snapshot.data as { transactions?: TransactionsData };
    if (resolved?.transactions) {
      this.setup(resolved.transactions);
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        this.setup(res['transactions']);
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  private setup(data: TransactionsData) {
    this.categories = data.categories;
    this.accounts = data.accounts;
    this.goals = data.savings;
    this.categorySummary = data.categorySummary || [];
    this.transactions = data.transactions;
    this.loadOverview();
    this.loadInvestmentPlans();
  }

  load() {
    const p = new URLSearchParams();
    if (this.filters.type) p.set('type', this.filters.type);
    if (this.filters.categoryId) p.set('categoryId', this.filters.categoryId);
    if (this.filters.startDate) p.set('startDate', this.filters.startDate);
    if (this.filters.endDate) p.set('endDate', this.filters.endDate);
    this.api.getTransactions(p.toString()).then(d => this.transactions = d.transactions);
    this.loadOverview();
  }

  loadOverview() {
    this.api.getTransactionOverview(this.overviewPeriod, this.overviewDate).then(result => {
      this.overview = result;
    });
  }

  loadInvestmentPlans() {
    this.api.getInvestmentPlans().then(plans => {
      this.investmentPlans = plans;
    });
  }

  format = formatCFA;

  get selectedCategoryBudget() {
    if (!this.form.categoryId) return null;
    const id = Number(this.form.categoryId);
    return this.categorySummary.find((c: any) => c.id === id) || null;
  }

  get selectedCategoryBudgetPct() {
    const b = this.selectedCategoryBudget;
    if (!b || !b.monthlyBudget) return 0;
    return Math.min((b.monthlySpent / b.monthlyBudget) * 100, 100);
  }

  get selectedCategoryBudgetColor() {
    const p = this.selectedCategoryBudgetPct;
    return p > 90 ? 'var(--error)' : p > 70 ? 'var(--warning)' : 'var(--secondary)';
  }

  deleteTxn(id: number) {
    if (confirm('Supprimer cette transaction ?')) this.api.deleteTransaction(id).then(() => this.load());
  }

  onCategoryChange() {
    if (!this.form.categoryId) return;
    const categoryId = Number(this.form.categoryId);
    this.form.categoryId = categoryId;
    const cat = this.categories.find(c => c.id === categoryId);
    if (!cat) return;
    this.form.type = cat.type;

    if (cat.accountId) {
      this.form.accountId = cat.accountId;
    } else {
      const accountMap: Record<string, string> = {
        income: 'checking', expense: 'checking', investment: 'investment', debt: 'credit'
      };
      const match = this.accounts.find(a => a.type === accountMap[cat.type]);
      if (match) this.form.accountId = match.id;
    }
  }

  save() {
    this.transactionError = '';
    const categoryId = Number(this.form.categoryId);
    const accountId = Number(this.form.accountId);
    const amount = Number(this.form.amount);

    if (Number.isNaN(categoryId) || categoryId <= 0) {
      this.transactionError = 'Veuillez choisir une catégorie.';
      return;
    }
    if (Number.isNaN(accountId) || accountId <= 0) {
      this.transactionError = 'Veuillez choisir un compte.';
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      this.transactionError = 'Veuillez saisir un montant valide.';
      return;
    }

    const data: any = {
      ...this.form,
      amount,
      categoryId,
      accountId,
      status: 'completed'
    };
    if (this.form.goalId) data.goalId = Number(this.form.goalId); else delete data.goalId;
    this.api.createTransaction(data).then(() => {
      this.form = { type: 'expense', amount: null, description: '', categoryId: '', accountId: '', goalId: '', date: new Date().toISOString().slice(0, 10) };
      this.showForm = false;
      this.load();
    }).catch((err: any) => {
      this.transactionError = err.message || 'Erreur lors de la création de la transaction.';
    });
  }

  savePlan() {
    const data: any = {
      name: this.planForm.name,
      amount: parseFloat(this.planForm.amount) || 0,
      frequency: this.planForm.frequency,
      startDate: this.planForm.startDate,
      endDate: this.planForm.endDate || null,
      targetAmount: parseFloat(this.planForm.targetAmount) || 0,
      savingGoalId: Number(this.planForm.savingGoalId),
      nextExecutionDate: this.planForm.startDate,
      isActive: this.planForm.isActive
    };
    this.api.createInvestmentPlan(data).then(() => {
      this.planForm = { name: '', amount: null, frequency: 'monthly', startDate: new Date().toISOString().slice(0, 10), endDate: '', targetAmount: null, savingGoalId: '', isActive: true };
      this.showPlanForm = false;
      this.loadInvestmentPlans();
    });
  }

  executeInvestmentPlan(id: number) {
    this.api.executeInvestmentPlan(id).then(() => {
      this.loadInvestmentPlans();
      this.loadOverview();
    });
  }

  formatBalance(b: number) { return b.toLocaleString('fr-FR') + ' FCFA'; }

  processRecurring() {
    this.api.processRecurring().then((res: any) => {
      alert(`${res.created} transaction(s) récurrente(s) générée(s)`);
      this.load();
    });
  }
}
