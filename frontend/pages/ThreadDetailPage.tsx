import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Input from '../components/Input';
import Button from '../components/Button';
import { LABORATORY_OPTIONS } from '../constants';
import { SubmissionThreadDetail, ThreadSubmission } from '../types';
import {
  fetchSubmissionThreadDetail,
  getSubmissionDownloadUrl,
  submitAbstract,
} from '../utils/api';

const detailFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const ThreadDetailPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();

  const [thread, setThread] = useState<SubmissionThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentNumber, setStudentNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [laboratory, setLaboratory] = useState(LABORATORY_OPTIONS[0]?.value ?? '');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDetail = async () => {
    if (!threadId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSubmissionThreadDetail(threadId);
      setThread(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '提出スレッドの読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const submissions = useMemo<ThreadSubmission[]>(
    () => (thread ? thread.submissions.slice().sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)) : []),
    [thread],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      if (selected.type !== 'application/pdf') {
        alert('PDFファイルを選択してください。');
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!threadId) return;
    if (!file) {
      alert('抄録PDFを選択してください。');
      return;
    }
    if (!studentNumber.trim() || !studentName.trim() || !title.trim()) {
      alert('学生番号・氏名・表題を入力してください。');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitAbstract({
        threadId,
        studentNumber: studentNumber.trim(),
        studentName: studentName.trim(),
        laboratory,
        title: title.trim(),
        file,
      });

      setStudentNumber('');
      setStudentName('');
      setLaboratory(LABORATORY_OPTIONS[0]?.value ?? '');
      setTitle('');
      setFile(null);
      await loadDetail();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '抄録の提出に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!threadId) {
    return <p className="text-sm text-red-600">スレッドIDが指定されていません。</p>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <SectionTitle subtitle="抄録の提出状況を確認し、追加提出が行えます。">
        抄録提出スレッド詳細
      </SectionTitle>

      {isLoading && <p className="text-sm text-gray-500">読み込み中...</p>}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {thread && (
        <div className="grid gap-8 lg:grid-cols-3">
          <aside className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{thread.name}</h2>
              {thread.description && <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{thread.description}</p>}
            </div>
            <dl className="space-y-3 text-sm text-gray-600">
              {thread.submissionDeadline && (
                <div>
                  <dt className="font-medium text-gray-700">提出期限</dt>
                  <dd>{detailFormatter.format(new Date(thread.submissionDeadline))}</dd>
                </div>
              )}
              {thread.eventDatetime && (
                <div>
                  <dt className="font-medium text-gray-700">発表日時</dt>
                  <dd>{detailFormatter.format(new Date(thread.eventDatetime))}</dd>
                </div>
              )}
              {thread.eventLocation && (
                <div>
                  <dt className="font-medium text-gray-700">会場</dt>
                  <dd>{thread.eventLocation}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-gray-700">提出件数</dt>
                <dd>{thread.submissionCount} 件</dd>
              </div>
            </dl>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => navigate(`/create-program?threadId=${thread.id}`)}>
                このスレッドからプログラム作成
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/generate-abstracts?threadId=${thread.id}`)}>
                プログラム一覧へ移動
              </Button>
              <Link to="/threads" className="block text-center text-sm text-blue-600 hover:underline">
                スレッド一覧に戻る
              </Link>
            </div>
          </aside>

          <section className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">抄録の提出</h3>
              <form className="grid gap-4" onSubmit={handleSubmission}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="学生番号"
                    placeholder="例: 5401"
                    value={studentNumber}
                    onChange={(event) => setStudentNumber(event.target.value)}
                    required
                  />
                  <Input
                    label="氏名"
                    placeholder="例: 山田 太郎"
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">研究室</label>
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={laboratory}
                      onChange={(event) => setLaboratory(event.target.value)}
                    >
                      {LABORATORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="表題"
                    placeholder="研究タイトル"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">抄録PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">PDF形式（最大10MB）をアップロードしてください。</p>
                  {file && <p className="text-xs text-blue-600 mt-1">選択中: {file.name}</p>}
                </div>
                <div className="text-right">
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? '送信中...' : '抄録を提出'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">提出済み抄録</h3>
                <span className="text-sm text-gray-500">{submissions.length} 件</span>
              </div>

              {submissions.length === 0 ? (
                <p className="text-sm text-gray-500">まだ抄録が提出されていません。</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800">{submission.title}</p>
                          <p className="text-sm text-gray-600">
                            {submission.studentNumber} / {submission.studentName} / {submission.laboratory}
                          </p>
                        </div>
                        <a
                          href={getSubmissionDownloadUrl(submission.threadId, submission.id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          PDFをダウンロード
                        </a>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-4">
                        <span>提出日時: {detailFormatter.format(new Date(submission.submittedAt))}</span>
                        <span>ファイルサイズ: {(submission.pdfSize / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ThreadDetailPage;
