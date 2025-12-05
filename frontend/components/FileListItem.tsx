import React from 'react';
import { Link } from 'react-router-dom';
import { FileItem } from '../types';
import Button from './Button';
import Tag from './Tag';
import { DocumentTextIcon } from './icons';

interface FileListItemProps {
  file: FileItem;
  onDelete?: (file: FileItem) => void;
  isDeleting?: boolean;
}

const FileListItem: React.FC<FileListItemProps> = ({ file, onDelete, isDeleting }) => {
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (onDelete) {
      onDelete(file);
    }
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 mb-3">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/file/${file.id}`} className="flex-1 group">
          <div className="flex items-start space-x-4">
            <DocumentTextIcon className="h-8 w-8 text-blue-500 mt-1 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">{file.name}</h3>
              {file.tags && file.tags.length > 0 && (
                <div className="mt-1">
                  <span className="text-xs text-gray-500 mr-1">Tags:</span>
                  {file.tags.slice(0, 3).map((tag, index) => (
                    <Tag key={index} className="mr-1 mb-1 text-xs">
                      {tag}
                    </Tag>
                  ))}
                  {file.tags.length > 3 && <span className="text-xs text-gray-500">+{file.tags.length - 3} more</span>}
                </div>
              )}
              {file.lastUpdated && <p className="mt-1 text-xs text-gray-500">Last updated {file.lastUpdated}</p>}
            </div>
          </div>
        </Link>
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : '削除'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileListItem;
