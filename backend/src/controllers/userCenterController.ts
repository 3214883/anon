﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { Request, Response } from 'express';
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

export const getMyLikes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const likes = await eventLikeRepository.find({
      where: { userId },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });

    const result = likes.map(like => ({
      id: like.eventId,
      eventId: like.eventId,
      title: like.event?.title || '',
      coverImage: like.event?.coverImage || '',
      date: like.event?.date ? like.event.date.toISOString().split('T')[0] : '',
      location: like.event?.location || '',
      category: like.event?.category || '',
      likeCount: like.event?.likeCount || 0,
      likedAt: like.createdAt.toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting my likes:', error);
    res.status(500).json({ success: false, message: '获取点赞列表失败' });
  }
};

export const getMyFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const favorites = await favoriteRepository.find({
      where: { userId },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });

    const result = favorites.map(fav => ({
      id: fav.eventId,
      eventId: fav.eventId,
      title: fav.event?.title || '',
      coverImage: fav.event?.coverImage || '',
      date: fav.event?.date ? fav.event.date.toISOString().split('T')[0] : '',
      location: fav.event?.location || '',
      category: fav.event?.category || '',
      price: fav.event?.price || 0,
      favoriteCount: fav.event?.favoriteCount || 0,
      favoritedAt: fav.createdAt.toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting my favorites:', error);
    res.status(500).json({ success: false, message: '获取收藏列表失败' });
  }
};

export const getMyComments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    console.log('获取用户评论, userId:', userId);
    const comments = await commentRepository.find({
      where: { userId, isDeleted: false, parentId: null },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });
    console.log('查询到评论数量:', comments.length);

    const result = comments.map(comment => {
      const date = new Date(comment.createdAt);
      const formattedTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      return {
        id: comment.eventId,
        eventId: comment.eventId,
        eventTitle: comment.event?.title || '',
        coverImage: comment.event?.coverImage || '',
        content: comment.content,
        likeCount: comment.likeCount,
        replyCount: 0,
        commentedAt: formattedTime,
        isLiked: false
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取评论列表详细错误:', error);
    res.status(500).json({ success: false, message: '获取评论列表失败', error: (error as any).message });
  }
};

export const getMyRatings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const ratings = await ratingRepository.find({
      where: { userId },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });

    const result = ratings.map(rating => ({
      id: rating.eventId,
      eventId: rating.eventId,
      title: rating.event?.title || '',
      coverImage: rating.event?.coverImage || '',
      rating: rating.score,
      content: rating.content || '',
      ratedAt: rating.createdAt.toISOString().split('T')[0],
      eventDate: rating.event?.date ? rating.event.date.toISOString().split('T')[0] : ''
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting my ratings:', error);
    res.status(500).json({ success: false, message: '获取评分列表失败' });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    console.log('=== getUserStats called ===')
    const userId = (req as any).userId;
    console.log('User ID from request:', userId)
    
    if (userId === undefined || userId === null) {
      console.log('User ID is undefined or null')
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const [likeCount, favoriteCount, commentCount, ratingCount] = await Promise.all([
      eventLikeRepository.count({ where: { userId } }),
      favoriteRepository.count({ where: { userId } }),
      commentRepository.count({ where: { userId, isDeleted: false } }),
      ratingRepository.count({ where: { userId } })
    ]);

    console.log('Stats counts:', { likeCount, favoriteCount, commentCount, ratingCount })

    res.json({
      success: true,
      data: {
        likes: likeCount,
        favorites: favoriteCount,
        comments: commentCount,
        ratings: ratingCount
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ success: false, message: '获取用户统计失败' });
  }
};

