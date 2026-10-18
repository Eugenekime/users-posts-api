import mongoose, { type QueryFilter } from 'mongoose';
import { Post } from '../models/Post.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listPosts(
  page = 1,
  limit = 10,
  published?: boolean,
  author?: string,
  query?: string
) {
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('Page must be a positive integer', 400);
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('Limit must be a positive integer', 400);
  }
  const skip = (page - 1) * limit;
  const search = query?.trim();

  const filter: QueryFilter<mongoose.Document> = {};

  if (published !== undefined) {
    filter.published = published;
  }

  if (author !== undefined) {
    filter.author = author;
  }

  if (search) {
    const regex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );

    filter.$or = [{ title: regex }, { content: regex }];
  }

  const [posts, total] = await Promise.all([
    Post.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),

    Post.countDocuments(filter),
  ]);

  return {
    posts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPostById(postId: string) {
  const post = await Post.findByIdAndUpdate(
    postId,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  return post;
}

export async function createPost(
  authorId: string,
  input: { title: string; content: string; published?: boolean }
) {
  if (!authorId) {
    throw new AppError('Author ID is required', 400);
  }
  const post = new Post({
    ...input,
    author: authorId,
  });

  await post.save();
  return post;
}

export async function updatePost(
  postId: string,
  userId: string,
  input: { title?: string; content?: string; published?: boolean }
) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  if (post.author.toString() !== userId) {
    throw new AppError('Not authorized to update this post', 403);
  }

  if (input.title !== undefined) {
    post.title = input.title;
  }

  if (input.content !== undefined) {
    post.content = input.content;
  }

  if (input.published !== undefined) {
    post.published = input.published;
  }

  await post.save();

  return post;
}

export async function deletePost(postId: string, userId: string) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  if (post.author.toString() !== userId) {
    throw new AppError('Not authorized to delete this post', 403);
  }

  await post.deleteOne();
  return { success: true, message: 'Post deleted successfully' };
}

export async function addComment(
  postId: string,
  userId: string,
  content: string
) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  if (!content?.trim()) {
    throw new AppError('Comment content is required', 400);
  }
  await post.addComment(new mongoose.Types.ObjectId(userId), content);
  return post;
}

export async function toggleLike(postId: string, userId: string) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }
  await post.toggleLike(new mongoose.Types.ObjectId(userId));
  return post;
}
export async function getPostsByAuthor(authorId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('Page must be a positive integer', 400);
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('Limit must be a positive integer', 400);
  }

  const [posts, total] = await Promise.all([
    Post.findByAuthor(new mongoose.Types.ObjectId(authorId))
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),

    Post.countDocuments({
      author: new mongoose.Types.ObjectId(authorId),
    }),
  ]);

  return {
    posts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function searchPosts(query: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const search = query?.trim();

  if (!search) {
    throw new AppError('Search query is required', 400);
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('Page must be a positive integer', 400);
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('Limit must be a positive integer', 400);
  }

  const filter: QueryFilter<mongoose.Document> = {};
  if (!search) {
    throw new Error('Search query is required');
  }
  if (search) {
    const regex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );

    filter.$or = [{ title: regex }, { content: regex }];
  }

  const [posts, total] = await Promise.all([
    Post.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),

    Post.countDocuments(filter),
  ]);

  return {
    posts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTrendingPosts(limit = 10) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('Limit must be a positive integer', 400);
  }
  const [posts, total] = await Promise.all([
    Post.findPopular(limit),
    Post.countDocuments({ published: true }),
  ]);

  return {
    posts,
    total,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
