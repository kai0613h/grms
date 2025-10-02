
import React, { useState, useMemo } from 'react';
import SectionTitle from '../components/SectionTitle';
import Input from '../components/Input';
import Button from '../components/Button';
import FileListItem from '../components/FileListItem';
import Pagination from '../components/Pagination';
import { MagnifyingGlassIcon } from '../components/icons';
import { MOCK_FILES } from '../constants';
import { FileItem } from '../types';

const ITEMS_PER_PAGE = 5;

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const filteredFiles = useMemo(() => {
    if (!hasSearched) return []; // Only show files after a search action

    return MOCK_FILES.filter(file => {
      const matchesSearchTerm = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDate = !dateFilter || (file.uploadedOn && file.uploadedOn.includes(dateFilter)); // Simplified date match
      const matchesCreatedBy = !createdByFilter || (file.uploadedBy && file.uploadedBy.toLowerCase().includes(createdByFilter.toLowerCase()));
      const matchesTag = !tagFilter || file.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()));
      return matchesSearchTerm && matchesDate && matchesCreatedBy && matchesTag;
    });
  }, [searchTerm, dateFilter, createdByFilter, tagFilter, hasSearched]);

  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
  const currentFiles = filteredFiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = () => {
    setHasSearched(true);
    setCurrentPage(1); // Reset to first page on new search
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SectionTitle>論文を検索</SectionTitle>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <Input
          id="search-term"
          placeholder="論文を検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<MagnifyingGlassIcon />}
          className="text-lg py-3"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Filters</h3>
          <div className="space-y-4">
            <Input
              label="Date"
              id="date-filter"
              placeholder="日付を入力"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              containerClassName="bg-gray-50 p-3 rounded-md"
            />
            <Input
              label="Created by"
              id="createdby-filter"
              placeholder="作成者を入力"
              value={createdByFilter}
              onChange={(e) => setCreatedByFilter(e.target.value)}
              containerClassName="bg-gray-50 p-3 rounded-md"
            />
            <Input
              label="Tag"
              id="tag-filter"
              placeholder="タグを入力"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              containerClassName="bg-gray-50 p-3 rounded-md"
            />
          </div>
           <Button onClick={handleSearch} className="w-full mt-6" variant="primary">
            Search
          </Button>
        </div>

        <div className="md:col-span-3">
          {hasSearched ? (
            <>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Files</h3>
              {currentFiles.length > 0 ? (
                <>
                  {currentFiles.map((file: FileItem) => (
                    <FileListItem key={file.id} file={file} />
                  ))}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                  <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </>
          ) : (
             <div className="text-center py-10 bg-white rounded-lg shadow h-full flex flex-col justify-center items-center">
                <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-300" />
                <p className="mt-4 text-lg text-gray-500">Enter search terms and filters to find files.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
