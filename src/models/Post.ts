import mongoose from 'mongoose';
export interface IPost {
  author: mongoose.Types.ObjectId;
  title: string;
  content: string;
  excerpt: string;
  published: boolean;
  publishedAt: Date | null;
  likes: mongoose.Types.ObjectId[];
  comments: {
    author: mongoose.Types.ObjectId;
    content: string;
    createdAt?: Date;
    updatedAt?: Date;
  }[];
  views: number;
}

export interface PostMethods {
  generateExcerpt(length?: number): string;

  addComment(authorId: mongoose.Types.ObjectId, content: string): Promise<any>;

  toggleLike(userId: mongoose.Types.ObjectId): Promise<any>;
}

export interface PostStatics {
  findByAuthor(authorId: mongoose.Types.ObjectId): mongoose.Query<any, any>;
  findPopular(limit?: number): mongoose.Query<any, any>;
}

const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const PostSchema = new mongoose.Schema<
  IPost,
  mongoose.Model<IPost, {}, PostMethods> & PostStatics,
  PostMethods
>(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },

    excerpt: {
      type: String,
      default: '',
    },

    published: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    comments: {
      type: [CommentSchema],
      default: [],
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PostSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

PostSchema.virtual('commentsCount').get(function () {
  return this.comments.length;
});

PostSchema.virtual('readingTime').get(function () {
  const words = this.content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
});

PostSchema.methods.generateExcerpt = function (length = 160): string {
  const text = this.content.trim();

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trimEnd()}...`;
};

PostSchema.methods.addComment = function (
  authorId: mongoose.Types.ObjectId,
  content: string
) {
  this.comments.push({
    author: authorId,
    content,
  });

  return this.save();
};

PostSchema.methods.toggleLike = function (userId: mongoose.Types.ObjectId) {
  const index = this.likes.findIndex((id: mongoose.Types.ObjectId) =>
    id.equals(userId)
  );

  if (index === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(index, 1);
  }

  return this.save();
};

PostSchema.pre('save', function () {
  if (this.isModified('content')) {
    this.excerpt = this.generateExcerpt();
  }

  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (!this.published) {
    this.publishedAt = null;
  }
});

PostSchema.statics.findByAuthor = function (authorId: mongoose.Types.ObjectId) {
  return this.find({ author: authorId });
};

PostSchema.statics.findPopular = function (limit = 10) {
  return this.aggregate([
    {
      $match: { published: true },
    },
    {
      $addFields: {
        likesCount: { $size: '$likes' },
      },
    },
    {
      $sort: {
        likesCount: -1,
        views: -1,
        publishedAt: -1,
      },
    },
    {
      $limit: limit,
    },
  ]);
};

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ published: 1, publishedAt: -1 });
PostSchema.index({ title: 'text', content: 'text' });

export const Post = mongoose.model<
  IPost,
  mongoose.Model<IPost, {}, PostMethods> & PostStatics
>('Post', PostSchema);
