
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon } from './icons';

interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesAccepted }) => {
  const [isHovering, setIsHovering] = useState(false);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAccepted(acceptedFiles);
    setIsHovering(false);
  }, [onFilesAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsHovering(true),
    onDragLeave: () => setIsHovering(false),
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center w-full h-64 px-6 py-10 border-2 border-dashed rounded-lg transition-colors duration-200 ease-in-out cursor-pointer
        ${isDragActive || isHovering ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
    >
      <input {...getInputProps()} />
      <ArrowUpTrayIcon className={`w-12 h-12 mb-3 ${isDragActive || isHovering ? 'text-blue-600' : 'text-gray-400'}`} />
      {isDragActive ? (
        <p className="text-blue-600 font-semibold">ここにファイルをドロップ</p>
      ) : (
        <p className="text-center text-gray-500">
          ファイルをドラッグ&ドロップするか、<br />
          <span className="font-semibold text-blue-600">コンピュータから選択してください</span>
        </p>
      )}
       <p className="mt-2 text-xs text-gray-400">（最大ファイルサイズ: 10MB）</p>
    </div>
  );
};

export default FileDropzone;
