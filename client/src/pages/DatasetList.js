import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, List, ListItem, ListItemText, Button } from '@mui/material';

function DatasetList() {
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/items/datasets`);
      setDatasets(res.data);
    } catch (err) {
      console.error('Error fetching datasets', err);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Datasets
      </Typography>
      <List>
        {datasets.map(dataset => (
          <ListItem key={dataset.id} component={RouterLink} to={`/label/${dataset.id}`} button>
            <ListItemText primary={dataset.name} />
          </ListItem>
        ))}
      </List>
      <Button variant="contained" component={RouterLink} to="/upload" sx={{ mt: 2 }}>
        Upload New Dataset
      </Button>
    </Container>
  );
}

export default DatasetList;