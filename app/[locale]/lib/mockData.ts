export interface Material {
  id: string
  title: string
  description: string
  type: "file" | "link"
  link: string
  date?: string
}

export interface Assignment {
  id: number
  title: string
  description: string
  deadline: string
  status: "not_started" | "in_progress" | "completed"
  notes: string
  materials: Material[]
}

export interface Event {
  id: string
  title: string
  description: string
  start: Date
  end: Date
  instructor: string
  materials: Material[]
}

export interface Goal {
  id: number
  title: string
  description: string
  deadline: string
  priority: "high" | "medium" | "low"
  status: "not_started" | "in_progress" | "completed"
}

export const goals: Goal[] = [
  {
    id: 1,
    title: "Complete TOEIC course",
    description: "Finish all lessons in the TOEIC preparation course",
    deadline: "2023-12-31",
    priority: "high",
    status: "in_progress",
  },
  {
    id: 2,
    title: "Improve speaking skills",
    description: "Practice speaking for 30 minutes daily",
    deadline: "2023-11-30",
    priority: "medium",
    status: "not_started",
  },
  {
    id: 3,
    title: "Read 5 English books",
    description: "Read and summarize 5 English novels",
    deadline: "2023-12-15",
    priority: "low",
    status: "in_progress",
  },
]

export const materials: Material[] = [
  {
    id: "1",
    title: "Basic English Learning Materials",
    description: "Materials for English beginners",
    type: "file",
    link: "https://example.com/english-basics.pdf",
    date: "2024-01-15"
  },
  {
    id: "2", 
    title: "Advanced English Grammar",
    description: "Grammar materials for intermediate and advanced levels",
    type: "file",
    link: "https://example.com/advanced-grammar.pdf",
    date: "2024-01-20"
  },
  {
    id: "3",
    title: "500 Common Words",
    description: "List of 500 most common English words",
    type: "file", 
    link: "https://example.com/vocabulary.pdf",
    date: "2024-01-25"
  }
]

export const assignments: Assignment[] = [
  {
    id: 1,
    title: "TOEIC Practice Test 1",
    description: "Complete TOEIC practice test and review answers",
    deadline: "2024-02-25",
    status: "not_started",
    notes: "Focus on listening section",
    materials: [],
  },
  {
    id: 2,
    title: "Write an Essay",
    description: "Write a 500-word essay on a given topic",
    deadline: "2024-03-05",
    status: "in_progress",
    notes: "Outline completed, working on first draft",
    materials: [],
  },
  {
    id: 3,
    title: "Vocabulary Quiz",
    description: "Take online vocabulary quiz",
    deadline: "2024-02-20",
    status: "completed",
    notes: "Scored 85%, review missed words",
    materials: [],
  },
]

export const events: Event[] = [
  {
    id: "1",
    title: "Day 1 - Review",
    description: "Review session for Day 1 materials",
    start: new Date(2024, 1, 3, 8, 0),
    end: new Date(2024, 1, 3, 10, 0),
    instructor: "Vu Nguyen",
    materials: [
      {
        id: "4",
        title: "AIO2025 - Daily code day 1.pdf",
        description: "Day 1 learning materials",
        type: "file",
        link: "/materials/daily-code-1.pdf",
      },
    ],
  },
  {
    id: "2",
    title: "AIO2024 - M08W1 - Study Guide",
    description: "Study guide for Module 8 Week 1",
    start: new Date(2024, 1, 3, 10, 0),
    end: new Date(2024, 1, 3, 12, 0),
    instructor: "Vu Nguyen",
    materials: [
      {
        id: "5",
        title: "Study Guide - M08W1.pdf",
        description: "Study guide for Module 8 Week 1",
        type: "file",
        link: "/materials/study-guide.pdf",
      },
    ],
  },
  {
    id: "3",
    title: "AIO2024 - M08EC - Mixture of Experts",
    description: "Session about Mixture of Experts in Module 8",
    start: new Date("2025-02-08T20:00:00"),
    end: new Date("2025-02-08T22:00:00"),
    instructor: "Vu Nguyen",
    materials: [
      {
        id: "6",
        title: "Mixture of Expert.pdf",
        description: "Materials about Mixture of Experts",
        type: "file",
        link: "/materials/mixture-expert.pdf",
      },
    ],
  },
] 