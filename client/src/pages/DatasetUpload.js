import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box } from '@mui/material';

function DatasetUpload() {
  const [file, setFile] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [labelOptions, setLabelOptions] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('datasetName', datasetName);
    formData.append('labelOptions', labelOptions);



  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/items/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log('Upload response:', response.data);
    navigate('/');
  } catch (err) {
    console.error('Upload error:', err);
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', err.response.data);
      console.error('Error status:', err.response.status);
      console.error('Error headers:', err.response.headers);
    } else if (err.request) {
      // The request was made but no response was received
      console.error('Error request:', err.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', err.message);
    }
    alert('Upload failed: ' + (err.response?.data?.msg || err.message));
  }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Dataset
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="datasetName"
          label="Dataset Name"
          name="datasetName"
          autoFocus
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="labelOptions"
          label="Label Options (comma-separated)"
          name="labelOptions"
          value={labelOptions}
          onChange={(e) => setLabelOptions(e.target.value)}
        />
        <input
          accept="application/json"
          style={{ display: 'none' }}
          id="raised-button-file"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <label htmlFor="raised-button-file">
          <Button variant="contained" component="span" fullWidth sx={{ mt: 2, mb: 2 }}>
            Choose JSON File
          </Button>
        </label>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Upload
        </Button>
      </Box>
    </Container>
  );
}

export default DatasetUpload;
