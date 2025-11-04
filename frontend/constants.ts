
import { NavItemType, SelectableProgram } from './types';

export const APP_TITLE = "卒業研究管理システム GRMS";

export const NAV_LINKS: NavItemType[] = [
  { label: "Home", path: "/search" }, // Home navigates to search as per common pattern
  { label: "検索", path: "/search" },
  { label: "アップロード", path: "/upload" },
];

export const MOCK_PROGRAMS: SelectableProgram[] = [
  { id: "p1", name: "Product launch", description: "Details about product launch", startTime: "10:00", endTime: "11:00", room: "A1" },
  { id: "p2", name: "Product update", description: "Details about product update", startTime: "11:00", endTime: "12:00", room: "A2" },
  { id: "p3", name: "Product launch", description: "Another product launch", startTime: "13:00", endTime: "14:00", room: "B1" },
  { id: "p4", name: "Product update", description: "Another product update", startTime: "14:00", endTime: "15:00", room: "B2" },
  { id: "p5", name: "Product launch", description: "Final product launch", startTime: "15:00", endTime: "16:00", room: "C1" },
];

export const SUGGESTED_TAGS: string[] = ["Invoice", "Receipt", "Tax document", "Research", "Thesis", "Presentation"];
