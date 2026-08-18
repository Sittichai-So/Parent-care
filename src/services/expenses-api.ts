import { apiDelete, apiGet, apiPost, apiPut } from './api-client';

export type ExpenseCategory = 'medicine' | 'treatment' | 'transport' | 'other';

export type ApiExpense = {
  _id: string;
  householdId: string;
  memberId: { _id: string; displayName: string; relation: string };
  title: string;
  category: ExpenseCategory;
  amount: number;
  note: string | null;
  spentAt: string;
  createdByMemberId: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseInput = {
  memberId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  spentAt?: string;
};

export type ApiExpenseSummary = {
  month: string;
  total: number;
  count: number;
  /** `pct` per category is pre-rounded so the set always sums to exactly
   *  100 (the largest slice absorbs any rounding drift) — render as-is,
   *  don't recompute. */
  categories: { category: ExpenseCategory; label: string; amount: number; count: number; pct: number }[];
};

export const getExpenses = (
  householdId: string,
  options?: { memberId?: string; category?: ExpenseCategory; month?: string }
) =>
  apiGet<ApiExpense[]>(`/households/${householdId}/expenses`, {
    memberId: options?.memberId,
    category: options?.category,
    month: options?.month,
  });

/** Defaults to the current month server-side when `month` is omitted. */
export const getExpenseSummary = (householdId: string, month?: string) =>
  apiGet<ApiExpenseSummary>(`/households/${householdId}/expenses/summary`, { month });

export const createExpense = (householdId: string, input: ExpenseInput) =>
  apiPost<ApiExpense>(`/households/${householdId}/expenses`, input);

export const updateExpense = (householdId: string, expenseId: string, patch: Partial<ExpenseInput>) =>
  apiPut<ApiExpense>(`/households/${householdId}/expenses/${expenseId}`, patch);

export const deleteExpense = (householdId: string, expenseId: string) =>
  apiDelete<null>(`/households/${householdId}/expenses/${expenseId}`);