import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { Favorite } from '../models/Favorite';
import { Event } from '../models/Event';

const favoriteRepository = dataSource.getRepository(Favorite);
const eventRepository = dataSource.getRepository(Event);

// 添加收藏
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.body;
    
    // 检查事件是否存在
    const event = await eventRepository.findOne({
      where: { id: eventId }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // 检查是否已经收藏
    const existingFavorite = await favoriteRepository.findOne({
      where: { userId, eventId }
    });
    
    if (existingFavorite) {
      return res.status(400).json({ success: false, message: 'Event already favorited' });
    }
    
    // 创建收藏
    const favorite = favoriteRepository.create({
      userId,
      eventId
    });
    
    await favoriteRepository.save(favorite);
    
    // 更新事件的收藏数
    event.favoriteCount += 1;
    await eventRepository.save(event);
    
    res.status(201).json({
      success: true,
      message: 'Event favorited successfully',
      data: favorite
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 取消收藏
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;
    
    // 查找收藏
    const favorite = await favoriteRepository.findOne({
      where: { userId, eventId: Number(eventId) }
    });
    
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }
    
    // 删除收藏
    await favoriteRepository.remove(favorite);
    
    // 更新事件的收藏数
    const event = await eventRepository.findOne({
      where: { id: Number(eventId) }
    });
    
    if (event) {
      event.favoriteCount = Math.max(0, event.favoriteCount - 1);
      await eventRepository.save(event);
    }
    
    res.json({
      success: true,
      message: 'Favorite removed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取用户的收藏列表
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const favorites = await favoriteRepository.find({
      where: { userId },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });
    
    // 提取事件信息
    const events = favorites.map(favorite => favorite.event);
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 检查用户是否已收藏事件
export const checkFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;
    
    const favorite = await favoriteRepository.findOne({
      where: { userId, eventId: Number(eventId) }
    });
    
    res.json({
      success: true,
      data: {
        isFavorited: !!favorite
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};