
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon
} from '../components/icons';
import {
  ProgramRecord,
  ProgramSessionDefinition,
  ProgramPreview,
  SubmissionThreadDetail,
  SubmissionThreadSummary,
} from '../types';
import {
  createProgram,
  createProgramPreview,
  fetchSubmissionThreadDetail,
  fetchSubmissionThreads,
  getBookletDownloadUrl,
  getProgramDownloadUrl,
} from '../utils/api';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';

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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedProgram, setGeneratedProgram] = useState<ProgramRecord | null>(null);
  const [previewProgram, setPreviewProgram] = useState<ProgramPreview | null>(null);

  const [eventDetails, setEventDetails] = useState({
    courseName: '2025年度 情報システム工学コース',
    eventName: '卒業研究発表会',
    eventTheme: '未来を拓く情報アーキテクト',
    dateTime: '2025年2月15日 10:00〜15:30',
    venue: '6階 IS-631・632',
  });
  const [presentationDuration, setPresentationDuration] = useState(15);
  const [sessions, setSessions] = useState<ProgramSessionDefinition[]>(initialSessions);
  const [selectedLaboratoryIds, setSelectedLaboratoryIds] = useState<number[]>([]);

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
      setPreviewProgram(null);
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

  const laboratoriesInThread = useMemo(() => {
    if (!threadDetail) return [];
    const map = new Map<number, { id: number; name: string; count: number }>();
    threadDetail.submissions.forEach((sub) => {
      const existing = map.get(sub.laboratoryId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(sub.laboratoryId, { id: sub.laboratoryId, name: sub.laboratory, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [threadDetail]);

  useEffect(() => {
    if (laboratoriesInThread.length > 0) {
      setSelectedLaboratoryIds(laboratoriesInThread.map((lab) => lab.id));
    } else {
      setSelectedLaboratoryIds([]);
    }
  }, [laboratoriesInThread]);

  const handleGenerateProgram = async () => {
    if (!selectedThreadId) {
      alert('提出スレッドを選択してください。');
      return;
    }
    if (!threadDetail || threadDetail.submissions.length === 0) {
      alert('選択したスレッドに抄録が登録されていません。');
      return;
    }
    if (selectedLaboratoryIds.length === 0) {
      alert('対象とする研究室を1つ以上選択してください。');
      return;
    }
    if (presentationDuration <= 0) {
      alert('発表時間は正の数で入力してください。');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const preview = await createProgramPreview({
        threadId: selectedThreadId,
        courseName: eventDetails.courseName,
        eventName: eventDetails.eventName,
        eventTheme: eventDetails.eventTheme,
        dateTime: eventDetails.dateTime,
        venue: eventDetails.venue,
        laboratoryIds: selectedLaboratoryIds,
        presentationDurationMinutes: presentationDuration,
        sessions,
        title: `${eventDetails.eventName} プログラム`,
        description: threadDetail.description,
      });
      setPreviewProgram(preview);
      setGeneratedProgram(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'プログラムの生成に失敗しました。');
      setPreviewProgram(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPdf = async () => {
    if (!previewProgram) {
      alert('先にプログラムを生成してプレビューを確認してください。');
      return;
    }
    setIsExportingPdf(true);
    setError(null);
    try {
      const program = await createProgram({
        threadId: selectedThreadId,
        courseName: eventDetails.courseName,
        eventName: eventDetails.eventName,
        eventTheme: eventDetails.eventTheme,
        dateTime: eventDetails.dateTime,
        venue: eventDetails.venue,
        laboratoryIds: selectedLaboratoryIds,
        presentationDurationMinutes: presentationDuration,
        sessions,
        title: `${eventDetails.eventName} プログラム`,
        description: threadDetail?.description,
      });
      setGeneratedProgram(program);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'PDF出力に失敗しました。');
      setGeneratedProgram(null);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const threadOptions = useMemo(() => {
    return [
      { value: '', label: isLoadingThreads ? '読込中...' : 'スレッドを選択してください', disabled: true },
      ...threads.map(t => ({ value: t.id, label: `${t.name}（提出 ${t.submissionCount} 件）` }))
    ];
  }, [threads, isLoadingThreads]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">発表プログラム生成</h1>
        <p className="mt-2 text-slate-500">抄録提出スレッドからプログラムを生成し、UIで確認後にPDFを出力します</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      {generatedProgram && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl shadow-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3 w-full">
              <h3 className="text-lg font-medium text-green-800">PDF出力が完了しました</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>ダウンロードリンクからプログラムPDFと抄録集PDFを保存できます。</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={getProgramDownloadUrl(generatedProgram.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  プログラムPDF
                </a>
                <a
                  href={getBookletDownloadUrl(generatedProgram.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  抄録集PDF
                </a>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/generate-abstracts?programId=${generatedProgram.id}`)}
                >
                  抄録集ページで確認
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Thread Selection */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold mr-3">1</span>
            提出スレッドを選択
          </h2>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Select
                label="スレッド"
                options={threadOptions}
                value={selectedThreadId}
                onChange={(e) => setSelectedThreadId(e.target.value)}
                disabled={isLoadingThreads}
              />
            </div>
            <div className="flex gap-2 pb-0.5">
              <Button variant="outline" onClick={() => navigate('/threads')}>
                スレッド一覧
              </Button>
              <Button variant="secondary" onClick={loadThreads} disabled={isLoadingThreads}>
                <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isLoadingThreads ? 'animate-spin' : ''}`} />
                {isLoadingThreads ? '更新中...' : '再読み込み'}
              </Button>
            </div>
          </div>

          {isLoadingDetail && (
            <div className="mt-4 flex items-center text-sm text-slate-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
              提出情報を読み込み中...
            </div>
          )}

          {threadDetail && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-2">{threadDetail.name}</h3>
	              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
	                {threadDetail.submissionDeadline && (
	                  <div className="flex items-center">
	                    <CalendarIcon className="h-4 w-4 mr-1.5 text-slate-400" />
	                    <span className="font-medium mr-1.5">提出期限:</span>
	                    {dateFormatter.format(new Date(threadDetail.submissionDeadline))} {timeFormatter.format(new Date(threadDetail.submissionDeadline))}
	                  </div>
	                )}
	                {submissionSummary.length > 0 && (
	                  <div className="sm:col-span-2">
	                    <span className="font-medium mr-1.5">研究室別提出数:</span>
	                    {submissionSummary.map((item) => `${item.lab} ${item.count}件`).join(' / ')}
	                  </div>
	                )}
	              </div>
	              {laboratoriesInThread.length > 0 && (
	                <div className="mt-4">
	                  <div className="text-sm font-medium text-slate-700 mb-2">プログラム対象研究室（研究室グループ）</div>
	                  <div className="flex flex-wrap gap-2">
	                    {laboratoriesInThread.map((lab) => (
	                      <label
	                        key={lab.id}
	                        className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
	                      >
	                        <input
	                          type="checkbox"
	                          className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
	                          checked={selectedLaboratoryIds.includes(lab.id)}
	                          onChange={(e) => {
	                            setSelectedLaboratoryIds((prev) =>
	                              e.target.checked
	                                ? Array.from(new Set([...prev, lab.id]))
	                                : prev.filter((id) => id !== lab.id),
	                            );
	                          }}
	                        />
	                        <span>{lab.name} ({lab.count}件)</span>
	                      </label>
	                    ))}
	                  </div>
	                </div>
	              )}
	            </div>
	          )}
	        </section>

        {/* Event Details */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold mr-3">2</span>
            イベント情報
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="コース名"
              name="courseName"
              value={eventDetails.courseName}
              onChange={handleEventDetailChange}
            />
            <Input
              label="発表会名"
              name="eventName"
              value={eventDetails.eventName}
              onChange={handleEventDetailChange}
            />
            <Input
              label="テーマ"
              name="eventTheme"
              value={eventDetails.eventTheme}
              onChange={handleEventDetailChange}
            />
            <Input
              label="日時"
              name="dateTime"
              value={eventDetails.dateTime}
              onChange={handleEventDetailChange}
              icon={<CalendarIcon className="h-5 w-5 text-slate-400" />}
            />
            <Input
              label="会場"
              name="venue"
              value={eventDetails.venue}
              onChange={handleEventDetailChange}
              icon={<MapPinIcon className="h-5 w-5 text-slate-400" />}
            />
            <Input
              label="1人あたりの発表時間 (分)"
              type="number"
              min={5}
              value={presentationDuration}
              onChange={(event) => setPresentationDuration(Number(event.target.value))}
              icon={<ClockIcon className="h-5 w-5 text-slate-400" />}
            />
          </div>
        </section>

        {/* Session Settings */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold mr-3">3</span>
              セッション設定
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addSession('session')}>
                <PlusIcon className="h-4 w-4 mr-1.5" />
                発表セッション
              </Button>
              <Button variant="outline" size="sm" onClick={() => addSession('break')}>
                <PlusIcon className="h-4 w-4 mr-1.5" />
                休憩
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div key={index} className="p-5 bg-slate-50 rounded-xl border border-slate-200 relative group">
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => removeSession(index)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="削除"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="font-bold text-slate-400 text-sm">#{index + 1}</span>
                  <div className="w-40">
                    <Select
                      options={[
                        { value: 'session', label: '発表セッション' },
                        { value: 'break', label: '休憩' }
                      ]}
                      value={session.type}
                      onChange={(e) => updateSession(index, { type: e.target.value as 'session' | 'break' })}
                      className="py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Input
                    label="開始時刻"
                    type="time"
                    value={session.startTime}
                    onChange={(e) => updateSession(index, { startTime: e.target.value })}
                    className="bg-white"
                  />
                  <Input
                    label="終了時刻"
                    type="time"
                    value={session.endTime}
                    onChange={(e) => updateSession(index, { endTime: e.target.value })}
                    className="bg-white"
                  />

                  {session.type === 'session' && (
                    <>
                      <Input
                        label="座長"
                        value={session.chair ?? ''}
                        onChange={(e) => updateSession(index, { chair: e.target.value })}
                        className="bg-white"
                        placeholder="座長名"
                      />
                      <Input
                        label="タイムキーパー"
                        value={session.timekeeper ?? ''}
                        onChange={(e) => updateSession(index, { timekeeper: e.target.value })}
                        className="bg-white"
                        placeholder="TK名"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerateProgram}
            disabled={isGenerating}
            className="shadow-xl shadow-indigo-500/20"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                生成中...
              </>
            ) : (
              <>
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                プログラムを生成（プレビュー）
              </>
            )}
          </Button>
        </div>

        {previewProgram && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-10 animate-fade-in">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">プログラムプレビュー</h3>
                <p className="text-sm text-slate-500">
                  {String(previewProgram.metadata.eventName ?? '')} / {String(previewProgram.metadata.dateTime ?? '')}
                </p>
              </div>
              <Button variant="primary" onClick={handleExportPdf} disabled={isExportingPdf}>
                {isExportingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    PDF出力中...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    PDFを出力
                  </>
                )}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">順番</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">セッション</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">時間</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">表題</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">学生</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">研究室</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {(previewProgram.presentationOrder as any[])
                    .slice()
                    .sort((a, b) => Number(a.global_order ?? 0) - Number(b.global_order ?? 0))
                    .map((entry, index) => (
                      <tr key={`${entry.submission_id}-${index}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {entry.global_order}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {Number(entry.session_index ?? 0) + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {entry.session_start_time} - {entry.session_end_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{entry.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {entry.student_number} / {entry.student_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.laboratory}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Submissions List Preview */}
        {threadDetail && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-12">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">提出済み抄録一覧</h3>
            </div>
            {threadDetail.submissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                このスレッドにはまだ抄録が提出されていません。
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">表題</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">学生</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">研究室</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">提出日時</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {threadDetail.submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{submission.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{submission.studentNumber} / {submission.studentName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{submission.laboratory}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {dateFormatter.format(new Date(submission.submittedAt))} {timeFormatter.format(new Date(submission.submittedAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default CreateProgramPage;
