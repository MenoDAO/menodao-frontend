import { getApiUrl } from "./api";

const API_BASE_URL = getApiUrl();

export interface Staff {
  id: string;
  username: string;
  fullName: string;
  role: "STAFF" | "ADMIN";
  branch?: string;
  clinicId?: string;
  lastLogin?: string;
  createdAt?: string;
  clinic?: {
    id: string;
    name: string;
    subCounty: string;
  };
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

export interface QuestionnaireData {
  age?: number;
  gender?: string;
  education?: string;
  occupation?: string;
  residenceVillage?: string;
  residenceCounty?: string;
  researchConsent: boolean;
  lastDentalVisit?: string;
  drugAllergies?: string;
  currentMedications?: string;
  medicalConditions?: string[];
  familyHistory?: string[];
  chiefComplaint?: string;
  painLevel?: number;
  recentSymptoms?: string[];
  brushingFrequency?: string;
  flossingFrequency?: string;
  sugarIntake?: string;
  smokesTobacco?: boolean;
  alcoholUse?: string;
  substanceUse?: boolean;
  oralHygieneIndex?: string;
  softTissueFindings?: string;
  periodontalStatus?: string;
  decayedTeeth?: number;
  missingTeeth?: number;
  filledTeeth?: number;
  dmftScore?: number;
  occlusionStatus?: string;
  cariesRisk?: string;
  periodontalRisk?: string;
  oralCancerRisk?: string;
  smileSatisfaction?: string;
  careConfidence?: string;
}

export interface CheckInDto {
  phoneNumber: string;
  chiefComplaint: string;
  medicalHistory?: string;
  vitals?: Record<string, unknown>;
  clinicalNotes?: string;
  hasConsent: boolean;
  questionnaire?: QuestionnaireData;
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
      // Only clear token if the profile validation endpoint returns 401
      // Other endpoints may return 401 for permission reasons without meaning
      // the token itself is invalid
      if (
        response.status === 401 &&
        typeof window !== "undefined" &&
        endpoint === "/staff/profile"
      ) {
        this.setToken(null);
      }

      // Try to parse error response
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    // Handle empty responses (204 No Content, etc.)
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return {} as T;
    }

    // Try to parse JSON response
    try {
      return await response.json();
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      throw new Error("Invalid response from server");
    }
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

  async checkIn(dto: CheckInDto): Promise<CheckInResponse> {
    return this.request<CheckInResponse>("/visits/check-in", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  async getOpenVisit(memberId: string): Promise<OpenVisit | null> {
    try {
      const response = await this.request<OpenVisit>(
        `/visits/open/${memberId}`,
      );

      // Check if response is an empty object or missing required fields
      if (
        !response ||
        typeof response !== "object" ||
        Object.keys(response).length === 0
      ) {
        return null;
      }

      // Validate that response has required structure
      if (!response.visit || !response.member) {
        console.warn("getOpenVisit returned incomplete data:", response);
        return null;
      }

      return response;
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

  async approveClaim(claimId: string): Promise<StaffPortalClaim> {
    return this.request<StaffPortalClaim>(`/claims/${claimId}/approve`, {
      method: "POST",
    });
  }

  async rejectClaim(
    claimId: string,
    reason: string,
  ): Promise<StaffPortalClaim> {
    return this.request<StaffPortalClaim>(`/claims/${claimId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
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

  // Clinics (staff view - approved only)
  async getClinics(): Promise<Clinic[]> {
    return this.request<Clinic[]>("/staff/clinics");
  }

  // Patient History
  async getPatientHistory(memberId: string): Promise<PatientHistory> {
    return this.request<PatientHistory>(`/visits/history/${memberId}`);
  }

  // Web3 / Filecoin / Hypercert
  async uploadCaseImages(
    visitId: string,
    beforeFile: File,
    afterFile: File,
  ): Promise<Web3UploadResult> {
    const formData = new FormData();
    formData.append("beforeImage", beforeFile);
    formData.append("afterImage", afterFile);

    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const res = await fetch(`${this.baseUrl}/web3/cases/${visitId}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Upload failed: ${res.status}`);
    }
    return res.json();
  }

  async processWeb3Case(visitId: string): Promise<Web3ProcessResult> {
    return this.request<Web3ProcessResult>(`/web3/cases/${visitId}/process`, {
      method: "POST",
    });
  }

  async getWeb3CaseStatus(visitId: string): Promise<Web3CaseStatus> {
    return this.request<Web3CaseStatus>(`/web3/cases/${visitId}/status`);
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
  tier: string;
}

export interface StaffPortalClaim {
  id: string;
  claimType: string;
  description: string;
  amount: number;
  status: string;
  rejectionReason: string | null;
  txHash: string | null;
  processedAt: string | null;
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

export interface Clinic {
  id: string;
  name: string;
  subCounty: string;
  physicalLocation: string;
  leadDentistName: string;
  ownerPhone: string;
  whatsappNumber: string;
  email: string | null;
  status: string;
  createdAt: string;
  approvedAt?: string;
}

export interface PatientHistory {
  member: {
    id: string;
    phoneNumber: string;
    fullName: string | null;
  };
  visits: Array<{
    id: string;
    date: string;
    status: string;
    totalCost: number;
    clinic: string;
    isOwnClinic: boolean;
    treatedBy: string;
    procedures: Array<{
      name: string;
      cost: number;
      addedAt: string;
    }>;
    clinicalData?: {
      chiefComplaint?: string;
      medicalHistory?: string;
      vitals?: any;
      clinicalNotes?: string;
    } | null;
    questionnaire?: any;
  }>;
  totalVisits: number;
  ownClinicVisits: number;
  otherClinicVisits: number;
}

export const staffApi = new StaffApiClient();

// Web3 / Filecoin / Hypercert types
export interface Web3UploadResult {
  beforeCID: string;
  afterCID: string;
  beforeUrl: string;
  afterUrl: string;
}

export interface Web3ProcessResult {
  verified: boolean;
  aiResult: { verified: boolean; confidence: number; reason: string };
  caseId?: number;
  submitTxHash?: string;
  payoutTxHash?: string;
  hypercertData?: {
    impactType: string;
    beforeCID: string;
    afterCID: string;
    timestamp: number;
    verifier: string;
    visitId: string;
    clinicAddress: string;
    mintedAt: string;
    mockTokenId: string;
  };
}

export interface Web3CaseStatus {
  id: string;
  beforeCID: string | null;
  afterCID: string | null;
  beforeUrl: string | null;
  afterUrl: string | null;
  web3VerificationStatus: "NONE" | "PENDING" | "VERIFIED" | "REJECTED";
  caseOnChainId: number | null;
  onChainTxHash: string | null;
  payoutTxHash: string | null;
  hypercertData: Web3ProcessResult["hypercertData"] | null;
  aiVerificationResult: Web3ProcessResult["aiResult"] | null;
}
