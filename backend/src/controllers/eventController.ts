import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { Category } from '../models/Category';

const eventRepository = dataSource.getRepository(Event);
const registrationRepository = dataSource.getRepository(Registration);
const userRepository = dataSource.getRepository(User);
const categoryRepository = dataSource.getRepository(Category);

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { category, page = 1, limit = 8 } = req.query;
    
    const query = eventRepository.createQueryBuilder('event')
      .where('event.status = :status', { status: 'published' });
    
    if (category && category !== 'all') {
      // 前端可能传分类ID（数字）或者分类名称
      const categoryId = parseInt(category as string);
      
      if (!isNaN(categoryId)) {
        // 如果是数字，按照categoryId查询
        query.andWhere('event.categoryId = :categoryId', { categoryId });
      } else {
        // 如果是字符串，按照category名称查询
        query.andWhere('event.category = :category', { category });
      }
    }
    
    const [events, total] = await query
      .orderBy('event.createdAt', 'DESC')
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .getManyAndCount();
    
    // Update registeredCount and add waitlist for each event
    const eventsWithData = await Promise.all(events.map(async (event) => {
      const count = await registrationRepository.count({
        where: { eventId: event.id, status: 'approved' }
      });
      event.registeredCount = count;
      
      // Add waitlist info
      const waitlist = await registrationRepository.find({
        where: { eventId: event.id, isWaitlist: true, status: 'pending' },
        order: { createdAt: 'ASC' },
        relations: ['user']
      });
      (event as any).waitlist = waitlist.map((reg: any) => ({
        userId: reg.userId,
        username: reg.user?.username,
        position: waitlist.findIndex((w) => w.id === reg.id) + 1,
        createdAt: reg.createdAt
      }));
      
      return event;
    }));
    
    res.json({
      success: true,
      data: eventsWithData,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const event = await eventRepository.findOne({
      where: { id: Number(id) },
      relations: ['organizer']
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // Update view count
    event.viewCount += 1;
    await eventRepository.save(event);
    
    // Get registered count
    const registeredCount = await registrationRepository.count({
      where: { eventId: event.id, status: 'approved' }
    });
    event.registeredCount = registeredCount;
    
    // Add waitlist info
    const waitlist = await registrationRepository.find({
      where: { eventId: event.id, isWaitlist: true, status: 'pending' },
      order: { createdAt: 'ASC' },
      relations: ['user']
    });
    (event as any).waitlist = waitlist.map((reg: any) => ({
      userId: reg.userId,
      username: reg.user?.username,
      position: waitlist.findIndex((w) => w.id === reg.id) + 1,
      createdAt: reg.createdAt
    }));
    
    // Get organizer info
    if (event.organizerId) {
      const organizer = await userRepository.findOne({
        where: { id: event.organizerId }
      });
      if (organizer) {
        (event as any).organizer = {
          id: organizer.id,
          username: organizer.username,
          avatar: organizer.avatar
        };
      }
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    console.log('Received createEvent request:', req.body);
    const userId = (req as any).userId;
    console.log('User ID:', userId);
    const { title, description, date, startTime, endTime, location, address, capacity, price, coverImage, category, categoryId, tags } = req.body;
    
    console.log('Event data:', {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      address,
      capacity,
      price,
      coverImage,
      category,
      categoryId,
      tags,
      status: 'published',
      organizerId: userId
    });
    
    const newEvent = eventRepository.create({
      title,
      description,
      date: new Date(date),
      startTime,
      endTime,
      location,
      address,
      capacity,
      price,
      coverImage,
      category,
      categoryId,
      tags,
      status: 'pending',
      organizerId: userId || 0
    });
    
    console.log('Creating event...');
    await eventRepository.save(newEvent);
    console.log('Event created successfully:', newEvent);
    
    res.status(201).json({
      success: true,
      data: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { title, description, date, startTime, endTime, location, address, capacity, price, coverImage, category, tags, status } = req.body;
    
    const event = await eventRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // Check if user is the organizer
    if (event.organizerId !== userId) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    
    // Update event
    if (title) event.title = title;
    if (description) event.description = description;
    if (date !== undefined) event.date = new Date(date);
    if (startTime !== undefined) event.startTime = startTime;
    if (endTime !== undefined) event.endTime = endTime;
    if (location !== undefined) event.location = location;
    if (address) event.address = address;
    if (capacity) event.capacity = capacity;
    if (price) event.price = price;
    if (coverImage) event.coverImage = coverImage;
    if (category) event.category = category;
    if (tags) event.tags = tags;
    if (status) event.status = status;
    
    await eventRepository.save(event);
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    const event = await eventRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // Check if user is the organizer
    if (event.organizerId !== userId) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    
    await eventRepository.delete(id);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getParticipants = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    
    const event = await eventRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // Check if user is the organizer
    if (event.organizerId !== userId) {
      return res.status(403).json({ success: false, message: '只有活动举办者才能查看报名名单' });
    }
    
    const participants = await registrationRepository.find({
      where: { eventId: Number(id) },
      order: { isWaitlist: 'ASC', createdAt: 'DESC' },
      relations: ['user']
    });
    
    res.json({
      success: true,
      data: participants.map(reg => ({
        id: reg.id,
        contactName: reg.contactName || reg.user?.username || '未填写',
        contactPhone: reg.contactPhone || '未填写',
        ticketId: reg.ticketId,
        ticketStatus: reg.ticketStatus,
        checkInTime: reg.checkInTime,
        paymentId: reg.paymentId,
        isWaitlist: reg.isWaitlist,
        waitlistPosition: reg.waitlistPosition,
        status: reg.status,
        createdAt: reg.createdAt,
        user: reg.user ? {
          id: reg.user.id,
          username: reg.user.username
        } : null
      }))
    });
  } catch (error) {
    console.error('Error getting participants:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const searchEvents = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    
    const events = await eventRepository.createQueryBuilder('event')
      .where('event.status = :status', { status: 'published' })
      .andWhere('event.title LIKE :keyword OR event.description LIKE :keyword OR event.location LIKE :keyword', {
        keyword: `%${keyword}%`
      })
      .orderBy('event.createdAt', 'DESC')
      .getMany();
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Admin-only routes
export const getPendingEvents = async (req: Request, res: Response) => {
  try {
    const events = await eventRepository.find({
      where: { status: 'pending' },
      relations: ['organizer'],
      order: { createdAt: 'ASC' }
    });
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const approveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const event = await eventRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    event.status = 'published';
    await eventRepository.save(event);
    
    res.json({
      success: true,
      data: event,
      message: 'Event approved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const rejectEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const event = await eventRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    event.status = 'rejected';
    await eventRepository.save(event);
    
    res.json({
      success: true,
      data: event,
      message: 'Event rejected successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getOrganizerEvents = async (req: Request, res: Response) => {
  try {
    const { organizerId } = req.params;
    
    const events = await eventRepository.find({
      where: { organizerId: Number(organizerId), status: 'published' },
      order: { createdAt: 'DESC' }
    });
    
    // Update registeredCount for each event
    const eventsWithData = await Promise.all(events.map(async (event) => {
      const count = await registrationRepository.count({
        where: { eventId: event.id, status: 'approved' }
      });
      event.registeredCount = count;
      return event;
    }));
    
    res.json({
      success: true,
      data: eventsWithData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取分类列表
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取近期活动（未来3天内）
export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];
    
    const events = await eventRepository.createQueryBuilder('event')
      .where('event.status = :status', { status: 'published' })
      .andWhere('event.date >= :today', { today: todayStr })
      .andWhere('event.date <= :threeDaysLater', { threeDaysLater: threeDaysLaterStr })
      .orderBy('event.date', 'ASC')
      .addOrderBy('event.startTime', 'ASC')
      .getMany();
    
    // 更新报名人数
    const eventsWithData = await Promise.all(events.map(async (event) => {
      const count = await registrationRepository.count({
        where: { eventId: event.id, status: 'approved' }
      });
      event.registeredCount = count;
      return event;
    }));
    
    res.json({
      success: true,
      data: eventsWithData
    });
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
