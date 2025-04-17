import express from 'express';
import { check } from './core/middleware/middleware';
import { randomUUID } from 'crypto';
import formidable from 'formidable';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.use(express.json());
app.use(check);

/* ============================== Media Route ================================ */

app.post('/api/upload', async (req, res) => {
  const form = formidable({
    uploadDir: './public',
    keepExtensions: true,
    filename: (name, ext, part, form) => randomUUID() + ext,
  });

  // Parse form and upload file
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: 'Gagal upload foto', code: 500 });
    if (!files || !files.video) return res.status(400).json({ message: 'Video adalah kolom wajib' });

    const { title, description } = fields;

    try {
      const video = files.video[0];
      const data = await prisma.video.create({ data: { title: title![0], description: description![0], video: video.newFilename } })
      return res.status(200).json({ code: 200, message: 'Berhasil menambahkan video', data: data });
    } catch (e) {
      return res.status(500).send({ message: `${e}`, code: 500 });
    }
  });
})

app.get('/api/media', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const videos = await prisma.video.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const totalVideos = await prisma.video.count();

    res.status(200).json({
      code: 200,
      message: 'Berhasil mendapatkan data',
      data: videos,
      count: totalVideos,
      totalPages: Math.ceil(totalVideos / Number(limit)),
      currentPage: Number(page),
    });
  } catch (e) {
    res.status(500).send({ message: `${e}`, code: 500 });
  }
})

app.delete('/api/media/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const video = await prisma.video.findUnique({ where: { id: Number(id) } });
    if (!video) {
      res.status(404).json({ message: 'Video tidak ditemukan', code: 404 });
      return;
    }

    await prisma.video.delete({ where: { id: Number(id) } });

    const videoPath = path.join(__dirname, '..', 'public', video.video);
    fs.unlinkSync(videoPath);

    res.status(200).json({ code: 200, message: 'Berhasil menghapus video' });
  } catch (e) {
    res.status(500).send({ message: `${e}`, code: 500 });
  }
})
/* ============================== Media Route ================================ */

app.get('/', (req, res) => {
  res.send('Hello from TypeScript + Express!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
