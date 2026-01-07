const getApiUrl = (): string => {
  // Check for environment variable first (works for SSR and build-time)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Client-side runtime detection based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'app.menodao.org') {
      return 'https://api.menodao.org';
    }
    if (hostname === 'stg.menodao.org') {
      return 'https://stg-api.menodao.org';
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiUrl();

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async requestOtp(phoneNumber: string) {
    return this.request<{ message: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async verifyOtp(phoneNumber: string, code: string) {
    return this.request<{ accessToken: string; member: Member }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
    });
  }

  async getMe() {
    return this.request<Member>('/auth/me');
  }

  // Member endpoints
  async getProfile() {
    return this.request<MemberProfile>('/members/profile');
  }

  async updateProfile(data: { fullName?: string; location?: string }) {
    return this.request<Member>('/members/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getContributions(page = 1, limit = 20) {
    return this.request<PaginatedResponse<Contribution>>(`/members/contributions?page=${page}&limit=${limit}`);
  }

  async getClaims(page = 1, limit = 20) {
    return this.request<PaginatedResponse<Claim>>(`/members/claims?page=${page}&limit=${limit}`);
  }

  async getTransactions(page = 1, limit = 20) {
    return this.request<PaginatedResponse<Transaction>>(`/members/transactions?page=${page}&limit=${limit}`);
  }

  // Subscription endpoints
  async getPackages() {
    return this.request<Package[]>('/subscriptions/packages');
  }

  async getCurrentSubscription() {
    return this.request<Subscription | null>('/subscriptions/current');
  }

  async subscribe(tier: 'BRONZE' | 'SILVER' | 'GOLD') {
    return this.request<Subscription>('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  }

  async upgrade(newTier: 'BRONZE' | 'SILVER' | 'GOLD') {
    return this.request<Subscription>('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ newTier }),
    });
  }

  // Contribution endpoints
  async getContributionSummary() {
    return this.request<ContributionSummary>('/contributions/summary');
  }

  async initiatePayment(amount: number, paymentMethod: string) {
    return this.request<PaymentInitiation>('/contributions/pay', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  }

  // Claims endpoints
  async getMyClaims() {
    return this.request<ClaimsResponse>('/claims');
  }

  async createClaim(data: CreateClaimData) {
    return this.request<Claim>('/claims', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Camps endpoints
  async getUpcomingCamps() {
    return this.request<Camp[]>('/camps');
  }

  async getNearby(lat: number, lng: number, radius = 50) {
    return this.request<CampWithDistance[]>(`/camps/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async getCamp(id: string) {
    return this.request<CampDetails>(`/camps/${id}`);
  }

  async registerForCamp(campId: string) {
    return this.request<CampRegistration>(`/camps/${campId}/register`, {
      method: 'POST',
    });
  }

  async cancelRegistration(campId: string) {
    return this.request<CampRegistration>(`/camps/${campId}/register`, {
      method: 'DELETE',
    });
  }

  async getMyRegistrations() {
    return this.request<CampRegistration[]>('/camps/my-registrations');
  }

  // Blockchain endpoints
  async getAllTransactions(page = 1, limit = 50) {
    return this.request<PaginatedResponse<Transaction>>(`/blockchain/transactions?page=${page}&limit=${limit}`);
  }

  async getTransactionByHash(txHash: string) {
    return this.request<Transaction>(`/blockchain/transactions/${txHash}`);
  }
}

// Types
export interface Member {
  id: string;
  phoneNumber: string;
  fullName?: string;
  location?: string;
  walletAddress?: string;
  isVerified: boolean;
  subscription?: Subscription;
}

export interface MemberProfile extends Member {
  contributions: Contribution[];
  claims: Claim[];
  nfts: NFT[];
}

export interface Subscription {
  id: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  monthlyAmount: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  benefits?: string[];
}

export interface Package {
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  monthlyPrice: number;
  benefits: string[];
}

export interface Contribution {
  id: string;
  amount: number;
  month: string;
  paymentMethod: string;
  paymentRef?: string;
  txHash?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export interface ContributionSummary {
  totalContributed: number;
  monthsContributed: number;
  recentContributions: Contribution[];
}

export interface PaymentInitiation {
  contributionId: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

export interface Claim {
  id: string;
  claimType: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'DISBURSED' | 'REJECTED';
  txHash?: string;
  processedAt?: string;
  createdAt: string;
  camp?: Camp;
}

export interface ClaimsResponse {
  claims: Claim[];
  summary: {
    claimsUsed: number;
    claimsRemaining: number;
    amountClaimed: number;
    amountRemaining: number;
  } | null;
}

export interface CreateClaimData {
  claimType: string;
  description: string;
  amount: number;
  campId?: string;
}

export interface Camp {
  id: string;
  name: string;
  description?: string;
  venue: string;
  address: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  capacity: number;
  isActive: boolean;
}

export interface CampWithDistance extends Camp {
  distanceKm: number;
}

export interface CampDetails extends Camp {
  spotsRemaining: number;
}

export interface CampRegistration {
  id: string;
  status: 'REGISTERED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';
  createdAt: string;
  camp: Camp;
}

export interface NFT {
  id: string;
  tokenId: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  contractAddress: string;
  txHash: string;
  mintedAt: string;
}

export interface Transaction {
  id: string;
  txHash: string;
  txType: 'NFT_MINT' | 'CONTRIBUTION' | 'CLAIM_DISBURSEMENT' | 'UPGRADE';
  fromAddress: string;
  toAddress: string;
  amount?: string;
  tokenId?: string;
  network: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  blockNumber?: number;
  createdAt: string;
  confirmedAt?: string;
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

export const api = new ApiClient(API_BASE_URL);
