import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings2, Plus, Trash2, Save, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { positionsApi } from "@/lib/api";
import { ApiPositionScreeningRules, ApiCustomSectionConfig } from "@/types/api";

interface Props {
  positionId: string;
  onClose: () => void;
}

export function ScreeningEngineSettings({ positionId, onClose }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<ApiPositionScreeningRules>({
    enabled: false,
    sections: [],
    auto_select_threshold: 80,
    auto_reject_threshold: 50,
  });

  useEffect(() => {
    positionsApi.get(positionId).then((pos) => {
      if (pos.screening_rules) {
        setRules(pos.screening_rules);
      } else {
        // Defaults
        setRules({
          enabled: false,
          sections: [
            { name: "Technical Fit", weight_percentage: 40 },
            { name: "Relevant Experience", weight_percentage: 40 },
            { name: "Education & Certifications", weight_percentage: 20 },
          ],
          auto_select_threshold: 80,
          auto_reject_threshold: 50,
        });
      }
    }).finally(() => setLoading(false));
  }, [positionId]);

  const addSection = () => {
    setRules(r => ({
      ...r,
      sections: [...r.sections, { name: "New Section", weight_percentage: 0 }]
    }));
  };

  const removeSection = (idx: number) => {
    setRules(r => ({
      ...r,
      sections: r.sections.filter((_, i) => i !== idx)
    }));
  };

  const updateSection = (idx: number, field: keyof ApiCustomSectionConfig, value: string | number) => {
    setRules(r => ({
      ...r,
      sections: r.sections.map((sec, i) => i === idx ? { ...sec, [field]: value } : sec)
    }));
  };

  const handleSave = async () => {
    if (rules.enabled) {
      const sum = rules.sections.reduce((acc, curr) => acc + curr.weight_percentage, 0);
      if (sum !== 100) {
        toast({
          title: "Invalid Weights",
          description: `Total weight must be exactly 100%. Current sum is ${sum}%.`,
          variant: "destructive",
        });
        return;
      }
      if (rules.auto_reject_threshold >= rules.auto_select_threshold) {
        toast({
         title: "Invalid Thresholds",
         description: "Auto-Reject must be lower than Auto-Select threshold.",
         variant: "destructive"
        });
        return;
      }
    }

    setSaving(true);
    try {
      await positionsApi.saveScreeningRules(positionId, rules);
      toast({
        title: "Settings Saved",
        description: "AI screening rules updated successfully.",
      });
      onClose();
    } catch (err) {
      toast({
        title: "Failed to save",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = rules.sections.reduce((acc, s) => acc + s.weight_percentage, 0);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex bg-muted/30 p-4 rounded-xl border border-border/50 items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-foreground font-display">Enable Custom HR Screening</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Override the default AI logic and apply a strict, weighted scoring rubric.
            </p>
          </div>
          <Switch
            checked={rules.enabled}
            onCheckedChange={(c) => setRules({ ...rules, enabled: c })}
          />
        </div>

        {rules.enabled && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    Evaluation Sections
                    <span className={`text-xs px-2 py-0.5 rounded-full ${totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {totalWeight}% / 100%
                    </span>
                  </h4>
                </div>
                <Button size="sm" variant="outline" onClick={addSection} className="h-8 gap-1 rounded-lg">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="space-y-3">
                {rules.sections.map((sec, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-background/50 p-3 rounded-xl border border-border/60 shadow-sm glass">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Section Name</Label>
                      <Input 
                        value={sec.name} 
                        onChange={(e) => updateSection(idx, 'name', e.target.value)} 
                        className="h-8 bg-transparent border-0 px-0 shadow-none focus-visible:ring-0 font-medium font-display"
                        placeholder="e.g. Technical Fit"
                      />
                    </div>
                    <div className="w-24 border-l border-border/50 pl-3">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Weight %</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          type="number"
                          value={sec.weight_percentage || ''} 
                          onChange={(e) => updateSection(idx, 'weight_percentage', parseInt(e.target.value) || 0)} 
                          className="h-8 w-14 bg-transparent border-0 px-0 shadow-none focus-visible:ring-0 font-mono"
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-full" onClick={() => removeSection(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {totalWeight !== 100 && (
                  <div className="text-red-400 text-xs flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    Weights must add up to exactly 100%.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-sm font-semibold border-b border-border/30 pb-2">Verdict Thresholds</h4>
               
               <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/40">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-Select Benchmark (Go)</Label>
                      <span className="text-emerald-500 font-bold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md text-xs">&gt;= {rules.auto_select_threshold}</span>
                    </div>
                    <Slider
                      value={[rules.auto_select_threshold]}
                      min={0} max={100} step={1}
                      onValueChange={([val]) => setRules(r => ({ ...r, auto_select_threshold: val }))}
                      className="[&_[role=slider]]:border-emerald-500 [&_[role=slider]]:bg-emerald-50"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-4 border-t border-border/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-Reject Benchmark (No-Go)</Label>
                      <span className="text-red-500 font-bold font-mono bg-red-500/10 px-2 py-0.5 rounded-md text-xs">&lt;= {rules.auto_reject_threshold}</span>
                    </div>
                    <Slider
                      value={[rules.auto_reject_threshold]}
                      min={0} max={100} step={1}
                      onValueChange={([val]) => setRules(r => ({ ...r, auto_reject_threshold: val }))}
                      className="[&_[role=slider]]:border-red-500 [&_[role=slider]]:bg-red-50"
                    />
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="p-4 border-t border-border/30 bg-muted/10 flex justify-end gap-3 shrink-0">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || (rules.enabled && totalWeight !== 100)} className="gradient-primary">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
