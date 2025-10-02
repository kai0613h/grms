
import React, { useState, useCallback } from 'react';
import SectionTitle from '../components/SectionTitle';
import FileDropzone from '../components/FileDropzone';
import Input from '../components/Input';
import Button from '../components/Button';
import Tag from '../components/Tag';
import { SUGGESTED_TAGS } from '../constants';
import { PlusIcon } from '../components/icons';

const UploadPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState('');

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

  const handleUpload = () => {
    if (files.length === 0) {
      alert("ファイルを選択してください。");
      return;
    }
    // Placeholder for actual upload logic
    console.log("Uploading files:", files);
    console.log("With tags:", tags);
    alert(`アップロード中: ${files.map(f => f.name).join(', ')}\nタグ: ${tags.join(', ')}`);
    setFiles([]);
    setTags([]);
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
        
        <div className="text-right">
          <Button onClick={handleUpload} variant="primary" size="lg" disabled={files.length === 0}>
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
