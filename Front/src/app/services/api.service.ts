import { Injectable, NgZone } from '@angular/core';
import type { Account, Budget, Category, DashboardData, Project, SavingGoal, Task, Transaction } from '../models';

const BASE = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private ngZone: NgZone) {}

  private async req<T>(path: string, opts?: RequestInit): Promise<T> {
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', 'x-user-id': '1', ...opts?.headers },
        ...opts
      });
      if (res.status === 204) return undefined as T;
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API Error ${res.status}: ${body.slice(0, 100)}`);
      }
      const data: T = await res.json();
      return this.ngZone.run(() => data);
    } catch (err) {
      console.error(`API ${opts?.method || 'GET'} ${path} failed:`, err);
      return this.ngZone.run(() => { throw err; });
    }
  }

  getDashboard() { return this.req<DashboardData>('/dashboard'); }

  getAccounts() { return this.req<Account[]>('/accounts'); }
  createAccount(d: Partial<Account>) { return this.req<Account>('/accounts', { method: 'POST', body: JSON.stringify(d) }); }
  updateAccount(id: number, d: Partial<Account>) { return this.req<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  deleteAccount(id: number) { return this.req<void>(`/accounts/${id}`, { method: 'DELETE' }); }

  depositAccount(id: number, amount: number, opts?: { categoryId?: number; description?: string; date?: string; goalId?: number }) {
    return this.req<Transaction>(`/accounts/${id}/deposit`, { method: 'POST', body: JSON.stringify({ amount, categoryId: opts?.categoryId, description: opts?.description, date: opts?.date, goalId: opts?.goalId }) });
  }

  getCategories() { return this.req<Category[]>('/categories'); }
  getCategorySummary() { return this.req<any[]>('/categories/summary'); }
  createCategory(d: Partial<Category>) { return this.req<Category>('/categories', { method: 'POST', body: JSON.stringify(d) }); }
  updateCategory(id: number, d: Partial<Category>) { return this.req<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }

  getTransactions(params?: string) { return this.req<{ transactions: Transaction[]; total: number }>(`/transactions?${params || ''}`); }
  getMonthlyTransactions(year: string, month: string) { return this.req<any>(`/transactions/monthly/${year}/${month}`); }
  getTransactionOverview(period: string, date?: string) { return this.req<any>(`/transactions/overview?period=${period}${date ? `&date=${date}` : ''}`); }
  createTransaction(d: Partial<Transaction>) { return this.req<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(d) }); }
  updateTransaction(id: number, d: Partial<Transaction>) { return this.req<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  deleteTransaction(id: number) { return this.req<void>(`/transactions/${id}`, { method: 'DELETE' }); }

  getInvestmentPlans() { return this.req<any>('/investment-plans'); }
  createInvestmentPlan(d: any) { return this.req<any>('/investment-plans', { method: 'POST', body: JSON.stringify(d) }); }
  updateInvestmentPlan(id: number, d: any) { return this.req<any>(`/investment-plans/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  deleteInvestmentPlan(id: number) { return this.req<void>(`/investment-plans/${id}`, { method: 'DELETE' }); }
  executeInvestmentPlan(id: number) { return this.req<any>(`/investment-plans/${id}/execute`, { method: 'POST' }); }

  getBudgets() { return this.req<Budget[]>('/budgets'); }
  getBudgetOverview(year: string, month: string) { return this.req<any[]>(`/budgets/overview/${year}/${month}`); }
  createBudget(d: Partial<Budget>) { return this.req<Budget>('/budgets', { method: 'POST', body: JSON.stringify(d) }); }

  getSavings() { return this.req<SavingGoal[]>('/savings'); }
  createSavingGoal(d: Partial<SavingGoal>) { return this.req<SavingGoal>('/savings', { method: 'POST', body: JSON.stringify(d) }); }
  updateSavingGoal(id: number, d: Partial<SavingGoal>) { return this.req<SavingGoal>(`/savings/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  deleteSavingGoal(id: number) { return this.req<void>(`/savings/${id}`, { method: 'DELETE' }); }

  getTasks(params?: string) { return this.req<Task[]>(`/tasks?${params || ''}`); }
  createTask(d: Partial<Task>) { return this.req<Task>('/tasks', { method: 'POST', body: JSON.stringify(d) }); }
  updateTask(id: number, d: Partial<Task>) { return this.req<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  deleteTask(id: number) { return this.req<void>(`/tasks/${id}`, { method: 'DELETE' }); }

  getProjects() { return this.req<Project[]>('/projects'); }
  createProject(d: Partial<Project>) { return this.req<Project>('/projects', { method: 'POST', body: JSON.stringify(d) }); }
  updateProject(id: number, d: Partial<Project>) { return this.req<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  deleteProject(id: number) { return this.req<void>(`/projects/${id}`, { method: 'DELETE' }); }

  getProfile() { return this.req<any>('/profile'); }
  updateProfile(d: any) { return this.req<any>('/profile', { method: 'PUT', body: JSON.stringify(d) }); }

  getTransfers() { return this.req<any[]>('/transfers'); }
  transfer(fromAccountId: number, toAccountId: number, amount: number, description?: string) {
    return this.req<any>('/transfers', { method: 'POST', body: JSON.stringify({ fromAccountId, toAccountId, amount, description }) });
  }

  getMonthlyReport(year: string, month: string) { return this.req<any>(`/report/monthly/${year}/${month}`); }

  processRecurring() { return this.req<any>('/recurring/process', { method: 'POST' }); }
}
