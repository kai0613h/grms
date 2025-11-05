
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import UploadPage from './pages/UploadPage';
import FileDetailsPage from './pages/FileDetailsPage';
import CreateProgramPage from './pages/CreateProgramPage';
import GenerateAbstractsPage from './pages/GenerateAbstractsPage';
import SubmissionThreadsPage from './pages/SubmissionThreadsPage';
import ThreadDetailPage from './pages/ThreadDetailPage';
import { Page } from './types';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to={Page.Search} replace />} />
          <Route path={Page.Search} element={<SearchPage />} />
          <Route path={Page.Upload} element={<UploadPage />} />
          <Route path="/file/:fileId" element={<FileDetailsPage />} /> {/* Dynamic route */}
          <Route path={Page.SubmissionThreads} element={<SubmissionThreadsPage />} />
          <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          <Route path={Page.CreateProgram} element={<CreateProgramPage />} />
          <Route path={Page.GenerateAbstracts} element={<GenerateAbstractsPage />} />
           {/* Add a fallback or 404 page if desired */}
          <Route path="*" element={<Navigate to={Page.Search} replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
