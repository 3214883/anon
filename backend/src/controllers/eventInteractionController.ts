﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { EventLike } from '../models/EventLike';
import { Favorite } from '../models/Favorite';
import { Comment } from '../models/Comment';
import { Rating } from '../models/Rating';
import { Event } from '../models/Event';

const eventLikeRepository = dataSource.getRepository(EventLike);
const favoriteRepository = dataSource.getRepository(Favorite);
const commentRepository = dataSource.getRepository(Comment);
const ratingRepository = dataSource.getRepository(Rating);
const eventRepository = dataSource.getRepository(Event);

export const toggleLike = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const existingLike = await eventLikeRepository.findOne({
      where: { userId, eventId: Number(eventId) }
    });

    if (existingLike) {
      await eventLikeRepository.remove(existingLike);
      const event = await eventRepository.findOne({ where: { id: Number(eventId) } });
      if (event) {
        event.likeCount = Math.max(0, (event.likeCount || 0) - 1);
        await eventRepository.save(event);
      }
      res.json({ success: true, data: { liked: false, likeCount: event?.likeCount || 0 } });
    } else {
      await eventLikeRepository.save({ userId: Number(userId), eventId: Number(eventId) });
      const event = await eventRepository.findOne({ where: { id: Number(eventId) } });
      if (event) {
        event.likeCount = (event.likeCount || 0) + 1;
        await eventRepository.save(event);
      }
      res.json({ success: true, data: { liked: true, likeCount: event?.likeCount || 0 } });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
};

export const checkLikeStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;

    if (userId === undefined || userId === null) {
      return res.json({ success: true, data: { liked: false } });
    }

    const existingLike = await eventLikeRepository.findOne({
      where: { userId, eventId: Number(eventId) }
    });

    res.json({
      success: true,
      data: { liked: !!existingLike }
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ success: false, message: '获取状态失败' });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const existingFavorite = await favoriteRepository.findOne({
      where: { userId, eventId: Number(eventId) }
    });

    if (existingFavorite) {
      await favoriteRepository.remove(existingFavorite);
      const event = await eventRepository.findOne({ where: { id: Number(eventId) } });
      if (event) {
        event.favoriteCount = Math.max(0, (event.favoriteCount || 0) - 1);
        await eventRepository.save(event);
      }
      res.json({ success: true, data: { favorited: false, favoriteCount: event?.favoriteCount || 0 } });
    } else {
      await favoriteRepository.save({ userId: Number(userId), eventId: Number(eventId) });
      const event = await eventRepository.findOne({ where: { id: Number(eventId) } });
      if (event) {
        event.favoriteCount = (event.favoriteCount || 0) + 1;
        await eventRepository.save(event);
      }
      res.json({ success: true, data: { favorited: true, favoriteCount: event?.favoriteCount || 0 } });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
};

export const checkFavoriteStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;

    if (userId === undefined || userId === null) {
      return res.json({ success: true, data: { favorited: false } });
    }

    const existingFavorite = await favoriteRepository.findOne({
      where: { userId, eventId: Number(eventId) }
    });

    res.json({
      success: true,
      data: { favorited: !!existingFavorite }
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ success: false, message: '获取状态失败' });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;
    const { content, parentId = null } = req.body;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    console.log('创建评论数据:', { userId, eventId, content, parentId });

    const commentData = {
      userId: Number(userId),
      eventId: Number(eventId),
      content: content.trim(),
      parentId: parentId || null
    };

    const result = await commentRepository.save(commentData);
    const comment = { ...commentData, id: result.id, createdAt: new Date() };

    const event = await eventRepository.findOne({ where: { id: Number(eventId) } });
    if (event) {
      event.commentCount = (event.commentCount || 0) + 1;
      await eventRepository.save(event);
    }

    res.json({
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt
      }
    });
  } catch (error) {
    console.error('创建评论详细错误:', error);
    res.status(500).json({ success: false, message: '评论失败', error: (error as any).message });
  }
};

export const getEventComments = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const comments = await commentRepository.find({
      where: { eventId: Number(eventId), isDeleted: false, parentId: null },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    console.log('查询到主评论数量:', comments.length);

    const result = await Promise.all(comments.map(async (comment) => {
      const replies = await commentRepository.find({
        where: { eventId: Number(eventId), isDeleted: false, parentId: comment.id },
        relations: ['user'],
        order: { createdAt: 'ASC' }
      });

      return {
        id: comment.id,
        content: comment.content,
        likeCount: comment.likeCount,
        createdAt: comment.createdAt,
        isLiked: false,
        user: {
          id: comment.user.id,
          username: comment.user.username || '匿名用户',
          avatar: comment.user.avatar || ''
        },
        replies: replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          likeCount: reply.likeCount,
          createdAt: reply.createdAt,
          user: {
            id: reply.user?.id,
            username: reply.user?.username || '匿名用户',
            avatar: reply.user?.avatar || ''
          }
        }))
      };
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取评论详细错误:', error);
    res.status(500).json({ success: false, message: '获取评论失败', error: (error as any).message });
  }
};

export const submitRating = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;
    const { score, content = '' } = req.body;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: '评分必须在1-5之间' });
    }

    const existingRating = await ratingRepository.findOne({
      where: { userId, eventId: Number(eventId) }
    });

    if (existingRating) {
      existingRating.score = score;
      existingRating.content = content || '';
      await ratingRepository.save(existingRating);
      res.json({ success: true, data: { updated: true, rating: existingRating } });
    } else {
      const ratingData = {
        userId: Number(userId),
        eventId: Number(eventId),
        score,
        content: content || ''
      };
      const rating = await ratingRepository.save(ratingData);
      res.json({ success: true, data: { created: true, rating } });
    }
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ success: false, message: '评分失败' });
  }
};

export const checkRatingStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;

    if (userId === undefined || userId === null) {
      return res.json({ success: true, data: { rated: false, score: 0, content: '' } });
    }

    const existingRating = await ratingRepository.findOne({
      where: { userId, eventId: Number(eventId) }
    });

    res.json({
      success: true,
      data: existingRating
        ? { rated: true, score: existingRating.score, content: existingRating.content }
        : { rated: false, score: 0, content: '' }
    });
  } catch (error) {
    console.error('Error checking rating status:', error);
    res.status(500).json({ success: false, message: '获取状态失败' });
  }
};

export const likeComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { commentId } = req.params;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const comment = await commentRepository.findOne({
      where: { id: Number(commentId) }
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    comment.likeCount = (comment.likeCount || 0) + 1;
    await commentRepository.save(comment);

    res.json({
      success: true,
      data: {
        liked: true,
        likeCount: comment.likeCount
      }
    });
  } catch (error) {
    console.error('评论点赞错误:', error);
    res.status(500).json({ success: false, message: '点赞失败', error: (error as any).message });
  }
};

