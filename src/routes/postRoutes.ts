import { Router } from 'express';
import * as postService from '../services/postService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const published =
      req.query.published === undefined
        ? undefined
        : req.query.published === 'true';

    const author = req.query.author?.toString();
    const query = req.query.query?.toString();

    const result = await postService.listPosts(
      page,
      limit,
      published,
      author,
      query
    );

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
    const { authorId, ...input } = req.body;

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
