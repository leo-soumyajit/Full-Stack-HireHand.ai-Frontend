import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  Trash2,
  ListChecks,
  Download,
  Edit2,
  Check,
  Layers,
  Tag,
  Plus,
  Filter,
} from "lucide-react";
import { ApiPosition, ApiL1Question } from "@/types/api";
import {
  generateInterviewQuestions,
  INTERVIEW_LEVELS,
  INTERVIEW_CATEGORIES,
  type InterviewLevel,
} from "@/lib/openrouter";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  position: ApiPosition;
  onSave: (questions: ApiL1Question[]) => Promise<void>;
}

/** Extract level from a question — uses `q.level` or falls back to parsing the id */
function getQuestionLevel(q: ApiL1Question): string {
  if (q.level) return q.level;
  const match = q.id.match(/^(l\d)/i);
  return match ? match[1].toUpperCase() : "L1";
}

export function PositionL1QuestionsTab({ position, onSave }: Props) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // ── Generator form state ────────────────────────────────────
  const [level, setLevel] = useState<InterviewLevel>("L1");
  const [category, setCategory] = useState<string>("Technical");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [counts, setCounts] = useState({ easy: 2, medium: 3, hard: 1 });

  // ── Category filter (within current level) ──────────────────
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const allQuestions = position.l1_questions || [];

  // Questions for the currently selected level
  const levelQuestions = useMemo(
    () => allQuestions.filter((q) => getQuestionLevel(q) === level),
    [allQuestions, level]
  );

  // Count per level (for badge display)
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    INTERVIEW_LEVELS.forEach((l) => (counts[l] = 0));
    allQuestions.forEach((q) => {
      const l = getQuestionLevel(q);
      counts[l] = (counts[l] || 0) + 1;
    });
    return counts;
  }, [allQuestions]);

  // Unique categories for the current level (for filter dropdown)
  const levelCategories = useMemo(() => {
    const set = new Set<string>();
    levelQuestions.forEach((q) => set.add(q.category));
    return Array.from(set).sort();
  }, [levelQuestions]);

  // Apply category filter
  const filteredQuestions = useMemo(() => {
    if (filterCategory === "all") return levelQuestions;
    return levelQuestions.filter((q) => q.category === filterCategory);
  }, [levelQuestions, filterCategory]);

  const activeCategory = showCustomCategory ? customCategory.trim() || "Custom" : category;

  // Reset category filter when level changes
  const handleLevelChange = (newLevel: InterviewLevel) => {
    setLevel(newLevel);
    setFilterCategory("all");
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
    if (showCustomCategory && !customCategory.trim()) {
      toast({ title: "Enter category", description: "Please type a custom category name.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const allJdText = [
        position.jd.purpose || "",
        ...(position.jd.experience || []),
        ...(position.jd.responsibilities || []),
        ...(position.jd.skills || []),
      ].join("\n");

      const newQuestions = await generateInterviewQuestions({
        jobDescription: allJdText,
        role: position.title,
        level,
        category: activeCategory,
        counts,
        existingQuestions: allQuestions, // Pass ALL existing questions so AI avoids repeating
      });

      // Append new questions to the global array
      const merged = [...allQuestions, ...newQuestions];
      await onSave(merged);
      toast({
        title: `${newQuestions.length} ${level} Questions Generated!`,
        description: `${activeCategory} — ${counts.easy}E / ${counts.medium}M / ${counts.hard}H`,
      });
    } catch (err) {
      toast({ title: "Generation failed", description: String(err), variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const next = allQuestions.filter((q) => q.id !== id);
    try {
      await onSave(next);
    } catch (err) {
      toast({ title: "Failed to delete", description: String(err), variant: "destructive" });
    }
  };

  const handleClearLevel = async () => {
    // Remove only questions for the currently selected level
    const next = allQuestions.filter((q) => getQuestionLevel(q) !== level);
    try {
      await onSave(next);
      toast({ title: `All ${level} questions cleared` });
    } catch (err) {
      toast({ title: "Failed to clear", description: String(err), variant: "destructive" });
    }
  };

  const startEdit = (q: ApiL1Question) => {
    setEditingId(q.id);
    setEditDraft(q.text);
  };

  const saveEdit = async (id: string) => {
    if (!editDraft.trim()) return;
    const next = allQuestions.map((q) => (q.id === id ? { ...q, text: editDraft.trim() } : q));
    try {
      await onSave(next);
      setEditingId(null);
      toast({ title: "Question updated successfully" });
    } catch (err) {
      toast({ title: "Failed to update", description: String(err), variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    const qs = levelQuestions;
    if (!qs.length) return;
    const headers = ["Sl No", "Level", "Category", "Difficulty", "Question"];
    const rows = qs.map((q, i) => [
      i + 1,
      getQuestionLevel(q),
      q.category,
      q.difficulty,
      `"${q.text.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${level}_Questions_${position.req_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const difficultyColor = (d: string) =>
    d === "Easy"
      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
      : d === "Medium"
        ? "border-amber-500/30 text-amber-400 bg-amber-500/5"
        : "border-red-500/30 text-red-400 bg-red-500/5";

  return (
    <div className="space-y-6">
      {/* ── AI Question Generator Card ────────────────────────────────── */}
      <Card className="glass-strong overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center gap-3 p-5 border-b border-border/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-display">AI Interview Question Generator</h3>
              <p className="text-xs text-muted-foreground">
                Select level, category, and difficulty distribution. AI generates questions from your JD.
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Row 1: Level + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Interview Level — this is also the view filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Interview Level
                </label>
                <div className="flex gap-1.5">
                  {INTERVIEW_LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => handleLevelChange(l)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border relative ${
                        level === l
                          ? "gradient-primary text-primary-foreground border-transparent shadow-md shadow-primary/20"
                          : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      {l}
                      {levelCounts[l] > 0 && (
                        <span
                          className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-bold ${
                            level === l
                              ? "bg-primary-foreground text-primary"
                              : "bg-primary/20 text-primary"
                          }`}
                        >
                          {levelCounts[l]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Category */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  Question Category
                </label>
                {showCustomCategory ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Data Structures, HR Policy..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="bg-background/50 border-border/50 text-sm focus-visible:ring-primary/50"
                      autoFocus
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomCategory(false);
                        setCustomCategory("");
                      }}
                      className="shrink-0 border-border/50 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 text-sm bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      {INTERVIEW_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomCategory(true)}
                      className="shrink-0 border-border/50 text-xs gap-1 hover:border-primary/50"
                      title="Add custom category"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Other
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Difficulty Counts + Generate Button */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-3 gap-3">
                {/* Easy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    Easy
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={counts.easy}
                    onChange={(e) => setCounts((prev) => ({ ...prev, easy: parseInt(e.target.value) || 0 }))}
                    className="bg-background/50 border-emerald-500/30 text-lg font-mono focus-visible:ring-emerald-500/50 text-center"
                  />
                </div>
                {/* Medium */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Medium
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={counts.medium}
                    onChange={(e) => setCounts((prev) => ({ ...prev, medium: parseInt(e.target.value) || 0 }))}
                    className="bg-background/50 border-amber-500/30 text-lg font-mono focus-visible:ring-amber-500/50 text-center"
                  />
                </div>
                {/* Hard */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-red-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    Hard
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={counts.hard}
                    onChange={(e) => setCounts((prev) => ({ ...prev, hard: parseInt(e.target.value) || 0 }))}
                    className="bg-background/50 border-red-500/30 text-lg font-mono focus-visible:ring-red-500/50 text-center"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !position.jd}
                className="gradient-primary text-primary-foreground font-semibold h-11 px-6 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all w-full md:w-auto min-w-[180px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate {level} Questions
                  </>
                )}
              </Button>
            </div>

            {/* Active Selection Summary */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <span>Generating:</span>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">
                {level}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                {activeCategory}
              </Badge>
              <span>→</span>
              <span className="text-emerald-400">{counts.easy}E</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-amber-400">{counts.medium}M</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-red-400">{counts.hard}H</span>
              <span className="text-muted-foreground/50">=</span>
              <span className="font-semibold text-foreground">{counts.easy + counts.medium + counts.hard} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Questions for the selected level ─────────────────────────── */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            {level} Questions
            {levelQuestions.length > 0 && (
              <Badge className="ml-1 bg-primary/20 text-primary border-0 text-xs">{levelQuestions.length}</Badge>
            )}
          </h3>
          {levelQuestions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter within level */}
              {levelCategories.length > 1 && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-xs bg-background/50 border border-border/50 rounded-lg px-2.5 py-1.5 text-foreground outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {levelCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-1.5 shrink-0 border-border/40 hover:bg-muted text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLevel}
                className="gap-1.5 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear {level}
              </Button>
            </div>
          )}
        </div>

        {/* Filtered count indicator */}
        {filterCategory !== "all" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>
              Showing {filteredQuestions.length} of {levelQuestions.length} {level} questions
            </span>
            <button
              onClick={() => setFilterCategory("all")}
              className="text-primary hover:underline ml-1"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Empty state */}
        {levelQuestions.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted/30 flex items-center justify-center">
                  <ListChecks className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">No {level} questions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a category above and generate {level} interview questions from your JD.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Cards */}
        {filteredQuestions.length > 0 && (
          <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredQuestions.map((q, idx) => (
              <Card
                key={q.id}
                className="glass-card group relative overflow-hidden transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
              >
                <CardContent className="p-4 md:p-5 flex gap-4 items-start md:items-center">
                  <div className="flex-1 space-y-2.5 w-full">
                    {editingId === q.id ? (
                      <div className="space-y-3 pr-2">
                        <Textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          className="min-h-[80px] bg-background text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => saveEdit(q.id)} className="gap-1">
                            <Check className="w-4 h-4" /> Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[15px] sm:text-base text-foreground/90 font-medium leading-relaxed pr-8">
                          <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                          {q.text}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground">
                            {q.category}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${difficultyColor(q.difficulty)}`}>
                            {q.difficulty}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                  {editingId !== q.id && (
                    <div className="flex flex-col gap-1 shrink-0 absolute top-3 right-3 md:relative md:top-0 md:right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(q)}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(q.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
