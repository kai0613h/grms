
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../components/Button';
import Tag from '../components/Tag';
import { FileItem } from '../types';
import { DocumentTextIcon, ArrowLeftIcon, ArrowDownTrayIcon } from '../components/icons';
import { downloadPaper, fetchPaperById, getDownloadUrl } from '../utils/api';

const FileDetailsPage: React.FC = () => {
  const { fileId, id } = useParams<{ fileId?: string; id?: string }>();
  const resolvedFileId = fileId ?? id;
  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!resolvedFileId) {
      setErrorMessage('ファイルIDが指定されていません。');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    fetchPaperById(resolvedFileId)
      .then((fetched) => {
        if (!isMounted) return;
        const enriched = fetched.downloadUrl
          ? fetched
          : {
            ...fetched,
            downloadUrl: getDownloadUrl(fetched.id),
          };
        setFile(enriched);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Failed to load file details:', error);
        setErrorMessage(error instanceof Error ? error.message : 'ファイル情報の取得に失敗しました。');
        setFile(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedFileId]);

  const handleDownload = async () => {
    if (!resolvedFileId || !file) return;
    setIsDownloading(true);
    setErrorMessage(null);

    try {
      if (file.downloadUrl) {
        const anchor = document.createElement('a');
        anchor.href = file.downloadUrl;
        anchor.download = file.name;
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setIsDownloading(false);
        return;
      }

      const { blob, filename } = await downloadPaper(resolvedFileId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'ダウンロードに失敗しました。');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (size?: number): string | undefined => {
    if (!size) return undefined;
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (errorMessage && !file) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 px-4">
        <div className="bg-red-50 rounded-full p-4 inline-block mb-6">
          <DocumentTextIcon className="h-10 w-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">読み込みエラー</h3>
        <p className="text-slate-500 mb-8">{errorMessage}</p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.history.back()} variant="outline">
            戻る
          </Button>
          <Link to="/search">
            <Button variant="primary">
              検索ページへ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 px-4">
        <div className="bg-slate-100 rounded-full p-4 inline-block mb-6">
          <DocumentTextIcon className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">ファイルが見つかりません</h3>
        <p className="text-slate-500 mb-8">
          お探しのファイルは削除されたか、移動した可能性があります。
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.history.back()} variant="outline">
            戻る
          </Button>
          <Link to="/search">
            <Button variant="primary">
              検索ページへ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/search" className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          検索結果に戻る
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600">
                  <DocumentTextIcon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {file.contentType || 'Document'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-4">
                {file.name}
              </h1>

              {file.tags && file.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {file.tags.map((tag, index) => (
                    <Tag key={index} label={tag} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <Button
                variant="primary"
                size="lg"
                onClick={handleDownload}
                disabled={isDownloading}
                className="shadow-lg shadow-indigo-500/30 w-full md:w-auto"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ダウンロード中...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    ダウンロード
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">説明</h3>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-line">
                  {file.description || '説明はありません。'}
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">詳細情報</h3>

                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">アップロード者</dt>
                  <dd className="text-sm text-slate-900 font-medium">{file.uploadedBy || '不明'}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">アップロード日</dt>
                  <dd className="text-sm text-slate-900 font-medium">{file.uploadedOn || '不明'}</dd>
                </div>

                {file.lastUpdated && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">最終更新日</dt>
                    <dd className="text-sm text-slate-900 font-medium">{file.lastUpdated}</dd>
                  </div>
                )}

                {file.fileSize && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">ファイルサイズ</dt>
                    <dd className="text-sm text-slate-900 font-medium">{formatFileSize(file.fileSize)}</dd>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetailsPage;
