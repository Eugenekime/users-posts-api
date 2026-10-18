import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface UpdateUserInput {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
}

export async function listUsers(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().select('-password').skip(skip).limit(limit).lean(),
    User.countDocuments(),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId)
    .select('-password')
    .populate('followers', 'username firstName lastName avatar')
    .populate('following', 'username firstName lastName avatar');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function createUser(input: CreateUserInput) {
  const user = new User(input);

  await user.save();

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    createdAt: user.createdAt,
  };
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: input },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function followUser(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new Error('You cannot follow yourself');
  }

  const [user, targetUser] = await Promise.all([
    User.findById(userId),
    User.findById(targetUserId),
  ]);

  if (!user || !targetUser) {
    throw new AppError('User not found', 404);
  }

  if (!user.following.some((id) => id.equals(targetUser._id))) {
    user.following.push(targetUser._id);
  }

  if (!targetUser.followers.some((id) => id.equals(user._id))) {
    targetUser.followers.push(user._id);
  }

  await Promise.all([user.save(), targetUser.save()]);

  return {
    following: user.following,
    followersCount: targetUser.followers.length,
  };
}

export async function unfollowUser(userId: string, targetUserId: string) {
  const [user, targetUser] = await Promise.all([
    User.findById(userId),
    User.findById(targetUserId),
  ]);

  if (!user || !targetUser) {
    throw new AppError('User not found', 404);
  }
  user.following = user.following.filter((id) => !id.equals(targetUser._id));

  targetUser.followers = targetUser.followers.filter(
    (id) => !id.equals(user._id)
  );

  await Promise.all([user.save(), targetUser.save()]);

  return {
    following: user.following,
    followersCount: targetUser.followers.length,
  };
}

export async function getFollowers(userId: string, page = 1, limit = 10) {
  const userExists = await User.exists({ _id: userId });

  if (!userExists) {
    throw new AppError('User not found', 404);
  }

  const [followers, total] = await Promise.all([
    User.find({ following: userId })
      .select('username firstName lastName avatar')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    User.countDocuments({ following: userId }),
  ]);

  return {
    followers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function searchUsers(query: string, page = 1, limit = 10) {
  const search = query.trim();

  if (!search) {
    return {
      users: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const filter = {
    $or: [
      { username: regex },
      { firstName: regex },
      { lastName: regex },
      { email: regex },
    ],
  };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
