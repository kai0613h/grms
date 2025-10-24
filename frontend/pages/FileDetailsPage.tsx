
import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import Tag from '../components/Tag';
import { MOCK_FILES } from '../constants';
import { FileItem } from '../types';
import { DocumentTextIcon } from '../components/icons';

const FileDetailsPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [file, setFile] = useState<FileItem | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const foundFile = MOCK_FILES.find(f => f.id === fileId);
    // For the specific PRD 1.2 example, ensure it's loaded if ID matches
    const prdFile = MOCK_FILES.find(f => f.name === "PRD 1.2");
    if (fileId === prdFile?.id) {
        setFile(prdFile);
    } else {
        setFile(foundFile);
    }
    setLoading(false);
  }, [fileId]);

  if (loading) {
    return <div className="text-center py-10">Loading file details...</div>;
  }

  if (!file) {
    // return <Navigate to="/search" replace />; // Or a 404 component
     return <div className="text-center py-10">
         <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
         <h3 className="mt-2 text-lg font-medium text-gray-900">File not found</h3>
         <p className="mt-1 text-sm text-gray-500">The file you are looking for does not exist or has been moved.</p>
         <Button onClick={() => window.history.back()} variant="outline" className="mt-4">Go Back</Button>
         <Link to="/search">
            <Button variant="primary" className="mt-4 ml-2">Go to Search</Button>
         </Link>
        </div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-lg">
      <SectionTitle subtitle={file.lastUpdated ? `Last updated ${file.lastUpdated}` : undefined}>
        {file.name}
      </SectionTitle>

      <div className="mb-8">
        <Button variant="primary" size="md">
          Download
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
    </div>
  );
};

export default FileDetailsPage;
