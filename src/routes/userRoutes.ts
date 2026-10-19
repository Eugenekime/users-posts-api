import { Router } from 'express';
import * as userService from '../services/userService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await userService.listUsers(page, limit);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q?.toString() ?? '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await userService.searchUsers(query, page, limit);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:userId/followers', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await userService.getFollowers(
      req.params.userId,
      page,
      limit
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:userId', async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.userId);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

router.patch('/:userId', async (req, res, next) => {
  try {
    const allowedFields = [
      'username',
      'email',
      'firstName',
      'lastName',
      'bio',
      'avatar',
    ] as const;

    const input = Object.fromEntries(
      allowedFields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (Object.keys(input).length === 0) {
      throw new AppError('No valid fields provided', 400);
    }

    const user = await userService.updateUser(req.params.userId, input);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/:userId/follow/:targetUserId', async (req, res, next) => {
  try {
    const result = await userService.followUser(
      req.params.userId,
      req.params.targetUserId
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId/follow/:targetUserId', async (req, res, next) => {
  try {
    const result = await userService.unfollowUser(
      req.params.userId,
      req.params.targetUserId
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
