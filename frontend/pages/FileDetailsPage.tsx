
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import Tag from '../components/Tag';
import { FileItem } from '../types';
import { DocumentTextIcon } from '../components/icons';
import { deletePaper, downloadPaper, fetchPaperById, getDownloadUrl } from '../utils/api';

const FileDetailsPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!fileId) {
      setErrorMessage('ファイルIDが指定されていません。');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    fetchPaperById(fileId)
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
  }, [fileId]);

  const handleDownload = async () => {
    if (!fileId || !file) return;
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

      const { blob, filename } = await downloadPaper(fileId);
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

  const handleDelete = async () => {
    if (!fileId || !file) return;
    if (!window.confirm(`「${file.name}」を削除しますか？この操作は元に戻せません。`)) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deletePaper(fileId);
      navigate('/search', { replace: true });
    } catch (error) {
      console.error('Delete failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'ファイルの削除に失敗しました。');
    } finally {
      setIsDeleting(false);
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
    return <div className="text-center py-10">Loading file details...</div>;
  }

  if (errorMessage && !file) {
    return (
      <div className="text-center py-10">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Unable to load file</h3>
        <p className="mt-1 text-sm text-gray-500">{errorMessage}</p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-4">
          Go Back
        </Button>
        <Link to="/search">
          <Button variant="primary" className="mt-4 ml-2">
            Go to Search
          </Button>
        </Link>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="text-center py-10">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">File not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The file you are looking for does not exist or has been moved.
        </p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-4">
          Go Back
        </Button>
        <Link to="/search">
          <Button variant="primary" className="mt-4 ml-2">
            Go to Search
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-lg">
      <SectionTitle subtitle={file.lastUpdated ? `Last updated ${file.lastUpdated}` : undefined}>
        {file.name}
      </SectionTitle>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
          {errorMessage}
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        <Button variant="primary" size="md" onClick={handleDownload} disabled={isDownloading || isDeleting}>
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
        <Button variant="danger" size="md" onClick={handleDelete} disabled={isDeleting || isDownloading}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>

      {file.tags && file.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {file.tags.map((tag, index) => (
              <Tag key={index}>{tag}</Tag>
            ))}
          </div>
        </div>
      )}

      {(file.uploadedOn || file.uploadedBy) && (
         <div className="border-t border-gray-200 pt-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {file.uploadedOn && (
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Uploaded on</dt>
                        <dd className="mt-1 text-sm text-gray-900">{file.uploadedOn}</dd>
                    </div>
                )}
                {file.uploadedBy && (
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Uploaded by</dt>
                        <dd className="mt-1 text-sm text-gray-900">{file.uploadedBy}</dd>
                    </div>
                )}
            </dl>
        </div>
      )}

      {(file.description || file.contentType || file.fileSize) && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {file.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{file.description}</dd>
              </div>
            )}
            {file.contentType && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Content type</dt>
                <dd className="mt-1 text-sm text-gray-900">{file.contentType}</dd>
              </div>
            )}
            {file.fileSize && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">File size</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatFileSize(file.fileSize)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
};

export default FileDetailsPage;
