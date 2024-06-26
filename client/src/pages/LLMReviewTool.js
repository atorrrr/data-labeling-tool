import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box, Paper, LinearProgress } from '@mui/material';

function LLMReviewTool() {
  const [currentItem, setCurrentItem] = useState(null);
  const [curatedOutput, setCuratedOutput] = useState('');
  const [progress, setProgress] = useState({ total: 0, reviewed: 0 });
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNextItem();
    fetchProgress();
  }, [sessionId]);

  const fetchNextItem = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/llm-review/next/${sessionId}`);
      if (res.data.msg === 'No more items to review') {
        alert('Review session complete!');
        navigate('/');
        return;
      }
      setCurrentItem(res.data);
      setCuratedOutput(res.data.curated_output || res.data.original_output);
    } catch (err) {
      console.error('Error fetching item', err);
      alert('Error fetching next item');
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/llm-review/progress/${sessionId}`);
      setProgress(res.data);
    } catch (err) {
      console.error('Error fetching progress', err);
    }
  };

  const submitCuratedOutput = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/llm-review/curate`, {
        inputId: currentItem.id,
        curatedOutput
      });
      fetchNextItem();
      fetchProgress();
    } catch (err) {
      console.error('Error submitting curated output', err);
      alert('Error saving curated output');
    }
  };

  const navigateItem = (direction) => async () => {
    if (!currentItem) return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/llm-review/navigate/${sessionId}/${currentItem.id}/${direction}`);
      if (res.data.msg) {
        alert(res.data.msg);
        return;
      }
      setCurrentItem(res.data);
      setCuratedOutput(res.data.curated_output || res.data.original_output);
    } catch (err) {
      console.error(`Error navigating ${direction}`, err);
      alert(`Error navigating ${direction}`);
    }
  };

  if (!currentItem) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        LLM Output Review Tool
      </Typography>
      <Box sx={{ width: '100%', mb: 2 }}>
        <LinearProgress variant="determinate" value={(progress.reviewed / progress.total) * 100} />
        <Typography variant="body2" color="text.secondary">
          Progress: {progress.reviewed} / {progress.total}
        </Typography>
      </Box>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Input:</Typography>
        <Typography variant="body1">{currentItem.input}</Typography>
      </Paper>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Original Output:</Typography>
        <Typography variant="body1">{currentItem.original_output}</Typography>
      </Paper>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>Curated Output:</Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          value={curatedOutput}
          onChange={(e) => setCuratedOutput(e.target.value)}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={navigateItem('prev')}>
          Previous
        </Button>
        <Button variant="contained" onClick={submitCuratedOutput}>
          Save and Next
        </Button>
        <Button variant="outlined" onClick={navigateItem('next')}>
          Next
        </Button>
      </Box>
      <Button variant="outlined" component={RouterLink} to={`/llm-review/${sessionId}/import`} sx={{ mt: 2 }}>
        Bulk Import
      </Button>
    </Container>
  );
}

export default LLMReviewTool;