import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { Ticket } from '../models/Ticket';
import { Checkin } from '../models/Checkin';
import { Payment } from '../models/Payment';
import { sendNotification } from '../services/notificationService';
import { generateQRCodeBase64 } from '../utils/qrcodeGenerator';
import { v4 as uuidv4 } from 'uuid';

const registrationRepository = dataSource.getRepository(Registration);
const eventRepository = dataSource.getRepository(Event);
const ticketRepository = dataSource.getRepository(Ticket);
const checkinRepository = dataSource.getRepository(Checkin);
const paymentRepository = dataSource.getRepository(Payment);

export const registerEvent = async (req: Request, res: Response) => {
  try {
    console.log('Received registration request:', req.body);
    
    const userId = (req as any).userId;
    console.log('User ID:', userId);
    
    const { eventId, quantity, contactName, contactPhone } = req.body;
    
    // Validate required fields
    console.log('Validating fields:', { eventId, quantity, contactName, contactPhone });
    if (eventId === undefined || eventId === null || quantity === undefined || quantity === null || !contactName || !contactPhone) {
      console.log('Missing required fields:', { eventId, quantity, contactName, contactPhone });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Check if event exists
    const event = await eventRepository.findOne({
      where: { id: eventId }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    console.log('Event found:', event);
    
    // Check if user already registered
    const existingRegistration = await registrationRepository.findOne({
      where: { userId, eventId }
    });
    
    if (existingRegistration) {
      return res.status(400).json({ success: false, message: 'You have already registered for this event' });
    }
    
    // Check if event is full
    const registeredCount = await registrationRepository.count({
      where: { eventId, status: 'approved' }
    });
    
    console.log('Registered count:', registeredCount);
    console.log('Event capacity:', event.capacity);
    
    let isWaitlist = false;
    let waitlistPosition = 0;
    
    if (registeredCount >= event.capacity) {
      isWaitlist = true;
      // Calculate waitlist position
      const waitlistCount = await registrationRepository.count({
        where: { eventId, isWaitlist: true }
      });
      waitlistPosition = waitlistCount + 1;
    }
    
    // Calculate total amount
    const totalAmount = event.price * quantity;
    
    console.log('Creating registration with:', {
      userId,
      eventId,
      quantity,
      totalAmount,
      contactName,
      contactPhone,
      status: isWaitlist ? 'pending' : 'approved',
      isWaitlist,
      waitlistPosition
    });
    
    // Generate unique ticket ID
    const ticketId = uuidv4();
    
    // Create registration
    const registration = registrationRepository.create({
      userId,
      eventId,
      quantity,
      totalAmount,
      contactName,
      contactPhone,
      status: isWaitlist ? 'pending' : (event.price > 0 ? 'pending' : 'approved'),
      isWaitlist,
      waitlistPosition,
      ticketId,
      // 免费活动报名后直接激活电子票，付费活动付款后激活
      ticketStatus: event.price > 0 ? 'pending' : 'valid'
    });
    
    await registrationRepository.save(registration);
    
    console.log('Registration saved successfully:', registration);
    
    // 付费活动报名成功，自动创建支付订单
    if (!isWaitlist && event.price > 0) {
      const payment = paymentRepository.create({
        userId,
        eventId,
        registrationId: registration.id,
        amount: event.price,
        paymentMethod: 'alipay',
        status: 'pending',
        transactionId: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`
      });
      const savedPayment = await paymentRepository.save(payment);
      console.log('Payment order created automatically:', savedPayment.id);
      
      // 更新报名记录的 paymentId
      registration.paymentId = savedPayment.id;
      registration.paymentStatus = 'pending';
      await registrationRepository.save(registration);
      console.log('Registration updated with paymentId:', registration.paymentId);
    }
    
    // 免费活动报名成功，直接生成电子票
    if (!isWaitlist && event.price === 0) {
      // 生成二维码图片
      const qrCode = await generateQRCodeBase64(ticketId);
      
      const ticket = ticketRepository.create({
        userId,
        eventId,
        registrationId: registration.id,
        ticketNumber: ticketId,
        qrCode,
        status: 'valid',
        ticketType: event.price === 0 ? '免费票' : '普通票'
      });
      await ticketRepository.save(ticket);
      console.log('Ticket created successfully with QRCode:', ticket.id);
    }
    
    // 发送报名成功通知
    const notificationTitle = isWaitlist ? '报名成功（候补）' : '报名成功';
    const notificationContent = isWaitlist 
      ? `您已成功报名 "${event.title}"，当前处于候补状态，如有名额空缺将自动为您安排。`
      : event.price === 0
        ? `您已成功报名 "${event.title}"，电子票已生成，请查看电子票准备参加活动。`
        : `您已成功报名 "${event.title}"，请在活动开始前完成支付，付款后电子票自动生效。`;
    
    await sendNotification(
      userId,
      'registration',
      notificationTitle,
      notificationContent
    );
    
    // Update event registered count
    if (!isWaitlist) {
      console.log('Updating event registered count...');
      console.log('Event ID:', eventId);
      
      const updatedRegisteredCount = await registrationRepository.count({
        where: { eventId, status: 'approved' }
      });
      
      console.log('Count result:', updatedRegisteredCount);
      console.log('Current event registeredCount:', event.registeredCount);
      
      event.registeredCount = updatedRegisteredCount;
      console.log('New event registeredCount:', event.registeredCount);
      
      const savedEvent = await eventRepository.save(event);
      console.log('Saved event registeredCount:', savedEvent.registeredCount);
      
      console.log('Updated event registered count:', updatedRegisteredCount);
    }
    
    res.status(201).json({
      success: true,
      data: registration
    });
  } catch (error) {
    console.error('Error registering event:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const cancelRegistration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { registrationId } = req.params;
    
    const registration = await registrationRepository.findOne({
      where: { id: Number(registrationId), userId },
      relations: ['event']
    });
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    
    // 只有已付款的报名无法取消
    if (registration.paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: '已完成付款的报名无法取消，请联系活动主办方' 
      });
    }
    
    // 未付款报名（包括候补）随时可以取消
    
    // 保存活动信息用于通知
    const eventTitle = registration.event?.title || `活动ID:${registration.eventId}`;
    
    // Delete registration
    await registrationRepository.delete(registrationId);
    
    // 发送退票成功通知
    await sendNotification(
      userId,
      'cancellation',
      '退票成功',
      `您已成功取消 "${eventTitle}" 的报名。`
    );
    
    // If user was on waitlist, update positions of others
    if (registration.isWaitlist) {
      await registrationRepository
        .createQueryBuilder()
        .update(Registration)
        .set({ waitlistPosition: () => 'waitlistPosition - 1' })
        .where('eventId = :eventId AND isWaitlist = true AND waitlistPosition > :position', {
          eventId: registration.eventId,
          position: registration.waitlistPosition
        })
        .execute();
    } else {
      // If user was approved, promote someone from waitlist
      const nextWaitlist = await registrationRepository.findOne({
        where: { eventId: registration.eventId, isWaitlist: true },
        order: { waitlistPosition: 'ASC' }
      });
      
      if (nextWaitlist) {
        nextWaitlist.isWaitlist = false;
        nextWaitlist.waitlistPosition = 0;
        nextWaitlist.status = 'approved';
        await registrationRepository.save(nextWaitlist);
        
        // 发送候补提升通知
        await sendNotification(
          nextWaitlist.userId,
          'registration',
          '候补成功',
          `您已从候补状态提升为正式报名，成功报名 "${eventTitle}"。`
        );
        
        // Update positions of remaining waitlist members
        await registrationRepository
          .createQueryBuilder()
          .update(Registration)
          .set({ waitlistPosition: () => 'waitlistPosition - 1' })
          .where('eventId = :eventId AND isWaitlist = true AND waitlistPosition > 1', {
            eventId: registration.eventId
          })
          .execute();
      }
    }
    
    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUserRegistrations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const registrations = await registrationRepository.find({
      where: { userId },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });
    
    // 确保返回的报名记录包含paymentId
    const formattedRegistrations = registrations.map(reg => ({
      ...reg,
      paymentId: reg.paymentId
    }));
    
    res.json({
      success: true,
      data: formattedRegistrations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取我的电子票列表
export const getMyTickets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    // ✅ 修复 userId=0 被当成无效的问题
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }
    
    const tickets = await ticketRepository.find({
      where: { userId },
      relations: ['event', 'registration'],
      order: { createdAt: 'DESC' }
    });
    
    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 根据票号获取单张电子票
export const getTicketByNumber = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    let ticketNumber = req.params.ticketNumber as string;
    
    // ✅ 修复 userId=0 被当成无效的问题
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }
    
    // ✅ 后端兼容层: 如果有 tickeT: 前缀，自动提取
    if (ticketNumber.startsWith('tickeT:')) {
      ticketNumber = ticketNumber.substring(7);
    }
    
    const ticket = await ticketRepository.findOne({
      where: { ticketNumber },
      relations: ['event', 'registration', 'user']
    });
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: '票号不存在' });
    }
    
    // 验证权限：只能查看自己的票，或者举办者查看活动的票
    if (ticket.userId !== userId && ticket.event.organizerId !== userId) {
      return res.status(403).json({ success: false, message: '无权查看此电子票' });
    }
    
    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error getting ticket:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEventRegistrations = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists
    const event = await eventRepository.findOne({
      where: { id: Number(eventId) }
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    const registrations = await registrationRepository.find({
      where: { eventId: Number(eventId) },
      relations: ['user'],
      order: { createdAt: 'ASC' }
    });
    
    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const checkIn = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    let ticketNumber = req.params.ticketId as string;
    
    // ✅ 修复 userId=0 被当成无效的问题
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }
    
    // ✅ 后端兼容层: 如果有 tickeT: 前缀，自动提取
    if (ticketNumber.startsWith('tickeT:')) {
      ticketNumber = ticketNumber.substring(7);
      console.log('后端提取票号:', ticketNumber);
    }
    
    // 1. 从真正的 Ticket 表查找电子票
    const ticket = await ticketRepository.findOne({
      where: { ticketNumber },
      relations: ['event', 'user', 'registration']
    });
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: '票号不存在' });
    }
    
    // 2. 验证举办者权限
    if (ticket.event.organizerId !== userId) {
      return res.status(403).json({ success: false, message: '只有活动举办者才能进行验票' });
    }
    
    // 3. 检查是否已签到过（检查 Checkin 表）
    const existingCheckin = await checkinRepository.findOne({
      where: { ticketId: ticket.id }
    });
    if (existingCheckin) {
      return res.status(400).json({ success: false, message: '该票已签到过' });
    }
    
    // 4. 检查票状态
    if (ticket.status !== 'valid') {
      return res.status(400).json({ success: false, message: '票状态无效' });
    }
    
    // 5. 创建签到记录（Checkin 表）
    const now = new Date();
    const checkin = checkinRepository.create({
      ticketId: ticket.id,
      userId: ticket.userId,
      eventId: ticket.eventId,
      checkinTime: now
    });
    await checkinRepository.save(checkin);
    
    // 6. 更新 Ticket 状态
    ticket.status = 'checked-in';
    await ticketRepository.save(ticket);
    
    // 7. 同步更新 registration 表（兼容旧逻辑）
    if (ticket.registration) {
      ticket.registration.checkInTime = now;
      ticket.registration.ticketStatus = 'checked-in';
      await registrationRepository.save(ticket.registration);
    }
    
    res.json({
      success: true,
      message: '签到成功',
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        contactName: ticket.registration?.contactName || ticket.user?.username || '未填写',
        contactPhone: ticket.registration?.contactPhone || '未填写',
        checkInTime: now,
        ticketType: ticket.ticketType,
        status: ticket.status
      }
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
