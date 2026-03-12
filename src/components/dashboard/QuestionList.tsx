import { useState } from "react";
import { motion, Reorder } from "framer-motion";
import { 
  Pencil, 
  Trash2, 
  GripVertical, 
  Copy, 
  Check, 
  Plus,
  Download,
  ClipboardCopy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Question, QuestionCategory, QUESTION_CATEGORIES } from "@/types/questions";
import { useToast } from "@/hooks/use-toast";

interface QuestionCardProps {
  question: Question;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

function QuestionCard({ question, onEdit, onDelete }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.text);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    onEdit(question.id, editText);
    setIsEditing(false);
    toast({ title: "Question updated" });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(question.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <Reorder.Item
      value={question}
      className="group flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
    >
      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors mt-1">
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 bg-background border-primary"
              autoFocus
            />
            <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <p className="text-foreground leading-relaxed">{question.text}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(question.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}

interface QuestionListProps {
  questions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
  onBack: () => void;
}

export function QuestionList({ questions, onUpdateQuestions, onBack }: QuestionListProps) {
  const { toast } = useToast();
  const [addingToCategory, setAddingToCategory] = useState<QuestionCategory | null>(null);
  const [newQuestionText, setNewQuestionText] = useState("");

  const groupedQuestions = QUESTION_CATEGORIES.reduce((acc, category) => {
    acc[category] = questions.filter((q) => q.category === category);
    return acc;
  }, {} as Record<QuestionCategory, Question[]>);

  const handleEdit = (id: string, text: string) => {
    onUpdateQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const handleDelete = (id: string) => {
    onUpdateQuestions(questions.filter((q) => q.id !== id));
    toast({ title: "Question deleted" });
  };

  const handleReorder = (category: QuestionCategory, newOrder: Question[]) => {
    const otherQuestions = questions.filter((q) => q.category !== category);
    onUpdateQuestions([...otherQuestions, ...newOrder]);
  };

  const handleAddQuestion = (category: QuestionCategory) => {
    if (!newQuestionText.trim()) return;
    const newQuestion: Question = {
      id: `custom-${Date.now()}`,
      text: newQuestionText,
      category,
    };
    onUpdateQuestions([...questions, newQuestion]);
    setNewQuestionText("");
    setAddingToCategory(null);
    toast({ title: "Question added" });
  };

  const handleCopyAll = async () => {
    const allText = QUESTION_CATEGORIES.map((category) => {
      const categoryQuestions = groupedQuestions[category];
      if (categoryQuestions.length === 0) return "";
      return `## ${category}\n${categoryQuestions.map((q, i) => `${i + 1}. ${q.text}`).join("\n")}`;
    })
      .filter(Boolean)
      .join("\n\n");

    await navigator.clipboard.writeText(allText);
    toast({ title: "All questions copied to clipboard" });
  };

  const handleExportPDF = () => {
    // Create a simple text export (PDF would require a library)
    const content = QUESTION_CATEGORIES.map((category) => {
      const categoryQuestions = groupedQuestions[category];
      if (categoryQuestions.length === 0) return "";
      return `${category}\n${"=".repeat(category.length)}\n${categoryQuestions.map((q, i) => `${i + 1}. ${q.text}`).join("\n")}`;
    })
      .filter(Boolean)
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview-questions.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Questions exported" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Generated Questions</h2>
          <p className="text-muted-foreground">{questions.length} questions across {QUESTION_CATEGORIES.length} categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyAll} className="gap-2">
            <ClipboardCopy className="h-4 w-4" />
            Copy All
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={onBack}>
            New JD
          </Button>
        </div>
      </div>

      {/* Question Categories */}
      <div className="space-y-6">
        {QUESTION_CATEGORIES.map((category, categoryIndex) => {
          const categoryQuestions = groupedQuestions[category];
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="glass-strong rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="gradient-text">{category}</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    ({categoryQuestions.length})
                  </span>
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-primary hover:text-primary"
                  onClick={() => setAddingToCategory(addingToCategory === category ? null : category)}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {addingToCategory === category && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex gap-2"
                >
                  <Input
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 bg-background"
                    onKeyDown={(e) => e.key === "Enter" && handleAddQuestion(category)}
                  />
                  <Button onClick={() => handleAddQuestion(category)} className="gradient-primary text-primary-foreground">
                    Add
                  </Button>
                </motion.div>
              )}

              <Reorder.Group
                axis="y"
                values={categoryQuestions}
                onReorder={(newOrder) => handleReorder(category, newOrder)}
                className="space-y-2"
              >
                {categoryQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </Reorder.Group>

              {categoryQuestions.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No questions in this category
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
