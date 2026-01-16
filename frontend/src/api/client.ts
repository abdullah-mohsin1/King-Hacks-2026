import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Course {
  id: number;
  code: string;
  title: string;
  createdAt: string;
  lectureCount?: number;
}

export interface Lecture {
  id: number;
  courseCode: string;
  lectureNumber: number;
  lectureTitle?: string;
  status: 'uploaded' | 'transcribing' | 'transcribed' | 'generating' | 'voiced' | 'complete' | 'failed';
  errorMessage?: string;
  outputs?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingStatus {
  status: string;
  errorMessage?: string;
  updatedAt: string;
}

// API functions
export const coursesApi = {
  list: async (): Promise<Course[]> => {
    const { data } = await api.get<Course[]>('/api/courses');
    return data;
  },
  
  get: async (code: string): Promise<Course> => {
    const { data } = await api.get<Course>(`/api/courses/${encodeURIComponent(code)}`);
    return data;
  },
  
  create: async (code: string, title: string): Promise<Course> => {
    const { data } = await api.post<Course>('/api/courses', { code, title });
    return data;
  },
};

export const lecturesApi = {
  list: async (courseCode: string): Promise<Lecture[]> => {
    const { data } = await api.get<Lecture[]>(`/api/courses/${encodeURIComponent(courseCode)}/lectures`);
    return data;
  },
  
  get: async (courseCode: string, lectureNumber: number): Promise<Lecture> => {
    const { data } = await api.get<Lecture>(
      `/api/courses/${encodeURIComponent(courseCode)}/lectures/${lectureNumber}`
    );
    return data;
  },
  
  upload: async (
    courseCode: string,
    lectureNumber: number,
    lectureTitle: string | undefined,
    file: File
  ): Promise<Lecture> => {
    const formData = new FormData();
    formData.append('lectureNumber', lectureNumber.toString());
    if (lectureTitle) {
      formData.append('lectureTitle', lectureTitle);
    }
    formData.append('file', file);
    
    const { data } = await api.post<Lecture>(
      `/api/courses/${encodeURIComponent(courseCode)}/lectures`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },
  
  process: async (
    lectureId: number,
    options: {
      generate: {
        notesShort: boolean;
        notesDetailed: boolean;
        flashcards: boolean;
        quiz: boolean;
        podcastScript: boolean;
      };
      prefs?: {
        tone?: 'friendly tutor' | 'formal' | 'exam mode';
        difficulty?: 'intro' | 'intermediate' | 'advanced';
        lengthMinutes?: number;
        focusTopics?: string[];
      };
      tts: {
        enabled: boolean;
        voiceId?: string;
        twoVoice?: boolean;
      };
    }
  ): Promise<{ lectureId: number; status: string; jobStarted: boolean }> => {
    const { data } = await api.post(`/api/lectures/${lectureId}/process`, options);
    return data;
  },
  
  getStatus: async (lectureId: number): Promise<ProcessingStatus> => {
    const { data } = await api.get<ProcessingStatus>(`/api/lectures/${lectureId}/status`);
    return data;
  },
};

export const outputsApi = {
  getTranscript: async (lectureId: number): Promise<any> => {
    const { data } = await api.get(`/api/lectures/${lectureId}/transcript`);
    return data;
  },
  
  getNotes: async (lectureId: number, type: 'short' | 'detailed'): Promise<string> => {
    const { data } = await api.get(`/api/lectures/${lectureId}/notes?type=${type}`, {
      responseType: 'text',
    });
    return data;
  },
  
  getFlashcards: async (lectureId: number): Promise<any> => {
    const { data } = await api.get(`/api/lectures/${lectureId}/flashcards`);
    return data;
  },
  
  getQuiz: async (lectureId: number): Promise<any> => {
    const { data } = await api.get(`/api/lectures/${lectureId}/quiz`);
    return data;
  },
  
  getPublicNotes: async (courseCode: string, lectureNumber: number, type: 'short' | 'detailed'): Promise<string> => {
    const { data } = await api.get(
      `/api/public/${encodeURIComponent(courseCode)}/lecture/${lectureNumber}/notes?type=${type}`,
      { responseType: 'text' }
    );
    return data;
  },
};

