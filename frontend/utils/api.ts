import {
  FileItem,
  SubmissionThreadSummary,
  SubmissionThreadDetail,
  ThreadSubmission,
  ProgramSessionDefinition,
  ProgramRecord,
} from '../types';

const resolveBaseUrl = (): string => {
  const envValue = import.meta.env.BACKEND_URL?.trim();
  const inferFromWindow = () => {
    if (typeof window === 'undefined') {
      return 'http://localhost:8000';
    }
    const { protocol, hostname } = window.location;
    const inferredHost =
      hostname === '0.0.0.0' || hostname === 'localhost' || hostname === '127.0.0.1'
        ? 'localhost'
        : hostname;
    return `${protocol}//${inferredHost}:8000`;
  };

  if (!envValue) {
    return inferFromWindow();
  }

  if (envValue.includes('host.docker.internal')) {
    if (typeof window !== 'undefined') {
      const targetHost = window.location.hostname || 'localhost';
      return envValue.replace('host.docker.internal', targetHost);
    }
    return envValue.replace('host.docker.internal', 'localhost');
  }

  return envValue;
};

export const API_BASE_URL = resolveBaseUrl().replace(/\/+$/, '');

export interface PaperApiModel {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
  tags: string[] | null;
  uploaded_by?: string | null;
  description?: string | null;
  uploaded_at: string;
}

export interface PaperFilters {
  search?: string;
  tag?: string;
  uploadedBy?: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const toDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normaliseTags = (tags: string[] | null | undefined): string[] =>
  Array.isArray(tags)
    ? tags
        .map((tag) => tag?.trim())
        .filter((tag): tag is string => Boolean(tag && tag.length))
    : [];

const mapPaperToFileItem = (paper: PaperApiModel): FileItem => {
  const uploadedDate = toDate(paper.uploaded_at);
  const lastUpdated = uploadedDate ? dateTimeFormatter.format(uploadedDate) : undefined;
  const uploadedOn = uploadedDate ? dateFormatter.format(uploadedDate) : undefined;

  return {
    id: paper.id,
    name: paper.filename,
    tags: normaliseTags(paper.tags),
    lastUpdated,
    uploadedOn,
    uploadedAtIso: uploadedDate ? uploadedDate.toISOString() : undefined,
    uploadedBy: paper.uploaded_by ?? undefined,
    description: paper.description ?? undefined,
    contentType: paper.content_type,
    fileSize: paper.file_size,
    downloadUrl: `${API_BASE_URL}/papers/${paper.id}/download`,
  };
};

interface ThreadApiModel {
  id: string;
  name: string;
  description?: string | null;
  submission_deadline?: string | null;
  event_datetime?: string | null;
  event_location?: string | null;
  created_at: string;
  updated_at: string;
  submission_count: number;
}

interface ThreadDetailApiModel extends ThreadApiModel {
  submissions: SubmissionApiModel[];
}

interface SubmissionApiModel {
  id: string;
  thread_id: string;
  student_number: string;
  student_name: string;
  laboratory: string;
  laboratory_id: number;
  title: string;
  pdf_filename: string;
  pdf_size: number;
  submitted_at: string;
}

interface ProgramRecordApiModel {
  id: string;
  thread_id?: string | null;
  title: string;
  description?: string | null;
  metadata: Record<string, string | number>;
  sessions: Array<Record<string, unknown>>;
  presentation_order: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

const toIsoString = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const dt = toDate(value);
  return dt ? dt.toISOString() : undefined;
};

const mapSubmission = (submission: SubmissionApiModel): ThreadSubmission => ({
  id: submission.id,
  threadId: submission.thread_id,
  studentNumber: submission.student_number,
  studentName: submission.student_name,
  laboratory: submission.laboratory,
  laboratoryId: submission.laboratory_id,
  title: submission.title,
  pdfFilename: submission.pdf_filename,
  pdfSize: submission.pdf_size,
  submittedAt: submission.submitted_at,
  downloadUrl: `${API_BASE_URL}/conference/threads/${submission.thread_id}/submissions/${submission.id}/download`,
});

const mapThreadSummary = (thread: ThreadApiModel): SubmissionThreadSummary => ({
  id: thread.id,
  name: thread.name,
  description: thread.description ?? undefined,
  submissionDeadline: toIsoString(thread.submission_deadline),
  eventDatetime: toIsoString(thread.event_datetime),
  eventLocation: thread.event_location ?? undefined,
  submissionCount: thread.submission_count ?? 0,
  createdAt: thread.created_at,
  updatedAt: thread.updated_at,
});

const mapThreadDetail = (thread: ThreadDetailApiModel): SubmissionThreadDetail => ({
  ...mapThreadSummary(thread),
  submissions: thread.submissions.map(mapSubmission),
});

const mapProgramRecord = (program: ProgramRecordApiModel): ProgramRecord => ({
  id: program.id,
  threadId: program.thread_id ?? undefined,
  title: program.title,
  description: program.description ?? undefined,
  metadata: program.metadata ?? {},
  sessions: program.sessions ?? [],
  presentationOrder: program.presentation_order ?? [],
  createdAt: program.created_at,
  updatedAt: program.updated_at,
});

const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = await response.json();
    if (typeof payload === 'string') {
      return payload;
    }
    if (payload?.detail) {
      if (typeof payload.detail === 'string') {
        return payload.detail;
      }
      if (Array.isArray(payload.detail) && payload.detail.length) {
        const first = payload.detail[0];
        if (typeof first === 'string') {
          return first;
        }
        if (first?.msg) {
          return first.msg;
        }
      }
      if (payload.detail?.message) {
        return payload.detail.message;
      }
    }
    if (payload?.message) {
      return payload.message;
    }
  } catch {
    // ignore json parse errors
  }
  return `${response.status} ${response.statusText}`;
};

const buildQueryString = (filters: PaperFilters): string => {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }
  if (filters.tag?.trim()) {
    params.set('tag', filters.tag.trim());
  }
  if (filters.uploadedBy?.trim()) {
    params.set('uploaded_by', filters.uploadedBy.trim());
  }
  const query = params.toString();
  return query ? `?${query}` : '';
};

const decodeContentDisposition = (value: string | null): string | undefined => {
  if (!value) return undefined;

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // fall back to raw match
      return utf8Match[1];
    }
  }

  const asciiMatch = value.match(/filename="?([^\";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }
  return undefined;
};

export const fetchPapers = async (filters: PaperFilters = {}): Promise<FileItem[]> => {
  const response = await fetch(`${API_BASE_URL}/papers${buildQueryString(filters)}`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  const payload: PaperApiModel[] = await response.json();
  return payload.map(mapPaperToFileItem);
};

export const fetchPaperById = async (paperId: string): Promise<FileItem> => {
  const response = await fetch(`${API_BASE_URL}/papers/${paperId}`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  const payload: PaperApiModel = await response.json();
  return mapPaperToFileItem(payload);
};

interface UploadPaperParams {
  file: File;
  tags: string[];
  uploadedBy?: string;
  description?: string;
  signal?: AbortSignal;
}

export const uploadPaper = async (params: UploadPaperParams): Promise<FileItem> => {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('tags', JSON.stringify(params.tags));
  if (params.uploadedBy?.trim()) {
    formData.append('uploaded_by', params.uploadedBy.trim());
  }
  if (params.description?.trim()) {
    formData.append('description', params.description.trim());
  }

  const response = await fetch(`${API_BASE_URL}/papers`, {
    method: 'POST',
    body: formData,
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const payload: PaperApiModel = await response.json();
  return mapPaperToFileItem(payload);
};

export const downloadPaper = async (
  paperId: string,
): Promise<{ filename: string; blob: Blob; contentType: string }> => {
  const response = await fetch(`${API_BASE_URL}/papers/${paperId}/download`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const blob = await response.blob();
  const contentType = response.headers.get('Content-Type') ?? 'application/octet-stream';
  const filename =
    decodeContentDisposition(response.headers.get('Content-Disposition')) ?? `${paperId}.bin`;

  return { filename, blob, contentType };
};

export const getDownloadUrl = (paperId: string): string =>
  `${API_BASE_URL}/papers/${paperId}/download`;

export const fetchSubmissionThreads = async (): Promise<SubmissionThreadSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/conference/threads`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  const payload: ThreadApiModel[] = await response.json();
  return payload.map(mapThreadSummary);
};

interface CreateThreadPayload {
  name: string;
  description?: string;
  submissionDeadline?: string;
  eventDatetime?: string;
  eventLocation?: string;
}

export const createSubmissionThread = async (payload: CreateThreadPayload): Promise<SubmissionThreadSummary> => {
  const response = await fetch(`${API_BASE_URL}/conference/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      submission_deadline: payload.submissionDeadline,
      event_datetime: payload.eventDatetime,
      event_location: payload.eventLocation,
    }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  const data: ThreadApiModel = await response.json();
  return mapThreadSummary(data);
};

export const fetchSubmissionThreadDetail = async (threadId: string): Promise<SubmissionThreadDetail> => {
  const response = await fetch(`${API_BASE_URL}/conference/threads/${threadId}`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  const payload: ThreadDetailApiModel = await response.json();
  return mapThreadDetail(payload);
};

interface CreateSubmissionPayload {
  threadId: string;
  studentNumber: string;
  studentName: string;
  laboratory: string;
  title: string;
  file: File;
}

export const submitAbstract = async (payload: CreateSubmissionPayload): Promise<ThreadSubmission> => {
  const formData = new FormData();
  formData.append('student_number', payload.studentNumber);
  formData.append('student_name', payload.studentName);
  formData.append('laboratory', payload.laboratory);
  formData.append('title', payload.title);
  formData.append('pdf', payload.file);

  const response = await fetch(`${API_BASE_URL}/conference/threads/${payload.threadId}/submissions`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const payloadJson: SubmissionApiModel = await response.json();
  return mapSubmission(payloadJson);
};

export const getSubmissionDownloadUrl = (threadId: string, submissionId: string): string =>
  `${API_BASE_URL}/conference/threads/${threadId}/submissions/${submissionId}/download`;

interface CreateProgramPayload {
  threadId: string;
  courseName: string;
  eventName: string;
  eventTheme: string;
  dateTime: string;
  venue: string;
  presentationDurationMinutes: number;
  sessions: ProgramSessionDefinition[];
  title?: string;
  description?: string;
}

export const createProgram = async (payload: CreateProgramPayload): Promise<ProgramRecord> => {
  const response = await fetch(`${API_BASE_URL}/conference/programs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      thread_id: payload.threadId,
      courseName: payload.courseName,
      eventName: payload.eventName,
      eventTheme: payload.eventTheme,
      dateTime: payload.dateTime,
      venue: payload.venue,
      presentationDurationMinutes: payload.presentationDurationMinutes,
      sessions: payload.sessions,
      title: payload.title,
      description: payload.description,
    }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const data: ProgramRecordApiModel = await response.json();
  return mapProgramRecord(data);
};

export const fetchPrograms = async (threadId?: string): Promise<ProgramRecord[]> => {
  const query = threadId ? `?thread_id=${encodeURIComponent(threadId)}` : '';
  const response = await fetch(`${API_BASE_URL}/conference/programs${query}`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  const payload: ProgramRecordApiModel[] = await response.json();
  return payload.map(mapProgramRecord);
};

export const getProgramDownloadUrl = (programId: string): string =>
  `${API_BASE_URL}/conference/programs/${programId}/download`;

export const getBookletDownloadUrl = (programId: string): string =>
  `${API_BASE_URL}/conference/programs/${programId}/booklet`;
