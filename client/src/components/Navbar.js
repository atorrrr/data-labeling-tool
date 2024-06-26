import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Data Tool
        </Typography>
        <Button color="inherit" component={RouterLink} to="/">
          Datasets
        </Button>
        <Button color="inherit" component={RouterLink} to="/upload">
          Upload
        </Button>
        <Button color="inherit" component={RouterLink} to="/llm-review-create">
          LLM Review
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;