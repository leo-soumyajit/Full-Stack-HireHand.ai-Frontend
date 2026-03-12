import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { schedulesApi } from "@/lib/schedulesApi";
import { Badge } from "@/components/ui/badge";

interface SchedulingModalProps {
  open: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  positionId: string;
  onScheduled: () => void;
}

export function SchedulingModal({
  open,
  onClose,
  candidateId,
  candidateName,
  positionId,
  onScheduled,
}: SchedulingModalProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!date || !time) {
      toast({ title: "Validation Error", description: "Please select both a date and a time.", variant: "destructive" });
      return;
    }

    setIsScheduling(true);
    try {
      // Combine date and time
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      await schedulesApi.create(candidateId, positionId, scheduledDate.toISOString());

      toast({
        title: "Interview Scheduled! 🗓️",
        description: `Working meeting link generated and email sent to ${candidateName}.`,
      });
      onScheduled();
      onClose();
    } catch (err) {
      toast({
        title: "Scheduling Failed",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Schedule Interview
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Set up a meeting with <strong className="text-foreground">{candidateName}</strong>. This will automatically send an email with a unique video meeting link.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid gap-3">
              <Label className="text-sm font-medium">Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal border-border/40 hover:bg-muted/50 transition-colors",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-border/40 bg-card/95 backdrop-blur-md" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-3">
              <Label className="text-sm font-medium">Select Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10 border-border/40 hover:border-border/60 transition-colors bg-background/50"
                  required
                />
              </div>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-primary/80 flex items-start gap-2">
              <Send className="h-4 w-4 shrink-0 mt-0.5" />
              <p>A calendar invitation with a unique video meeting link will be sent directly to the candidate's email address.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={onClose} disabled={isScheduling} className="hover:bg-muted/50 transition-colors">
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={isScheduling || !date || !time} className="gradient-primary shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
              {isScheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Confirm & Send Email"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
