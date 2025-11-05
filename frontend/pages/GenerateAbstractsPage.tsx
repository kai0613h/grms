import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import { SubmissionThreadSummary, ProgramRecord } from '../types';
import {
  fetchPrograms,
  fetchSubmissionThreads,
  getBookletDownloadUrl,
  getProgramDownloadUrl,
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
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'プログラム一覧の取得に失敗しました。');
    } finally {
      setIsLoadingPrograms(false);
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

  return (
    <div className="max-w-5xl mx-auto">
      <SectionTitle subtitle="作成済みプログラムを選択し、抄録集PDFをダウンロードできます。">
        抄録集生成
      </SectionTitle>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">提出スレッド</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedThreadId}
              onChange={(event) => setSelectedThreadId(event.target.value)}
            >
              <option value="">すべてのスレッド</option>
              {threads.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.name}（提出 {thread.submissionCount} 件）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">プログラム</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedProgramId}
              onChange={(event) => setSelectedProgramId(event.target.value)}
              disabled={isLoadingPrograms}
            >
              {isLoadingPrograms ? (
                <option value="">読込中...</option>
              ) : programs.length === 0 ? (
                <option value="">該当するプログラムがありません</option>
              ) : (
                programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}（{dateFormatter.format(new Date(program.createdAt))} 作成）
                  </option>
                ))
              )}
            </select>
          </div>
        </section>

        {selectedProgram && (
          <section className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">{selectedProgram.title}</h2>
                <p className="text-sm text-blue-800">
                  {selectedProgram.metadata.courseName} / {selectedProgram.metadata.eventName}
                </p>
                <p className="text-sm text-blue-700">
                  {selectedProgram.metadata.dateTime} @ {selectedProgram.metadata.venue}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={getProgramDownloadUrl(selectedProgram.id)}>
                  <Button variant="secondary">プログラムPDF</Button>
                </a>
                <a href={getBookletDownloadUrl(selectedProgram.id)}>
                  <Button variant="primary">抄録集PDF</Button>
                </a>
              </div>
            </div>
            <p className="text-xs text-blue-700">
              プログラムPDFの後に、発表順で全ての抄録PDFを自動結合したファイルをダウンロードできます。
            </p>
          </section>
        )}
      </div>

      {selectedProgram && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">発表順リスト</h2>
          {presentationOrder.length === 0 ? (
            <p className="text-sm text-gray-500">発表順の情報が登録されていません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">順番</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">表題</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">学生</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">研究室</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {presentationOrder.map((entry, index) => (
                    <tr key={`${entry.submission_id}-${index}`}>
                      <td className="px-4 py-2 text-gray-700">
                        {typeof entry.global_order === 'number'
                          ? entry.global_order
                          : String(entry.global_order || '')}
                      </td>
                      <td className="px-4 py-2 text-gray-800">{entry.title as string}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {entry.student_number} / {entry.student_name}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{entry.laboratory}</td>
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
