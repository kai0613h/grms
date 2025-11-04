import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Input from '../components/Input';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import { SubmissionThreadSummary } from '../types';
import {
  createSubmissionThread,
  fetchSubmissionThreads,
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

  const sortedThreads = useMemo(
    () => threads.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [threads],
  );

  return (
    <div className="max-w-5xl mx-auto">
      <SectionTitle subtitle="発表会ごとの抄録提出スレッドを作成・一覧できます。">
        抄録提出スレッド
      </SectionTitle>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">新規スレッド作成</h2>
          <form className="space-y-4" onSubmit={handleCreateThread}>
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
            <Input
              label="会場"
              placeholder="例: 6階 IS-631・632"
              value={eventLocation}
              onChange={(event) => setEventLocation(event.target.value)}
            />
            <div className="text-right">
              <Button type="submit" variant="primary" disabled={isCreating}>
                {isCreating ? '作成中...' : 'スレッドを作成'}
              </Button>
            </div>
          </form>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">既存スレッド</h2>
            <Button variant="secondary" size="sm" onClick={loadThreads} disabled={isLoading}>
              {isLoading ? '更新中...' : '再読み込み'}
            </Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-500">読み込み中...</p>
          ) : sortedThreads.length === 0 ? (
            <p className="text-sm text-gray-500">まだ提出スレッドが作成されていません。</p>
          ) : (
            <ul className="space-y-4">
              {sortedThreads.map((thread) => (
                <li
                  key={thread.id}
                  className="border border-gray-200 rounded-md p-4 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => navigate(`/threads/${thread.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">{thread.name}</h3>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      提出 {thread.submissionCount} 件
                    </span>
                  </div>
                  {thread.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{thread.description}</p>
                  )}
                  <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                    {thread.submissionDeadline && (
                      <div>
                        <dt className="font-medium text-gray-600">提出期限</dt>
                        <dd>{deadlineFormatter.format(new Date(thread.submissionDeadline))}</dd>
                      </div>
                    )}
                    {thread.eventDatetime && (
                      <div>
                        <dt className="font-medium text-gray-600">発表日時</dt>
                        <dd>{deadlineFormatter.format(new Date(thread.eventDatetime))}</dd>
                      </div>
                    )}
                    {thread.eventLocation && (
                      <div>
                        <dt className="font-medium text-gray-600">会場</dt>
                        <dd>{thread.eventLocation}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default SubmissionThreadsPage;
