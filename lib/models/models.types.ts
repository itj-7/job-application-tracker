export interface Board {
  _id: string;
  name: string;
  columns: Column[];
}
export interface Column {
  _id: string;
  name: string;
  order: number;
  jobApplications: JobApplication[];
}

export interface JobApplication {
  _id: string;
  company: string;
  position: string;
  location?: string;
  status: string;
  order: number;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  appliedDate?: Date;
  tags?: string[];
  description?: string;
  columnId?: string;
}
