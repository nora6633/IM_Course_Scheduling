import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

// Sample user interface
interface User {
  id: number;
  name: string;
  email: string;
}

// Sample user data
let users: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  }
];

// Get all users
router.get('/', (req: Request, res: Response) => {
  res.json(users);
});

// Get user by ID
router.get('/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

// Create new user
router.post('/', (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  const newUser: User = {
    id: users.length + 1,
    name,
    email
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// Update user
router.put('/:id', (req: Request, res: Response) => {
  const { name, email } = req.body;
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));

  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  users[userIndex] = {
    ...users[userIndex],
    name: name || users[userIndex].name,
    email: email || users[userIndex].email
  };

  res.json(users[userIndex]);
});

// Delete user
router.delete('/:id', (req: Request, res: Response) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));

  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  users = users.filter(u => u.id !== parseInt(req.params.id));
  res.status(204).send();
});

export { router }; 