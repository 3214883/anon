import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { In } from 'typeorm';

const userRepository = dataSource.getRepository(User);
const eventRepository = dataSource.getRepository(Event);

// 获取用户列表
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $like: `%${search}%` } },
        { email: { $like: `%${search}%` } },
        { phone: { $like: `%${search}%` } }
      ];
    }
    
    const [users, total] = await userRepository.findAndCount({
      where: query,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { createdAt: 'DESC' }
    });
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取单个用户详情
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 创建新用户
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, phone, password, role = 'user', isActive = true } = req.body;
    
    const existingUser = await userRepository.findOne({
      where: [{ email }, { phone }]
    });
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const newUser = userRepository.create({
      username,
      email,
      phone: phone || null,
      password,
      role,
      isActive
    });
    
    await userRepository.save(newUser);
    
    res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 更新用户信息
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, phone, password, role, isActive } = req.body;
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (email && email !== user.email) {
      const existingUser = await userRepository.findOne({
        where: { email }
      });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }
    
    if (phone && phone !== user.phone) {
      const existingUser = await userRepository.findOne({
        where: { phone }
      });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Phone number already in use' });
      }
    }
    
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.password = password;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    await userRepository.save(user);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 删除用户
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin user' });
    }
    
    await userRepository.delete(Number(id));
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 批量删除用户
export const batchDeleteUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid user IDs' });
    }
    
    const users = await userRepository.find({
      where: { id: In(ids) }
    });
    
    const adminExists = users.some(user => user.role === 'admin');
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Cannot delete admin users' });
    }
    
    await userRepository.delete(ids);
    
    res.json({
      success: true,
      message: `Deleted ${ids.length} users successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== 活动管理接口 ====================

// 获取活动列表
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 100, search = '', status } = req.query;
    
    const where: any = {};
    if (search) {
      where.title = { $like: `%${search}%` };
    }
    if (status) {
      where.status = status;
    }
    
    const [events, total] = await eventRepository.findAndCount({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { createdAt: 'DESC' }
    });
    
    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取活动列表错误:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取单个活动详情
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const event = await eventRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 更新活动信息
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, description, date, startTime, endTime, 
      location, address, category, capacity, price, 
      coverImage, tags, status, isSponsored 
    } = req.body;
    
    const event = await eventRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (location) event.location = location;
    if (address) event.address = address;
    if (category) event.category = category;
    if (capacity) event.capacity = capacity;
    if (price !== undefined) event.price = price;
    if (coverImage) event.coverImage = coverImage;
    if (tags) event.tags = tags;
    if (status) event.status = status;
    if (isSponsored !== undefined) event.isSponsored = isSponsored;
    
    await eventRepository.save(event);
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('更新活动错误:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 删除活动
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const event = await eventRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    await eventRepository.delete(Number(id));
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
