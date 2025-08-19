import express from 'express';
import fs from 'node:fs';

const router = express.Router();
const MUSIC_DIR = process.env.MUSIC_OUT || '/opt/blackroad/data/outputs';

router.get('/clips', (_req, res) => {
  fs.readdir(MUSIC_DIR, (err, files = []) => {
    if (err) {
      return res.json({ files: [] });
    }
    const audio = files.filter((f) => /\.(wav|mp3|ogg)$/i.test(f));
    res.json({ files: audio });
  });
});

export default router;
