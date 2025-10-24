import React, { useState } from 'react';
// pdflatex-ts のインポートを削除

import Button from '../components/Button';
import Input from '../components/Input';
import SectionTitle from '../components/SectionTitle';

// --- 型定義 ---
interface Presentation {
  id: number;
  student_number: number;
  student_name: string;
  laboratory_id: number;
  theme: string;
  years_id: number;
}
interface Session {
  type: 'session' | 'break';
  startTime: string;
  endTime: string;
  chair?: string;
  timekeeper?: string;
  presentations?: Presentation[];
}
interface ScheduleData {
  courseName: string;
  eventName: string;
  eventTheme: string;
  dateTime: string;
  venue: string;
  sessions: Session[];
}

// --- 仮データ ---
const mockPresentationsDB: Presentation[] = [
    { id: 1, student_number: 5401, student_name: '淺島 楓良', laboratory_id: 1, theme: '品川区における最適避難所の分析', years_id: 2 },
    { id: 2, student_number: 5402, student_name: '高塚 空輝', laboratory_id: 2, theme: 'マイナンバーカードの暗号技術による安全性を体系的に学べるシステムの開発', years_id: 2 },
    { id: 3, student_number: 5403, student_name: '村上 祥', laboratory_id: 3, theme: '教職員の業務効率化と学生の主attiv行動を支援する進路支援システムの開発', years_id: 2 },
    { id: 4, student_number: 5404, student_name: '谷 春奈', laboratory_id: 4, theme: '聴覚障害者を対象にした投手の音声認識・文字起こしシステム', years_id: 2 },
    { id: 5, student_number: 5405, student_name: '大住 悠惺', laboratory_id: 1, theme: 'Timing side-channel leak を排除したコードの生成技術の調査と開発について', years_id: 2 },
    { id: 6, student_number: 5406, student_name: '兒玉 百合香', laboratory_id: 2, theme: '環境に左右されない物体検出', years_id: 2 },
    { id: 7, student_number: 5407, student_name: '堀川 風花', laboratory_id: 3, theme: 'スマホを用いた高齢者と障害者の行動解析', years_id: 2 },
    { id: 8, student_number: 5408, student_name: '戸塚 晴太郎', laboratory_id: 4, theme: 'ランニング中の音楽聴取がパフォーマンスに与える影響', years_id: 2 },
    { id: 9, student_number: 5409, student_name: '橋本 洪主', laboratory_id: 1, theme: '正規表現に対する検索可能暗号の高速化', years_id: 2 },
    { id: 10, student_number: 5410, student_name: '波多野 楓', laboratory_id: 2, theme: 'BERT を用いたオンライン小説のあらすじの評価', years_id: 2 },
    { id: 11, student_number: 5411, student_name: '長谷川 穂墳', laboratory_id: 3, theme: 'VR 環境におけるアバターの違いによるコミュニケーションについて', years_id: 2 },
    { id: 12, student_number: 5412, student_name: '輿石 一舞', laboratory_id: 4, theme: 'プログラミング試験の半自動採点システムの提案', years_id: 2 },
    { id: 13, student_number: 5413, student_name: '濱中 幾門', laboratory_id: 1, theme: 'バレーボールにおけるスパイク動作の異常検出', years_id: 2 },
    { id: 14, student_number: 5414, student_name: '松本 郁美', laboratory_id: 2, theme: 'MIDI データによる演奏への技術的・感情的表現の付加', years_id: 2 },
    { id: 15, student_number: 5415, student_name: '河井 政哉', laboratory_id: 3, theme: 'TEE による機密 Faas 基盤ソフトウェアの開発', years_id: 2 },
    { id: 16, student_number: 5416, student_name: '岸川 幸平', laboratory_id: 4, theme: 'H.264/MPEG-4 AVC に対する動作認識のための Encryption-then-Compression システム', years_id: 2 },
    { id: 17, student_number: 5417, student_name: '薄葉 太一', laboratory_id: 1, theme: 'インターネット上におけるアンチコメントの表現変更による効果', years_id: 2 },
    { id: 18, student_number: 5418, student_name: '大和 男飛', laboratory_id: 2, theme: '小型コンピュータを用いた作業者の行動分析', years_id: 2 },
    { id: 19, student_number: 5419, student_name: '田中 瑛人', laboratory_id: 3, theme: 'ソフト制約を考慮した時間割編成支援システムの開発', years_id: 2 },
    { id: 20, student_number: 5420, student_name: '笹川 駿', laboratory_id: 4, theme: 'CGL ハッシュ関数の高速化', years_id: 2 },
];

const fetchPresentationsFromDB = async (): Promise<Presentation[]> => {
    return new Promise(resolve => setTimeout(() => resolve(mockPresentationsDB), 500));
};

// --- HTMLプレビュー用コンポーネント ---
const PrintableContent: React.FC<{ data: ScheduleData }> = ({ data }) => {
    let presentationCounter = 1;
    return (
        <div className="p-8 bg-white max-w-4xl mx-auto font-sans text-gray-800 shadow-lg mt-6">
            <header className="text-center mb-10">
                <p className="text-lg">{data.courseName}</p>
                <h1 className="text-3xl font-bold my-2">{data.eventName}</h1>
                <p className="text-xl mb-6">{data.eventTheme}</p>
                <p>{data.dateTime}</p>
                <p>{data.venue}</p>
            </header>
            <main>
                {data.sessions.map((session, index) => {
                    const timeDisplay = `${session.startTime}〜${session.endTime}`;
                    if (session.type === 'break') {
                        return <div key={index} className="text-center font-bold my-6 py-2">Break ({timeDisplay})</div>;
                    }
                    const sessionNumber = data.sessions.filter(s => s.type === 'session').findIndex(s => s === session) + 1;
                    return (
                        <section key={index} className="mb-8 break-inside-avoid">
                            <div className="border-b-2 border-gray-800 pb-1 mb-3">
                                <h2 className="text-xl font-bold inline-block mr-4">Session {sessionNumber} ({timeDisplay})</h2>
                                <span className="text-sm">座長: {session.chair}, タイムキーパー: {session.timekeeper}</span>
                            </div>
                            <ol className="space-y-2">
                                {session.presentations?.map((p) => {
                                    const currentNumber = presentationCounter++;
                                    return (
                                        <li key={p.id} className="flex">
                                            <span className="w-8">{currentNumber}.</span>
                                            <div className="flex-1">
                                                <p className="font-semibold">{p.theme}</p>
                                                <p className="text-right text-sm">{p.student_name}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </section>
                    );
                })}
            </main>
        </div>
    );
};


// ==================================================================
// ★★★ メインコンポーネント ★★★
// ==================================================================
const DynamicProgramPage: React.FC = () => {
    const PRESENTATION_TIME_MINUTES = 15;

    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // --- フォーム用 State ---
    const [eventDetails, setEventDetails] = useState({
        courseName: '2025年度 情報システム工学コース',
        eventName: '卒業研究中間発表会',
        eventTheme: '〜情報アーキテクト〜',
        dateTime: '2025年8月1日(金) 10:30〜16:25',
        venue: '会場: 6階 IS-631・632',
    });
    const [sessions, setSessions] = useState<Session[]>([
        { type: 'session', startTime: '10:30', endTime: '12:00', chair: '橋本 洪主', timekeeper: '笹川 駿' },
        { type: 'break', startTime: '12:00', endTime: '12:45' },
        { type: 'session', startTime: '12:45', endTime: '14:30', chair: '河井 政哉', timekeeper: '高塚 空輝' },
        { type: 'break', startTime: '14:30', endTime: '14:40' },
        { type: 'session', startTime: '14:40', endTime: '16:25', chair: '橋本 洪主', timekeeper: '大住 悠惺' },
    ]);

    // --- 生成データ/エラー表示用 State ---
    const [generatedData, setGeneratedData] = useState<ScheduleData | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // --- LaTeXエスケープ関数 ---
    const escapeLatex = (str: string): string => {
      if (!str) return '';
      return str.replace(/([&%$#_{}])/g, '\\$1')
                .replace(/\\/g, '\\textbackslash{}')
                .replace(/[~^]/g, '\\$&{}')
                .replace(/_/g, '\\_');
    };

    // --- LaTeX文字列生成関数 ---
    const generateLatexString = (data: ScheduleData): string => {
        let presentationCounter = 1;
        const sessionsLatex = data.sessions.map((session, index) => {
            const sessionTitle = `${escapeLatex(session.startTime)}〜${escapeLatex(session.endTime)}`;
            if (session.type === 'break') {
                return `\\section*{Break（${sessionTitle}）}\n\\vspace{0.5cm}`;
            }
            const sessionNumber = data.sessions.filter((s, i) => s.type === 'session' && i <= index).length;
            const chair = escapeLatex(session.chair || '');
            const timekeeper = escapeLatex(session.timekeeper || '');
            const presentationsLatex = session.presentations?.map(p => {
                const line = `  ${presentationCounter}. & ${escapeLatex(p.student_name)} & ${escapeLatex(p.theme)} \\\\`;
                presentationCounter++;
                return line;
            }).join('\n');
            return `
\\section*{Session ${sessionNumber}（${sessionTitle}）{\\normalsize 座長：${chair}、タイムキーパー：${timekeeper}} }
\\begin{tabular}{rlp{12cm}}
${presentationsLatex}
\\end{tabular}
`;
        }).join('\n\\vspace{0.5cm}\n');

        // Overleaf などでコンパイルしやすい標準的なヘッダー
        const originalHeader = `
\\documentclass[dvipdfmx,a4j]{jsarticle}
`;

        return `
${originalHeader}
\\usepackage[top=20truemm,bottom=20truemm,left=25truemm,right=25truemm]{geometry}
\\begin{document}
\\title{{\\normalsize ${escapeLatex(data.courseName)}} \\\\
{\\LARGE ${escapeLatex(data.eventName)}} \\\\
{\\Large ${escapeLatex(data.eventTheme)}}}
\\date{\\empty}
\\maketitle
\\vspace{-1cm}
\\noindent
\\hspace{5cm} 日時：${escapeLatex(data.dateTime)} \\\\
\\hspace{5cm} 会場：${escapeLatex(data.venue)}
\\vspace{1cm}
${sessionsLatex}
\\end{document}
`;
    };

    // --- .tex ダウンロード関数 ---
    const handleTexDownload = () => {
        if (!generatedData) return;

        try {
            const latexContent = generateLatexString(generatedData);
            const blob = new Blob([latexContent], { type: 'text/x-latex;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'program.tex'; // ファイル名を .tex に
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('TeX Generate Error:', error);
            setErrorMessage('LaTeX (.tex) ファイルの生成に失敗しました。');
        }
    };

    // --- 時刻計算 ---
    const getDurationInMinutes = (startTimeStr: string, endTimeStr: string): number => {
        if (!startTimeStr || !endTimeStr) return 0;
        try {
            const [startHour, startMin] = startTimeStr.split(':').map(Number);
            const [endHour, endMin] = endTimeStr.split(':').map(Number);
            if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) return 0;
            const startTimeInMinutes = startHour * 60 + startMin;
            const endTimeInMinutes = endHour * 60 + endMin;
            return endTimeInMinutes - startTimeInMinutes;
        } catch (error) {
            console.error("Time parsing failed:", startTimeStr, endTimeStr, error);
            return 0;
        }
    };

    // --- プレビュー生成ロジック ---
    const handleGenerate = async () => {
        setIsLoadingPreview(true);
        setErrorMessage(null);
        setGeneratedData(null);

        const allPresentations = await fetchPresentationsFromDB();

        const presentationSessions = sessions.filter(s => s.type === 'session');
        const sessionCapacities = presentationSessions.map(s => {
            const duration = getDurationInMinutes(s.startTime, s.endTime);
            return Math.floor(duration / PRESENTATION_TIME_MINUTES);
        });
        const totalCapacity = sessionCapacities.reduce((sum, cap) => sum + cap, 0);

        if (totalCapacity < allPresentations.length) {
            setErrorMessage(`警告: 発表者数(${allPresentations.length}人)に必要な時間枠が足りません。(${-(totalCapacity-allPresentations.length)})人分`);
            setIsLoadingPreview(false);
            return;
        }

        const labGroups = new Map<number, Presentation[]>();
        allPresentations.forEach(p => {
            if (!labGroups.has(p.laboratory_id)) {
                labGroups.set(p.laboratory_id, []);
            }
            const group = labGroups.get(p.laboratory_id)!;
            group.push(p);
            group.sort((a, b) => a.student_number - b.student_number);
        });

        const labIds = Array.from(labGroups.keys());
        const smallestLabGroupSize = Math.min(...Array.from(labGroups.values()).map(g => g.length));
        if (presentationSessions.length > smallestLabGroupSize) {
            setErrorMessage(
                `エラー: 条件を満たせません。\n` +
                `セッション数 (${presentationSessions.length}) が、最も人数の少ない研究室の学生数 (${smallestLabGroupSize}人) を上回っています。\n` +
                `各研究室の学生を全てのセッションに割り振ることができません。`
            );
            setIsLoadingPreview(false);
            return;
        }

        const sessionAssignments: Presentation[][] = presentationSessions.map(() => []);
        for (let i = 0; i < presentationSessions.length; i++) {
            for (const labId of labIds) {
                const student = labGroups.get(labId)!.shift();
                if (student) {
                    sessionAssignments[i].push(student);
                }
            }
        }
        let remainingPresentations: Presentation[] = [];
        labGroups.forEach(group => {
            remainingPresentations.push(...group);
        });
        remainingPresentations.sort((a, b) => a.student_number - b.student_number);
        for (let i = 0; i < presentationSessions.length; i++) {
            while (sessionAssignments[i].length < sessionCapacities[i] && remainingPresentations.length > 0) {
                sessionAssignments[i].push(remainingPresentations.shift()!);
            }
        }
        sessionAssignments.forEach(assignment => {
            assignment.sort((a, b) => a.student_number - b.student_number);
        });
        let assignmentIndex = 0;
        const newSessionsWithPresentations: Session[] = sessions.map(s => {
            if (s.type === 'session') {
                const assigned = sessionAssignments[assignmentIndex];
                assignmentIndex++;
                return { ...s, presentations: assigned };
            }
            return s;
        });

        setGeneratedData({ ...eventDetails, sessions: newSessionsWithPresentations });
        setIsLoadingPreview(false);
    };

    // --- フォーム入力用ハンドラ ---
    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEventDetails({ ...eventDetails, [e.target.name]: e.target.value });
    };

    const handleSessionChange = (index: number, field: string, value: string) => {
        const newSessions = [...sessions];
        (newSessions[index] as any)[field] = value;
        setSessions(newSessions);
    };

    const addPresentationSession = () => {
        setSessions([...sessions, { type: 'session', startTime: '', endTime: '', chair: '', timekeeper: '' }]);
    };

    const addBreakSession = () => {
        setSessions([...sessions, { type: 'break', startTime: '', endTime: '' }]);
    };

    const removeSession = (index: number) => {
        setSessions(sessions.filter((_, i) => i !== index));
    };

    // --- JSX (描画部分) ---
    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <SectionTitle>プログラム情報入力</SectionTitle>
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">

                {/* --- フォーム入力部分 --- */}
                {Object.entries(eventDetails).map(([key, value]) => (
                    <Input
                        key={key}
                        label={key}
                        name={key}
                        value={value}
                        onChange={handleDetailChange}
                    />
                ))}

                <h3 className="text-lg font-semibold border-b pb-2">セッション設定</h3>

                {sessions.map((session, index) => {
                    const sessionNumber = sessions.filter((s, i) => s.type === 'session' && i <= index).length;
                    return (
                        <div key={index} className="p-4 border rounded-md bg-gray-50 relative">
                            <button onClick={() => removeSession(index)} className="absolute top-2 right-2 text-red-500 font-bold">✕</button>
                            <p className="font-bold mb-2">
                               {session.type === 'session' ? `セッション ${sessionNumber}` : '休憩'}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="開始時刻"
                                    type="time"
                                    value={session.startTime}
                                    onChange={e => handleSessionChange(index, 'startTime', e.target.value)}
                                />
                                <Input
                                    label="終了時刻"
                                    type="time"
                                    value={session.endTime}
                                    onChange={e => handleSessionChange(index, 'endTime', e.target.value)}
                                />
                            </div>
                            {session.type === 'session' && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <Input
                                        label="座長"
                                        value={session.chair || ''}
                                        onChange={e => handleSessionChange(index, 'chair', e.target.value)}
                                    />
                                    <Input
                                        label="タイムキーパー"
                                        value={session.timekeeper || ''}
                                        onChange={e => handleSessionChange(index, 'timekeeper', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
                 <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={addPresentationSession}>発表セッションを追加</Button>
                    <Button type="button" variant="secondary" onClick={addBreakSession}>休憩を追加</Button>
                 </div>

                <hr />

                {/* --- ボタンと結果表示 --- */}
                <div className="text-right pt-4">
                    <Button type="button" variant="primary" onClick={handleGenerate} disabled={isLoadingPreview}>
                        {isLoadingPreview ? 'プレビュー生成中...' : 'プログラムを生成 (プレビュー)'}
                    </Button>
                </div>

                {/* エラーメッセージ表示エリア */}
                {errorMessage && (
                    <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-wrap">
                        {errorMessage}
                    </div>
                )}

                {/* プレビューとダウンロードボタンの表示エリア */}
                {generatedData && !errorMessage && (
                    <div className="mt-6 border-t pt-6">
                        <h2 className="text-2xl font-bold text-center mb-4">プログラム プレビュー</h2>
                        <div className="text-center mb-6">
                            {/* ★ 変更点: ボタンの機能とテキストを .tex ダウンロードに戻す */}
                            <Button variant="primary" onClick={handleTexDownload} disabled={isLoadingPreview}>
                                LaTeXをダウンロード (.tex)
                            </Button>
                        </div>
                        <PrintableContent data={generatedData} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DynamicProgramPage;
