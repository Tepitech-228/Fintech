const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();
require('./models/index');
const routes = require('./routes/index');

const app = express();

const isProd = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN || (isProd ? '' : '*');

app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(compression());
app.use(cors({ origin: corsOrigin || false, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

if (isProd) {
  const distPath = path.join(__dirname, '../../Front/dist/Front/browser');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

module.exports = app;
