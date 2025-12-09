import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { LABORATORY_OPTIONS } from '../constants';
import { SubmissionThreadDetail, ThreadSubmission } from '../types';
import {
  CalendarIcon,
  MapPinIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  TrashIcon
} from '../components/icons';
import {
  fetchSubmissionThreadDetail,
  getSubmissionDownloadUrl,
  submitFiles,
  deleteSubmission,
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
  
  const [abstractFile, setAbstractFile] = useState<File | null>(null);
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'abstract' | 'paper' | 'presentation') => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const extension = '.' + selected.name.split('.').pop()?.toLowerCase();
    
    if (type === 'abstract' || type === 'paper') {
        if (extension !== '.pdf') {
            alert('PDFファイルを選択してください。');
            event.target.value = '';
            return;
        }
    } else if (type === 'presentation') {
        if (!['.pdf', '.pptx'].includes(extension)) {
            alert('PDFまたはPPTXファイルを選択してください。');
            event.target.value = '';
            return;
        }
    }

    if (type === 'abstract') setAbstractFile(selected);
    if (type === 'paper') setPaperFile(selected);
    if (type === 'presentation') setPresentationFile(selected);
  };

  const handleSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!threadId) return;
    
    if (!abstractFile && !paperFile && !presentationFile) {
      alert('少なくとも1つのファイルを選択してください。');
      return;
    }
    
    if (!studentNumber.trim() || !studentName.trim() || !title.trim()) {
      alert('学生番号・氏名・表題を入力してください。');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitFiles({
        threadId,
        studentNumber: studentNumber.trim(),
        studentName: studentName.trim(),
        laboratory,
        title: title.trim(),
        abstractFile,
        paperFile,
        presentationFile,
      });

      setStudentNumber('');
      setStudentName('');
      setLaboratory(LABORATORY_OPTIONS[0]?.value ?? '');
      setTitle('');
      setAbstractFile(null);
      setPaperFile(null);
      setPresentationFile(null);
      
      // Reset file inputs
      ['abstract-upload', 'paper-upload', 'presentation-upload'].forEach(id => {
          const el = document.getElementById(id) as HTMLInputElement;
          if (el) el.value = '';
      });

      await loadDetail();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '提出に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!threadId) return;
    if (!window.confirm('この提出を削除してもよろしいですか？')) {
      return;
    }

    try {
      await deleteSubmission(threadId, submissionId);
      await loadDetail();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました。');
    }
  };

  if (!threadId) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
        スレッドIDが指定されていません。
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link to="/threads" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          スレッド一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">提出スレッド詳細</h1>
        <p className="mt-1 text-slate-500">提出状況を確認し、追加提出が行えます</p>
      </div>

      {isLoading && !thread && (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500">読み込み中...</p>
        </div>
      )}

      {error && <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-600 rounded-lg">{error}</div>}

      {thread && (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Sidebar Info */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4">{thread.name}</h2>
              {thread.description && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {thread.description}
                </div>
              )}

              <dl className="space-y-4 text-sm">
                <div className="flex items-start pt-4 border-t border-slate-100">
                  <dt className="min-w-[5rem] font-medium text-slate-500 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                    提出件数
                  </dt>
                  <dd className="font-bold text-indigo-600 text-lg">{thread.submissionCount} <span className="text-sm font-normal text-slate-500">件</span></dd>
                </div>
              </dl>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
              <h3 className="font-semibold text-slate-800 mb-2">管理者メニュー</h3>
              <Button variant="secondary" className="w-full justify-start" onClick={() => navigate(`/create-program?threadId=${thread.id}`)}>
                このスレッドからプログラム作成
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/generate-abstracts?threadId=${thread.id}`)}>
                プログラム一覧へ移動
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-8 space-y-8">
            {/* Submission Form */}
            <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                  <CloudArrowUpIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  ファイルの提出
                </h3>
              </div>
              <div className="p-6">
                <form className="grid gap-6" onSubmit={handleSubmission}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">研究室</label>
                      <div className="relative">
                        <select
                          className="block w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 text-sm appearance-none transition-all"
                          value={laboratory}
                          onChange={(event) => setLaboratory(event.target.value)}
                        >
                          {LABORATORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <Input
                      label="表題"
                      placeholder="研究タイトル"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                    />
                  </div>

                  {/* File Upload Sections */}
                  <div className="space-y-4">
                    {thread.hasAbstract && (
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">抄録 (PDF)</label>
                                {thread.abstractDeadline && (
                                    <span className="text-xs text-red-600 font-medium">
                                        期限: {detailFormatter.format(new Date(thread.abstractDeadline))}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-4">
                            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-blue-200 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none transition-colors">
                                <CloudArrowUpIcon className="h-5 w-5 mr-2 text-blue-400" />
                                ファイルを選択
                                <input
                                id="abstract-upload"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'abstract')}
                                className="hidden"
                                />
                            </label>
                            <span className="text-sm text-slate-500 truncate">
                                {abstractFile ? abstractFile.name : '未選択'}
                            </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              許可された形式: .pdf（最大10MB）
                            </p>
                        </div>
                    )}

                    {thread.hasPaper && (
                        <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">論文 (PDF)</label>
                                {thread.paperDeadline && (
                                    <span className="text-xs text-red-600 font-medium">
                                        期限: {detailFormatter.format(new Date(thread.paperDeadline))}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-4">
                            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-green-200 rounded-lg shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none transition-colors">
                                <CloudArrowUpIcon className="h-5 w-5 mr-2 text-green-400" />
                                ファイルを選択
                                <input
                                id="paper-upload"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'paper')}
                                className="hidden"
                                />
                            </label>
                            <span className="text-sm text-slate-500 truncate">
                                {paperFile ? paperFile.name : '未選択'}
                            </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              許可された形式: .pdf（最大10MB）
                            </p>
                        </div>
                    )}

                    {thread.hasPresentation && (
                        <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">発表資料 (PDF/PPTX)</label>
                                {thread.presentationDeadline && (
                                    <span className="text-xs text-red-600 font-medium">
                                        期限: {detailFormatter.format(new Date(thread.presentationDeadline))}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-4">
                            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-purple-200 rounded-lg shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 focus:outline-none transition-colors">
                                <CloudArrowUpIcon className="h-5 w-5 mr-2 text-purple-400" />
                                ファイルを選択
                                <input
                                id="presentation-upload"
                                type="file"
                                accept=".pdf,.pptx"
                                onChange={(e) => handleFileChange(e, 'presentation')}
                                className="hidden"
                                />
                            </label>
                            <span className="text-sm text-slate-500 truncate">
                                {presentationFile ? presentationFile.name : '未選択'}
                            </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              許可された形式: .pdf, .pptx（最大10MB）
                            </p>
                        </div>
                    )}
                  </div>

                  <div className="text-right pt-2">
                    <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full sm:w-auto shadow-lg shadow-indigo-500/20">
                      {isSubmitting ? '送信中...' : '提出する'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-800">提出済み一覧</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  {submissions.length} 件
                </span>
              </div>

              {submissions.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p>まだ提出がありません。</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-slate-800 mb-1 truncate">{submission.title}</h4>
                          <div className="flex flex-wrap items-center text-sm text-slate-600 gap-x-3 gap-y-1 mb-2">
                            <span className="font-medium text-indigo-600">{submission.studentNumber}</span>
                            <span className="text-slate-300">|</span>
                            <span>{submission.studentName}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">{submission.laboratory}</span>
                          </div>
                          
                          {/* Submitted Files Badges/Links */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {submission.abstractFilename && (
                                <a href={getSubmissionDownloadUrl(submission.threadId, submission.id, 'abstract')} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                                    <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                                    抄録
                                </a>
                            )}
                            {submission.paperFilename && (
                                <a href={getSubmissionDownloadUrl(submission.threadId, submission.id, 'paper')} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                                    <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                                    論文
                                </a>
                            )}
                            {submission.presentationFilename && (
                                <a href={getSubmissionDownloadUrl(submission.threadId, submission.id, 'presentation')} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                                    <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                                    発表資料
                                </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-slate-500">
                              更新: {detailFormatter.format(new Date(submission.submittedAt))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSubmission(submission.id)}
                            className="inline-flex items-center p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                            title="削除"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
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