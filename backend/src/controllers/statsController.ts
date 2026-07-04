import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { Registration } from '../models/Registration';
import { Payment } from '../models/Payment';
import { MoreThanOrEqual } from 'typeorm';

const eventRepository = dataSource.getRepository(Event);
const userRepository = dataSource.getRepository(User);
const registrationRepository = dataSource.getRepository(Registration);
const paymentRepository = dataSource.getRepository(Payment);

// 获取系统概览统计
export const getSystemOverview = async (req: Request, res: Response) => {
  try {
    // 统计活动数量
    const totalEvents = await eventRepository.count();
    const publishedEvents = await eventRepository.count({
      where: { status: 'published' }
    });
    const pendingEvents = await eventRepository.count({
      where: { status: 'pending' }
    });
    
    // 统计用户数量
    const totalUsers = await userRepository.count();
    const activeUsers = await userRepository.count({
      where: { isActive: true }
    });
    
    // 统计报名数量
    const totalRegistrations = await registrationRepository.count();
    const approvedRegistrations = await registrationRepository.count({
      where: { status: 'approved' }
    });
    
    // 统计支付金额
    const payments = await paymentRepository.find({
      where: { status: 'completed' }
    });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    res.json({
      success: true,
      data: {
        events: {
          total: totalEvents,
          published: publishedEvents,
          pending: pendingEvents
        },
        users: {
          total: totalUsers,
          active: activeUsers
        },
        registrations: {
          total: totalRegistrations,
          approved: approvedRegistrations
        },
        revenue: totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取活动分类统计
export const getEventCategoryStats = async (req: Request, res: Response) => {
  try {
    const events = await eventRepository.find({
      where: { status: 'published' }
    });
    
    // 按分类统计
    const categoryStats = events.reduce((acc, event) => {
      const category = event.category || '未分类';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category]++;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      data: categoryStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取最近活动统计
export const getRecentEventsStats = async (req: Request, res: Response) => {
  try {
    // 获取最近7天的活动
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentEvents = await eventRepository.find({
      where: {
        status: 'published',
        createdAt: MoreThanOrEqual(sevenDaysAgo)
      },
      order: { createdAt: 'ASC' }
    });
    
    // 按日期统计
    const dailyStats = recentEvents.reduce((acc, event) => {
      const date = event.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      data: dailyStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};