import { getApiUrl } from "./api";

const API_BASE_URL = getApiUrl();

class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("admin-auth-storage");
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    } catch {
      return null;
    }
  }

  setToken(token: string | null) {
    // This method is kept for backward compatibility but token is now read dynamically
    if (typeof window !== "undefined" && token) {
      const stored = localStorage.getItem("admin-auth-storage");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.state.token = token;
          localStorage.setItem("admin-auth-storage", JSON.stringify(parsed));
        } catch {
          // Ignore
        }
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Always read fresh token from store
    const token = this.getToken();

    // Log authentication state before request
    console.log(`[AdminAPI] Request to ${endpoint}`, {
      hasToken: !!token,
      method: options.method || "GET",
      timestamp: new Date().toISOString(),
    });

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (fetchError) {
      console.error(`[AdminAPI] Network error on ${endpoint}:`, fetchError);
      throw new Error("Network error. Please check your connection.");
    }

    // Log response status
    console.log(`[AdminAPI] Response from ${endpoint}`, {
      status: response.status,
      ok: response.ok,
      timestamp: new Date().toISOString(),
    });

    if (!response.ok) {
      // Parse error response
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = "Request failed";
      }

      // Log error details without modifying auth state
      console.error(`[AdminAPI] Error on ${endpoint}:`, {
        status: response.status,
        message: errorMessage,
        endpoint,
        timestamp: new Date().toISOString(),
      });

      // Only handle 401 for /auth/me endpoint (token validation)
      // Other 401s might be permission issues, not invalid tokens
      if (
        response.status === 401 &&
        endpoint === "/admin/auth/me" &&
        typeof window !== "undefined"
      ) {
        console.warn(
          "[AdminAPI] 401 on auth check - clearing auth and redirecting",
        );
        // Clear auth and redirect to login
        localStorage.removeItem("admin-auth-storage");
        if (
          window.location.pathname.startsWith("/admin") &&
          window.location.pathname !== "/admin/login"
        ) {
          window.location.href = "/admin/login";
        }
      }

      throw new Error(errorMessage);
    }

    // Parse and return successful response
    try {
      const data = await response.json();
      console.log(`[AdminAPI] Success on ${endpoint}`, {
        hasData: !!data,
        timestamp: new Date().toISOString(),
      });
      return data;
    } catch (parseError) {
      console.error(
        `[AdminAPI] Failed to parse response from ${endpoint}:`,
        parseError,
      );
      throw new Error("Failed to parse server response");
    }
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

  // Clinics
  async listClinics(status?: string) {
    const params = status ? `?status=${status}` : "";
    return this.request<AdminClinic[]>(`/admin/clinics${params}`);
  }

  async getClinicDetail(id: string) {
    return this.request<AdminClinic>(`/admin/clinics/${id}`);
  }

  async approveClinic(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/clinics/${id}/approve`,
      { method: "POST" },
    );
  }

  async suspendClinic(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/clinics/${id}/suspend`,
      { method: "POST" },
    );
  }

  async rejectClinic(id: string, reason: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/clinics/${id}/reject`,
      { method: "POST", body: JSON.stringify({ reason }) },
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

  // Notifications (Legacy Alerts System)
  async sendAlert(title: string, body: string, data?: Record<string, string>) {
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

  async getSMSStats() {
    return this.request<SMSStats>("/admin/notifications/sms-stats");
  }

  async getNotificationHistoryV2(params: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.type) searchParams.set("type", params.type);
    if (params.status) searchParams.set("status", params.status);
    if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params.dateTo) searchParams.set("dateTo", params.dateTo);

    return this.request<NotificationHistoryResponse>(
      `/admin/notifications/history?${searchParams}`,
    );
  }

  async previewRecipients(filters: RecipientFilters) {
    return this.request<{ count: number }>("/admin/notifications/preview", {
      method: "POST",
      body: JSON.stringify({ filters }),
    });
  }

  async sendNotification(request: SendNotificationRequest) {
    return this.request<SendNotificationResponse>("/admin/notifications/send", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Site Visit Analytics
  async getSiteVisitMetrics(days = 30) {
    return this.request<SiteVisitMetrics>(
      `/admin/stats/site-visits?days=${days}`,
    );
  }

  // Payment Search and Management
  async searchPayments(params: {
    transactionId?: string;
    phoneNumber?: string;
    email?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params.transactionId)
      searchParams.set("transactionId", params.transactionId);
    if (params.phoneNumber) searchParams.set("phoneNumber", params.phoneNumber);
    if (params.email) searchParams.set("email", params.email);
    if (params.status) searchParams.set("status", params.status);
    if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params.dateTo) searchParams.set("dateTo", params.dateTo);

    return this.request<PaymentDetailResponse[]>(
      `/admin/payments/search?${searchParams}`,
    );
  }

  async getPaymentDetail(transactionId: string) {
    return this.request<PaymentDetailResponse>(
      `/admin/payments/${transactionId}`,
    );
  }

  // Member Search and Management
  async searchMembers(params: {
    phoneNumber?: string;
    email?: string;
    memberId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params.phoneNumber) searchParams.set("phoneNumber", params.phoneNumber);
    if (params.email) searchParams.set("email", params.email);
    if (params.memberId) searchParams.set("memberId", params.memberId);

    return this.request<MemberDetailResponse[]>(
      `/admin/members/search?${searchParams}`,
    );
  }

  async getMemberDetail(memberId: string) {
    return this.request<MemberDetailResponse>(`/admin/members/${memberId}`);
  }

  // Admin Actions
  async suspendMember(targetId: string, reason: string) {
    return this.request<AdminActionResponse>("/admin/actions/suspend-member", {
      method: "POST",
      body: JSON.stringify({ targetId, reason }),
    });
  }

  async deactivateSubscription(targetId: string, reason: string) {
    return this.request<AdminActionResponse>(
      "/admin/actions/deactivate-subscription",
      {
        method: "POST",
        body: JSON.stringify({ targetId, reason }),
      },
    );
  }

  async verifyPaymentManually(targetId: string, reason: string) {
    return this.request<AdminActionResponse>("/admin/actions/verify-payment", {
      method: "POST",
      body: JSON.stringify({ targetId, reason }),
    });
  }

  // Payment Reconciliation
  async reconcilePayments(from: string, to: string) {
    return this.request<ReconciliationReport>(
      "/admin/reconciliation/payments",
      {
        method: "POST",
        body: JSON.stringify({ from, to }),
      },
    );
  }

  async syncPaymentStatus(paymentId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/admin/reconciliation/sync/${paymentId}`,
      {
        method: "POST",
      },
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

export interface SMSStats {
  todayCount: number;
  allTimeCount: number;
}

export interface NotificationRecord {
  id: string;
  type: "SMS" | "PUSH";
  recipientCount: number;
  message: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "PARTIAL";
  deliveryStats: {
    successCount: number;
    failureCount: number;
  };
  sentAt: string;
  sentBy: string;
}

export interface NotificationHistoryResponse {
  notifications: NotificationRecord[];
  total: number;
  page: number;
  pageSize: number;
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

export interface AdminClinic {
  id: string;
  name: string;
  subCounty: string;
  physicalLocation: string;
  leadDentistName: string;
  ownerPhone: string;
  managerName?: string;
  whatsappNumber: string;
  email?: string;
  mpesaTillOrPaybill: string;
  tillPaybillName: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
  rejectionReason?: string;
  approvedAt?: string;
  activeDentalChairs: number;
  kmpdcRegNumber?: string;
  createdAt: string;
  _count: { staffUsers: number };
}

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

export interface RecipientFilters {
  packageTypes?: string[];
  dateJoinedFrom?: string;
  dateJoinedTo?: string;
  balanceMin?: string;
  balanceMax?: string;
  subscriptionStatus?: "active" | "inactive" | "all";
  singlePhoneNumber?: string;
  csvPhoneNumbers?: string[];
}

export interface SendNotificationRequest {
  type: "SMS" | "PUSH";
  filters: Record<string, string | string[]>;
  message: string;
}

export interface SendNotificationResponse {
  success: boolean;
  notificationId: string;
  recipientCount: number;
}

export interface PaymentDetailResponse {
  id: string;
  transactionId: string;
  userId: string;
  userPhone: string;
  userEmail: string;
  amount: number;
  status: string;
  subscriptionType: string;
  paymentFrequency: "MONTHLY" | "ANNUAL";
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  claimLimitsAssigned: boolean;
  claimLimitsAssignedAt?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    metadata?: any;
  }>;
  sasaPayData: {
    merchantRequestId?: string;
    checkoutRequestId?: string;
    mpesaReceiptNumber?: string;
  };
  relatedLinks: {
    userProfile: string;
    subscription: string;
    claims: string[];
  };
}

export interface MemberDetailResponse {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  location: string;
  registrationDate: string;
  accountStatus: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  subscription: {
    tier: "BRONZE" | "SILVER" | "GOLD";
    status: "ACTIVE" | "INACTIVE";
    startDate: string;
    paymentFrequency: "MONTHLY" | "ANNUAL";
    annualCapLimit: number;
    annualCapUsed: number;
    remainingLimit: number;
  };
  paymentHistory: Array<{
    id: string;
    transactionId: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  claimSummary: {
    totalClaims: number;
    totalAmountClaimed: number;
    remainingLimit: number;
  };
  waitingPeriodStatus: {
    consultationsExtractions: {
      available: boolean;
      daysRemaining: number;
    };
    restorativeProcedures: {
      available: boolean;
      daysRemaining: number;
    };
  };
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
  updatedRecord: any;
  auditLogId: string;
}

export interface ReconciliationReport {
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalPayments: number;
    matchedPayments: number;
    discrepancies: number;
  };
  discrepancies: Array<{
    paymentId: string;
    transactionId: string;
    localStatus: string;
    sasaPayStatus: string;
    amount: number;
    createdAt: string;
  }>;
}
