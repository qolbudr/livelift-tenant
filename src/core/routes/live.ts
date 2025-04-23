import { randomUUID } from 'crypto';
import express from 'express';
import { Live, PrismaClient } from '@prisma/client';
import { CommandObject } from '../types/command_object';
import { startStreaming, stopStreaming } from '../utils/streaming';

const prisma = new PrismaClient();
const router = express.Router();
let ffMpegProcess: CommandObject = {};

router.post('/api/live', async (req, res) => {
  const { title, videoId } = req.body;
  try {
    const uuid = randomUUID();
    const data = await prisma.live.create({ data: { title, uuid: uuid, videoId: videoId } })
    res.status(200).json({ code: 200, message: 'Berhasil menambahkan live', data: data });
  } catch (e) {
    res.status(500).send({ message: `${e}`, code: 500 });
  }
});

router.get('/api/live', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    // Compose Pagination
    const totalLive = await prisma.live.count();
    const live = await prisma.live.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        video: true,
      }
    });

    res.status(200).json({
      code: 200,
      message: 'Berhasil mendapatkan data',
      data: live,
      count: totalLive,
      totalPages: Math.ceil(totalLive / Number(limit)),
      currentPage: Number(page),
    });
  } catch (e) {
    res.status(500).send({ message: `${e}`, code: 500 });
  }
})

router.patch('/api/live/:id', async (req, res) => {
  const { id } = req.params;
  const { title, videoId, streamKey, rtmpUrl, loop, scheduleAt, max_quality, watermark, custom_logo } = req.body;

  try {
    // Update data first
    const data: Live = await prisma.live.update({ where: { id: Number(id) }, data: { title: title, videoId: videoId, streamKey: streamKey, rtmpUrl: rtmpUrl, loop: loop, scheduleAt: scheduleAt ? scheduleAt : null } })
    if (data) {
      // Check if the videoId is valid
      const video = await prisma.video.findUnique({ where: { id: Number(videoId) } });
      if (!video) {
        res.status(404).json({ message: 'Video tidak ditemukan', code: 404 });
        return;
      }

      // Check if the stream is already running
      if (data.scheduleAt == null) {
        startStreaming(data, video, ffMpegProcess, max_quality, watermark);
        await prisma.live.update({ where: { id: Number(id) }, data: { live: true } });
        res.status(200).json({ code: 200, message: 'Berhasil memulai live', data: data });
      } else {
        res.status(200).json({ code: 200, message: 'Berhasil mengupdate live', data: data });
      }
    }
  } catch (e) {
    res.status(500).send({ message: `${e}`, code: 500 });
  }
})

router.get('/api/live/:id/stop', async (req, res) => {
  const { id } = req.params;
  try {
    const live = await prisma.live.update({ where: { id: Number(id) }, data: { live: false, scheduleAt: null } });
    if (live) stopStreaming(live, ffMpegProcess);
    res.status(200).json({ code: 200, message: 'Berhasil menghentikan live' });
  } catch (e) {
    res.status(500).send({ message: `${e}`, code: 500 });
  }
})

router.delete('/api/live/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const live = await prisma.live.findUnique({ where: { id: Number(id) } });
    if (!live) {
      res.status(404).json({ message: 'Live tidak ditemukan', code: 404 });
      return;
    }

    await prisma.live.delete({ where: { id: Number(id) } });
    res.status(200).json({ code: 200, message: 'Berhasil menghapus live' });
  } catch (e) {
    res.status(500).send({ message: `${e}`, code: 500 });
  }
})

router.get('/api/live/schedule', async (req, res) => {
  const url = process.env.MAIN_URL;
  const base = process.env.URL;
  const response = await fetch(`${url}/api/auth/site?tenant=${base}`, { method: 'GET' });
  const result = await response.json();

  if (result.data) {
    const live = await prisma.live.findMany({ where: { scheduleAt: { lt: new Date() } }, include: { video: true } });
    live.forEach(async (item) => {
      startStreaming(item, item.video, ffMpegProcess, result.data.max_quality, result.data.watermark);
      await prisma.live.update({ where: { id: Number(item.id) }, data: { live: true } });
    })
  }

  res.status(200).json({ code: 200, message: 'Berhasil mendapatkan data', data: result.data });
})

export default router;