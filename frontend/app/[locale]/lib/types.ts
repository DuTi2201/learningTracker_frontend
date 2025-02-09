export interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'file' | 'link';
  link: string;
  date: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: 'not_started' | 'in_progress' | 'completed';
  notes: string;
  materials: Material[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  instructor?: string;
  materials?: Material[];
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'completed';
} 