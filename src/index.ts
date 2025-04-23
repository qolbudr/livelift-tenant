import express from 'express';
import { check } from './core/middleware/middleware';
import cors from 'cors';
import mediaRoute from './core/routes/media';
import liveRoute from './core/routes/live';
import historyRoute from './core/routes/history';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.static('public'))
app.use(express.json());
app.use(check);

app.use('/', mediaRoute);
app.use('/', liveRoute);
app.use('/', historyRoute);

app.get('/', (req, res) => {
  res.status(200).json({code: 200, message: 'Server is running', data: null, token: undefined});
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
