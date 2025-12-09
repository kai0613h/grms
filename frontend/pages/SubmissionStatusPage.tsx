import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from '../components/Select';
import { SubmissionThreadSummary, SubmissionThreadDetail, ThreadSubmission } from '../types';
import {
  fetchSubmissionThreads,
  fetchSubmissionThreadDetail,
  getSubmissionDownloadUrl,
} from '../utils/api';
import { ArrowDownTrayIcon, DocumentTextIcon, ArrowPathIcon } from '../components/icons';
import Button from '../components/Button';

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const SubmissionStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<SubmissionThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [threadDetail, setThreadDetail] = useState<SubmissionThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId);
    } else {
      setThreadDetail(null);
    }
  }, [selectedThreadId]);

  const loadThreads = async () => {
    try {
      const data = await fetchSubmissionThreads();
      setThreads(data);
      if (data.length > 0 && !selectedThreadId) {
        setSelectedThreadId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('スレッド一覧の取得に失敗しました。');
    }
  };

  const loadThreadDetail = async (threadId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSubmissionThreadDetail(threadId);
      setThreadDetail(data);
    } catch (err) {
      console.error(err);
      setError('提出状況の取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const threadOptions = useMemo(() => [
    { value: '', label: 'スレッドを選択してください', disabled: true },
    ...threads.map(t => ({ value: t.id, label: t.name }))
  ], [threads]);

  const sortedSubmissions = useMemo(() => {
    if (!threadDetail) return [];
    return threadDetail.submissions.slice().sort((a, b) => {
        // Sort by student number roughly (assuming numeric string)
        return a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true });
    });
  }, [threadDetail]);

  const renderStatusIcon = (filename: string | undefined, hasType: boolean, downloadUrl?: string) => {
    if (!hasType) return <span className="text-slate-300">-</span>;
    if (filename) {
      return (
        <a 
          href={downloadUrl} 
          className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
          title={filename}
        >
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-1.5">
            <ArrowDownTrayIcon className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium">提出済</span>
        </a>
      );
    }
    return (
      <div className="flex items-center text-red-500">
        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-1.5">
          <span className="text-xs font-bold">!</span>
        </div>
        <span className="text-xs font-medium">未提出</span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">提出状況確認</h1>
          <p className="mt-2 text-slate-500">各学生の提出状況を一覧で確認できます</p>
        </div>
        <Button variant="ghost" onClick={() => selectedThreadId && loadThreadDetail(selectedThreadId)} disabled={isLoading || !selectedThreadId}>
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            再読み込み
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="max-w-md">
            <Select
                label="提出スレッド"
                options={threadOptions}
                value={selectedThreadId}
                onChange={(e) => setSelectedThreadId(e.target.value)}
            />
        </div>
      </div>

      {threadDetail && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">
                    提出者一覧 ({sortedSubmissions.length}名)
                </h2>
                <div className="text-sm text-slate-500">
                    最終更新: {new Date().toLocaleTimeString()}
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">学生番号</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">氏名</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">研究室</th>
                            {threadDetail.hasAbstract && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">抄録</th>}
                            {threadDetail.hasPaper && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">論文</th>}
                            {threadDetail.hasPresentation && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">発表資料</th>}
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">最終提出日時</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {sortedSubmissions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    まだ提出はありません。
                                </td>
                            </tr>
                        ) : (
                            sortedSubmissions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{sub.studentNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{sub.studentName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{sub.laboratory}</td>
                                    
                                    {threadDetail.hasAbstract && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusIcon(sub.abstractFilename, true, getSubmissionDownloadUrl(sub.threadId, sub.id, 'abstract'))}
                                        </td>
                                    )}
                                    {threadDetail.hasPaper && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusIcon(sub.paperFilename, true, getSubmissionDownloadUrl(sub.threadId, sub.id, 'paper'))}
                                        </td>
                                    )}
                                    {threadDetail.hasPresentation && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusIcon(sub.presentationFilename, true, getSubmissionDownloadUrl(sub.threadId, sub.id, 'presentation'))}
                                        </td>
                                    )}
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                        {dateFormatter.format(new Date(sub.submittedAt))}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionStatusPage;
