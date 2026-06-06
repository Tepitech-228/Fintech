import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import type { Account, Category, DashboardData, Project, SavingGoal, Task, Transaction } from '../models';

export interface MonthlyTrendItem {
  label: string;
  inc: number;
  exp: number;
}

function buildMonthlyRange(monthCount = 6) {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
    return {
      year: String(d.getFullYear()),
      month: String(d.getMonth() + 1).padStart(2, '0'),
      label: d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '')
    };
  });
}

async function loadTrendData(api: ApiService, monthCount = 6): Promise<MonthlyTrendItem[]> {
  const months = buildMonthlyRange(monthCount);
  const results = await Promise.allSettled(
    months.map(({ year, month }) => api.getMonthlyTransactions(year, month).catch(() => ({ transactions: [] })))
  );
  return results.map((result, index) => {
    const txns = result.status === 'fulfilled' ? result.value.transactions || [] : [];
    return {
      label: months[index].label,
      inc: txns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0),
      exp: txns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0)
    };
  });
}

export interface DashboardRouteData extends DashboardData {
  trendData: MonthlyTrendItem[];
}

export const dashboardResolver: ResolveFn<DashboardRouteData> = async () => {
  const api = inject(ApiService);
  const [dashboard, trendData] = await Promise.all([api.getDashboard(), loadTrendData(api)]);
  return { ...dashboard, trendData };
};

export interface PortefeuilleData {
  dashboard: DashboardData;
  accounts: Account[];
  categorySummary: any[];
  projects: Project[];
  tasks: Task[];
}

export interface PortefeuilleRouteData extends PortefeuilleData {
  monthlyCashflow: MonthlyTrendItem[];
}

export const portefeuilleResolver: ResolveFn<PortefeuilleRouteData> = async () => {
  const api = inject(ApiService);
  const [dashboard, accounts, categorySummary, projects, tasks, monthlyCashflow] = await Promise.all([
    api.getDashboard(),
    api.getAccounts(),
    api.getCategorySummary(),
    api.getProjects(),
    api.getTasks(),
    loadTrendData(api)
  ]);
  return { dashboard, accounts, categorySummary, projects, tasks, monthlyCashflow };
};

export const accountsResolver: ResolveFn<Account[]> = () =>
  inject(ApiService).getAccounts();

export interface TransactionsData {
  categories: Category[];
  accounts: Account[];
  savings: SavingGoal[];
  transactions: Transaction[];
  categorySummary: any[];
}

export const transactionsResolver: ResolveFn<TransactionsData> = () => {
  const api = inject(ApiService);
  return Promise.all([
    api.getCategories(),
    api.getAccounts(),
    api.getSavings(),
    api.getTransactions(),
    api.getCategorySummary()
  ]).then(([categories, accounts, savings, txns, categorySummary]) => ({
    categories, accounts, savings, transactions: txns.transactions, categorySummary
  }));
};

export interface BudgetAnalysisData {
  accounts: Account[];
  categorySummary: any[];
  budgetOverview: any[];
}

export const budgetAnalysisResolver: ResolveFn<BudgetAnalysisData> = () => {
  const api = inject(ApiService);
  const d = new Date();
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return Promise.all([
    api.getAccounts(),
    api.getCategorySummary(),
    api.getBudgetOverview(y, m)
  ]).then(([accounts, categorySummary, budgetOverview]) => ({
    accounts, categorySummary, budgetOverview
  }));
};

export const savingsResolver: ResolveFn<SavingGoal[]> = () =>
  inject(ApiService).getSavings();

export interface ProjectsTasksData {
  projects: Project[];
  tasks: Task[];
}

export const projectsTasksResolver: ResolveFn<ProjectsTasksData> = () => {
  const api = inject(ApiService);
  return Promise.all([
    api.getProjects(),
    api.getTasks()
  ]).then(([projects, tasks]) => ({ projects, tasks }));
};

export const bilanResolver: ResolveFn<any> = () => {
  const d = new Date();
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return inject(ApiService).getMonthlyReport(year, month);
};

export const settingsResolver: ResolveFn<any> = () =>
  inject(ApiService).getProfile();

export interface TransactionFormData {
  categories: Category[];
  accounts: Account[];
  goals: SavingGoal[];
  categorySummary: any[];
  editTransaction?: any;
}

export const transactionFormResolver: ResolveFn<TransactionFormData> = (route) => {
  const api = inject(ApiService);
  const id = route.params['id'];
  return Promise.all([
    api.getCategories(),
    api.getAccounts(),
    api.getSavings(),
    api.getCategorySummary(),
    id ? api.getTransactions(`id=${id}`).then(r => r.transactions?.[0]) : Promise.resolve(undefined)
  ]).then(([categories, accounts, goals, categorySummary, editTx]) => ({
    categories, accounts, goals, categorySummary, editTransaction: editTx
  }));
};

export interface CalendarData {
  transactions: any[];
  tasks: Task[];
  projects: Project[];
}

export interface FinancialHistoryData {
  overview: any;
  transactions: any[];
}

export const financialHistoryResolver: ResolveFn<FinancialHistoryData> = () => {
  const api = inject(ApiService);
  const d = new Date();
  const period = 'month';
  const date = d.toISOString().slice(0, 10);
  return api.getTransactionOverview(period, date).then((res: any) => ({
    overview: res,
    transactions: res.transactions || []
  }));
};

export const calendarResolver: ResolveFn<CalendarData> = () => {
  const api = inject(ApiService);
  const d = new Date();
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return Promise.all([
    api.getMonthlyTransactions(year, month),
    api.getTasks(),
    api.getProjects()
  ]).then(([txnsRes, tasks, projects]) => ({
    transactions: (txnsRes as any)?.transactions || [],
    tasks, projects
  }));
};
