import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  Plus,
  BarChart3,
  Package,
  TrendingUp,
  ArrowRight,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePositions } from "@/hooks/usePositions";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

interface DashboardHomeProps {
  onViewPosition: (id: string) => void;
  onNavigate?: (section: string) => void;
  onPasteJD?: () => void;
}

export function DashboardHome({ onViewPosition, onNavigate, onPasteJD }: DashboardHomeProps) {
  const { positions, isLoading } = usePositions();

  const openCount = useMemo(() => positions.filter((p) => p.status === "Active").length, [positions]);
  const closedCount = useMemo(() => positions.filter((p) => p.status === "Closed").length, [positions]);
  const totalCandidates = useMemo(() => positions.reduce((s, p) => s + p.candidates_count, 0), [positions]);
  const totalShortlisted = useMemo(() => positions.reduce((s, p) => s + p.shortlisted_count, 0), [positions]);

  const recentPositions = useMemo(() => {
    return [...positions]
      .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
      .slice(0, 5);
  }, [positions]);

  const kpiData = useMemo(() => [
    { label: "Open Positions", value: String(openCount), icon: Briefcase, sub: `${closedCount} closed`, color: "from-blue-500 to-indigo-600", iconBg: "bg-blue-500/10 border-blue-500/20", iconColor: "text-blue-500" },
    { label: "Total Candidates", value: String(totalCandidates), icon: Users, sub: `${totalShortlisted} shortlisted`, color: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-500/10 border-emerald-500/20", iconColor: "text-emerald-500" },
    { label: "Positions Created", value: String(positions.length), icon: CheckCircle, sub: "All time", color: "from-purple-500 to-violet-600", iconBg: "bg-purple-500/10 border-purple-500/20", iconColor: "text-purple-500" },
    { label: "Screening Rate", value: totalCandidates > 0 ? `${Math.round((totalShortlisted / totalCandidates) * 100)}%` : "—", icon: TrendingUp, sub: totalCandidates > 0 ? "Of total candidates" : "No data yet", color: "from-amber-500 to-orange-600", iconBg: "bg-amber-500/10 border-amber-500/20", iconColor: "text-amber-500" },
  ], [positions, openCount, closedCount, totalCandidates, totalShortlisted]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Welcome Banner */}
      <motion.div variants={item}>
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-background to-primary/[0.02] p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-foreground font-display">Dashboard</h1>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Manage your hiring pipeline, screen candidates with AI, and make data-driven decisions.
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <motion.div key={kpi.label} variants={item}>
            <Card className="relative overflow-hidden group border-border/40 hover:border-border/80 transition-all duration-500 hover:shadow-lg bg-background/60 backdrop-blur-sm h-full">
              <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-25 rounded-full translate-x-6 -translate-y-6 bg-gradient-to-br ${kpi.color}`} />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl border ${kpi.iconBg}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold font-display text-foreground tracking-tight">{kpi.value}</h3>
                <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
                <span className="text-xs text-muted-foreground mt-2 block">{kpi.sub}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold text-foreground mb-3 font-display">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Paste Job Description", icon: Sparkles, desc: "Create positions with AI", action: onPasteJD, gradient: true },
            { label: "View All Positions", icon: Briefcase, desc: `${openCount} open roles`, action: () => onNavigate?.("positions") },
            { label: "All Candidates", icon: Users, desc: `${totalCandidates} in pipeline`, action: () => onNavigate?.("candidates") },
          ].map((qa) => (
            <Card key={qa.label} onClick={qa.action} className={`cursor-pointer group border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md ${qa.gradient ? 'bg-gradient-to-br from-primary/5 to-transparent' : 'bg-background/60'}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${qa.gradient ? 'gradient-primary shadow-lg shadow-primary/20' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
                  <qa.icon className={`h-5 w-5 ${qa.gradient ? 'text-primary-foreground' : 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{qa.label}</p>
                  <p className="text-xs text-muted-foreground">{qa.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Recent Positions */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground font-display">Recent Positions</h2>
          {positions.length > 5 && (
            <button onClick={() => onNavigate?.("positions")} className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
        
        {isLoading ? (
          <Card className="glass-card p-8">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              <span className="text-sm">Loading positions...</span>
            </div>
          </Card>
        ) : recentPositions.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No positions created yet.</p>
            <button onClick={onPasteJD} className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Create your first position
            </button>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentPositions.map((pos) => (
              <Card
                key={pos.id}
                onClick={() => onViewPosition(pos.id)}
                className="glass-card cursor-pointer group hover:border-primary/30 transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm truncate">{pos.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${pos.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-muted text-muted-foreground border-border/50"}`}
                      >
                        {pos.status === "Active" ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground font-mono">{pos.req_id}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {pos.location}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {pos.candidates_count} candidates
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 hidden sm:block" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
