import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Shield, Crown, Eye, Briefcase, Mic,
  Trash2, ChevronDown, Loader2, Mail, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { teamApi } from "@/lib/api";
import { useAuthStore, hasMinRole } from "@/store/authStore";

// ── Role Styling Map ──────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  owner:       { icon: Crown,     color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20", label: "Owner" },
  admin:       { icon: Shield,    color: "text-red-400",     bg: "bg-red-500/10",      border: "border-red-500/20",   label: "Admin" },
  manager:     { icon: Briefcase, color: "text-indigo-400",  bg: "bg-indigo-500/10",   border: "border-indigo-500/20",label: "Manager" },
  interviewer: { icon: Mic,       color: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/20", label: "Interviewer" },
  viewer:      { icon: Eye,       color: "text-sky-400",     bg: "bg-sky-500/10",      border: "border-sky-500/20",   label: "Viewer" },
};

const ASSIGNABLE_ROLES = ["admin", "manager", "interviewer", "viewer"];

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at?: string;
  avatar_url?: string;
}

export function TeamManagement() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || "owner";

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Invite form
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("interviewer");

  // ── Load Members ─────────────────────────────────────────────────
  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await teamApi.listMembers();
      setMembers(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // ── Invite Handler ───────────────────────────────────────────────
  const handleInvite = async () => {
    if (!invName.trim() || !invEmail.trim()) {
      toast({ title: "Missing Fields", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      await teamApi.createMember({ name: invName.trim(), email: invEmail.trim(), role: invRole });
      toast({ title: "Team Member Invited", description: `${invName} has been invited as ${invRole}.` });
      setInvName(""); setInvEmail(""); setInvRole("interviewer");
      setInviteOpen(false);
      await loadMembers();
    } catch (err: any) {
      toast({ title: "Invite Failed", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  // ── Role Change Handler ──────────────────────────────────────────
  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await teamApi.updateRole(memberId, newRole);
      toast({ title: "Role Updated", description: `Role changed to ${newRole}.` });
      await loadMembers();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  // ── Delete Handler ───────────────────────────────────────────────
  const handleDelete = async (member: TeamMember) => {
    try {
      await teamApi.deleteMember(member.id);
      toast({ title: "Member Removed", description: `${member.name} has been removed from the team.` });
      await loadMembers();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  // ── Helper: Get initials ─────────────────────────────────────────
  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const isOwnerOrAdmin = hasMinRole(userRole, "admin");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Team Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organization's team members and their access roles
          </p>
        </div>

        {isOwnerOrAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-transform">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle className="font-display text-lg">Invite Team Member</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  They'll receive an email with temporary login credentials.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <Input
                    value={invName}
                    onChange={(e) => setInvName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <Input
                    type="email"
                    value={invEmail}
                    onChange={(e) => setInvEmail(e.target.value)}
                    placeholder="priya@company.com"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</label>
                  <Select value={invRole} onValueChange={setInvRole}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => {
                        const cfg = ROLE_CONFIG[r];
                        // Only owner can assign admin role
                        if (r === "admin" && userRole !== "owner") return null;
                        return (
                          <SelectItem key={r} value={r}>
                            <div className="flex items-center gap-2">
                              <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                              <span>{cfg.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button onClick={handleInvite} disabled={inviting} className="gradient-primary text-primary-foreground">
                  {inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
          <Badge key={key} variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border} text-[11px] gap-1`}>
            <cfg.icon className="w-3 h-3" /> {cfg.label}
          </Badge>
        ))}
      </div>

      {/* Members Table */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No team members yet. Invite someone to get started!</p>
          </div>
        ) : (
          <AnimatePresence>
            {members.map((member, idx) => {
              const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
              const isCurrentUser = member.id === user?.id;
              const isOwner = member.role === "owner";

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 transition-all group"
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full ${cfg.bg} ${cfg.border} border flex items-center justify-center text-sm font-bold ${cfg.color} shrink-0`}>
                    {member.avatar_url ? (
                      <img src={member.avatar_url} className="w-full h-full rounded-full object-cover" alt={member.name} />
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm truncate">{member.name}</span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">You</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>

                  {/* Role Badge / Selector */}
                  <div className="shrink-0">
                    {isOwnerOrAdmin && !isOwner && !isCurrentUser ? (
                      <Select value={member.role} onValueChange={(val) => handleRoleChange(member.id, val)}>
                        <SelectTrigger className={`h-8 w-[140px] text-xs ${cfg.bg} ${cfg.border} ${cfg.color} border`}>
                          <div className="flex items-center gap-1.5">
                            <cfg.icon className="w-3 h-3" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_ROLES.map((r) => {
                            const rc = ROLE_CONFIG[r];
                            if (r === "admin" && userRole !== "owner") return null;
                            return (
                              <SelectItem key={r} value={r}>
                                <div className="flex items-center gap-2">
                                  <rc.icon className={`w-3 h-3 ${rc.color}`} />
                                  <span>{rc.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border} text-[11px] gap-1`}>
                        <cfg.icon className="w-3 h-3" /> {cfg.label}
                      </Badge>
                    )}
                  </div>

                  {/* Delete */}
                  {isOwnerOrAdmin && !isOwner && !isCurrentUser && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-strong">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" /> Remove Team Member
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove <strong>{member.name}</strong> ({member.email}) from your organization. They will lose all access immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(member)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Remove Member
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
