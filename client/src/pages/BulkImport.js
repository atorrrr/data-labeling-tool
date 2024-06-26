import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, Button, Box, TextField } from '@mui/material';

function BulkImport() {
  const [jsonData, setJsonData] = useState('');
  const { datasetId } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(jsonData);
      await axios.post(`${process.env.REACT_APP_API_URL}/api/items/bulk-import`, {
        datasetId,
        items: data
      });
      alert('Items imported successfully');
      navigate(`/label/${datasetId}`);
    } catch (err) {
      console.error('Error importing items', err);
      alert('Error importing items. Please check your JSON format.');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Bulk Import Items
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
          helperText="Enter JSON array of objects to import"
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

export default BulkImport;