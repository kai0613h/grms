
import { NavItemType, FileItem, SelectableProgram } from './types';

export const APP_TITLE = "卒業研究管理システム GRMS";

export const NAV_LINKS: NavItemType[] = [
  { label: "Home", path: "/search" }, // Home navigates to search as per common pattern
  { label: "検索", path: "/search" },
  { label: "アップロード", path: "/upload" },
];

// Mock data
export const MOCK_FILES: FileItem[] = [
  { id: "1", name: "Project Brief", tags: ["Project", "Brief", "Report"], lastUpdated: "2 weeks ago" },
  { id: "2", name: "Sprint 1", tags: ["Sprint", "1", "Report"], lastUpdated: "2 weeks ago" },
  { id: "3", name: "Sprint 2", tags: ["Sprint", "2", "Report"], lastUpdated: "2 weeks ago" },
  { id: "4", name: "Sprint 3", tags: ["Sprint", "3", "Report"], lastUpdated: "2 weeks ago" },
  { id: "5", name: "Sprint 4", tags: ["Sprint", "4", "Report"], lastUpdated: "2 weeks ago" },
  { id: "6", name: "Sprint 5", tags: ["Sprint", "5", "Report"], lastUpdated: "2 weeks ago" },
  { id: "prd12", name: "PRD 1.2", tags: ["Engineering", "Design", "Product", "Marketing", "Sales"], lastUpdated: "2 days ago by Sarah", uploadedOn: "January 29, 2023", uploadedBy: "Sarah" },
];

export const MOCK_PROGRAMS: SelectableProgram[] = [
  { id: "p1", name: "Product launch", description: "Details about product launch", startTime: "10:00", endTime: "11:00", room: "A1" },
  { id: "p2", name: "Product update", description: "Details about product update", startTime: "11:00", endTime: "12:00", room: "A2" },
  { id: "p3", name: "Product launch", description: "Another product launch", startTime: "13:00", endTime: "14:00", room: "B1" },
  { id: "p4", name: "Product update", description: "Another product update", startTime: "14:00", endTime: "15:00", room: "B2" },
  { id: "p5", name: "Product launch", description: "Final product launch", startTime: "15:00", endTime: "16:00", room: "C1" },
];

export const SUGGESTED_TAGS: string[] = ["Invoice", "Receipt", "Tax document", "Research", "Thesis", "Presentation"];
