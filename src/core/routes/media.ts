import { randomUUID } from 'crypto';
import express from 'express';
import formidable from 'formidable';
import path from 'path';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/api/upload', async (req, res) => {
  const form = formidable({
    uploadDir: './public',
    keepExtensions: true,
    filename: (name, ext, part, form) => randomUUID() + ext,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: 'Gagal upload foto', code: 500 });
    if (!files || !files.video) return res.status(400).json({ message: 'Video adalah kolom wajib' });
    const { title, description } = fields;
    try {
      const video = files.video[0];
      const videoPath = path.join(__dirname, '../../..', 'public', video.newFilename);
      const thumbnailPath = path.join(__dirname, '../../..', 'public/thumbnail', video.newFilename.replace(/\.[^/.]+$/, '.png'));
      const thumbnail = await new Promise((resolve, reject) => {
        ffmpeg(videoPath).on('end', () => resolve(thumbnailPath)).on('error', (err) => reject(err))
          .screenshots({
            count: 1,
            folder: path.dirname(thumbnailPath),
            filename: path.basename(thumbnailPath)
          });
      });

      const data = await prisma.video.create({ data: { title: title![0], thumbnail: video.newFilename.replace(/\.[^/.]+$/, '.png'), description: description![0], video: video.newFilename } })
      return res.status(200).json({ code: 200, message: 'Berhasil menambahkan video', data: data });
    } catch (e) {
      return res.status(500).send({ message: `${e}`, code: 500 });
    }
  });
})

router.get('/api/media', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const totalVideos = await prisma.video.count();
    const videos = await prisma.video.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

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

router.delete('/api/media/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const video = await prisma.video.findUnique({ where: { id: Number(id) } });
    if (!video) {
      res.status(404).json({ message: 'Video tidak ditemukan', code: 404 });
      return;
    }

    await prisma.video.delete({ where: { id: Number(id) } });
    const videoPath = path.join(__dirname, '../../..', 'public', video.video);
    const thumbnailPath = path.join(__dirname, '../../..', 'public/thumbnail', video.thumbnail);
    fs.unlinkSync(videoPath);
    fs.unlinkSync(thumbnailPath);

    res.status(200).json({ code: 200, message: 'Berhasil menghapus video' });
  } catch (e) {
    res.status(500).send({ message: `${e}`, code: 500 });
  }
})

export default router;