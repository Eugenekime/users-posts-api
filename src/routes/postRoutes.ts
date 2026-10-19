import { Router } from 'express';
import * as postService from '../services/postService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const author = req.query.author?.toString();
    const query = req.query.query?.toString();

    const result = await postService.listPosts(page, limit, author, query);

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

    const result = await postService.searchPosts(query, page, limit);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/trending', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const result = await postService.getTrendingPosts(limit);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/author/:authorId', async (req, res, next) => {
  try {
    const result = await postService.getPostsByAuthor(
      req.params.authorId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 10
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:postId', async (req, res, next) => {
  try {
    const post = await postService.getPostById(req.params.postId);

    res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, content, published, authorId } = req.body;

    if (!authorId) {
      throw new AppError('AuthorId field not provided', 400);
    }
    if (typeof title !== 'string' || !title.trim()) {
      throw new AppError('Title is required and must be a string', 400);
    }

    if (typeof content !== 'string' || !content.trim()) {
      throw new AppError('Content is required and must be a string', 400);
    }

    if (published !== undefined && typeof published !== 'boolean') {
      throw new AppError('Published must be a boolean', 400);
    }
    const input: {
      title: string;
      content: string;
      published?: boolean;
    } = {
      title: title.trim(),
      content: content.trim(),
    };

    if (published !== undefined) {
      input.published = published;
    }
    const post = await postService.createPost(authorId, input);

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
});

router.patch('/:postId', async (req, res, next) => {
  try {
    const { userId, ...input } = req.body;

    const post = await postService.updatePost(req.params.postId, userId, input);

    res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
});

router.delete('/:postId', async (req, res, next) => {
  try {
    const result = await postService.deletePost(
      req.params.postId,
      req.body.userId
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:postId/comments', async (req, res, next) => {
  try {
    const post = await postService.addComment(
      req.params.postId,
      req.body.userId,
      req.body.content
    );

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
});

router.post('/:postId/like', async (req, res, next) => {
  try {
    const post = await postService.toggleLike(
      req.params.postId,
      req.body.userId
    );

    res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
});

export default router;
