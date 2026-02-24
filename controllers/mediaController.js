const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const Media = require('../model/Media');

const detectContentType = (name) => {
  const lc = name.toLowerCase();
  if (lc.endsWith('.mp4')) return 'video/mp4';
  if (lc.endsWith('.webm')) return 'video/webm';
  if (lc.endsWith('.ogg')) return 'video/ogg';
  if (lc.endsWith('.png')) return 'image/png';
  if (lc.endsWith('.jpg') || lc.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

const listMedia = async (req, res) => {
  const items = await Media.find().select('filename contentType').lean();
  res.json(items.map(i => i.filename));
};

// Serve files either from DB or from disk (including backend/videos)
const getFile = async (req, res) => {
  const name = req.params.name;
  if (!name) return res.status(400).json({ message: 'Filename required' });

  // Try DB first
  let media = await Media.findOne({ filename: name }).exec();
  if (media && media.data) {
    res.set('Content-Type', media.contentType || detectContentType(name));
    return res.send(media.data);
  }

  // Look for files on disk in several locations
  const candidates = [
    path.join(__dirname, '..', 'videos', name),
    path.join(__dirname, '..', 'public', 'videos', name),
    path.join(__dirname, '..', 'public', 'images', name),
    path.join(__dirname, '..', 'public', 'imgf', name),
    path.join(__dirname, '..', 'public', name)
  ];

  let filePath = null;
  for (const p of candidates) {
    try {
      await fsp.access(p, fs.constants.R_OK);
      filePath = p;
      break;
    } catch (e) {
      // not found, continue
    }
  }

  if (!filePath) return res.sendStatus(404);

  // Stream with Range support for video playback
  try {
    const stat = await fsp.stat(filePath);
    const total = stat.size;
    const range = req.headers.range;
    const contentType = detectContentType(name);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      if (start >= total || end >= total) {
        res.status(416).set('Content-Range', `bytes */${total}`).end();
        return;
      }
      const chunkSize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, { 'Content-Length': total, 'Content-Type': contentType });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  } catch (err) {
    console.error('Error serving file', err);
    res.sendStatus(500);
  }
};

module.exports = { listMedia, getFile };
