import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { EventLike } from '../models/EventLike';
import { Favorite } from '../models/Favorite';
import { Comment } from '../models/Comment';
import { Friend } from '../models/Friend';

const eventLikeRepository = dataSource.getRepository(EventLike);
const favoriteRepository = dataSource.getRepository(Favorite);
const commentRepository = dataSource.getRepository(Comment);
const friendRepository = dataSource.getRepository(Friend);

export const likeEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.body;
    
    // Check if already liked
    const existingLike = await eventLikeRepository.findOne({
      where: { userId, eventId }
    });
    
    if (existingLike) {
      // Unlike if already liked
      await eventLikeRepository.delete(existingLike.id);
      return res.json({
        success: true,
        message: 'Event unliked successfully'
      });
    }
    
    // Create like
    const like = eventLikeRepository.create({
      userId,
      eventId
    });
    
    await eventLikeRepository.save(like);
    
    res.json({
      success: true,
      message: 'Event liked successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const favoriteEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.body;
    
    // Check if already favorited
    const existingFavorite = await favoriteRepository.findOne({
      where: { userId, eventId }
    });
    
    if (existingFavorite) {
      // Remove favorite if already favorited
      await favoriteRepository.delete(existingFavorite.id);
      return res.json({
        success: true,
        message: 'Event removed from favorites'
      });
    }
    
    // Create favorite
    const favorite = favoriteRepository.create({
      userId,
      eventId
    });
    
    await favoriteRepository.save(favorite);
    
    res.json({
      success: true,
      message: 'Event added to favorites'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId, content, parentId } = req.body;
    
    const comment = commentRepository.create({
      userId,
      eventId,
      content,
      parentId: parentId || null
    });
    
    await commentRepository.save(comment);
    
    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    const comments = await commentRepository.find({
      where: { eventId: Number(eventId), parentId: undefined },
      relations: ['user', 'replies', 'replies.user'],
      order: { createdAt: 'ASC' }
    });
    
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { commentId } = req.params;
    
    const comment = await commentRepository.findOne({
      where: { id: Number(commentId) }
    });
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    
    if (comment.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    
    await commentRepository.delete(commentId);
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { friendId } = req.body;
    
    // Check if already friends or request pending
    const existingFriendship = await friendRepository.findOne({
      where: [
        { userId, friendId, status: 'accepted' },
        { userId: friendId, friendId: userId, status: 'accepted' },
        { userId, friendId, status: 'pending' }
      ]
    });
    
    if (existingFriendship) {
      return res.status(400).json({ success: false, message: 'Friend request already sent or you are already friends' });
    }
    
    const friendRequest = friendRepository.create({
      userId,
      friendId,
      status: 'pending'
    });
    
    await friendRepository.save(friendRequest);
    
    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { requestId } = req.params;
    
    const request = await friendRepository.findOne({
      where: { id: Number(requestId), friendId: userId, status: 'pending' }
    });
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }
    
    request.status = 'accepted';
    await friendRepository.save(request);
    
    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const friendships = await friendRepository.find({
      where: [
        { userId, status: 'accepted' },
        { friendId: userId, status: 'accepted' }
      ],
      relations: ['user', 'friend']
    });
    
    const friends = friendships.map(friendship => {
      return friendship.userId === userId ? friendship.friend : friendship.user;
    });
    
    res.json({
      success: true,
      data: friends
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
