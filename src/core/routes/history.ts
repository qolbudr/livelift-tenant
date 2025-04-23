import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();

router.get('/api/history', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const totalHistory = await prisma.history.count();
    const history = await prisma.history.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        live: true,
      }
    });

    res.status(200).json({
      code: 200,
      message: 'Berhasil mendapatkan data',
      data: history,
      count: totalHistory,
      totalPages: Math.ceil(totalHistory / Number(limit)),
      currentPage: Number(page),
    });
  } catch (e) {
    res.status(500).send({ message: `${e}`, code: 500 });
  }
})

export default router;