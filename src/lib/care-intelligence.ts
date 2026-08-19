export type DataStatus = "ok" | "insufficient" | "not_tracked";
export type HealthStatus =
  | "GOOD"
  | "WATCH"
  | "NEEDS_WORK"
  | "NEEDS_DATA"
  | "EARLY";

export interface MetricValue {
  metricId: string;
  label: string;
  value: number | null;
  previous?: number | null;
  changePct?: number | null;
  sampleSize?: number;
  target?: number;
  definition?: string;
  cohortDefinition?: string;
  dataStatus: DataStatus | "ok";
  returning?: number;
  eligible?: number;
  referred?: number;
  totalNew?: number;
}

export interface CareLoopStage {
  id: string;
  label: string;
  metricId: string;
  definition: string;
  tracked: boolean;
  untrackedReason?: string;
  count: number | null;
  previous: number | null;
  changePct: number | null;
  dataStatus: DataStatus | string;
}

export interface RankedTransition {
  transitionId: string;
  label: string;
  current: number | null;
  previous: number | null;
  target: number;
  gapPp: number | null;
  volume: number;
  sampleSize: number;
  opportunity: number;
  confidence: number;
  dataStatus: DataStatus;
}

export interface ActionItem {
  problem: string;
  evidence: string;
  metricId: string;
  suggestedAction: string;
  expectedImpact: string;
  confidence: string;
  status: string;
  cohortKey: string;
  count: number;
  actions: string[];
}

export interface CareIntelligenceDashboard {
  generatedAt: string;
  period: {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
    label: string;
  };
  filters: { county?: string; subCounty?: string };
  northStar: {
    metricId: string;
    label: string;
    current: number;
    previous: number;
    momPct: number | null;
    trailing3mAvg: number | null;
    trailing6m: { month: string; value: number }[];
    target: number;
    sampleSize: number;
    dataStatus: DataStatus;
    definition: string;
  };
  secondary: {
    patientsTreated: MetricValue;
    activeMembers: MetricValue;
    paidMembers: MetricValue;
    treatmentCompletionRate: MetricValue;
    patientRetention: MetricValue;
    referralRate: MetricValue;
  };
  membershipFunnel: {
    registered: number;
    paid: number;
    paidConversion: number | null;
    booked: number | null;
    bookedTracked: boolean;
    treated: number;
    paidToTreated: number | null;
  };
  membershipConversion: {
    metricId: string;
    paid: number;
    registered: number;
    rate: number | null;
    target: number;
    gapPp: number | null;
    byGeography: Array<{
      area: string;
      members: number;
      paid: number;
      paidConversion: number | null;
      completedShare: number;
      demandShare: number;
      patientsTreated: number;
      completed: number;
      membersToPatients: number | null;
    }>;
    byChannel: Array<{
      channel: string;
      leads: number;
      registered: number;
      paid: number;
      treated: number;
      treatmentYield: number | null;
      paidConversion: number | null;
    }>;
  };
  membership: {
    registered: number;
    active: number;
    paid: number;
    expired: number;
    cancelled: number;
    pendingPayment: number;
    failedPayments: number;
    newSubscriptions: number;
    newRegistrations: number;
    conversion: number | null;
    avgMembershipDays: number | null;
    membersWithSubscription: number;
  };
  membershipToCare: {
    paidMembers: number;
    usedCarePct: number | null;
    patientsTreated: number;
    treatmentsCompleted: number;
    definition: string;
  };
  careLoop: {
    stages: CareLoopStage[];
    transitions: RankedTransition[];
    bottleneck: {
      headline: string;
      detail: string;
      ranked: RankedTransition | null;
      disclaimer: string;
    };
  };
  careLoopHealth: Array<{
    key: string;
    label: string;
    status: HealthStatus;
    reason: string;
  }>;
  timeToCare: {
    registrationToFirstVisit: {
      metricId: string;
      label: string;
      medianDays: number | null;
      previousMedianDays: number | null;
      changePct: number | null;
      sampleSize: number;
      definition: string;
      dataStatus: DataStatus;
    };
    bookingToAppointment: {
      metricId: string;
      label: string;
      medianDays: number | null;
      sampleSize: number;
      definition: string;
      dataStatus: DataStatus;
    };
    appointmentToTreatment: {
      metricId: string;
      medianMinutes: number | null;
      sampleSize: number;
      definition: string;
      dataStatus: DataStatus;
    };
    treatmentToFollowup: {
      medianDays: number | null;
      sampleSize: number;
      dataStatus: DataStatus;
    };
  };
  patientImpact: {
    uniquePatientsTreated: number;
    totalTreatments: number;
    completedTreatments: number;
    cancelledVisits: number;
    firstTimePatients: number;
    returningPatients: number;
    followUpCompletion: number | null;
    patientSatisfaction: {
      responses: number;
      highSatisfaction: number;
      highSatisfactionRate: number | null;
      dataStatus: DataStatus;
      definition: string;
    };
    patientsReferred: number;
    geographicReach: unknown[];
  };
  treatmentMix: Array<{
    category: string;
    current: number;
    previous: number;
    changePct: number | null;
  }>;
  geography: {
    areas: CareIntelligenceDashboard["membershipConversion"]["byGeography"];
    conversion: CareIntelligenceDashboard["membershipConversion"]["byGeography"];
  };
  acquisition: CareIntelligenceDashboard["membershipConversion"]["byChannel"];
  dataHealth: {
    patientRecordsComplete: number | null;
    acquisitionSourceCaptured: number | null;
    geographyCaptured: number | null;
    treatmentOutcomesCaptured: number | null;
    satisfactionCaptured: number;
    staleOpenVisits: number;
    issues: string[];
    totals: { members: number; discharged: number };
  };
  actionCenter: ActionItem[];
  conversionAssistant: {
    title: string;
    question: string;
    cohort: { count: number; sampleIds: string[] };
    note: string;
  };
  sustainability: {
    membershipContributionsKes: number;
    careDisbursedKes: number;
    fundingPerCompletedTreatment: number | null;
    costPerCompletedTreatment: number | null;
    costPerPatientTreated: number | null;
    membershipContributionPerMember: number | null;
    subsidyPerTreatment: number | null;
    unitImpact: { kesPerTreatment: number; treatmentsPer1000Kes: number } | null;
    note: string;
    dataStatus: string;
  };
  operations: {
    providerUtilization: {
      providers: number;
      visits: number;
      visitsPerProvider: number | null;
      dataStatus: string;
    };
    waitingTimeDays: number | null;
    attendance: number;
    capacityNote: string;
  };
  appointments: {
    created: number;
    bookedMembers: number;
    attended: number;
    noShow: number;
    cancelled: number;
    rescheduled: number;
    keptRate: number | null;
    noShowRate: number | null;
    previous: { created: number; attended: number; noShow: number };
    definition: string;
  };
  observedFacts: Array<{ kind: "OBSERVED"; text: string; metricId: string }>;
}

export interface CareDataRoom {
  generatedAt: string;
  period: CareIntelligenceDashboard["period"];
  framing: string;
  reach: { websiteSessions: number | null | undefined; note: string };
  access: {
    registered: number;
    paid: number;
    paidConversion: number | null;
  };
  appointments: CareIntelligenceDashboard["appointments"];
  care: {
    completedTreatments: number;
    patientsTreated: number;
    treatmentCompletionRate: number | null;
  };
  outcomes: { followUp: unknown; note: string };
  retention: unknown;
  community: { referralRate: unknown };
  membership: CareIntelligenceDashboard["membership"];
  sustainability: CareIntelligenceDashboard["sustainability"];
  geography: CareIntelligenceDashboard["geography"];
  treatmentMix: CareIntelligenceDashboard["treatmentMix"];
  dataHealth: CareIntelligenceDashboard["dataHealth"];
}

export interface CareLoopTarget {
  metricId: string;
  targetValue: number;
  minSampleSize: number;
  impactWeight: number;
  controllability: number;
  notes: string | null;
  updatedAt: string | null;
}

export interface CareExperiment {
  id: string;
  name: string;
  hypothesis: string;
  metricId: string;
  baseline: number | null;
  target: number | null;
  startDate: string;
  endDate: string | null;
  owner: string | null;
  status: string;
  result: string | null;
  decision: string | null;
}

export interface CareInsight {
  id: string;
  generatedAt: string;
  metricId: string;
  kind: string;
  observation: string;
  interpretation: string | null;
  recommendation: string | null;
  evidence: unknown;
  confidence: string;
  actionTaken: string | null;
  outcome: string | null;
  owner: string | null;
  status: string;
}

export interface CareCohort {
  key: string;
  definition: string;
  members: Array<{
    id: string;
    fullName: string | null;
    phoneNumber: string;
    createdAt: string;
    county: string | null;
    subCounty: string | null;
  }>;
}
