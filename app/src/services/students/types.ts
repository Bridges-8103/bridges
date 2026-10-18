export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  university?: string | null;
  degree?: string | null;
  fieldOfStudy?: string | null;
  yearOfStudy?: number | null;
  interests: string[];
  skills: string[];
}

export interface StudentListQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface StudentListResponse {
  items: StudentProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
