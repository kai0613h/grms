import React, { useState, useEffect } from 'react';
import { ClockIcon, ArrowDownTrayIcon } from '../components/icons';
import Button from '../components/Button';
import RadioCard from '../components/RadioCard';
import Select from '../components/Select';

// --- 型定義 ---
interface Student {
  id?: number;
  student_number: number;
  student_name: string;
  theme?: string;
}

// APIから実際に返ってくるタスクデータの型
interface ApiTask {
  student_name: string;
  start_time: string | "Unknown";
  end_time: string | "Unknown";
  working_time: number | "Unknown";
  summary: string | "Unknown";
  excluded_time: number | string;
}

// LaTeX生成用に整形した後の型
interface LatexTask {
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  content: string;
  excluded: number;
}

const YEARS = [
  { id: 2024, label: '2024年度' },
  { id: 2025, label: '2025年度' },
];

const GenerateContactTimePage: React.FC = () => {
  // --- State管理 ---
  const [labs, setLabs] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedLabName, setSelectedLabName] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const [isGenerating, setIsGenerating] = useState(false);

  // 環境変数からAPIのURLを取得（なければlocalhost）
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // 1. 研究室一覧の取得（初回ロード時）
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notion/laboratory_name`);
        if (!res.ok) throw new Error('Failed to fetch labs');
        const data = await res.json();

        if (data.laboratories && Array.isArray(data.laboratories)) {
          setLabs(data.laboratories);
        } else if (Array.isArray(data)) {
          setLabs(data);
        } else {
          setLabs([]);
        }
      } catch (error) {
        console.error("研究室一覧の取得失敗:", error);
      }
    };
    fetchLabs();
  }, []);

  // 2. 学生一覧の取得（研究室または年度変更時）
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedLabName) return;
      setStudents([]);
      setSelectedStudent(null);

      try {
        const params = new URLSearchParams({
          laboratory_name: selectedLabName,
          year: selectedYear.toString(),
        });

        const res = await fetch(`${API_BASE_URL}/notion/laboratory_students?${params}`);
        if (!res.ok) throw new Error('Failed to fetch students');
        const data = await res.json();

        let list: Student[] = [];
        if (data.students && Array.isArray(data.students)) {
          list = data.students;
        } else if (Array.isArray(data)) {
          list = data;
        }
        setStudents(list);
      } catch (error) {
        console.error("学生一覧の取得失敗:", error);
      }
    };
    fetchStudents();
  }, [selectedLabName, selectedYear]);

  // --- データの整形用ヘルパー関数 ---
  const formatIsoDate = (isoString: string | "Unknown"): string => {
    if (!isoString || isoString === "Unknown") return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
    } catch { return ""; }
  };

  const formatIsoTime = (isoString: string | "Unknown"): string => {
    if (!isoString || isoString === "Unknown") return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch { return ""; }
  };

  // --- PDF生成のメイン処理 ---
  const generatePdf = async () => {
    if (!selectedLabName || !selectedStudent) return;
    setIsGenerating(true);

    try {
      // 1. Notionからタスクデータを取得
      const params = new URLSearchParams({
        laboratory_name: selectedLabName,
        year: selectedYear.toString(),
      });

      const res = await fetch(`${API_BASE_URL}/notion/laboratory_tasks?${params}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');

      const data: Record<string, ApiTask[]> = await res.json();

      const targetName = selectedStudent.student_name;
      const rawTasks = data[targetName] || [];

      if (rawTasks.length === 0) {
        alert(`${targetName} さんのコンタクトタイム記録が見つかりませんでした。`);
        setIsGenerating(false);
        return;
      }

      // 2. データをLaTeX用に整形
      const latexTasks: LatexTask[] = rawTasks
        .filter(t => t.start_time !== "Unknown" && t.summary !== "Unknown")
        .map(t => ({
          date: formatIsoDate(t.start_time),
          start_time: formatIsoTime(t.start_time),
          end_time: formatIsoTime(t.end_time),
          duration: typeof t.working_time === 'number' ? t.working_time : 0,
          content: t.summary === "Unknown" ? "" : t.summary,
          excluded: (t.excluded_time === "Unknown" || typeof t.excluded_time !== 'number') ? 0 : t.excluded_time
        }));

      // 3. LaTeXのソースコードを作成
      const latexSource = createLatexString(latexTasks, selectedLabName, selectedStudent);

      console.log("PDF生成を開始します...");

      // 4. バックエンドのAPIに送信 (URLを /pdf/compile に修正済み)
      const pdfRes = await fetch(`${API_BASE_URL}/pdf/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: latexSource }),
      });

      if (!pdfRes.ok) {
        const errorText = await pdfRes.text();
        console.error("PDF生成エラー詳細:", errorText);
        throw new Error('PDFの生成に失敗しました。');
      }

      // 5. PDFをダウンロード
      const pdfBlob = await pdfRes.blob();
      downloadPdfBlob(pdfBlob, `contact_time_${selectedStudent.student_name}.pdf`);

    } catch (error) {
      console.error("生成エラー:", error);
      alert("PDFの生成に失敗しました。\nコンソールログのエラー詳細を確認してください。");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdfBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const createLatexString = (tasks: LatexTask[], labName: string, student: Student) => {
    const contactTimeLines = tasks.map(t =>
      `\\addLine{${t.date}}{${t.start_time}}{${t.end_time}}{${t.excluded}}{${t.duration}}{${t.content}}`
    ).join('\n');

    const totalDuration = tasks.reduce((acc, t) => acc + t.duration, 0);

    return `
\\documentclass[a4j,12pt]{jarticle}
%!TEX root = output.utf8.tex
\\usepackage[a4paper,totalheight=265mm,textwidth=175mm]{geometry}
\\pagestyle{empty}
\\setlength{\\unitlength}{1mm}
\\newcommand{\\ysize}{192}
\\newcommand{\\xline}{\\line(1,0){175}}%
\\newcommand{\\yline}{\\line(0,1){\\ysize}}%
\\newcount\\x
\\newcount\\y
\\newcommand{\\startFrame}{%
 \\begin{picture}(175,260)
  \\put(0,0){\\makebox(175,260){}}
  \\put(0,30){
   \\thicklines
   \\put(0,0){\\framebox(175,192){}}
   \\put(0,186){\\xline}
   \\put(66,0){\\line(0,-1){6}}%
   \\put(90,0){\\line(0,-1){6}}%
   \\put(66,-6){\\line(1,0){24}}%
   \\thinlines
   \\multiput(0,6)(0,6){30}{\\xline}
   \\put(16,0){\\yline}%
   \\put(33,0){\\yline}%
   \\put(50,0){\\yline}%
   \\put(66,0){\\yline}%
   \\put(90,0){\\yline}%
   \\put(0,186){
    \\put(0,0){\\makebox(16,6){日付}}%
    \\put(16,0){\\makebox(17,6){開始時刻}}%
    \\put(33,0){\\makebox(17,6){終了時刻}}%
    \\put(50,0){\\makebox(16,6){除外(分)}}%
    \\put(66,0){\\makebox(24,6){実施時間(分)}}%
    \\put(90,0){\\makebox(85,6){内容}}%
   }
  }
  \\put(0,0){
   \\thicklines
   \\put(0,0){\\framebox(90,18){}}
   \\thinlines
   \\multiput(0,6)(0,6){2}{\\line(1,0){90}}%
   \\put(45,0){\\line(0,1){18}}%
   \\put(0,0){\\makebox(45,6){総コンタクトタイム}}%
   \\put(0,6){\\makebox(45,6){これまでのコンタクトタイム}}%
   \\put(0,12){\\makebox(45,6){今回のコンタクトタイム}}%
  }
  \\put(155,0){\\thicklines\\framebox(20,20){}}
  \\put(140,0){教員の印}%

  \\global\\y=210
}

\\newcommand{\\nendoNumber}[3]{%
 \\put(0,236){\\makebox(175,8){\\Large\\bf #1年度　#2研究　コンタクトタイム記録用紙}}%
 \\put(0,244){\\makebox(175,6)[r]{No. #3}}%
}
\\newcommand{\\courseLaboName}[3]{
\\put(0,228){\\makebox(175,6){%
#1 \\hfil ${labName} \\hfil #3
}}%
}
\\newcommand{\\lastFrame}{
 \\end{picture}
}

\\newcommand{\\addLine}[6]{
 \\put(0,\\y){%
  \\put(0,0){\\makebox(16,6){#1}}%
  \\put(16,0){\\makebox(17,6){#2}}%
  \\put(33,0){\\makebox(17,6){#3}}%
  \\put(50,0){\\makebox(16,6){#4}}%
  \\put(66,0){\\makebox(24,6){#5}}%
  \\put(91,0){\\makebox(83,6)[l]{#6}}%
 }
 \\global\\advance\\y by -6
}

\\newcommand{\\total}[1]{%
 \\put(66,24){\\makebox(24,6){#1}}
}

\\begin{document}
\\startFrame
\\nendoNumber{${selectedYear}}{卒業}{1}
\\courseLaboName{情報通信工学コース}{${labName}}{${student.student_name}}
${contactTimeLines}
\\total{${totalDuration}}
\\lastFrame
\\end{document}
    `;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">コンタクトタイム生成</h1>
        <p className="mt-2 text-slate-500">Notionデータからコンタクトタイム記録用紙（PDF）を生成します</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        {/* 年度選択 */}
        <div>
          <Select
            label="年度を選択"
            options={YEARS.map(y => ({ value: y.id, label: y.label }))}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          />
        </div>

        {/* 研究室選択 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">研究室を選択</label>
          {labs.length === 0 ? (
            <p className="text-sm text-gray-500">研究室データを読み込み中...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {labs.map((labName, index) => (
                <RadioCard
                  key={index}
                  id={`lab-${index}`}
                  name="selectedLab"
                  label={labName}
                  value={labName}
                  checked={selectedLabName === labName}
                  onChange={() => { setSelectedLabName(labName); setSelectedStudent(null); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 学生選択 */}
        {selectedLabName && (
          <div className="animate-fade-in">
            <label className="block text-sm font-medium text-slate-700 mb-3">人を選択</label>
            <div className="space-y-3">
              {students.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  該当する学生がいません
                </p>
              ) : (
                students.map((student, index) => (
                  <RadioCard
                    key={index}
                    id={`student-${index}`}
                    name="selectedStudent"
                    label={student.student_name}
                    description={`${student.student_number} / ${student.theme || 'テーマ未設定'}`}
                    value={student.student_name}
                    checked={selectedStudent?.student_name === student.student_name}
                    onChange={() => setSelectedStudent(student)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* 生成ボタン */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            onClick={generatePdf}
            variant="primary"
            size="lg"
            disabled={!selectedLabName || !selectedStudent || isGenerating}
            className="w-full sm:w-auto shadow-lg shadow-indigo-500/20"
          >
            {isGenerating ? (
              <>
                <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                PDF生成
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateContactTimePage;