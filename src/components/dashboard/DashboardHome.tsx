import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  Plus,
  BarChart3,
  Package,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  X,
  CheckCircle2,
  MoreVertical,
  Eye,
  XCircle,
  RotateCcw,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePositions } from "@/hooks/usePositions";
import { ApiPosition } from "@/types/api";
import { enhanceJDWithAI } from "@/lib/openrouter";
import { useToast } from "@/hooks/use-toast";

type ModalStep = "form" | "success";
type ModalMode = "create" | "edit";

interface DashboardHomeProps {
  onViewPosition: (id: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function DashboardHome({ onViewPosition }: DashboardHomeProps) {
  const {
    positions,
    isLoading,
    createPosition,
    updatePosition,
    deletePosition,
    setPositionStatus,
    saveJD,
  } = usePositions();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("form");
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createdPosition, setCreatedPosition] = useState<ApiPosition | null>(null);
  const [form, setForm] = useState({ title: "", bu: "", location: "", level: "Mid" });
  const [statusFilter, setStatusFilter] = useState<"Active" | "Closed">("Active");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingJD, setIsGeneratingJD] = useState(false);
  const { toast } = useToast();

  const filteredPositions = useMemo(
    () => positions.filter((p) => p.status === statusFilter),
    [positions, statusFilter]
  );
  const openCount = useMemo(() => positions.filter((p) => p.status === "Active").length, [positions]);
  const closedCount = useMemo(() => positions.filter((p) => p.status === "Closed").length, [positions]);

  const kpiData = useMemo(() => {
    const totalCandidates = positions.reduce((s, p) => s + p.candidates_count, 0);
    const totalShortlisted = positions.reduce((s, p) => s + p.shortlisted_count, 0);
    return [
      { label: "Open Positions", value: String(openCount), icon: Briefcase, sub: "Active roles", trend: null },
      { label: "Total Candidates", value: String(totalCandidates), icon: Users, sub: `${totalShortlisted} shortlisted`, trend: null },
      { label: "Avg Time to Fill", value: "45 days", icon: Clock, sub: "+12%", trend: "up" },
      { label: "Offer Acceptance", value: "82%", icon: CheckCircle, sub: "+5%", trend: "up" },
    ];
  }, [positions, openCount]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setIsSaving(true);
    try {
      const newPos = await createPosition({
        title: form.title.trim(),
        business_unit: form.bu || "General",
        location: form.location || "Remote",
        level: form.level,
      });
      setCreatedPosition(newPos);
      setModalStep("success");
    } catch (err) {
      toast({ title: "Failed to create position", description: String(err), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleJDChoice = async () => {
    if (!createdPosition) return;
    setIsGeneratingJD(true);
    try {
      const prompt = `Write a highly professional and structured Job Description for a ${createdPosition.level} ${createdPosition.title} in the ${createdPosition.business_unit} department in ${createdPosition.location}. Return it in the exact required JSON structure.`;
      const generatedJD = await enhanceJDWithAI(prompt);
      const nextVersion = (createdPosition.jd_versions?.length ?? 0) + 1;
      await saveJD(createdPosition.id, generatedJD, nextVersion);
      setCreatedPosition((p) => p ? { ...p, jd: generatedJD } : p);
      toast({ title: "JD Generated!", description: "AI-generated JD saved to your position." });
    } catch (error) {
      toast({ title: "Generation failed", description: error instanceof Error ? error.message : "Failed to generate JD", variant: "destructive" });
    } finally {
      setIsGeneratingJD(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !form.title.trim()) return;
    setIsSaving(true);
    try {
      await updatePosition(editingId, {
        title: form.title.trim(),
        business_unit: form.bu || "General",
        location: form.location || "Remote",
        level: form.level,
      });
      closeModal();
    } catch (err) {
      toast({ title: "Update failed", description: String(err), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this position? This cannot be undone.")) return;
    try {
      await deletePosition(id);
      toast({ title: "Position deleted" });
    } catch { /* already toasted in hook */ }
  };

  const handleStatusToggle = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = currentStatus === "Active" ? "Closed" : "Active";
    try {
      await setPositionStatus(id, next);
    } catch (err) {
      toast({ title: "Status update failed", description: String(err), variant: "destructive" });
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setForm({ title: "", bu: "", location: "", level: "Mid" });
    setModalStep("form");
    setModalOpen(true);
  };

  const openEditModal = (pos: ApiPosition, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode("edit");
    setEditingId(pos.id);
    setForm({ title: pos.title, bu: pos.business_unit, location: pos.location, level: pos.level });
    setModalStep("form");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalStep("form");
    setModalMode("create");
    setEditingId(null);
    setCreatedPosition(null);
    setForm({ title: "", bu: "", location: "", level: "Mid" });
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => (
            <motion.div key={kpi.label} variants={item}>
              <Card className="glass-strong hover:glow-sm transition-all duration-300 group">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-primary">
                    <kpi.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{kpi.label}</p>
                    <p className="text-2xl font-bold font-display text-foreground">{kpi.value}</p>
                    {kpi.sub && (
                      <span className={`text-xs ${kpi.trend === "up" ? "text-emerald-400" : "text-muted-foreground"} flex items-center gap-1`}>
                        {kpi.trend === "up" && <TrendingUp className="h-3 w-3" />}
                        {kpi.sub}
                      </span>
                    )}
                  </div>
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
              { label: "Create a Position", icon: Plus, desc: "Post a new role", action: () => openCreateModal() },
              { label: "View Analytics", icon: BarChart3, desc: "Hiring insights", action: undefined },
              { label: "Decision Packs", icon: Package, desc: "Review bundles", action: undefined },
            ].map((qa) => (
              <Card key={qa.label} onClick={qa.action} className="glass hover:glow-sm transition-all duration-300 cursor-pointer group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <qa.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{qa.label}</p>
                    <p className="text-xs text-muted-foreground">{qa.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Positions Table */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground font-display">Positions</h2>
            <div className="flex items-center rounded-lg border border-border/40 overflow-hidden">
              <button
                onClick={() => setStatusFilter("Active")}
                className={`px-4 py-1.5 text-sm font-medium transition-all ${statusFilter === "Active" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Open ({openCount})
              </button>
              <button
                onClick={() => setStatusFilter("Closed")}
                className={`px-4 py-1.5 text-sm font-medium transition-all ${statusFilter === "Closed" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Closed ({closedCount})
              </button>
            </div>
          </div>
          <Card className="glass-strong overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-14 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading positions...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Req ID</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden md:table-cell">BU</TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Location</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center">Candidates</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-center hidden sm:table-cell">Shortlisted</TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Risk Flags</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Updated</TableHead>
                    <TableHead className="text-muted-foreground font-medium w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions.map((pos) => (
                    <TableRow
                      key={pos.id}
                      onClick={() => onViewPosition(pos.id)}
                      className="border-border/20 hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{pos.req_id}</TableCell>
                      <TableCell className="font-medium text-foreground">{pos.title}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{pos.business_unit}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">{pos.location}</TableCell>
                      <TableCell className="text-center text-foreground">{pos.candidates_count}</TableCell>
                      <TableCell className="text-center text-foreground hidden sm:table-cell">{pos.shortlisted_count}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pos.risk_flag ? (
                          <Badge variant="outline" className={`text-xs ${
                            pos.risk_level === "high" ? "border-red-500/50 text-red-400 bg-red-500/10"
                            : pos.risk_level === "new" ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                            : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                          }`}>
                            {pos.risk_level !== "new" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {pos.risk_level === "new" && <Sparkles className="h-3 w-3 mr-1" />}
                            {pos.risk_flag}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${pos.status === "Active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground border-border/50"}`}
                          variant="outline"
                        >
                          {pos.status === "Active" ? "Open" : "Closed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs hidden lg:table-cell">
                        {pos.updated_at?.slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border/50 z-50">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewPosition(pos.id); }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => openEditModal(pos, e)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit Position
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleStatusToggle(pos.id, pos.status, e)}>
                              {pos.status === "Active" ? (
                                <><XCircle className="h-4 w-4 mr-2" /> Mark as Closed</>
                              ) : (
                                <><RotateCcw className="h-4 w-4 mr-2" /> Re-open Position</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDelete(pos.id, e)} className="text-red-400 focus:text-red-400 focus:bg-red-500/10">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Position
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && filteredPositions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No {statusFilter === "Active" ? "open" : "closed"} positions.{" "}
                        {statusFilter === "Active" && (
                          <button onClick={openCreateModal} className="text-primary hover:underline">Create your first one →</button>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </motion.div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-card border border-border/40 rounded-2xl shadow-2xl glow-sm overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {modalStep === "form" ? (
                  <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="flex items-center justify-between p-6 border-b border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                          {modalMode === "edit" ? <Pencil className="h-5 w-5 text-primary-foreground" /> : <Plus className="h-5 w-5 text-primary-foreground" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground font-display">{modalMode === "edit" ? "Edit Position" : "Create Position"}</h3>
                          <p className="text-xs text-muted-foreground">{modalMode === "edit" ? "Update position details" : "Add a new open role"}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full"><X className="h-4 w-4" /></Button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Position Title</Label>
                        <Input placeholder="e.g. Software Engineer" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="bg-background/50 border-border/50 focus:border-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Business Unit</Label>
                        <Input placeholder="e.g. Engineering" value={form.bu} onChange={(e) => setForm((f) => ({ ...f, bu: e.target.value }))} className="bg-background/50 border-border/50 focus:border-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Location</Label>
                        <Input placeholder="e.g. San Francisco, CA" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="bg-background/50 border-border/50 focus:border-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Level</Label>
                        <Select value={form.level} onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}>
                          <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Junior">Junior</SelectItem>
                            <SelectItem value="Mid">Mid</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-border/30">
                      <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                      {modalMode === "edit" ? (
                        <Button onClick={handleSaveEdit} disabled={!form.title.trim() || isSaving} className="gradient-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Pencil className="h-4 w-4 mr-1" /> Save Changes</>}
                        </Button>
                      ) : (
                        <Button onClick={handleCreate} disabled={!form.title.trim() || isSaving} className="gradient-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1" /> Create Position</>}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="success" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div className="flex items-center justify-between p-6 border-b border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground font-display">Position Created!</h3>
                          <p className="text-xs text-muted-foreground font-mono">{createdPosition?.req_id}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full"><X className="h-4 w-4" /></Button>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-muted-foreground">What would you like to do next?</p>
                      <button
                        onClick={handleJDChoice}
                        disabled={isGeneratingJD}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                          createdPosition?.jd ? "border-primary bg-primary/10 glow-sm" : "border-border/40 hover:border-primary/50 hover:bg-primary/5"
                        } ${isGeneratingJD ? "opacity-70 pointer-events-none" : ""}`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary">
                          {isGeneratingJD ? <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Sparkles className="h-5 w-5 text-primary-foreground" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{isGeneratingJD ? "Generating JD..." : "Create JD with AI"}</p>
                          <p className="text-xs text-muted-foreground">{isGeneratingJD ? "This takes a few seconds" : "Use the Adaptive JD Generator"}</p>
                        </div>
                        {createdPosition?.jd && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-border/30">
                      <Button variant="ghost" onClick={closeModal}>Skip for now</Button>
                      <Button onClick={() => { onViewPosition(createdPosition!.id); closeModal(); }} className="gradient-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90">
                        Go to Position →
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
