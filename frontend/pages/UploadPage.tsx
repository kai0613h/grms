
import React, { useCallback, useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import FileDropzone from '../components/FileDropzone';
import Input from '../components/Input';
import Button from '../components/Button';
import Tag from '../components/Tag';
import { SUGGESTED_TAGS } from '../constants';
import { PlusIcon } from '../components/icons';
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
    <div className="max-w-3xl mx-auto">
      <SectionTitle>論文アップロード</SectionTitle>
      
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Add tags</h3>
          <div className="flex items-center gap-2 mb-3">
            <Input
              id="tag-input"
              placeholder="タグを追加"
              value={currentTagInput}
              onChange={(e) => setCurrentTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              containerClassName="flex-grow bg-gray-50 p-3 rounded-md"
              className="bg-transparent border-none focus:ring-0"
            />
            <Button onClick={handleAddTag} variant="secondary" size="md" aria-label="Add tag">
              <PlusIcon />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <Tag key={tag} onRemove={() => handleRemoveTag(tag)}>{tag}</Tag>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map(tag => (
              <Tag key={tag} interactive onClick={() => handleSuggestedTagClick(tag)}>
                {tag}
              </Tag>
            ))}
          </div>
        </div>

        <Input
          label="アップロード者"
          id="uploaded-by"
          placeholder="氏名を入力"
          value={uploadedBy}
          onChange={(e) => setUploadedBy(e.target.value)}
        />

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            id="description"
            className="w-full h-28 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="論文の概要やメモを入力してください（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Files</h3>
            <FileDropzone onFilesAccepted={handleFilesAccepted} />
            {files.length > 0 && (
                <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-600">選択されたファイル:</h4>
                <ul className="list-disc list-inside text-sm text-gray-500">
                    {files.map((file, index) => (
                    <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                    ))}
                </ul>
                </div>
            )}
        </div>

        {uploadMessage && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {uploadMessage}
          </div>
        )}
        {uploadError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {uploadError}
          </div>
        )}
        
        <div className="text-right">
          <Button onClick={handleUpload} variant="primary" size="lg" disabled={files.length === 0 || isUploading}>
            {isUploading ? 'アップロード中...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
