import { getApiUrl } from "./api";

const API_BASE_URL = getApiUrl();

export interface Staff {
  id: string;
  username: string;
  fullName: string;
  role: "STAFF" | "ADMIN";
  branch?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface StaffLoginResponse {
  accessToken: string;
  staff: Staff;
}

export interface MemberSearchResult {
  found: boolean;
  active?: boolean;
  member?: {
    id: string;
    phoneNumber: string;
    fullName: string | null;
    tier?: string;
  };
  subscription?: {
    tier: string;
    isActive: boolean;
  };
  claimLimit?: {
    allocated: number;
    used: number;
    remaining: number;
  };
  message?: string;
}

export interface CheckInResponse {
  visit: {
    id: string;
    memberId: string;
    status: string;
    checkedInAt: string;
    totalCost: number;
  };
  member: {
    id: string;
    fullName: string | null;
    phoneNumber: string;
    tier: string;
  };
  claimLimit: {
    allocated: number;
    used: number;
    remaining: number;
  } | null;
}

export interface Procedure {
  id: string;
  code: string;
  name: string;
  description: string | null;
  cost: number;
  allowedTiers: string[];
  isActive: boolean;
}

export interface VisitProcedure {
  id: string;
  visitId: string;
  procedureId: string;
  cost: number;
  addedAt: string;
  addedBy: string;
  procedure: Procedure;
}

export interface OpenVisit {
  visit: {
    id: string;
    memberId: string;
    status: string;
    totalCost: number;
    checkedInAt: string;
    procedures: VisitProcedure[];
  };
  member: {
    id: string;
    phoneNumber: string;
    fullName: string | null;
    subscription: {
      tier: string;
      isActive: boolean;
    } | null;
  };
  remainingLimit: number;
  allocatedLimit: number;
}

export interface DischargeResponse {
  visit: {
    id: string;
    status: string;
    dischargedAt: string;
  };
  claims: Array<{
    id: string;
    amount: number;
    description: string;
  }>;
  summary: {
    totalCost: number;
    proceduresCount: number;
    newRemainingLimit: number;
    allocatedLimit: number;
  };
}

class StaffApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("staffToken");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("staffToken", token);
      } else {
        localStorage.removeItem("staffToken");
      }
    }
  }

  getToken() {
    return this.token;
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

  // Staff auth
  async login(username: string, password: string): Promise<StaffLoginResponse> {
    return this.request<StaffLoginResponse>("/staff/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async getProfile(): Promise<Staff> {
    return this.request<Staff>("/staff/profile");
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>("/staff/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Visits
  async searchMember(phoneNumber: string): Promise<MemberSearchResult> {
    return this.request<MemberSearchResult>("/visits/search", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async checkIn(phoneNumber: string): Promise<CheckInResponse> {
    return this.request<CheckInResponse>("/visits/check-in", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async getOpenVisit(memberId: string): Promise<OpenVisit | null> {
    try {
      return await this.request<OpenVisit>(`/visits/open/${memberId}`);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        return null;
      }
      throw error;
    }
  }

  async addProcedure(
    visitId: string,
    procedureId: string,
  ): Promise<{ visit: OpenVisit["visit"]; remainingLimit: number }> {
    return this.request<{ visit: OpenVisit["visit"]; remainingLimit: number }>(
      "/visits/add-procedure",
      {
        method: "POST",
        body: JSON.stringify({ visitId, procedureId }),
      },
    );
  }

  async dischargeVisit(visitId: string): Promise<DischargeResponse> {
    return this.request<DischargeResponse>(`/visits/discharge/${visitId}`, {
      method: "POST",
    });
  }

  // Procedures
  async getProcedures(): Promise<Procedure[]> {
    return this.request<Procedure[]>("/procedures");
  }

  async getProceduresForTier(tier: string): Promise<Procedure[]> {
    return this.request<Procedure[]>(`/procedures/tier/${tier}`);
  }

  // Camps
  async getCamps(): Promise<Camp[]> {
    return this.request<Camp[]>("/camps");
  }

  async getUpcomingCamps(): Promise<Camp[]> {
    return this.request<Camp[]>("/camps/upcoming");
  }

  async getNearbyCamps(
    lat: number,
    lon: number,
    radius: number = 50,
  ): Promise<Array<Camp & { distanceKm: number }>> {
    return this.request<Array<Camp & { distanceKm: number }>>(
      `/camps/nearby?lat=${lat}&lon=${lon}&radius=${radius}`,
    );
  }

  async createCamp(data: CreateCampDto): Promise<Camp> {
    return this.request<Camp>("/camps", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCamp(id: string, data: Partial<CreateCampDto>): Promise<Camp> {
    return this.request<Camp>(`/camps/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCamp(id: string): Promise<void> {
    return this.request<void>(`/camps/${id}`, {
      method: "DELETE",
    });
  }

  async registerForCamp(
    campId: string,
    memberId: string,
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/camps/${campId}/register`, {
      method: "POST",
      body: JSON.stringify({ memberId }),
    });
  }

  async cancelRegistration(
    campId: string,
    memberId: string,
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/camps/${campId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ memberId }),
    });
  }

  async getMemberRegistrations(
    memberId: string,
  ): Promise<Array<{ id: string; camp: Camp; status: string }>> {
    return this.request<Array<{ id: string; camp: Camp; status: string }>>(
      `/camps/member/${memberId}`,
    );
  }

  async getMembers(branch?: string): Promise<StaffPortalMember[]> {
    const url = branch ? `/staff/members?branch=${branch}` : "/staff/members";
    return this.request<StaffPortalMember[]>(url);
  }

  async getStaffUsers(branch?: string, role?: string): Promise<Staff[]> {
    const params = new URLSearchParams();
    if (branch) params.append("branch", branch);
    if (role) params.append("role", role);
    const url = params.toString()
      ? `/staff/users?${params.toString()}`
      : "/staff/users";
    return this.request<Staff[]>(url);
  }

  // Dashboard & Stats
  async getStats(): Promise<{
    branchMemberCount: number;
    upcomingCamps: Array<{
      id: string;
      name: string;
      expectedMembers: number;
      startDate: string;
      venue: string;
    }>;
    totalClaimsPending: number;
  }> {
    return this.request("/staff/stats");
  }

  // Staff Management
  async enrollStaff(data: StaffEnrollmentData): Promise<Staff> {
    return this.request<Staff>("/staff/enroll", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Claims
  async getStaffClaims(
    status?: string,
    memberId?: string,
  ): Promise<StaffPortalClaim[]> {
    let url = "/claims/staff";
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (memberId) params.append("memberId", memberId);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request<StaffPortalClaim[]>(url);
  }

  // Communication
  async sendBulkSms(
    phoneNumbers: string[],
    message: string,
  ): Promise<BulkSmsResponse> {
    return this.request<BulkSmsResponse>("/staff/bulk-sms", {
      method: "POST",
      body: JSON.stringify({ phoneNumbers, message }),
    });
  }
}

export interface Camp {
  id: string;
  name: string;
  description?: string;
  venue: string;
  address: string;
  startDate: string;
  endDate: string;
  capacity: number;
  isActive: boolean;
  _count?: {
    registrations: number;
  };
}

export interface CreateCampDto {
  name: string;
  description?: string;
  venue: string;
  address: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  capacity: number;
}

export interface DischargeResponse {
  message: string;
  totalCost: number;
}

export interface BulkSmsResponse {
  total: number;
  successful: number;
  failed: number;
  error?: string;
}

export interface StaffPortalMember {
  id: string;
  phoneNumber: string;
  fullName: string | null;
  branch: string | null;
  subscription?: {
    tier: string;
    isActive: boolean;
  };
}

export interface StaffPortalClaim {
  id: string;
  claimType: string;
  description: string;
  amount: number;
  status: string;
  txHash: string | null;
  createdAt: string;
  member: {
    fullName: string | null;
    phoneNumber: string;
  };
}

export interface StaffEnrollmentData {
  username: string;
  password?: string;
  fullName: string;
  role: string;
  branch?: string;
}

export const staffApi = new StaffApiClient();
