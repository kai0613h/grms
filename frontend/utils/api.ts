import { FileItem } from '../types';

const resolveBaseUrl = (): string => {
  const envValue = import.meta.env.VITE_API_BASE_URL?.trim();
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
