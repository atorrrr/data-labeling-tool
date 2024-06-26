import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DatasetUpload from './pages/DatasetUpload';
import DatasetList from './pages/DatasetList';
import LabelingTool from './pages/LabelingTool';
import BulkImport from './pages/BulkImport';
import LLMSessionCreate from './pages/LLMSessionCreate';
import LLMReviewTool from './pages/LLMReviewTool';
import LLMBulkImport from './pages/LLMBulkImport';
import Navbar from './components/Navbar';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<DatasetList />} />
          <Route path="/upload" element={<DatasetUpload />} />
          <Route path="/label/:datasetId" element={<LabelingTool />} />
          <Route path="/dataset/:datasetId/import" element={<BulkImport />} />
          <Route path="/llm-review-create" element={<LLMSessionCreate />} />
          <Route path="/llm-review/:sessionId" element={<LLMReviewTool />} />
          <Route path="/llm-review/:sessionId/import" element={<LLMBulkImport />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;