const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'web' folder
app.use(express.static(path.join(__dirname, 'web')));

// Serve index.html on the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// Handle requests for other HTML files
app.get('/:page', (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, 'web', `${page}.html`));
});

// Start the server
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});

