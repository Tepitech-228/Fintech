export interface User {
  id: number; name: string; email: string; currency: string; locale: string; theme: string;
}

export interface Account {
  id: number; userId: number; name: string; type: string; balance: number; currency: string; color: string; icon: string;
}

export interface Category {
  id: number; userId: number; name: string; type: 'income' | 'expense' | 'investment' | 'debt'; color: string; icon: string;
  accountId?: number; Account?: { id: number; name: string }; monthlyBudget?: number;
}

export interface Transaction {
  id: number; userId: number; accountId: number; categoryId: number; goalId?: number;
  type: 'income' | 'expense' | 'investment' | 'debt'; amount: number;
  description: string; date: string; isRecurring: boolean; recurringInterval: string; status: string;
  Category?: Category; Account?: Account;
}

export interface Budget {
  id: number; userId: number; categoryId: number; month: string; amount: number; spent: number;
  remaining?: number; Category?: Category;
}

export interface SavingGoal {
  id: number; userId: number; name: string; targetAmount: number; currentAmount: number; deadline: string; color: string; icon: string;
}

export interface Task {
  id: number; userId: number; title: string; description: string; dueDate: string; priority: string; status: string; category: string;
}

export interface Project {
  id: number; userId: number; name: string; description: string; budget: number; spent: number; status: string; startDate: string; endDate: string; color: string;
}

export interface InvestmentPlan {
  id: number;
  userId: number;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  targetAmount: number;
  savingGoalId: number;
  nextExecutionDate: string;
  isActive: boolean;
  SavingGoal?: SavingGoal;
}

export interface DashboardData {
  totalBalance: number; monthlyIncome: number; monthlyExpense: number; monthlyBalance: number;
  accounts: Account[]; goals: SavingGoal[]; tasks: Task[]; recentTransactions: Transaction[];
}
