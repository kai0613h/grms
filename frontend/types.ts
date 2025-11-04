
export interface NavItemType {
  label: string;
  path: string;
}

export interface FileItem {
  id: string;
  name: string;
  tags: string[];
  lastUpdated?: string;
  uploadedOn?: string;
  uploadedAtIso?: string;
  uploadedBy?: string;
  description?: string;
  contentType?: string;
  fileSize?: number;
  downloadUrl?: string;
}

export interface AbstractSubmission {
  id: string;
  programId: string;
  order: number;
  presenter: string;
  title: string;
  summary: string;
}

export interface SubmissionThreadSummary {
  id: string;
  name: string;
  description?: string;
  submissionDeadline?: string;
  eventDatetime?: string;
  eventLocation?: string;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionThreadDetail extends SubmissionThreadSummary {
  submissions: ThreadSubmission[];
}

export interface ThreadSubmission {
  id: string;
  threadId: string;
  studentNumber: string;
  studentName: string;
  laboratory: string;
  laboratoryId: number;
  title: string;
  pdfFilename: string;
  pdfSize: number;
  submittedAt: string;
  downloadUrl: string;
}

export interface ProgramSessionDefinition {
  type: 'session' | 'break';
  startTime: string;
  endTime: string;
  chair?: string;
  timekeeper?: string;
}

export interface ProgramRecord {
  id: string;
  threadId?: string;
  title: string;
  description?: string;
  metadata: Record<string, string | number>;
  sessions: Array<Record<string, unknown>>;
  presentationOrder: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export enum Page {
  Search = '/search',
  Upload = '/upload',
  FileDetails = '/file/:id', // Note: for routing, actual ID will replace :id
  CreateProgram = '/create-program',
  GenerateAbstracts = '/generate-abstracts',
  SubmissionThreads = '/threads',
  SubmissionThreadDetail = '/threads/:threadId',
}
