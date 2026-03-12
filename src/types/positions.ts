export interface CandidateScores {
  resume: number;
  psych: number;
  composite: number;
}

export interface CandidateData {
  id: string;
  name: string;
  role: string;
  email: string;
  stage: string;
  scores: CandidateScores;
  verdict: "Go" | "Conditional" | "No-Go";
  addedDate: string;
}

export interface PositionJD {
  purpose: string;
  education: string[];
  experience: string[];
  responsibilities: string[];
  skills: string[];
}

export interface PositionStats {
  candidates: number;
  avgScore: number;
  sla: string;
  riskFlags: number;
}

export interface PositionData {
  id: string;
  title: string;
  level: string;
  location: string;
  department: string;
  status: string;
  jdChoice: "create" | "upload" | null;
  jd: PositionJD | null;
  jdVersions: { version: number; jd: PositionJD; createdAt: string }[];
  stats: PositionStats;
  candidates: number;
  shortlisted: number;
  riskFlag: string | null;
  riskLevel: string | null;
  sla: string;
  slaLevel: string;
  updated: string;
  candidatesList?: CandidateData[];
}

const POSITIONS_KEY = "hirehand-positions-v2";

const MOCK_JD: PositionJD = {
  purpose:
    "Lead the development of scalable backend systems and distributed architectures. Collaborate with cross-functional teams to define technical strategy and deliver high-impact solutions that power our core platform.",
  education: [
    "Bachelor's degree in Computer Science, Engineering, or related field",
    "Master's degree preferred but not required",
  ],
  experience: [
    "6+ years of software engineering experience",
    "Strong background in cloud platforms (AWS, GCP, or Azure)",
    "Experience leading technical teams of 3+ engineers",
    "Track record of delivering production systems at scale",
  ],
  responsibilities: [
    "Design and implement microservices architecture",
    "Mentor junior engineers and conduct code reviews",
    "Drive technical decisions and architecture proposals",
    "Collaborate with Product and Design on feature specs",
    "Ensure system reliability with monitoring and alerting",
    "Contribute to hiring and team growth initiatives",
  ],
  skills: [
    "Kubernetes",
    "Machine Learning",
    "Event-driven Architecture",
    "GraphQL",
    "CI/CD Pipelines",
    "System Design",
    "TypeScript",
    "PostgreSQL",
  ],
};

const MOCK_CANDIDATES: CandidateData[] = [
  { id: "cand-101", name: "James Morrison", role: "Senior Dev @ TechCorp", email: "james@techcorp.com", stage: "Interview L2", scores: { resume: 8.2, psych: 7.8, composite: 80 }, verdict: "Go", addedDate: "2024-12-10" },
  { id: "cand-102", name: "Priya Sharma", role: "Staff Engineer @ InnovateTech", email: "priya@innovatetech.com", stage: "Interview L2", scores: { resume: 9.1, psych: 8.5, composite: 88 }, verdict: "Go", addedDate: "2024-12-08" },
  { id: "cand-103", name: "Alex Chen", role: "Backend Lead @ DataFlow", email: "alex@dataflow.io", stage: "Screened", scores: { resume: 7.4, psych: 7.1, composite: 73 }, verdict: "Conditional", addedDate: "2024-12-12" },
  { id: "cand-104", name: "Sarah Williams", role: "SDE III @ CloudBase", email: "sarah@cloudbase.com", stage: "Sourced", scores: { resume: 6.8, psych: 6.5, composite: 67 }, verdict: "No-Go", addedDate: "2024-12-14" },
  { id: "cand-105", name: "Rahul Patel", role: "Principal Eng @ ScaleUp", email: "rahul@scaleup.io", stage: "Interview L1", scores: { resume: 8.7, psych: 8.0, composite: 84 }, verdict: "Conditional", addedDate: "2024-12-11" },
];

export const DEFAULT_POSITIONS: PositionData[] = [
  {
    id: "REQ-2024-0042",
    title: "Senior Software Engineer",
    level: "Senior",
    location: "San Francisco, CA",
    department: "Engineering",
    status: "Active",
    jdChoice: "create",
    jd: MOCK_JD,
    jdVersions: [{ version: 1, jd: MOCK_JD, createdAt: "2024-12-15T10:00:00Z" }],
    stats: { candidates: 24, avgScore: 7.9, sla: "At Risk", riskFlags: 1 },
    candidates: 24,
    shortlisted: 6,
    riskFlag: "Long time-to-fill",
    riskLevel: "high",
    sla: "At Risk",
    slaLevel: "warning",
    updated: "2024-12-15",
    candidatesList: MOCK_CANDIDATES,
  },
  {
    id: "REQ-2024-0039",
    title: "Product Manager",
    level: "Senior",
    location: "New York, NY",
    department: "Product",
    status: "Active",
    jdChoice: "create",
    jd: { ...MOCK_JD, purpose: "Drive product strategy and roadmap for key business verticals. Work with engineering and design to ship features that delight users and move core metrics." },
    jdVersions: [{ version: 1, jd: { ...MOCK_JD, purpose: "Drive product strategy and roadmap for key business verticals. Work with engineering and design to ship features that delight users and move core metrics." }, createdAt: "2024-12-14T09:30:00Z" }],
    stats: { candidates: 18, avgScore: 8.1, sla: "On Track", riskFlags: 0 },
    candidates: 18,
    shortlisted: 4,
    riskFlag: null,
    riskLevel: null,
    sla: "On Track",
    slaLevel: "success",
    updated: "2024-12-14",
    candidatesList: [
      { id: "cand-201", name: "Emily Zhang", role: "Sr PM @ MetaVerse", email: "emily@metaverse.com", stage: "Interview L1", scores: { resume: 8.5, psych: 7.9, composite: 82 }, verdict: "Go", addedDate: "2024-12-09" },
      { id: "cand-202", name: "David Kim", role: "Product Lead @ Stripe", email: "david@stripe.com", stage: "Screened", scores: { resume: 7.8, psych: 7.2, composite: 75 }, verdict: "Conditional", addedDate: "2024-12-11" },
    ],
  },
  {
    id: "REQ-2024-0045",
    title: "UX Designer",
    level: "Mid",
    location: "Remote",
    department: "Design",
    status: "Active",
    jdChoice: "upload",
    jd: { ...MOCK_JD, purpose: "Create intuitive, accessible, and beautiful user experiences across web and mobile platforms. Conduct research, prototype solutions, and collaborate closely with engineering." },
    jdVersions: [{ version: 1, jd: { ...MOCK_JD, purpose: "Create intuitive, accessible, and beautiful user experiences across web and mobile platforms. Conduct research, prototype solutions, and collaborate closely with engineering." }, createdAt: "2024-12-13T14:15:00Z" }],
    stats: { candidates: 8, avgScore: 7.2, sla: "On Track", riskFlags: 1 },
    candidates: 8,
    shortlisted: 3,
    riskFlag: "Low pipeline",
    riskLevel: "medium",
    sla: "On Track",
    slaLevel: "success",
    updated: "2024-12-13",
    candidatesList: [],
  },
];

export function loadPositions(): PositionData[] {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_POSITIONS;
}

export function savePositions(data: PositionData[]) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(data));
}

export function generateReqId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `REQ-2024-${num}`;
}

export function generateCandidateId() {
  return `cand-${Math.floor(100 + Math.random() * 900)}`;
}

export function generateAIScores(): { scores: CandidateScores; verdict: "Go" | "Conditional" | "No-Go" } {
  const resume = +(6.0 + Math.random() * 3.5).toFixed(1);
  const psych = +(6.0 + Math.random() * 3.0).toFixed(1);
  const composite = Math.round(((resume + psych) / 2) * 10);
  const verdict = composite >= 85 ? "Go" : composite >= 70 ? "Conditional" : "No-Go";
  return { scores: { resume, psych, composite }, verdict };
}

export function createMockJD(title: string): PositionJD {
  return {
    purpose: `Lead and contribute to ${title} initiatives. Collaborate across teams to deliver high-quality results aligned with organizational goals.`,
    education: [
      "Bachelor's degree in a relevant field",
      "Advanced certifications preferred",
    ],
    experience: [
      "3+ years of relevant professional experience",
      "Demonstrated ability to work in cross-functional teams",
    ],
    responsibilities: [
      "Execute core duties related to the role",
      "Collaborate with stakeholders on project deliverables",
      "Maintain documentation and reporting standards",
      "Contribute to continuous improvement initiatives",
    ],
    skills: ["Communication", "Problem Solving", "Teamwork", "Adaptability"],
  };
}
