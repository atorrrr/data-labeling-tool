const express = require('express');
const cors = require('cors');
const morgan = require('morgan');  // You may need to install this: npm install morgan
const itemRoutes = require('./routes/items');

const app = express();

// Use morgan for logging HTTP requests
app.use(morgan('dev'));

app.use(cors());
app.use(express.json());

// Log all routes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/items', itemRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
