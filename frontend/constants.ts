
import { NavItemType } from './types';

export const APP_TITLE = "卒業研究管理システム GRMS";

export const NAV_LINKS: NavItemType[] = [
  { label: "Home", path: "/search" }, // Home navigates to search as per common pattern
  { label: "検索", path: "/search" },
  { label: "アップロード", path: "/upload" },
  { label: "抄録提出", path: "/threads" },
  { label: "プログラム生成", path: "/create-program" },
  { label: "抄録集", path: "/generate-abstracts" },
  { label: "コンタクトタイム生成", path: "/generate-contact-time" },
];

export const SUGGESTED_TAGS: string[] = ["Invoice", "Receipt", "Tax document", "Research", "Thesis", "Presentation"];

export const LABORATORY_OPTIONS = [
  { label: '黒木研究室', value: '黒木研究室' },
  { label: '小林研究室', value: '小林研究室' },
  { label: '大塚研究室', value: '大塚研究室' },
  { label: '田中研究室', value: '田中研究室' },
];
