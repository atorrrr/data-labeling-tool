import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, Button, Box, TextField } from '@mui/material';

function LLMBulkImport() {
  const [jsonData, setJsonData] = useState('');
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(jsonData);
      await axios.post(`${process.env.REACT_APP_API_URL}/api/llm-review/inputs`, {
        sessionId,
        inputs: data
      });
      alert('Inputs imported successfully');
      navigate(`/llm-review/${sessionId}`);
    } catch (err) {
      console.error('Error importing inputs', err);
      alert('Error importing inputs. Please check your JSON format.');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Bulk Import LLM Inputs/Outputs
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          multiline
          rows={10}
          id="jsonData"
          label="JSON Data"
          name="jsonData"
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          helperText="Enter JSON array of objects with 'input' and 'output' fields"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Import Data
        </Button>
      </Box>
    </Container>
  );
}

export default LLMBulkImport;