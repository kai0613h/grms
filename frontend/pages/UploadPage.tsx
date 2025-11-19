
import React, { useCallback, useState } from 'react';
import FileDropzone from '../components/FileDropzone';
import Input from '../components/Input';
import Button from '../components/Button';
import Tag from '../components/Tag';
import { SUGGESTED_TAGS } from '../constants';
import { PlusIcon, CloudArrowUpIcon } from '../components/icons';
import { uploadPaper } from '../utils/api';

const UploadPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFilesAccepted = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const handleAddTag = () => {
    if (currentTagInput.trim() && !tags.includes(currentTagInput.trim())) {
      setTags([...tags, currentTagInput.trim()]);
      setCurrentTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestedTagClick = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("ファイルを選択してください。");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const uploaded = await Promise.all(
        files.map(file =>
          uploadPaper({
            file,
            tags,
            uploadedBy,
            description,
          })
        )
      );
      setUploadMessage(`アップロードが完了しました (${uploaded.length}件)。`);
      setFiles([]);
      setTags([]);
      setUploadedBy('');
      setDescription('');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'アップロードに失敗しました。');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">論文アップロード</h1>
        <p className="mt-2 text-slate-500">新しい論文をシステムに追加します</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-8">
          {/* File Upload Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <CloudArrowUpIcon className="h-5 w-5 mr-2 text-indigo-500" />
              ファイル選択
            </h3>
            <FileDropzone onFilesAccepted={handleFilesAccepted} />

            {files.length > 0 && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-2">選択されたファイル ({files.length})</h4>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="text-sm text-slate-600 flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-slate-400 text-xs ml-2">{(file.size / 1024).toFixed(2)} KB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Metadata Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">基本情報</h3>

              <Input
                label="アップロード者"
                id="uploaded-by"
                placeholder="氏名を入力"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
              />

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                  説明 <span className="text-slate-400 font-normal text-xs ml-1">(任意)</span>
                </label>
                <textarea
                  id="description"
                  className="w-full h-32 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 text-sm resize-none transition-all"
                  placeholder="論文の概要やメモを入力してください"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">タグ設定</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">タグを追加</label>
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <Input
                      id="tag-input"
                      placeholder="新しいタグ..."
                      value={currentTagInput}
                      onChange={(e) => setCurrentTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      containerClassName="mb-0"
                    />
                  </div>
                  <Button onClick={handleAddTag} variant="secondary" className="px-3">
                    <PlusIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 min-h-[100px]">
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Tag
                        key={tag}
                        label={tag}
                        onRemove={() => handleRemoveTag(tag)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">タグはまだ追加されていません</p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">おすすめのタグ</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.map(tag => (
                    <Tag
                      key={tag}
                      label={tag}
                      interactive
                      onClick={() => handleSuggestedTagClick(tag)}
                      className="opacity-70 hover:opacity-100"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex items-center justify-between">
          <div className="flex-1 mr-4">
            {uploadMessage && (
              <div className="text-sm text-green-600 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {uploadMessage}
              </div>
            )}
            {uploadError && (
              <div className="text-sm text-red-600 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {uploadError}
              </div>
            )}
          </div>
          <Button
            onClick={handleUpload}
            variant="primary"
            size="lg"
            disabled={files.length === 0 || isUploading}
            className="shadow-lg shadow-indigo-500/30"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                アップロード中...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                アップロード
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
