import { getApiUrl } from "./api";

const API_BASE_URL = getApiUrl();

class AdminApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin-auth-storage");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.token = parsed.state?.token || null;
        } catch {
          this.token = null;
        }
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        this.setToken(null);
      }
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    return this.request<{
      accessToken: string;
      admin: { id: string; username: string };
    }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async getProfile() {
    return this.request<{
      id: string;
      username: string;
      lastLogin: string;
      createdAt: string;
    }>("/admin/profile");
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>("/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Stats
  async getOverviewStats() {
    return this.request<OverviewStats>("/admin/stats/overview");
  }

  async getUserStats() {
    return this.request<UserStats>("/admin/stats/users");
  }

  async getPaymentStats() {
    return this.request<PaymentStats>("/admin/stats/payments");
  }

  async getTechnicalStats() {
    return this.request<TechnicalStats>("/admin/stats/technical");
  }

  async getRecentSignups(limit = 10) {
    return this.request<RecentSignup[]>(
      `/admin/stats/recent-signups?limit=${limit}`,
    );
  }

  async getRecentPayments(limit = 10) {
    return this.request<RecentPayment[]>(
      `/admin/stats/recent-payments?limit=${limit}`,
    );
  }

  // Users
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.tier) searchParams.set("tier", params.tier);

    return this.request<PaginatedResponse<AdminUser>>(
      `/admin/users?${searchParams}`,
    );
  }

  async getUserDetail(id: string) {
    return this.request<AdminUserDetail>(`/admin/users/${id}`);
  }

  async deleteSubscription(memberId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/users/${memberId}/subscription`,
      { method: "DELETE" },
    );
  }

  // Payments
  async listPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.status) searchParams.set("status", params.status);
    if (params.startDate) searchParams.set("startDate", params.startDate);
    if (params.endDate) searchParams.set("endDate", params.endDate);
    if (params.search) searchParams.set("search", params.search);

    return this.request<PaymentListResponse>(`/admin/payments?${searchParams}`);
  }

  async getPaymentSummary() {
    return this.request<PaymentSummary[]>("/admin/payments/summary");
  }

  async getFinancialSummary() {
    return this.request<FinancialSummary>("/admin/payments/financial-summary");
  }

  // Notifications
  async sendNotification(
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    return this.request<{ success: boolean; sentTo: number }>(
      "/admin/alerts/send",
      {
        method: "POST",
        body: JSON.stringify({ title, body, data }),
      },
    );
  }

  async getNotificationHistory(page = 1, limit = 20) {
    return this.request<PaginatedResponse<NotificationHistory>>(
      `/admin/alerts/history?page=${page}&limit=${limit}`,
    );
  }

  // Site Visit Analytics
  async getSiteVisitMetrics(days = 30) {
    return this.request<SiteVisitMetrics>(
      `/admin/stats/site-visits?days=${days}`,
    );
  }
}

// Types
export interface OverviewStats {
  members: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  subscriptions: {
    active: number;
    byTier: {
      BRONZE: number;
      SILVER: number;
      GOLD: number;
    };
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
  payments: {
    pending: number;
    completedThisMonth: number;
    failedThisMonth: number;
  };
  sms: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

export interface UserStats {
  signupsPerDay: { date: string; count: number }[];
  subscriptionDistribution: {
    tier: string;
    isActive: boolean;
    count: number;
  }[];
}

export interface PaymentStats {
  paymentsPerDay: {
    date: string;
    completed: number;
    failed: number;
    revenue: number;
  }[];
  paymentMethods: { method: string; count: number; totalAmount: number }[];
}

export interface TechnicalStats {
  sms: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    byStatus: { status: string; count: number }[];
    recentLogs: {
      id: string;
      phoneNumber: string;
      status: string;
      createdAt: string;
    }[];
  };
  deviceTokens: { platform: string; count: number }[];
  blockchain: {
    transactionsByStatus: { status: string; count: number }[];
  };
}

export interface RecentSignup {
  id: string;
  phoneNumber: string;
  fullName: string | null;
  createdAt: string;
  subscription: { tier: string; isActive: boolean } | null;
}

export interface RecentPayment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  member: { phoneNumber: string; fullName: string | null };
}

export interface AdminUser {
  id: string;
  phoneNumber: string;
  fullName: string | null;
  location: string | null;
  isVerified: boolean;
  createdAt: string;
  subscription: {
    tier: string;
    isActive: boolean;
    monthlyAmount: number;
    startDate: string;
  } | null;
  _count: { contributions: number; claims: number };
}

export interface AdminUserDetail extends AdminUser {
  contributions: any[];
  claims: any[];
  nfts: any[];
  deviceTokens: { id: string; platform: string; createdAt: string }[];
  stats: {
    totalContributed: number;
    contributionCount: number;
    claimCount: number;
    nftCount: number;
  };
}

export interface PaymentListResponse {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totalAmount: number;
  };
}

export interface PaymentSummary {
  status: string;
  count: number;
  totalAmount: number;
}

export interface FinancialSummary {
  collected: { total: number; thisMonth: number; thisYear: number };
  disbursed: { total: number; thisMonth: number; thisYear: number };
  netBalance: number;
  recentDisbursals: Array<{
    id: string;
    amount: number;
    claimType: string;
    memberName: string;
    memberPhone: string;
    txHash: string | null;
    processedAt: string | null;
  }>;
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  sentTo: number;
  sentBy: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const adminApi = new AdminApiClient(API_BASE_URL);

export interface SiteVisitMetrics {
  summary: {
    totalVisits: number;
    uniqueSessions: number;
    todayVisits: number;
    days: number;
  };
  visitsPerDay: { date: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  topUtmSources: { source: string; count: number }[];
  topUtmCampaigns: { campaign: string; count: number }[];
  topPages: { page: string; count: number }[];
}
