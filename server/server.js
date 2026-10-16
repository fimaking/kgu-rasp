import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Agent that ignores SSL certificate issues on university server
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Schedule Proxy: queries KSU EIOS API directly from backend
 * GET /api/schedule?groupId=8953&sdate=2026-10-16
 */
app.get('/api/schedule', (req, res) => {
  const groupId = req.query.groupId || '8953';
  const sdate = req.query.sdate;

  let eiosUrl = `https://eios.kosgos.ru/api/Rasp?idGroup=${groupId}`;
  if (sdate) {
    eiosUrl += `&sdate=${encodeURIComponent(sdate)}`;
  }

  const options = {
    agent: httpsAgent,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://eios.kosgos.ru/WebApp/',
    },
  };

  https
    .get(eiosUrl, options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.json(parsed);
        } catch {
          res.status(502).json({
            state: 0,
            msg: 'Ошибка разбора ответа сервера КГУ',
          });
        }
      });
    })
    .on('error', (err) => {
      console.error('Error fetching from KSU EIOS:', err.message);
      res.status(500).json({
        state: 0,
        msg: 'Не удалось связаться с сервером ЭИОС КГУ: ' + err.message,
      });
    });
});

/**
 * Schedule Dates: queries date range
 * GET /api/schedule/dates?groupId=8953
 */
app.get('/api/schedule/dates', (req, res) => {
  const groupId = req.query.groupId || '8953';
  const eiosUrl = `https://eios.kosgos.ru/api/GetRaspDates?idGroup=${groupId}`;

  const options = {
    agent: httpsAgent,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://eios.kosgos.ru/WebApp/',
    },
  };

  https
    .get(eiosUrl, options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.json(parsed);
        } catch {
          res.status(502).json({ state: 0, msg: 'Ошибка ответа' });
        }
      });
    })
    .on('error', (err) => {
      res.status(500).json({ state: 0, msg: err.message });
    });
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    group: '26-ИСбо-4',
    groupId: 8953,
    serverTime: new Date().toISOString(),
  });
});

// Serve frontend static build if exists
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🎓 Сервер студента КГУ запущен!`);
  console.log(`🚀 Порт: http://localhost:${PORT}`);
  console.log(`📅 Расписание группы 8953: http://localhost:${PORT}/api/schedule?groupId=8953`);
  console.log(`=================================================\n`);
});
