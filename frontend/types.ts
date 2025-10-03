
export interface NavItemType {
  label: string;
  path: string;
}

export interface FileItem {
  id: string;
  name: string;
  tags: string[];
  lastUpdated: string;
  uploadedOn?: string;
  uploadedBy?: string;
  description?: string; // For PRD 1.2
}

export interface Program {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface SelectableProgram extends Program {
  // any additional properties for selection if needed
}

export enum Page {
  Search = '/search',
  Upload = '/upload',
  FileDetails = '/file/:id', // Note: for routing, actual ID will replace :id
  CreateProgram = '/create-program',
  GenerateAbstracts = '/generate-abstracts',
}
