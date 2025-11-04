import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Input from '../components/Input';
import Button from '../components/Button';
import {
  ProgramRecord,
  ProgramSessionDefinition,
  SubmissionThreadDetail,
  SubmissionThreadSummary,
} from '../types';
import {
  createProgram,
  fetchSubmissionThreadDetail,
  fetchSubmissionThreads,
  getBookletDownloadUrl,
  getProgramDownloadUrl,
} from '../utils/api';

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
  hour: '2-digit',
  minute: '2-digit',
});

const initialSessions: ProgramSessionDefinition[] = [
  { type: 'session', startTime: '10:00', endTime: '11:30', chair: '', timekeeper: '' },
  { type: 'break', startTime: '11:30', endTime: '12:15' },
  { type: 'session', startTime: '12:15', endTime: '13:45', chair: '', timekeeper: '' },
  { type: 'break', startTime: '13:45', endTime: '14:00' },
  { type: 'session', startTime: '14:00', endTime: '15:30', chair: '', timekeeper: '' },
];

const CreateProgramPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<SubmissionThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [threadDetail, setThreadDetail] = useState<SubmissionThreadDetail | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedProgram, setGeneratedProgram] = useState<ProgramRecord | null>(null);

  const [eventDetails, setEventDetails] = useState({
    courseName: '2025年度 情報システム工学コース',
    eventName: '卒業研究発表会',
    eventTheme: '未来を拓く情報アーキテクト',
    dateTime: '2025年2月15日 10:00〜15:30',
    venue: '6階 IS-631・632',
  });
  const [presentationDuration, setPresentationDuration] = useState(15);
  const [sessions, setSessions] = useState<ProgramSessionDefinition[]>(initialSessions);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadId = params.get('threadId');
    if (threadId) {
      setSelectedThreadId(threadId);
    }
  }, [location.search]);

  const loadThreads = async () => {
    setIsLoadingThreads(true);
    setError(null);
    try {
      const data = await fetchSubmissionThreads();
      setThreads(data);
      if (!selectedThreadId && data.length > 0) {
        setSelectedThreadId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '提出スレッドの取得に失敗しました。');
    } finally {
      setIsLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadThreadDetail = async (threadId: string) => {
    setIsLoadingDetail(true);
    setError(null);
    try {
      const detail = await fetchSubmissionThreadDetail(threadId);
      setThreadDetail(detail);
      setGeneratedProgram(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '提出詳細の取得に失敗しました。');
      setThreadDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId);
    }
  }, [selectedThreadId]);

  const handleEventDetailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEventDetails((prev) => ({ ...prev, [name]: value }));
  };

  const updateSession = (index: number, updates: Partial<ProgramSessionDefinition>) => {
    setSessions((prev) => prev.map((session, idx) => (idx === index ? { ...session, ...updates } : session)));
  };

  const addSession = (type: 'session' | 'break') => {
    setSessions((prev) => [
      ...prev,
      type === 'session'
        ? { type: 'session', startTime: '15:30', endTime: '17:00', chair: '', timekeeper: '' }
        : { type: 'break', startTime: '17:00', endTime: '17:15' },
    ]);
  };

  const removeSession = (index: number) => {
    setSessions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submissionSummary = useMemo(() => {
    if (!threadDetail) return [];
    const groups: Record<string, number> = {};
    threadDetail.submissions.forEach((submission) => {
      groups[submission.laboratory] = (groups[submission.laboratory] ?? 0) + 1;
    });
    return Object.entries(groups).map(([lab, count]) => ({ lab, count }));
  }, [threadDetail]);

  const handleGenerateProgram = async () => {
    if (!selectedThreadId) {
      alert('提出スレッドを選択してください。');
      return;
    }
    if (!threadDetail || threadDetail.submissions.length === 0) {
      alert('選択したスレッドに抄録が登録されていません。');
      return;
    }
    if (presentationDuration <= 0) {
      alert('発表時間は正の数で入力してください。');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const program = await createProgram({
        threadId: selectedThreadId,
        courseName: eventDetails.courseName,
        eventName: eventDetails.eventName,
        eventTheme: eventDetails.eventTheme,
        dateTime: eventDetails.dateTime,
        venue: eventDetails.venue,
        presentationDurationMinutes: presentationDuration,
        sessions,
        title: `${eventDetails.eventName} プログラム`,
        description: threadDetail.description,
      });
      setGeneratedProgram(program);
      alert('プログラムを生成しました。ダウンロードリンクをご確認ください。');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'プログラムの生成に失敗しました。');
      setGeneratedProgram(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <SectionTitle subtitle="抄録提出スレッドからプログラムPDFを自動生成します。">
        発表プログラム生成
      </SectionTitle>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">提出スレッドを選択</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">スレッド</label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedThreadId}
                onChange={(event) => setSelectedThreadId(event.target.value)}
                disabled={isLoadingThreads}
              >
                <option value="" disabled>
                  {isLoadingThreads ? '読込中...' : 'スレッドを選択してください'}
                </option>
                {threads.map((thread) => (
                  <option key={thread.id} value={thread.id}>
                    {thread.name}（提出 {thread.submissionCount} 件）
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/threads')}>
                スレッド一覧に移動
              </Button>
              <Button variant="outline" onClick={loadThreads} disabled={isLoadingThreads}>
                {isLoadingThreads ? '更新中...' : '再読み込み'}
              </Button>
            </div>
          </div>
          {isLoadingDetail && <p className="text-sm text-gray-500">提出情報を読み込み中...</p>}
          {threadDetail && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2 text-sm text-gray-700">
              <p className="font-semibold text-gray-800">{threadDetail.name}</p>
              {threadDetail.submissionDeadline && (
                <p>
                  提出期限: {dateFormatter.format(new Date(threadDetail.submissionDeadline))}{' '}
                  {timeFormatter.format(new Date(threadDetail.submissionDeadline))}
                </p>
              )}
              {submissionSummary.length > 0 && (
                <p>
                  研究室別提出数:{' '}
                  {submissionSummary.map((item) => `${item.lab} ${item.count}件`).join(' / ')}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">イベント情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="コース名" name="courseName" value={eventDetails.courseName} onChange={handleEventDetailChange} />
            <Input label="発表会名" name="eventName" value={eventDetails.eventName} onChange={handleEventDetailChange} />
            <Input label="テーマ" name="eventTheme" value={eventDetails.eventTheme} onChange={handleEventDetailChange} />
            <Input label="日時" name="dateTime" value={eventDetails.dateTime} onChange={handleEventDetailChange} />
            <Input label="会場" name="venue" value={eventDetails.venue} onChange={handleEventDetailChange} />
            <Input
              label="1人あたりの発表時間 (分)"
              type="number"
              min={5}
              value={presentationDuration}
              onChange={(event) => setPresentationDuration(Number(event.target.value))}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">セッション設定</h2>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => addSession('session')}>
                発表セッションを追加
              </Button>
              <Button variant="secondary" size="sm" onClick={() => addSession('break')}>
                休憩を追加
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <select
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                      value={session.type}
                      onChange={(event) => updateSession(index, { type: event.target.value as 'session' | 'break' })}
                    >
                      <option value="session">発表セッション</option>
                      <option value="break">休憩</option>
                    </select>
                    <span className="text-sm font-medium text-gray-700">#{index + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSession(index)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    削除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="開始時刻"
                    type="time"
                    value={session.startTime}
                    onChange={(event) => updateSession(index, { startTime: event.target.value })}
                  />
                  <Input
                    label="終了時刻"
                    type="time"
                    value={session.endTime}
                    onChange={(event) => updateSession(index, { endTime: event.target.value })}
                  />
                </div>

                {session.type === 'session' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Input
                      label="座長"
                      value={session.chair ?? ''}
                      onChange={(event) => updateSession(index, { chair: event.target.value })}
                    />
                    <Input
                      label="タイムキーパー"
                      value={session.timekeeper ?? ''}
                      onChange={(event) => updateSession(index, { timekeeper: event.target.value })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="text-right">
          <Button variant="primary" size="lg" onClick={handleGenerateProgram} disabled={isGenerating}>
            {isGenerating ? '生成中...' : 'プログラムPDFを生成'}
          </Button>
        </div>
      </div>

      {generatedProgram && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
          <h2 className="text-lg font-semibold text-blue-900">プログラム生成が完了しました</h2>
          <p className="text-sm text-blue-700">
            ダウンロードリンクからプログラムPDFと抄録集PDFを保存できます。
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={getProgramDownloadUrl(generatedProgram.id)}>
              <Button variant="secondary">プログラムPDFをダウンロード</Button>
            </a>
            <a href={getBookletDownloadUrl(generatedProgram.id)}>
              <Button variant="primary">抄録集PDFをダウンロード</Button>
            </a>
            <Button variant="ghost" onClick={() => navigate(`/generate-abstracts?programId=${generatedProgram.id}`)}>
              抄録集ページで確認
            </Button>
          </div>
        </div>
      )}

      {threadDetail && (
        <div className="mt-10 bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">提出済み抄録一覧</h2>
          {threadDetail.submissions.length === 0 ? (
            <p className="text-sm text-gray-500">このスレッドにはまだ抄録が提出されていません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">表題</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">学生</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">研究室</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">提出日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {threadDetail.submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-4 py-2 text-gray-800">{submission.title}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {submission.studentNumber} / {submission.studentName}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{submission.laboratory}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {dateFormatter.format(new Date(submission.submittedAt))}{' '}
                        {timeFormatter.format(new Date(submission.submittedAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateProgramPage;
