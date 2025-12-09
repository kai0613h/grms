import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import { SubmissionThreadSummary } from '../types';
import { PlusIcon, CalendarIcon, MapPinIcon, ArrowPathIcon, ChatBubbleLeftRightIcon, TrashIcon } from '../components/icons';
import {
  createSubmissionThread,
  fetchSubmissionThreads,
  deleteSubmissionThread,
} from '../utils/api';

const deadlineFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const SubmissionThreadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<SubmissionThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const [hasAbstract, setHasAbstract] = useState(true);
  const [hasPaper, setHasPaper] = useState(false);
  const [hasPresentation, setHasPresentation] = useState(false);

  const [abstractDeadline, setAbstractDeadline] = useState('');
  const [paperDeadline, setPaperDeadline] = useState('');
  const [presentationDeadline, setPresentationDeadline] = useState('');

  const loadThreads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSubmissionThreads();
      setThreads(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '提出スレッドの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const handleCreateThread = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      alert('発表会名を入力してください。');
      return;
    }
    if (!hasAbstract && !hasPaper && !hasPresentation) {
      alert('少なくとも1つの提出物を選択してください。');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createSubmissionThread({
        name: name.trim(),
        description: description.trim() || undefined,
        abstractDeadline: (hasAbstract && abstractDeadline) ? new Date(abstractDeadline).toISOString() : undefined,
        paperDeadline: (hasPaper && paperDeadline) ? new Date(paperDeadline).toISOString() : undefined,
        presentationDeadline: (hasPresentation && presentationDeadline) ? new Date(presentationDeadline).toISOString() : undefined,
        hasAbstract,
        hasPaper,
        hasPresentation,
      });

      setName('');
      setDescription('');
      setAbstractDeadline('');
      setPaperDeadline('');
      setPresentationDeadline('');
      setHasAbstract(true);
      setHasPaper(false);
      setHasPresentation(false);
      await loadThreads();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'スレッドの作成に失敗しました。');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    if (!window.confirm('このスレッドを削除してもよろしいですか？\n関連する提出物も全て削除されます。')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteSubmissionThread(threadId);
      await loadThreads();
    } catch (err) {
      console.error(err);
      alert('スレッドの削除に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedThreads = useMemo(
    () => threads.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [threads],
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">提出スレッド</h1>
        <p className="mt-2 text-slate-500">発表会ごとの提出スレッドを作成・管理します</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Create New Thread Section */}
        <section className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-200 overflow-hidden sticky top-24">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <PlusIcon className="h-5 w-5 mr-2 text-indigo-500" />
                新規スレッド作成
              </h2>
            </div>
            <div className="p-6">
              <form className="space-y-5" onSubmit={handleCreateThread}>
                <Input
                  label="発表会名"
                  placeholder="例: 2025年度 卒業研究発表会"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <Textarea
                  label="説明"
                  placeholder="発表会の概要や提出に関する注意事項など"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                />
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">必要な提出物と期限</label>
                  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    
                    {/* Abstract */}
                    <div>
                        <label className="flex items-center space-x-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            checked={hasAbstract}
                            onChange={(e) => setHasAbstract(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-700">抄録 (PDF)</span>
                        </label>
                        {hasAbstract && (
                            <Input
                                type="datetime-local"
                                value={abstractDeadline}
                                onChange={(e) => setAbstractDeadline(e.target.value)}
                                containerClassName="ml-6 mb-0"
                                className="py-1.5 text-xs"
                            />
                        )}
                    </div>

                    {/* Paper */}
                    <div>
                        <label className="flex items-center space-x-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            checked={hasPaper}
                            onChange={(e) => setHasPaper(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-700">論文 (PDF)</span>
                        </label>
                        {hasPaper && (
                            <Input
                                type="datetime-local"
                                value={paperDeadline}
                                onChange={(e) => setPaperDeadline(e.target.value)}
                                containerClassName="ml-6 mb-0"
                                className="py-1.5 text-xs"
                            />
                        )}
                    </div>

                    {/* Presentation */}
                    <div>
                        <label className="flex items-center space-x-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            checked={hasPresentation}
                            onChange={(e) => setHasPresentation(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-700">発表資料 (PDF/PPTX)</span>
                        </label>
                        {hasPresentation && (
                            <Input
                                type="datetime-local"
                                value={presentationDeadline}
                                onChange={(e) => setPresentationDeadline(e.target.value)}
                                containerClassName="ml-6 mb-0"
                                className="py-1.5 text-xs"
                            />
                        )}
                    </div>

                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" disabled={isCreating} className="w-full justify-center shadow-lg shadow-indigo-500/20">
                    {isCreating ? '作成中...' : 'スレッドを作成'}
                  </Button>
                </div>
              </form>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Existing Threads Section */}
        <section className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-indigo-500" />
                既存スレッド
              </h2>
              <Button variant="ghost" size="sm" onClick={loadThreads} disabled={isLoading}>
                <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? '更新中...' : '再読み込み'}
              </Button>
            </div>

            {isLoading && threads.length === 0 ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-500">読み込み中...</p>
              </div>
            ) : sortedThreads.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p>まだ提出スレッドが作成されていません。</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/threads/${thread.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {thread.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          提出 {thread.submissionCount} 件
                        </span>
                        <button
                          onClick={(e) => handleDeleteThread(e, thread.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 z-10"
                          title="スレッドを削除"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {thread.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{thread.description}</p>
                    )}

                    <div className="space-y-2 mt-4">
                      {thread.hasAbstract && (
                        <div className="flex items-center text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 min-w-[4rem] justify-center mr-2">
                                抄録
                            </span>
                            <span className="text-slate-500">
                                {thread.abstractDeadline ? `期限: ${deadlineFormatter.format(new Date(thread.abstractDeadline))}` : '期限なし'}
                            </span>
                        </div>
                      )}
                      {thread.hasPaper && (
                        <div className="flex items-center text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100 min-w-[4rem] justify-center mr-2">
                                論文
                            </span>
                            <span className="text-slate-500">
                                {thread.paperDeadline ? `期限: ${deadlineFormatter.format(new Date(thread.paperDeadline))}` : '期限なし'}
                            </span>
                        </div>
                      )}
                      {thread.hasPresentation && (
                        <div className="flex items-center text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 min-w-[4rem] justify-center mr-2">
                                発表資料
                            </span>
                            <span className="text-slate-500">
                                {thread.presentationDeadline ? `期限: ${deadlineFormatter.format(new Date(thread.presentationDeadline))}` : '期限なし'}
                            </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SubmissionThreadsPage;