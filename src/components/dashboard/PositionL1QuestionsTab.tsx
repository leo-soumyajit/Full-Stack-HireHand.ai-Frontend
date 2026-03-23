import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Trash2, ListChecks, Download, Edit2, Check } from "lucide-react";
import { ApiPosition, ApiL1Question } from "@/types/api";
import { generateL1Questions } from "@/lib/openrouter";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  position: ApiPosition;
  onSave: (questions: ApiL1Question[]) => Promise<void>;
}

export function PositionL1QuestionsTab({ position, onSave }: Props) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [counts, setCounts] = useState({ easy: 2, medium: 3, hard: 1 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  
  const existing = position.l1_questions || [];

  const handleExportCSV = () => {
    if (!existing.length) return;
    const headers = ["Sl No", "Category", "Difficulty", "Question"];
    const rows = existing.map((q, i) => [
      i + 1,
      q.category,
      q.difficulty,
      `"${q.text.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `L1_Questions_REQ_${position.req_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEdit = (q: ApiL1Question) => {
    setEditingId(q.id);
    setEditDraft(q.text);
  };

  const saveEdit = async (id: string) => {
    if (!editDraft.trim()) return;
    const next = existing.map(q => q.id === id ? { ...q, text: editDraft.trim() } : q);
    try {
      await onSave(next);
      setEditingId(null);
      toast({ title: "Question updated successfully" });
    } catch (err) {
      toast({ title: "Failed to update", description: String(err), variant: "destructive" });
    }
  };
  const handleGenerate = async () => {
    if (!position.jd) {
      toast({ title: "No JD found", description: "Please add a JD first.", variant: "destructive" });
      return;
    }
    const total = counts.easy + counts.medium + counts.hard;
    if (total === 0 || total > 20) {
      toast({ title: "Invalid count", description: "Select between 1 and 20 questions total.", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    try {
      const allJdText = [
        position.jd.purpose || "",
        ...(position.jd.experience || []),
        ...(position.jd.responsibilities || []),
        ...(position.jd.skills || [])
      ].join("\n");
      
      const newQuestions = await generateL1Questions(allJdText, position.title, counts);
      await onSave(newQuestions);
      toast({ title: "Questions Generated!" });
    } catch (err) {
      toast({ title: "Generation failed", description: String(err), variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const next = existing.filter(q => q.id !== id);
    try {
      await onSave(next);
    } catch (err) {
      toast({ title: "Failed to delete", description: String(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/40 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            AI Question Generator
          </CardTitle>
          <CardDescription>Specify how many questions you need. The AI will read the JD and output tailored technical/behavioral questions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="space-y-2 flex-1 relative">
              <Label className="text-green-400">Easy Questions</Label>
              <Input type="number" min="0" max="10" value={counts.easy} onChange={e => setCounts(prev => ({...prev, easy: parseInt(e.target.value)||0}))} className="bg-background/50 border-green-500/30 text-lg font-mono focus-visible:ring-green-500/50" />
            </div>
            <div className="space-y-2 flex-1 relative">
              <Label className="text-yellow-400">Medium Questions</Label>
              <Input type="number" min="0" max="10" value={counts.medium} onChange={e => setCounts(prev => ({...prev, medium: parseInt(e.target.value)||0}))} className="bg-background/50 border-yellow-500/30 text-lg font-mono focus-visible:ring-yellow-500/50" />
            </div>
            <div className="space-y-2 flex-1 relative">
              <Label className="text-red-400">Hard Questions</Label>
              <Input type="number" min="0" max="10" value={counts.hard} onChange={e => setCounts(prev => ({...prev, hard: parseInt(e.target.value)||0}))} className="bg-background/50 border-red-500/30 text-lg font-mono focus-visible:ring-red-500/50" />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="w-full md:w-auto mt-4 md:mt-0 shadow-lg shadow-primary/20 h-10 px-8">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {existing.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" />
              Generated L1 Questions ({existing.length})
            </h3>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 shrink-0 border-primary/20 hover:bg-primary/5">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
          <div className="grid gap-3">
            {existing.map((q, idx) => (
              <Card key={q.id} className="bg-card border-border/50 group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-md hover:shadow-primary/5">
                <CardContent className="p-4 md:p-5 flex gap-4 items-start md:items-center">
                  <div className="flex-1 space-y-2.5 w-full">
                    {editingId === q.id ? (
                      <div className="space-y-3 pr-2">
                        <Textarea 
                          value={editDraft} 
                          onChange={e => setEditDraft(e.target.value)} 
                          className="min-h-[80px] bg-background text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => saveEdit(q.id)} className="gap-1"><Check className="w-4 h-4"/> Save</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[15px] sm:text-base text-foreground/90 font-medium leading-relaxed pr-8">
                          <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                          {q.text}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="border-primary/30 text-primary/80 bg-primary/5">{q.category}</Badge>
                          <Badge variant="outline" className={
                            q.difficulty === "Easy" ? "border-green-500/30 text-green-400 bg-green-500/5" :
                            q.difficulty === "Medium" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/5" :
                            "border-red-500/30 text-red-400 bg-red-500/5"
                          }>{q.difficulty}</Badge>
                        </div>
                      </>
                    )}
                  </div>
                  {editingId !== q.id && (
                    <div className="flex flex-col gap-1 shrink-0 absolute top-3 right-3 md:relative md:top-0 md:right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(q)} className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
