require('dotenv').config();
require('./scripts/db-init');
require('./scripts/migrate');
const express = require('express');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const indexRoutes = require('./routes');
const llmRoutes = require('./routes/llm');
const guardianRoutes = require('./routes/guardian');

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use(logger);

app.use('/api', indexRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/guardian', guardianRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`blackroad-api listening on ${PORT}`);
});

module.exports = app;

