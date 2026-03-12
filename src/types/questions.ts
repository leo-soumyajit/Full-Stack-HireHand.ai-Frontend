export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
}

export type QuestionCategory =
  | "Technical"
  | "Behavioral"
  | "Problem Solving"
  | "Cultural Fit"
  | "Leadership"
  | "Communication";

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  "Technical",
  "Behavioral",
  "Problem Solving",
  "Cultural Fit",
  "Leadership",
  "Communication",
];

export const generateMockQuestions = (): Question[] => {
  return [
    // Technical
    { id: "t1", text: "Describe your experience with the primary technologies mentioned in the job description.", category: "Technical" },
    { id: "t2", text: "How do you approach debugging complex technical issues?", category: "Technical" },
    { id: "t3", text: "What's your process for learning new technologies quickly?", category: "Technical" },
    
    // Behavioral
    { id: "b1", text: "Tell me about a time when you had to meet a tight deadline. How did you handle it?", category: "Behavioral" },
    { id: "b2", text: "Describe a situation where you had to work with a difficult team member.", category: "Behavioral" },
    { id: "b3", text: "Give an example of when you went above and beyond for a project.", category: "Behavioral" },
    
    // Problem Solving
    { id: "ps1", text: "Walk me through your approach to solving a complex problem you've faced.", category: "Problem Solving" },
    { id: "ps2", text: "How do you prioritize tasks when everything seems urgent?", category: "Problem Solving" },
    { id: "ps3", text: "Describe a time when you had to make a decision with incomplete information.", category: "Problem Solving" },
    
    // Cultural Fit
    { id: "cf1", text: "What type of work environment helps you do your best work?", category: "Cultural Fit" },
    { id: "cf2", text: "How do you handle feedback, both giving and receiving?", category: "Cultural Fit" },
    { id: "cf3", text: "What motivates you in your professional career?", category: "Cultural Fit" },
    
    // Leadership
    { id: "l1", text: "Describe your leadership style and how it has evolved.", category: "Leadership" },
    { id: "l2", text: "Tell me about a time you mentored someone. What was the outcome?", category: "Leadership" },
    { id: "l3", text: "How do you handle conflicts within your team?", category: "Leadership" },
    
    // Communication
    { id: "c1", text: "How do you ensure clear communication in a remote/hybrid environment?", category: "Communication" },
    { id: "c2", text: "Describe a time when you had to explain a complex concept to a non-technical audience.", category: "Communication" },
    { id: "c3", text: "How do you approach giving constructive criticism?", category: "Communication" },
  ];
};
