
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DocumentTextIcon, ArrowDownTrayIcon, ArrowPathIcon, TrashIcon } from '../components/icons';
import Button from '../components/Button';
import Select from '../components/Select';
import { SubmissionThreadSummary, ProgramRecord } from '../types';
import {
  fetchPrograms,
  fetchSubmissionThreads,
  getBookletDownloadUrl,
  getProgramDownloadUrl,
  deleteProgram,
} from '../utils/api';

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const GenerateAbstractsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<SubmissionThreadSummary[]>([]);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const programId = params.get('programId');
    const threadId = params.get('threadId');
    if (threadId) {
      setSelectedThreadId(threadId);
    }
    if (programId) {
      setSelectedProgramId(programId);
    }
  }, [location.search]);

  const loadThreads = async () => {
    try {
      const data = await fetchSubmissionThreads();
      setThreads(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '提出スレッド一覧の取得に失敗しました。');
    }
  };

  const loadPrograms = async (threadId?: string) => {
    setIsLoadingPrograms(true);
    setError(null);
    try {
      const data = await fetchPrograms(threadId);
      setPrograms(data);
      if (data.length > 0 && !selectedProgramId) {
        setSelectedProgramId(data[0].id);
      } else if (data.length === 0) {
        setSelectedProgramId('');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'プログラム一覧の取得に失敗しました。');
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!selectedProgramId) return;
    if (!window.confirm('このプログラムを削除してもよろしいですか？')) {
      return;
    }

    try {
      await deleteProgram(selectedProgramId);
      setSelectedProgramId('');
      await loadPrograms(selectedThreadId || undefined);
    } catch (err) {
      console.error(err);
      alert('プログラムの削除に失敗しました。');
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    loadPrograms(selectedThreadId || undefined);
  }, [selectedThreadId]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );

  const presentationOrder = useMemo(() => {
    if (!selectedProgram) return [];
    return (selectedProgram.presentationOrder || []).slice().sort((a, b) => {
      const aOrder = typeof a.global_order === 'number' ? a.global_order : Number(a.global_order ?? 0);
      const bOrder = typeof b.global_order === 'number' ? b.global_order : Number(b.global_order ?? 0);
      return aOrder - bOrder;
    });
  }, [selectedProgram]);

  const threadOptions = useMemo(() => [
    { value: '', label: 'すべてのスレッド' },
    ...threads.map(t => ({ value: t.id, label: `${t.name}（提出 ${t.submissionCount} 件）` }))
  ], [threads]);

  const programOptions = useMemo(() => {
    if (isLoadingPrograms) return [{ value: '', label: '読込中...', disabled: true }];
    if (programs.length === 0) return [{ value: '', label: '該当するプログラムがありません', disabled: true }];
    return programs.map(p => ({
      value: p.id,
      label: `${p.title}（${dateFormatter.format(new Date(p.createdAt))} 作成）`
    }));
  }, [programs, isLoadingPrograms]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">抄録集生成</h1>
        <p className="mt-2 text-slate-500">作成済みプログラムを選択し、抄録集PDFをダウンロードできます</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="提出スレッド"
            options={threadOptions}
            value={selectedThreadId}
            onChange={(e) => setSelectedThreadId(e.target.value)}
          />

          <Select
            label="プログラム"
            options={programOptions}
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            disabled={isLoadingPrograms}
          />
        </section>

        {selectedProgram && (
          <section className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-indigo-900 mb-2">{selectedProgram.title}</h2>
                <div className="space-y-1 text-sm text-indigo-700">
                  <p className="font-medium">
                    {selectedProgram.metadata.courseName} / {selectedProgram.metadata.eventName}
                  </p>
                  <p>
                    {selectedProgram.metadata.dateTime} @ {selectedProgram.metadata.venue}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={getProgramDownloadUrl(selectedProgram.id)} className="no-underline">
                  <Button variant="outline" className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    プログラムPDF
                  </Button>
                </a>
                <a href={getBookletDownloadUrl(selectedProgram.id)} className="no-underline">
                  <Button variant="primary" className="shadow-lg shadow-indigo-500/20">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    抄録集PDF
                  </Button>
                </a>
                <Button
                  variant="danger"
                  className="shadow-none"
                  onClick={handleDeleteProgram}
                  title="このプログラムを削除"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-indigo-200/50">
              <p className="text-xs text-indigo-600 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                プログラムPDFの後に、発表順で全ての抄録PDFを自動結合したファイルをダウンロードできます。
              </p>
            </div>
          </section>
        )}
      </div>

      {selectedProgram && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">発表順リスト</h2>
          </div>

          {presentationOrder.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              発表順の情報が登録されていません。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">順番</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">表題</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">学生</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">研究室</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {presentationOrder.map((entry, index) => (
                    <tr key={`${entry.submission_id}-${index}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {typeof entry.global_order === 'number'
                          ? entry.global_order
                          : String(entry.global_order || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{entry.title as string}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {entry.student_number} / {entry.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.laboratory}</td>
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

export default GenerateAbstractsPage;
