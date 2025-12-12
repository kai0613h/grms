
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import UploadPage from './pages/UploadPage';
import FileDetailsPage from './pages/FileDetailsPage';
import SubmissionThreadsPage from './pages/SubmissionThreadsPage';
import ThreadDetailPage from './pages/ThreadDetailPage';
import CreateProgramPage from './pages/CreateProgramPage';
import GenerateAbstractsPage from './pages/GenerateAbstractsPage';
import GenerateContactTimePage from './pages/GenerateContactTimePage';
import SubmissionStatusPage from './pages/SubmissionStatusPage';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/file/:fileId" element={<FileDetailsPage />} />
          <Route path="/threads" element={<SubmissionThreadsPage />} />
          <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          <Route path="/status" element={<SubmissionStatusPage />} />
          <Route path="/create-program" element={<CreateProgramPage />} />
          <Route path="/generate-abstracts" element={<GenerateAbstractsPage />} />
          <Route path="/generate-contact-time" element={<GenerateContactTimePage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
