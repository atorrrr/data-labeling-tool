const express = require('express');
const multer = require('multer');
const db = require('../database');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

router.post('/upload', upload.single('file'), (req, res) => {
  console.log('Upload request received');
  console.log('File:', req.file);
  console.log('Body:', req.body);

  const { datasetName, labelOptions } = req.body;
  const filePath = req.file.path;

  // Ensure labelOptions is stored as a JSON string
  const labelOptionsJson = JSON.stringify(labelOptions.split(',').map(opt => opt.trim()));

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({ msg: 'Error reading file', error: err.message });
    }

    try {
      const items = JSON.parse(data);
      console.log('Parsed items:', items.length);

      db.run('INSERT INTO datasets (name, labelOptions) VALUES (?, ?)', [datasetName, labelOptionsJson], function(err) {
        if (err) {
          console.error('Error inserting dataset:', err);
          return res.status(400).json({ msg: 'Dataset name already exists', error: err.message });
        }

        const datasetId = this.lastID;
        console.log('Dataset inserted, id:', datasetId);

        const placeholders = items.map(() => '(?, ?)').join(',');
        const values = items.flatMap(item => [JSON.stringify(item), datasetId]);

        db.run(`INSERT INTO items (content, dataset_id) VALUES ${placeholders}`, values, (err) => {
          if (err) {
            console.error('Error inserting items:', err);
            return res.status(500).json({ msg: 'Error inserting items', error: err.message });
          }
          fs.unlinkSync(filePath);
          console.log('Upload successful');
          res.json({ msg: 'Dataset uploaded successfully' });
        });
      });
    } catch (err) {
      console.error('Error parsing JSON:', err);
      return res.status(400).json({ msg: 'Invalid JSON format', error: err.message });
    }
  });
});

router.get('/datasets', (req, res) => {
  db.all('SELECT * FROM datasets', (err, datasets) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(datasets);
  });
});

router.get('/next/:datasetId', (req, res) => {
  const { datasetId } = req.params;
  db.get(`
    SELECT i.*, d.labelOptions, 
           (SELECT COUNT(*) FROM items WHERE dataset_id = ? AND id <= i.id) as position,
           (SELECT COUNT(*) FROM items WHERE dataset_id = ?) as total
    FROM items i
    JOIN datasets d ON i.dataset_id = d.id
    WHERE i.dataset_id = ?
    ORDER BY i.id ASC
    LIMIT 1
  `, [datasetId, datasetId, datasetId], (err, item) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    if (!item) {
      return res.status(404).json({ msg: 'No items in this dataset' });
    }
    try {
      item.labelOptions = JSON.parse(item.labelOptions);
      item.content = JSON.parse(item.content);
      item.allKeys = Object.keys(item.content);
    } catch (parseError) {
      console.error('Error parsing item data:', parseError);
      item.labelOptions = [];
      item.allKeys = [];
    }
    res.json(item);
  });
});

router.post('/label', (req, res) => {
  const { itemId, label } = req.body;
  db.run('UPDATE items SET label = ? WHERE id = ?', [label, itemId], (err) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json({ msg: 'Item labeled successfully' });
  });
});


router.get('/progress/:datasetId', (req, res) => {
  const { datasetId } = req.params;
  db.get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'labeled' THEN 1 ELSE 0 END) as labeled
    FROM items
    WHERE dataset_id = ?
  `, [datasetId], (err, result) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(result);
  });
});


router.get('/navigate/:datasetId/:itemId/:direction', (req, res) => {
  const { datasetId, itemId, direction } = req.params;
  const query = direction === 'prev'
    ? `SELECT i.*, d.labelOptions, 
        (SELECT COUNT(*) FROM items WHERE dataset_id = ? AND id <= i.id) as position,
        (SELECT COUNT(*) FROM items WHERE dataset_id = ?) as total
      FROM items i 
      JOIN datasets d ON i.dataset_id = d.id 
      WHERE i.dataset_id = ? AND i.id < ? 
      ORDER BY i.id DESC LIMIT 1`
    : `SELECT i.*, d.labelOptions, 
        (SELECT COUNT(*) FROM items WHERE dataset_id = ? AND id <= i.id) as position,
        (SELECT COUNT(*) FROM items WHERE dataset_id = ?) as total
      FROM items i 
      JOIN datasets d ON i.dataset_id = d.id 
      WHERE i.dataset_id = ? AND i.id > ? 
      ORDER BY i.id ASC LIMIT 1`;
  
  db.get(query, [datasetId, datasetId, datasetId, itemId], (err, item) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    if (!item) {
      return res.json({ msg: 'No more items in this direction' });
    }
    try {
      item.labelOptions = JSON.parse(item.labelOptions);
      item.content = JSON.parse(item.content);
      item.allKeys = Object.keys(item.content);
    } catch (parseError) {
      console.error('Error parsing item data:', parseError);
      item.labelOptions = [];
      item.allKeys = [];
    }
    res.json(item);
  });
});

router.post('/bulk-import', (req, res) => {
  const { datasetId, items } = req.body;
  const stmt = db.prepare('INSERT INTO items (dataset_id, content) VALUES (?, ?)');

  items.forEach((item) => {
    stmt.run(datasetId, JSON.stringify(item));
  });

  stmt.finalize((err) => {
    if (err) {
      return res.status(500).json({ msg: 'Error importing items' });
    }
    res.json({ msg: 'Items imported successfully' });
  });
});

router.get('/labelOptions/:datasetId', (req, res) => {
  const { datasetId } = req.params;
  db.get('SELECT labelOptions FROM datasets WHERE id = ?', [datasetId], (err, result) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    if (!result || !result.labelOptions) {
      return res.status(404).json({ msg: 'Label options not found' });
    }
    try {
      const labelOptions = JSON.parse(result.labelOptions);
      res.json({ labelOptions });
    } catch (parseError) {
      console.error('Error parsing labelOptions:', parseError);
      res.status(500).json({ msg: 'Error parsing label options' });
    }
  });
});


router.get('/export/:datasetId', (req, res) => {
  const { datasetId } = req.params;
  db.all(`
    SELECT i.id, i.content, i.label
    FROM items i
    WHERE i.dataset_id = ?
    ORDER BY i.id ASC
  `, [datasetId], (err, items) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    const exportData = items.map(item => ({
      ...JSON.parse(item.content),
      label: item.label
    }));
    res.json(exportData);
  });
});

module.exports = router;
