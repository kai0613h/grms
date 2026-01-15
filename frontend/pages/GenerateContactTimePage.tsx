import React, { useState, useEffect } from 'react';
import { ClockIcon, ArrowDownTrayIcon } from '../components/icons';
import Button from '../components/Button';
import RadioCard from '../components/RadioCard';
import Select from '../components/Select';
import { API_BASE_URL } from '../utils/api';

// --- 型定義 ---
interface Student {
  id?: number;
  student_number: number;
  student_name: string;
  theme?: string;
  total_contact_time?: number; // Added field
}

// APIから実際に返ってくるタスクデータを型
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

const GenerateContactTimePage: React.FC = () => {
  // --- State管理 ---
  const [labs, setLabs] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  // 年度のリストをStateで管理
  const [years, setYears] = useState<{ id: number; label: string }[]>([]);

  const [selectedLabName, setSelectedLabName] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // 初期値は一旦nullにするか、現在の年度にする
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [isGenerating, setIsGenerating] = useState(false);

  // 0. 年度一覧の取得 (New)
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notion/years`);
        if (!res.ok) throw new Error('Failed to fetch years');
        const data = await res.json();

        if (data.years && Array.isArray(data.years) && data.years.length > 0) {
          const formattedYears = data.years.map((y: number) => ({
            id: y,
            label: `${y}年度`
          }));
          setYears(formattedYears);

          // もし現在選択中の年度がリストになければ、最新の年度を選択
          if (!data.years.includes(selectedYear)) {
            setSelectedYear(data.years[0]);
          }
        } else {
          // データがない場合のフォールバック（今年は少なくとも入れる）
          const currentYear = new Date().getFullYear();
          setYears([
            { id: currentYear, label: `${currentYear}年度` },
            { id: currentYear + 1, label: `${currentYear + 1}年度` }
          ]);
        }
      } catch (error) {
        console.error("年度一覧の取得失敗:", error);
        // エラー時はデフォルト値をセット
        const currentYear = new Date().getFullYear();
        setYears([
          { id: currentYear, label: `${currentYear}年度` },
          { id: currentYear + 1, label: `${currentYear + 1}年度` }
        ]);
      }
    };
    fetchYears();
  }, []); // 初回のみ実行

  // 1. 研究室一覧の取得（初回ロード時）
  // ※研究室一覧は年度に依存する仕様なら依存配列にselectedYearが必要だが、
  // 現状のAPI(/notion/laboratory_name)は year引数を受け取れるので
  // 年度を変えたら研究室も再取得すべきかもしれない。
  // ここでは要望通り「動的に増やす」ことを主眼に置き、既存の動きを大きく壊さないようにする。
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        // APIは year クエリを受け取れるので、選択年度の研究室だけ出す方が親切
        const res = await fetch(`${API_BASE_URL}/notion/laboratory_name?year=${selectedYear}`);

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
  }, [selectedYear]);

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
      return `${(d.getMonth() + 1)}月 ${d.getDate()}日`;
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

  const formatDurationDetail = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${minutes}分 (${h}時間 ${m}分)`;
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

      // 4. バックエンドのAPIに送信
      const pdfRes = await fetch(`${API_BASE_URL}/pdf/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      alert("PDFの生成に失敗しました。");
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
    // 時間計算
    const currentTotal = tasks.reduce((acc, t) => acc + t.duration, 0);
    // grandTotal (Notion上の総計) があれば使い、なければ今回の合計を総計とする
    const grandTotal = (student.total_contact_time && typeof student.total_contact_time === 'number')
      ? student.total_contact_time
      : currentTotal;

    // 前回までの合計 = 総計 - 今回
    const previousTotal = grandTotal - currentTotal;

    const currentStr = formatDurationDetail(currentTotal);
    const previousStr = formatDurationDetail(Math.max(0, previousTotal));
    const grandTotalStr = formatDurationDetail(grandTotal);

    const contactTimeLines = tasks.map(t =>
      `\\addLine{${t.date}}{${t.start_time}}{${t.end_time}}{${t.excluded}}{${t.duration}}{${t.content}}`
    ).join('\n');

    return `
\\documentclass[a4j,11pt]{jarticle}
\\usepackage[a4paper,totalheight=265mm,textwidth=175mm]{geometry}
\\pagestyle{empty}
\\setlength{\\unitlength}{1mm}
\\newcommand{\\ysize}{192}
\\newcommand{\\xline}{\\line(1,0){175}}%
\\newcommand{\\yline}{\\line(0,1){\\ysize}}%
\\newcount\\x
\\newcount\\y

% --- フレーム描画コマンド ---
\\newcommand{\\startFrame}{%
 \\begin{picture}(175,260)
  \\put(0,0){\\makebox(175,260){}} 

  % --- メインの表 (上部) ---
  \\put(0,30){
   \\thicklines
   \\put(0,0){\\framebox(175,192){}}
   \\put(0,186){\\xline} 
   
   % 縦線
   \\thinlines
   \\put(16,0){\\yline}% 日付
   \\put(33,0){\\yline}% 開始
   \\put(50,0){\\yline}% 終了
   \\put(66,0){\\yline}% 除外
   \\put(90,0){\\yline}% 実施時間
   
   % 横罫線 (30行)
   \\multiput(0,6)(0,6){30}{\\xline}

   % ヘッダー文字
   \\put(0,186){
    \\put(0,0){\\makebox(16,6){日付}}%
    \\put(16,0){\\makebox(17,6){開始時刻}}%
    \\put(33,0){\\makebox(17,6){終了時刻}}%
    \\put(50,0){\\makebox(16,6){除外(分)}}%
    \\put(66,0){\\makebox(24,6){実施時間(分)}}%
    \\put(90,0){\\makebox(85,6){内容}}%
   }

   % 合計欄 (表の直下、実施時間の列)
   \\put(66,-6){\\line(0,1){6}} % 縦線
   \\put(90,-6){\\line(0,1){6}} % 縦線
   \\put(66,-6){\\line(1,0){24}} % 下線
   \\put(66,-6){\\makebox(24,6){${currentTotal}}} 
  }

  % --- フッター集計表 (左下) ---
  \\put(0,0){
   \\thicklines
   % 3行目 (今回の)
   \\put(0,12){\\framebox(60,6){今回のコンタクトタイム}}
   \\put(60,12){\\framebox(60,6){${currentStr}}}

   % 2行目 (これまでの)
   \\put(0,6){\\framebox(60,6){これまでのコンタクトタイム}}
   \\put(60,6){\\framebox(60,6){${previousStr}}}

   % 1行目 (総)
   \\put(0,0){\\framebox(60,6){総コンタクトタイム}}
   \\put(60,0){\\framebox(60,6){${grandTotalStr}}}
  }

  % --- 教員印 (右下) ---
  \\put(155,0){\\thicklines\\framebox(20,20){}}
  \\put(134,0){\\makebox(20,6)[r]{教員の印}} 

  \\global\\y=210 
}

\\newcommand{\\nendoNumber}[3]{%
 \\put(0,236){\\makebox(175,8){\\Large\\bf #1年度　#2研究　コンタクトタイム記録用紙}}%
 \\put(0,244){\\makebox(175,6)[r]{No. #3}}%
}

% 学生番号と名前をスペース区切りで表示
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
  \\put(91,0){\\makebox(83,6)[l]{\\small #6}}%
 }
 \\global\\advance\\y by -6
}

\\begin{document}
\\startFrame
\\nendoNumber{${selectedYear}}{卒業}{1}
\\courseLaboName{情報システム工学コース}{${labName}}{${student.student_number}~~${student.student_name}}
${contactTimeLines}
\\lastFrame
\\end{document}
    `;
  };

  // --- データ更新用ハンドラ ---
  const handleRefresh = async () => {
    if (!confirm("Notionから最新のデータを取得してデータベースを更新しますか？\n（少し時間がかかります）")) return;

    setIsGenerating(true);
    try {
      const rootDbId = "20ab77e257b580d0a8d4fffaeb4f02f9";
      const res = await fetch(`${API_BASE_URL}/notion/laboratories/reflesh?root_database_id=${rootDbId}`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Refresh failed');

      alert("データの更新が完了しました！");
      window.location.reload();

    } catch (error) {
      console.error("更新エラー:", error);
      alert("データの更新に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">コンタクトタイム生成</h1>
          <p className="mt-2 text-slate-500">Notionデータからコンタクトタイム記録用紙（PDF）を生成します</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isGenerating}
          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 text-sm font-bold flex-shrink-0 transition-colors"
        >
          {isGenerating ? "更新中..." : "Notionデータ更新"}
        </button>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        {/* 年度選択 */}
        <div>
          <Select
            label="年度を選択"
            options={years.map(y => ({ value: y.id, label: y.label }))}
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
