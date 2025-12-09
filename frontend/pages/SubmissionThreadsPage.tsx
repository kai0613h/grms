
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
  const [deadlineInput, setDeadlineInput] = useState('');
  const [eventDatetimeInput, setEventDatetimeInput] = useState('');
  const [eventLocation, setEventLocation] = useState('');

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

    setIsCreating(true);
    setError(null);

    try {
      await createSubmissionThread({
        name: name.trim(),
        description: description.trim() || undefined,
        submissionDeadline: deadlineInput ? new Date(deadlineInput).toISOString() : undefined,
        eventDatetime: eventDatetimeInput ? new Date(eventDatetimeInput).toISOString() : undefined,
        eventLocation: eventLocation.trim() || undefined,
      });

      setName('');
      setDescription('');
      setDeadlineInput('');
      setEventDatetimeInput('');
      setEventLocation('');
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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">抄録提出スレッド</h1>
        <p className="mt-2 text-slate-500">発表会ごとの抄録提出スレッドを作成・管理します</p>
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
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Input
                    label="提出期限"
                    type="datetime-local"
                    value={deadlineInput}
                    onChange={(event) => setDeadlineInput(event.target.value)}
                  />
                  <Input
                    label="発表日時"
                    type="datetime-local"
                    value={eventDatetimeInput}
                    onChange={(event) => setEventDatetimeInput(event.target.value)}
                  />
                </div>
                <Input
                  label="会場"
                  placeholder="例: 6階 IS-631・632"
                  value={eventLocation}
                  onChange={(event) => setEventLocation(event.target.value)}
                  icon={<MapPinIcon className="h-5 w-5 text-slate-400" />}
                />
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500">
                      {thread.submissionDeadline && (
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                          <span className="font-medium mr-1.5">提出期限:</span>
                          <span className="text-slate-700">{deadlineFormatter.format(new Date(thread.submissionDeadline))}</span>
                        </div>
                      )}
                      {thread.eventDatetime && (
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                          <span className="font-medium mr-1.5">発表日時:</span>
                          <span className="text-slate-700">{deadlineFormatter.format(new Date(thread.eventDatetime))}</span>
                        </div>
                      )}
                      {thread.eventLocation && (
                        <div className="flex items-center sm:col-span-2">
                          <MapPinIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                          <span className="font-medium mr-1.5">会場:</span>
                          <span className="text-slate-700">{thread.eventLocation}</span>
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
