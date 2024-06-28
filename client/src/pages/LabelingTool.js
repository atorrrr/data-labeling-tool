import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, Button, Box, Paper, LinearProgress, Checkbox, FormControlLabel, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPre = styled('pre')(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.9rem',
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  maxHeight: '400px',
  overflowY: 'auto',
  '& .key': {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
  },
  '& .string': {
    color: theme.palette.success.main,
  },
  '& .number': {
    color: theme.palette.error.main,
  },
  '& .boolean': {
    color: theme.palette.warning.main,
  },
}));

function LabelingTool() {
  const [currentItem, setCurrentItem] = useState(null);
  const [currentLabel, setCurrentLabel] = useState('');
  const [progress, setProgress] = useState({ total: 0, labeled: 0 });
  const [labelOptions, setLabelOptions] = useState([]);
  const [allKeys, setAllKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [contentHeight, setContentHeight] = useState('auto');
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  useEffect(() => {
    fetchNextItem();
  }, [datasetId]);

  useEffect(() => {
    if (contentRef.current) {
      const newHeight = Math.min(contentRef.current.scrollHeight, 400);
      setContentHeight(`${newHeight}px`);
    }
  }, [currentItem, selectedKeys]);

  const fetchNextItem = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/items/next/${datasetId}`);
      if (res.status === 404) {
        alert('This dataset is empty.');
        navigate('/');
        return;
      }
      setCurrentItem(res.data);
      setCurrentLabel(res.data.label || '');
      setLabelOptions(res.data.labelOptions || []);
      setAllKeys(res.data.allKeys || []);
      if (selectedKeys.length === 0) {
        setSelectedKeys(res.data.allKeys || []);
      }
    } catch (err) {
      console.error('Error fetching item', err);
      alert('Error fetching item');
    }
  };

  const submitLabel = async () => {
    if (!currentLabel) {
      alert('Please select a label before saving.');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/items/label`, { itemId: currentItem.id, label: currentLabel });
      navigateItem('next');
    } catch (err) {
      console.error('Error submitting label', err);
      alert('Error saving label');
    }
  };

  const navigateItem = async (direction) => {
    if (!currentItem) return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/items/navigate/${datasetId}/${currentItem.id}/${direction}`);
      if (res.data.msg) {
        alert(res.data.msg);
        return;
      }
      setCurrentItem(res.data);
      setCurrentLabel(res.data.label || '');
      setLabelOptions(res.data.labelOptions || []);
    } catch (err) {
      console.error(`Error navigating ${direction}`, err);
      alert(`Error navigating ${direction}`);
    }
  };

  const exportDataset = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/items/export/${datasetId}`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `dataset_${datasetId}_export.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (err) {
      console.error('Error exporting dataset', err);
      alert('Error exporting dataset');
    }
  };

  const toggleKey = (key) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleAllKeys = () => {
    setSelectedKeys(prev => prev.length === allKeys.length ? [] : [...allKeys]);
  };

  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2)
      .replace(/"([^"]+)":/g, '<span class="key">$1:</span>')
      .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
      .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
      .replace(/\b(true|false)\b/g, '<span class="boolean">$1</span>');
  };

  if (!currentItem) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Labeling Tool
      </Typography>
      <Box sx={{ width: '100%', mb: 2 }}>
        <LinearProgress variant="determinate" value={(currentItem.position / currentItem.total) * 100} />
        <Typography variant="body2" color="text.secondary">
          Progress: {currentItem.position} / {currentItem.total}
        </Typography>
      </Box>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Select fields to display:
          </Typography>
          <Button onClick={toggleAllKeys} sx={{ mb: 1 }}>
            {selectedKeys.length === allKeys.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {allKeys.map((key) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={selectedKeys.includes(key)}
                    onChange={() => toggleKey(key)}
                  />
                }
                label={key}
                sx={{ width: '50%', mr: 0 }}
              />
            ))}
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Item Content:
        </Typography>
        <StyledPre 
          ref={contentRef}
          style={{ height: contentHeight }}
          dangerouslySetInnerHTML={{ 
            __html: formatJSON(
              Object.fromEntries(
                Object.entries(currentItem.content).filter(([key]) => selectedKeys.includes(key))
              )
            )
          }} 
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Select Label:
          </Typography>
          {labelOptions.map((option) => (
            <Button
              key={option}
              variant={currentLabel === option ? "contained" : "outlined"}
              onClick={() => setCurrentLabel(option)}
              sx={{ mr: 1, mb: 1 }}
            >
              {option}
            </Button>
          ))}
        </Box>
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => navigateItem('prev')}>
          PREVIOUS
        </Button>
        <Button variant="contained" onClick={submitLabel}>
          SAVE AND NEXT
        </Button>
        <Button variant="outlined" onClick={() => navigateItem('next')}>
          NEXT
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={exportDataset} color="secondary">
          Export Dataset
        </Button>
      </Box>
    </Container>
  );
}

export default LabelingTool;
