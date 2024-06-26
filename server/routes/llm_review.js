const express = require('express');
const db = require('../database');
const router = express.Router();

router.post('/session', (req, res) => {
  const { name, description } = req.body;
  db.run('INSERT INTO llm_sessions (name, description) VALUES (?, ?)', [name, description], function(err) {
    if (err) {
      return res.status(500).json({ msg: 'Error creating session' });
    }
    res.json({ msg: 'Session created successfully', sessionId: this.lastID });
  });
});

router.post('/inputs', (req, res) => {
  const { sessionId, inputs } = req.body;
  const stmt = db.prepare('INSERT INTO llm_inputs (session_id, input, original_output) VALUES (?, ?, ?)');
  
  inputs.forEach(({ input, output }) => {
    stmt.run(sessionId, input, output);
  });
  
  stmt.finalize((err) => {
    if (err) {
      return res.status(500).json({ msg: 'Error adding inputs' });
    }
    res.json({ msg: 'Inputs added successfully' });
  });
});

router.get('/next/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  db.get(`
    SELECT * FROM llm_inputs 
    WHERE session_id = ? AND status = "pending"
    UNION
    SELECT * FROM llm_inputs 
    WHERE session_id = ? AND status = "reviewed"
    ORDER BY status DESC, id ASC
    LIMIT 1
  `, [sessionId, sessionId], (err, row) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(row || { msg: 'No more items to review' });
  });
});

router.post('/curate', (req, res) => {
  const { inputId, curatedOutput } = req.body;
  db.run('UPDATE llm_inputs SET curated_output = ?, status = "reviewed" WHERE id = ?', [curatedOutput, inputId], (err) => {
    if (err) {
      return res.status(500).json({ msg: 'Error updating curated output' });
    }
    res.json({ msg: 'Curated output saved successfully' });
  });
});

router.get('/progress/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed
    FROM llm_inputs
    WHERE session_id = ?
  `, [sessionId], (err, result) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(result);
  });
});

router.get('/navigate/:sessionId/:inputId/:direction', (req, res) => {
  const { sessionId, inputId, direction } = req.params;
  const query = direction === 'prev' 
    ? 'SELECT * FROM llm_inputs WHERE session_id = ? AND id < ? ORDER BY id DESC LIMIT 1'
    : 'SELECT * FROM llm_inputs WHERE session_id = ? AND id > ? ORDER BY id ASC LIMIT 1';
  
  db.get(query, [sessionId, inputId], (err, row) => {
    if (err) {
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(row || { msg: 'No more items in this direction' });
  });
});

module.exports = router;