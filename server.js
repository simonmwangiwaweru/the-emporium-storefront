import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/admin', '/admin.html'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get(['/cart', '/cart.html'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`The Emporium server running at http://${HOST}:${PORT}`);
});
