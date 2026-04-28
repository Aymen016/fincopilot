const API_URL = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1`;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function handleUnauthorized() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const apiClient = {
  // Auth
  getMe: () => request<any>("/auth/me"),
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string; token_type: string }>("/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    }),
  register: (full_name: string, email: string, password: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ full_name, email, password }) }),

  // Expenses
  getExpenses: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return request<any>(`/expenses${qs ? `?${qs}` : ""}`);
  },
  createExpense: (data: any) => request("/expenses", { method: "POST", body: JSON.stringify(data) }),
  updateExpense: (id: string, data: any) => request(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteExpense: (id: string) => request(`/expenses/${id}`, { method: "DELETE" }),
  uploadCSV: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const token = getToken();
    return fetch(`${API_URL}/expenses/bulk`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async (r) => {
      if (r.status === 401) { handleUnauthorized(); throw new Error("Session expired"); }
      return r.json();
    });
  },
  getJobStatus: (jobId: string) => request<any>(`/expenses/jobs/${jobId}`),

  // Categories
  getCategories: () => request<any[]>("/categories"),
  correctCategory: (expenseId: string, categoryId: string) =>
    request("/categories/correct", { method: "POST", body: JSON.stringify({ expense_id: expenseId, correct_category_id: categoryId }) }),

  // Budgets
  getBudgets: () => request<any[]>("/budgets"),
  createBudget: (data: any) => request("/budgets", { method: "POST", body: JSON.stringify(data) }),
  deleteBudget: (id: string) => request(`/budgets/${id}`, { method: "DELETE" }),
  getBudgetAlerts: () => request<any[]>("/budgets/alerts"),

  // Goals
  getGoals: () => request<any[]>("/goals"),
  createGoal: (data: any) => request("/goals", { method: "POST", body: JSON.stringify(data) }),
  updateGoal: (id: string, data: any) => request(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteGoal: (id: string) => request(`/goals/${id}`, { method: "DELETE" }),
  depositGoal: (id: string, amount: number, note?: string) =>
    request(`/goals/${id}/deposit`, { method: "PATCH", body: JSON.stringify({ amount, note }) }),
  getGoalPlan: (id: string) => request<any>(`/goals/${id}/plan`),

  // Insights
  getInsights: () => request<any[]>("/insights"),
  dismissInsight: (id: string) => request(`/insights/${id}/dismiss`, { method: "POST" }),

  // Forecast
  getMonthlyForecast: () => request<any>("/forecast/monthly"),
  getForecastRisk: () => request<any>("/forecast/risk"),

  // Health Score
  getHealthScore: () => request<any>("/health-score"),
};
