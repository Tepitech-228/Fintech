import { Routes } from '@angular/router';
import { Sidebar } from './layouts/sidebar';
import { DashboardPage } from './pages/dashboard/dashboard';
import { AccountsPage } from './pages/accounts/accounts';
import { TransactionsPage } from './pages/transactions/transactions';
import { BudgetAnalysisPage } from './pages/budget-analysis/budget-analysis';
import { SavingsPage } from './pages/savings/savings';
import { ProjectsTasksPage } from './pages/projects-tasks/projects-tasks';
import { PortefeuillePage } from './pages/portefeuille/portefeuille';
import { SettingsPage } from './pages/settings/settings';
import { TransactionForm } from './pages/transaction-form/transaction-form';
import { CalendarPage } from './pages/calendar/calendar';
import { BilanPage } from './pages/bilan/bilan';
import { FinancialHistoryPage } from './pages/financial-history/financial-history';
import {
  dashboardResolver,
  portefeuilleResolver,
  accountsResolver,
  transactionsResolver,
  budgetAnalysisResolver,
  savingsResolver,
  projectsTasksResolver,
  bilanResolver,
  settingsResolver,
  transactionFormResolver,
  calendarResolver,
  financialHistoryResolver
} from './resolvers/data.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Sidebar,
    children: [
      { path: '', component: DashboardPage, resolve: { dashboard: dashboardResolver }, runGuardsAndResolvers: 'always' },
      { path: 'portefeuille', component: PortefeuillePage, resolve: { portefeuille: portefeuilleResolver }, runGuardsAndResolvers: 'always' },
      { path: 'accounts', component: AccountsPage, resolve: { accounts: accountsResolver }, runGuardsAndResolvers: 'always' },
      { path: 'history', component: FinancialHistoryPage, resolve: { financialHistory: financialHistoryResolver }, runGuardsAndResolvers: 'always' },
      { path: 'transactions', component: TransactionsPage, resolve: { transactions: transactionsResolver }, runGuardsAndResolvers: 'always' },
      { path: 'budget-analysis', component: BudgetAnalysisPage, resolve: { budgetAnalysis: budgetAnalysisResolver }, runGuardsAndResolvers: 'always' },
      { path: 'bilan', component: BilanPage, resolve: { bilan: bilanResolver }, runGuardsAndResolvers: 'always' },
      { path: 'savings', component: SavingsPage, resolve: { savings: savingsResolver }, runGuardsAndResolvers: 'always' },
      { path: 'projects-tasks', component: ProjectsTasksPage, resolve: { projectsTasks: projectsTasksResolver }, runGuardsAndResolvers: 'always' },
      { path: 'calendar', component: CalendarPage, resolve: { calendar: calendarResolver }, runGuardsAndResolvers: 'always' },
      { path: 'settings', component: SettingsPage, resolve: { settings: settingsResolver }, runGuardsAndResolvers: 'always' },
      { path: 'transaction/:id', component: TransactionForm, resolve: { transactionForm: transactionFormResolver }, runGuardsAndResolvers: 'always' }
    ]
  }
];
