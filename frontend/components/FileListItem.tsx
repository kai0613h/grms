import React from 'react';
import { Link } from 'react-router-dom';
import { FileItem } from '../types';
import { DocumentIcon, CalendarIcon, UserIcon, TagIcon } from './icons';
import Tag from './Tag';

interface FileListItemProps {
  file: FileItem;
}

const FileListItem: React.FC<FileListItemProps> = ({ file }) => {
  return (
    <Link to={`/file/${file.id}`} className="block group">
      <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <DocumentIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {file.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                {file.description || 'No description available.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                  {file.uploadedOn || file.uploadedAtIso?.split('T')[0]}
                </div>
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                  {file.uploadedBy}
                </div>
                {file.tags && file.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-slate-400" />
                    {file.tags.map((tag, index) => (
                      <Tag key={index} label={tag} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FileListItem;
