
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
  abstractDeadline?: string;
  paperDeadline?: string;
  presentationDeadline?: string;
  eventDatetime?: string;
  hasAbstract: boolean;
  hasPaper: boolean;
  hasPresentation: boolean;
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
  abstractFilename?: string;
  paperFilename?: string;
  presentationFilename?: string;
  submittedAt: string;
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

export interface ProgramPreview {
  metadata: Record<string, unknown>;
  sessions: Array<Record<string, unknown>>;
  presentationOrder: Array<Record<string, unknown>>;
}

export interface Laboratory {
  id: number;
  name: string;
  year?: number;
}

export enum Page {
  Search = '/search',
  Upload = '/upload',
  FileDetails = '/file/:id', // Note: for routing, actual ID will replace :id
  CreateProgram = '/create-program',
  GenerateAbstracts = '/generate-abstracts',
  GenerateContactTime = '/generate-contact-time',
  SubmissionThreads = '/threads',
  SubmissionThreadDetail = '/threads/:threadId',
}
