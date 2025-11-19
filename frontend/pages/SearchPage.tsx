
import React, { useState } from 'react';

import Input from '../components/Input';
import Button from '../components/Button';
import FileListItem from '../components/FileListItem';
import Pagination from '../components/Pagination';
import { MagnifyingGlassIcon, FunnelIcon } from '../components/icons';
import { FileItem } from '../types';
import { fetchPapers } from '../utils/api';

const ITEMS_PER_PAGE = 5;

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE);
  const currentFiles = files.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = async () => {
    setHasSearched(true);
    setCurrentPage(1);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const results = await fetchPapers({
        search: searchTerm,
        tag: tagFilter,
        uploadedBy: createdByFilter,
      });

      const trimmedDate = dateFilter.trim();
      const dateFiltered = trimmedDate
        ? results.filter((file) => {
          if (!file.uploadedAtIso) return false;
          return (
            file.uploadedAtIso.startsWith(trimmedDate) ||
            (file.uploadedOn && file.uploadedOn.includes(trimmedDate))
          );
        })
        : results;

      setFiles(dateFiltered);
    } catch (error) {
      console.error('Search failed:', error);
      setErrorMessage(error instanceof Error ? error.message : '検索に失敗しました。');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">論文検索</h1>
        <p className="mt-2 text-slate-500">キーワードやフィルターを使って論文を検索できます</p>
      </div>

      <div className="bg-white p-1 rounded-2xl shadow-lg shadow-indigo-100 border border-slate-200 mb-10 max-w-3xl mx-auto flex items-center">
        <div className="flex-grow">
          <Input
            id="search-term"
            placeholder="キーワードで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<MagnifyingGlassIcon />}
            className="border-none shadow-none focus:ring-0 text-lg py-4 bg-transparent"
            containerClassName="w-full"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="pr-2">
          <Button onClick={handleSearch} size="lg" className="rounded-xl px-8">
            検索
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
            <div className="flex items-center mb-4 text-slate-800">
              <FunnelIcon className="h-5 w-5 mr-2 text-indigo-500" />
              <h3 className="font-semibold">フィルター</h3>
            </div>

            <div className="space-y-5">
              <Input
                label="日付"
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <Input
                label="作成者"
                id="createdby-filter"
                placeholder="名前を入力"
                value={createdByFilter}
                onChange={(e) => setCreatedByFilter(e.target.value)}
              />
              <Input
                label="タグ"
                id="tag-filter"
                placeholder="タグを入力"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              />

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => {
                    setDateFilter('');
                    setCreatedByFilter('');
                    setTagFilter('');
                  }}
                >
                  クリア
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {hasSearched ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  検索結果 <span className="ml-2 text-sm font-normal text-slate-500">{files.length} 件</span>
                </h3>
              </div>

              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errorMessage}
                </div>
              )}

              {!isLoading && !errorMessage && currentFiles.length > 0 && (
                <div className="space-y-4">
                  {currentFiles.map((file: FileItem) => (
                    <FileListItem key={file.id} file={file} />
                  ))}
                  <div className="pt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              )}

              {!isLoading && !errorMessage && currentFiles.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                  <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
                    <MagnifyingGlassIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">見つかりませんでした</h3>
                  <p className="mt-1 text-slate-500">検索条件を変更して再度お試しください。</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed h-full flex flex-col justify-center items-center">
              <div className="bg-indigo-50 p-6 rounded-full mb-6 animate-pulse">
                <MagnifyingGlassIcon className="h-12 w-12 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">検索を開始</h3>
              <p className="mt-2 text-slate-500 max-w-sm mx-auto">
                左側のフィルターや上部の検索バーを使用して、必要な論文を見つけてください。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
