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
  const controller = new AbortController();
  // Hugging Face Spaces sleep when idle and can take up to ~60s to cold-start,
  // so allow a generous timeout before giving up.
  const timeout = setTimeout(() => controller.abort(), 90000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.");
    }
    throw new Error("Can't reach the server. Please check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) {
    const hadToken = !!getToken();
    handleUnauthorized();
    if (hadToken) throw new Error("Session expired. Please log in again.");
    // No token → real auth error; surface the actual detail from the server
    const err = await res.json().catch(() => ({ detail: "Incorrect email or password" }));
    throw new Error(parseDetail(err.detail) || "Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(parseDetail(err.detail) || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// FastAPI error `detail` can be a string OR an array of validation-error objects.
// Normalise it to a readable message so the UI never shows "[object Object]".
function parseDetail(detail: unknown): string {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => (typeof d === "string" ? d : d?.msg || JSON.stringify(d)))
      .join(", ");
  }
  if (typeof detail === "object") {
    return (detail as any).msg || JSON.stringify(detail);
  }
  return String(detail);
}

export const apiClient = {
  // Auth
  getMe: () => request<any>("/auth/me"),
  login: (email: string) =>
    request<{ message: string }>("/auth/token", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  register: (full_name: string, email: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ full_name, email }) }),

  verifyEmail: (email: string, code: string) =>
    request("/auth/verify-email", { method: "POST", body: JSON.stringify({ email, code }) }),

  resendCode: (email: string) =>
    request<{ message: string }>("/auth/resend-code", { method: "POST", body: JSON.stringify({ email }) }),

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
    request(`/goals/${id}/deposit`, { method: "POST", body: JSON.stringify({ amount, note }) }),
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
