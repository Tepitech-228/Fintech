import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import type { Account, Category, SavingGoal } from '../../models';
import type { TransactionFormData } from '../../resolvers/data.resolver';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './transaction-form.html'
})
export class TransactionForm implements OnInit, OnDestroy {
  isEdit = false;
  editId?: number;
  allCategories: Category[] = [];
  accounts: Account[] = [];
  goals: SavingGoal[] = [];
  categorySummary: any[] = [];
  form: any = { type: 'expense', amount: null, description: '', categoryId: '', accountId: '', goalId: '', date: new Date().toISOString().slice(0, 10) };
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  get filteredCategories() {
    return this.allCategories.filter(c => c.type === this.form.type);
  }

  get showGoalSelector() {
    return this.goals.length > 0 && (this.form.type === 'investment' || this.form.type === 'income' || this.form.type === 'debt');
  }

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

  format = (v: number) => new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';

  private applyFormData(data: TransactionFormData) {
    this.allCategories = data.categories;
    this.accounts = data.accounts;
    this.goals = data.goals || [];
    this.categorySummary = data.categorySummary || [];
    if (data.editTransaction) {
      this.isEdit = true;
      this.editId = this.route.snapshot.params['id'];
      const t = data.editTransaction;
      this.form = { type: t.type || 'expense', amount: t.amount, description: t.description, categoryId: t.categoryId, accountId: t.accountId, goalId: t.goalId || '', date: t.date };
    }
  }

  ngOnInit() {
    const resolved = this.route.snapshot.data as { transactionForm?: TransactionFormData };
    if (resolved?.transactionForm) {
      this.applyFormData(resolved.transactionForm);
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        this.applyFormData(res['transactionForm']);
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  onCategoryChange() {
    if (!this.form.categoryId) return;
    const cat = this.allCategories.find(c => c.id === Number(this.form.categoryId));
    if (!cat) return;
    this.form.type = cat.type;
    const accountMap: Record<string, string> = {
      income: 'checking',
      expense: 'checking',
      investment: 'investment',
      debt: 'credit'
    };
    const targetType = accountMap[cat.type];
    const match = this.accounts.find(a => a.type === targetType);
    if (match) this.form.accountId = match.id;
  }

  formatBalance(b: number) { return b.toLocaleString('fr-FR') + ' FCFA'; }

  save() {
    const data: any = { ...this.form, amount: parseFloat(this.form.amount) || 0, categoryId: Number(this.form.categoryId), accountId: Number(this.form.accountId), status: 'completed' };
    if (this.form.goalId) data.goalId = Number(this.form.goalId); else delete data.goalId;
    if (this.isEdit && this.editId) {
      this.api.updateTransaction(this.editId, data).then(() => this.router.navigate(['/transactions']));
    } else {
      this.api.createTransaction(data).then(() => this.router.navigate(['/transactions']));
    }
  }
}
