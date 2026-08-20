// api-server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  genSong,
  genLyrics,
  getLyrics,
  getTrendingSongs,
  getLatestSongs,
  getSongInfo,
  getBillingInfo
} from './your-suno-wrapper.js'; // Your existing code

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Suno API Wrapper' });
});

// 1. Generate a song
app.post('/api/generate/song', async (req, res) => {
  try {
    const { description, title, lyrics, is_no_lyrics, tags } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    const task_uuid = `task_${Date.now()}`;
    const result = await genSong(
      task_uuid,
      description,
      title,
      lyrics,
      is_no_lyrics,
      tags
    );

    res.json({
      success: true,
      task_uuid,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Generate lyrics only
app.post('/api/generate/lyrics', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    const result = await genLyrics(description);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get generated lyrics
app.get('/api/lyrics/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await getLyrics(taskId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get trending songs
app.get('/api/songs/trending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await getTrendingSongs(page);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get latest songs
app.get('/api/songs/latest', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await getLatestSongs(page);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get song info by IDs
app.get('/api/songs/info', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required (comma-separated)' });
    }

    const idArray = ids.split(',');
    const result = await getSongInfo(idArray);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get billing info
app.get('/api/billing', async (req, res) => {
  try {
    const result = await getBillingInfo();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Suno API server running on http://localhost:${PORT}`);
});
