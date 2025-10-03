import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Button from '../components/Button';
import Input from '../components/Input';
import SectionTitle from '../components/SectionTitle';

// --- 1. 型定義 ---
interface Presentation {
  id: number;
  presenter: string;
  theme: string;
}

interface Session {
  type: 'session' | 'break';
  time: string;
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

// --- 2. データベースの代わりとなる仮データと、それを取得する非同期関数 ---
const mockPresentationsDB: Presentation[] = [
    { id: 1, presenter: '淺島 楓良', theme: '品川区における最適避難所の分析' },
    { id: 2, presenter: '高塚 空輝', theme: 'マイナンバーカードの暗号技術による安全性を体系的に学べるシステムの開発' },
    { id: 3, presenter: '村上 祥', theme: '教職員の業務効率化と学生の主体的行動を支援する進路支援システムの開発' },
    { id: 4, presenter: '谷 春奈', theme: '聴覚障害者を対象にした投手の音声認識・文字起こしシステム' },
    { id: 5, presenter: '大住 悠惺', theme: 'Timing side-channel leak を排除したコードの生成技術の調査と開発について' },
    { id: 6, presenter: '兒玉 百合香', theme: '環境に左右されない物体検出' },
    { id: 7, presenter: '堀川 風花', theme: 'スマホを用いた高齢者と障害者の行動解析' },
    { id: 8, presenter: '戸塚 晴太郎', theme: 'ランニング中の音楽聴取がパフォーマンスに与える影響' },
    { id: 9, presenter: '橋本 洪主', theme: '正規表現に対する検索可能暗号の高速化' },
    { id: 10, presenter: '波多野 楓', theme: 'BERT を用いたオンライン小説のあらすじの評価' },
    { id: 11, presenter: '長谷川 穂墳', theme: 'VR 環境におけるアバターの違いによるコミュニケーションについて' },
    { id: 12, presenter: '輿石 一舞', theme: 'プログラミング試験の半自動採点システムの提案' },
    { id: 13, presenter: '濱中 幾門', theme: 'バレーボールにおけるスパイク動作の異常検出' },
    { id: 14, presenter: '松本 郁美', theme: 'MIDI データによる演奏への技術的・感情的表現の付加' },
    { id: 15, presenter: '河井 政哉', theme: 'TEE による機密 Faas 基盤ソフトウェアの開発' },
    { id: 16, presenter: '岸川 幸平', theme: 'H.264/MPEG-4 AVC に対する動作認識のための Encryption-then-Compression システム' },
    { id: 17, presenter: '薄葉 太一', theme: 'インターネット上におけるアンチコメントの表現変更による効果' },
    { id: 18, presenter: '大和 男飛', theme: '小型コンピュータを用いた作業者の行動分析' },
    { id: 19, presenter: '田中 瑛人', theme: 'ソフト制約を考慮した時間割編成支援システムの開発' },
    { id: 20, presenter: '笹川 駿', theme: 'CGL ハッシュ関数の高速化' },
];

// DBからデータを取得する処理をシミュレート
const fetchPresentationsFromDB = async (): Promise<Presentation[]> => {
    console.log("Fetching data from DB...");
    // 実際のアプリケーションではここでAPIを呼び出す
    // await fetch('/api/presentations');
    return new Promise(resolve => setTimeout(() => resolve(mockPresentationsDB), 500));
};


// --- 3. PDFプレビュー用コンポーネント ---
const PrintableContent = React.forwardRef<HTMLDivElement, { data: ScheduleData }>(({ data }, ref) => (
    <div ref={ref} className="p-8 bg-white max-w-4xl mx-auto font-sans text-gray-800 shadow-lg">
         <header className="text-center mb-10">
            <p className="text-lg">{data.courseName}</p>
            <h1 className="text-3xl font-bold my-2">{data.eventName}</h1>
            <p className="text-xl mb-6">{data.eventTheme}</p>
            <p>{data.dateTime}</p>
            <p>{data.venue}</p>
        </header>
        <main>
            {data.sessions.map((session, index) => {
                if (session.type === 'break') {
                    return <div key={index} className="text-center font-bold my-6 py-2">Break ({session.time})</div>;
                }
                return (
                    <section key={index} className="mb-8 break-inside-avoid">
                        <div className="border-b-2 border-gray-800 pb-1 mb-3">
                            <h2 className="text-xl font-bold inline-block mr-4">Session {index + 1} ({session.time})</h2>
                            <span className="text-sm">座長: {session.chair}、 タイムキーパー: {session.timekeeper}</span>
                        </div>
                        <ol start={session.presentations?.[0]?.id || 1} className="space-y-2">
                            {session.presentations?.map((p) => (
                                <li key={p.id} className="flex">
                                    <span className="w-8">{p.id}.</span>
                                    <div className="flex-1">
                                        <p className="font-semibold">{p.theme}</p>
                                        <p className="text-right text-sm">{p.presenter}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                );
            })}
        </main>
    </div>
));


// --- 4. メインコンポーネント (入力フォームとプレビューの管理) ---
const DynamicProgramPage: React.FC = () => {
    const [view, setView] = useState<'form' | 'preview'>('form');
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [eventDetails, setEventDetails] = useState({
        courseName: '2025年度 情報システム工学コース',
        eventName: '卒業研究中間発表会',
        eventTheme: '〜情報アーキテクト〜',
        dateTime: '2025年8月1日(金) 10:30〜16:25',
        venue: '会場: 6階 IS-631・632',
    });
    const [sessions, setSessions] = useState([
        { type: 'session' as 'session', time: '10:30〜12:00', chair: '橋本 洪主', timekeeper: '笹川 駿' },
        { type: 'break' as 'break', time: '12:00〜12:45' },
        { type: 'session' as 'session', time: '12:45〜14:30', chair: '河井 政哉', timekeeper: '高塚 空輝' },
    ]);

    // Generated Data State
    const [generatedData, setGeneratedData] = useState<ScheduleData | null>(null);

    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => componentRef.current });

    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEventDetails({ ...eventDetails, [e.target.name]: e.target.value });
    };

    const handleSessionChange = (index: number, field: string, value: string) => {
        const newSessions = [...sessions];
        (newSessions[index] as any)[field] = value;
        setSessions(newSessions);
    };

    const addSession = () => {
        setSessions([...sessions, { type: 'session', time: '', chair: '', timekeeper: '' }]);
    };

    const removeSession = (index: number) => {
        setSessions(sessions.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        // TODO: ここを実際のAPI呼び出しに置き換える
        const allPresentations = await fetchPresentationsFromDB();

        const presentationSessions = sessions.filter(s => s.type === 'session');
        const presentationsPerSession = Math.ceil(allPresentations.length / presentationSessions.length);

        let presentationCursor = 0;
        const newSessionsWithPresentations: Session[] = sessions.map(s => {
            if (s.type === 'session') {
                const presentations = allPresentations.slice(presentationCursor, presentationCursor + presentationsPerSession);
                presentationCursor += presentationsPerSession;
                return { ...s, presentations };
            }
            return s;
        });

        setGeneratedData({ ...eventDetails, sessions: newSessionsWithPresentations });
        setIsLoading(false);
        setView('preview');
    };

    if (view === 'preview' && generatedData) {
        return (
            <div className="bg-gray-100 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto text-center mb-6 flex justify-center space-x-4">
                    <Button variant="outline" onClick={() => setView('form')}>フォームに戻る</Button>
                    <Button variant="primary" onClick={handlePrint}>PDFとして保存または印刷</Button>
                </div>
                <PrintableContent ref={componentRef} data={generatedData} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <SectionTitle>プログラム情報入力</SectionTitle>
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
                {Object.entries(eventDetails).map(([key, value]) => (
                    <Input key={key} label={key} name={key} value={value} onChange={handleDetailChange} />
                ))}

                <h3 className="text-lg font-semibold border-b pb-2">セッション設定</h3>
                {sessions.map((session, index) => (
                    <div key={index} className="p-4 border rounded-md bg-gray-50 relative">
                        <button onClick={() => removeSession(index)} className="absolute top-2 right-2 text-red-500 font-bold">✕</button>
                        <p className="font-bold mb-2">
                           {session.type === 'session' ? `セッション ${index + 1}` : '休憩'}
                        </p>
                        <Input label="時間" value={session.time} onChange={e => handleSessionChange(index, 'time', e.target.value)} placeholder="例: 10:30〜12:00" />
                        {session.type === 'session' && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <Input label="座長" value={session.chair} onChange={e => handleSessionChange(index, 'chair', e.target.value)} />
                                <Input label="タイムキーパー" value={session.timekeeper} onChange={e => handleSessionChange(index, 'timekeeper', e.target.value)} />
                            </div>
                        )}
                    </div>
                ))}
                 <Button type="button" variant="outline" onClick={addSession}>セッションを追加</Button>

                <div className="text-right pt-4">
                    <Button type="button" variant="primary" onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? '生成中...' : 'プログラムを生成'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DynamicProgramPage;
