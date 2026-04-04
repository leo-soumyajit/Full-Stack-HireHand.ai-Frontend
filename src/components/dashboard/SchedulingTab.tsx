import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, CheckCircle2, Video, RefreshCw, XCircle } from "lucide-react";
import { format, isPast, addHours } from "date-fns";
import { schedulesApi, ApiSchedule } from "@/lib/schedulesApi";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function SchedulingTab() {
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await schedulesApi.list();
      setSchedules(data);
    } catch (err) {
      toast({ title: "Failed to load schedules", description: String(err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "Completed" | "Cancelled") => {
    try {
      await schedulesApi.updateStatus(id, newStatus);
      setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      toast({ title: "Status Updated", description: `Interview marked as ${newStatus}.` });
    } catch (err) {
      toast({ title: "Failed to update status", description: String(err), variant: "destructive" });
    }
  };

  // Derived states
  const now = new Date();
  // We give a 1-hour grace period before an interview is considered truly "past" to allow it to run
  const isExpired = (dateString: string) => isPast(addHours(new Date(dateString), 1));

  const upcoming = schedules.filter(
    (s) => s.status === "Scheduled" && !isExpired(s.scheduled_at)
  );
  
  // Anything explicitly marked completed/cancelled, OR implicitly past its 1-hour grace period
  // Sort descending so the most recently completed ones are at the top
  const pastOrCompleted = schedules
    .filter((s) => s.status !== "Scheduled" || isExpired(s.scheduled_at))
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary glow-sm">
              <CalendarIcon className="h-6 w-6" />
            </div>
            Interview Scheduler
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Track and manage your upcoming candidate interviews. Schedules in the past are automatically marked as completed for your convenience.
          </p>
        </div>
        <Button variant="outline" onClick={fetchSchedules} disabled={isLoading} className="border-border/40 hover:bg-muted/50">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Sync
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Upcoming Interviews
            </h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">{upcoming.length}</Badge>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {upcoming.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="glass-panel border-dashed border-border/60 bg-muted/20">
                    <CardContent className="p-10 text-center flex flex-col items-center justify-center">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground font-medium">No upcoming interviews</p>
                      <p className="text-xs text-muted-foreground mt-1 text-balance">Ensure you have shortlisted candidates and select "Schedule Interview" from their profile action menu.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                upcoming.map((schedule) => (
                  <ScheduleCard 
                    key={schedule.id}
                    schedule={schedule}
                    onStatusChange={(status) => handleUpdateStatus(schedule.id, status)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Completed / Past Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between opacity-80">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              Past & Completed
            </h2>
            <Badge variant="secondary">{pastOrCompleted.length}</Badge>
          </div>

          <div className="space-y-3">
             <AnimatePresence mode="popLayout">
              {pastOrCompleted.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="glass-panel border-dashed border-border/40 bg-transparent opacity-60">
                    <CardContent className="p-8 text-center text-muted-foreground text-sm">
                      Your history is clean.
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                pastOrCompleted.map((schedule) => (
                  <ScheduleCard 
                    key={schedule.id} 
                    schedule={schedule}
                    isPast={isPast(new Date(schedule.scheduled_at))}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleCard({ schedule, isPast, onStatusChange }: { schedule: ApiSchedule, isPast?: boolean, onStatusChange?: (s: "Completed"|"Cancelled") => void }) {
  const dt = new Date(schedule.scheduled_at);
  const statusColor = schedule.status === "Cancelled" ? "text-red-400 bg-red-400/10" 
                    : schedule.status === "Completed" || isPast ? "text-muted-foreground bg-muted" 
                    : "text-emerald-400 bg-emerald-400/10";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className={`glass-panel border-border/40 overflow-hidden transition-all duration-300 ${isPast ? 'opacity-70 grayscale-[30%] hover:grayscale-0' : 'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'}`}>
        <div className="p-5 flex flex-col sm:flex-row gap-5">
          {/* DateTime Block */}
          <div className="flex sm:flex-col gap-3 sm:gap-1 items-center sm:items-start sm:w-32 shrink-0 sm:border-r sm:border-border/40 sm:pr-4">
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">{format(dt, "MMM")}</span>
              <span className="text-3xl font-display font-light text-foreground">{format(dt, "dd")}</span>
            </div>
            <div className="h-8 w-px bg-border/40 hidden sm:block my-1" />
            <div className="flex items-center gap-1.5 text-muted-foreground mt-auto">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{format(dt, "hh:mm a")}</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-lg font-semibold text-foreground truncate">{schedule.candidate_name}</h3>
              <Badge variant="outline" className={`border-0 shrink-0 ${statusColor}`}>
                {isPast && schedule.status === "Scheduled" ? "Completed (Auto)" : schedule.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate flex items-center gap-2 mb-3">
              <span className="font-medium text-foreground/80">{schedule.candidate_role}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="truncate">{schedule.candidate_email}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="truncate">{schedule.position_title}</span>
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {schedule.room_id && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors gap-2"
                  onClick={() => window.open(`/interview/${schedule.room_id}?role=host&sid=${schedule.id}`, "_blank")}
                >
                  <Video className="h-3.5 w-3.5" />
                  Start HireHand Interview
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/15 transition-colors gap-2"
                onClick={() => window.open(schedule.meeting_link, "_blank")}
              >
                <Video className="h-3.5 w-3.5" />
                Join Jitsi Call
              </Button>
              
              {!isPast && onStatusChange && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onStatusChange("Completed")} className="text-muted-foreground hover:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Done
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onStatusChange("Cancelled")} className="text-muted-foreground hover:text-red-400">
                    <XCircle className="h-4 w-4 mr-1.5" /> Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
