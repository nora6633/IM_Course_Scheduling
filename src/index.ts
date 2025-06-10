import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { router as userRouter } from './routes/users';
import { router as screenshotRouter } from './routes/screenshot';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the TypeScript Express API!' });
});

app.use('/api/users', userRouter);
app.use('/api/screenshot', screenshotRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
}); 