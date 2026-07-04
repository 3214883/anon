﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { Payment } from '../models/Payment';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { Ticket } from '../models/Ticket';
import { sendNotification } from '../services/notificationService';
import { generateQRCodeBase64 } from '../utils/qrcodeGenerator';
import { processWalletPayment } from './walletController';
import { v4 as uuidv4 } from 'uuid';
import { createAlipayOrder, createAlipayQrCodeOrder, getAlipayOrder, mockPayOrder, checkOrderStatus, verifyAlipayNotify, queryAlipayOrder } from '../services/alipayService';

const paymentRepository = dataSource.getRepository(Payment);
const registrationRepository = dataSource.getRepository(Registration);
const eventRepository = dataSource.getRepository(Event);
const ticketRepository = dataSource.getRepository(Ticket);

// 创建支付订单
export const createPayment = async (req: Request, res: Response) => {
  try {
    console.log('=== createPayment called ===');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Request userId:', (req as any).userId);
    console.log('Request object keys:', Object.keys(req));
    console.log('Request auth:', (req as any).auth);
    console.log('Request user:', (req as any).user);
    
    // 手动从请求头中获取token并验证
    const token = req.headers?.authorization?.replace('Bearer ', '');
    console.log('Manual token extraction:', token);
    
    const userId = (req as any).userId;
    const { registrationId, eventId, amount, paymentMethod } = req.body;
    
    console.log('Extracted parameters:', { userId, registrationId, eventId, amount, paymentMethod });
    
    // 验证userId
    if (userId === undefined || userId === null) {
      console.log('=== userId is missing ===');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // 验证参数
    if (!registrationId || !eventId || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // 验证userId
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // 验证注册是否存在
    const registration = await registrationRepository.findOne({
      where: { id: registrationId, userId }
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // 验证活动是否存在
    const event = await eventRepository.findOne({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // 创建支付记录
    const payment = new Payment();
    payment.userId = userId;
    payment.registrationId = registrationId;
    payment.eventId = eventId;
    payment.amount = amount;
    payment.paymentMethod = paymentMethod;
    payment.transactionId = uuidv4();
    payment.status = 'pending';
    
    // 确保关联关系也被设置
    const user = new User();
    user.id = userId;
    payment.user = user;
    
    // 设置registration关联
    payment.registration = registration;
    
    // 设置event关联
    payment.event = event;

    await paymentRepository.save(payment);

    // 模拟支付处理 - 仅用于测试，实际环境应移除
    // setTimeout(async () => {
    //   payment.status = 'completed';
    //   await paymentRepository.save(payment);
    //   
    //   // 更新注册状态
    //   registration.status = 'approved';
    //   registration.paymentId = payment.id;
    //   
    //   // 生成票号
    //   const ticketNumber = uuidv4();
    //   registration.ticketId = ticketNumber;
    //   registration.ticketStatus = 'valid';
    //   
    //   await registrationRepository.save(registration);
    //   
    //   // 创建电子票记录（包含二维码）
    //   const qrCode = await generateQRCodeBase64(ticketNumber);
    //   const ticket = ticketRepository.create({
    //     userId,
    //     eventId,
    //     registrationId: registration.id,
    //     ticketNumber,
    //     qrCode,
    //     status: 'valid',
    //     ticketType: '付费票'
    //   });
    //   await ticketRepository.save(ticket);
    //   console.log('Ticket created after payment with QRCode:', ticket.id);
    //   
    //   // 发送支付成功通知
    //   const event = await eventRepository.findOne({
    //     where: { id: eventId }
    //   });
    //   
    //   if (event) {
    //     await sendNotification(
    //       userId,
    //       'payment',
    //       '支付成功',
    //       `您已成功支付 "${event.title}" 的报名费用，电子票已生效，请查看电子票准备参加活动。`
    //     );
    //   }
    // }, 2000);

    res.json({
      success: true,
      data: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 处理支付回调
export const handlePaymentCallback = async (req: Request, res: Response) => {
  try {
    const { transactionId, status, paymentMethod } = req.body;

    // 验证参数
    if (!transactionId || !status) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // 查找支付记录
    const payment = await paymentRepository.findOne({
      where: { transactionId }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // 更新支付状态
    payment.status = status;
    if (paymentMethod) {
      payment.paymentMethod = paymentMethod;
    }

    await paymentRepository.save(payment);

    // 如果支付成功，更新注册状态并生成电子票
    if (status === 'completed') {
      const registration = await registrationRepository.findOne({
        where: { id: payment.registrationId }
      });

      if (registration) {
        registration.status = 'approved';
        registration.paymentStatus = 'paid';
        await registrationRepository.save(registration);

        // 生成电子票（包含完整验证信息的二维码）- 先检查是否已存在
        const existingTicket = await ticketRepository.findOne({
          where: { registrationId: registration.id }
        });
        
        if (!existingTicket) {
          const ticketNumber = uuidv4();
          const ticketData = {
            ticketNumber,
            ticketId: 0,
            eventId: payment.eventId,
            userId: payment.userId,
            status: 'valid',
            issueTime: new Date().toISOString()
          };
          const qrCode = await generateQRCodeBase64(`TICKET:${JSON.stringify(ticketData)}`);
          
          const ticket = ticketRepository.create({
            userId: payment.userId,
            eventId: payment.eventId,
            registrationId: registration.id,
            ticketNumber,
            qrCode,
            status: 'valid',
            ticketType: registration.totalAmount > 0 ? '付费票' : '免费票'
          });
          const savedTicket = await ticketRepository.save(ticket);
          console.log('电子票已生成:', savedTicket.id, '票号:', ticketNumber);
        } else {
          console.log('电子票已存在，跳过创建:', existingTicket.id);
        }

        // 发送支付成功通知
        const event = await eventRepository.findOne({
          where: { id: payment.eventId }
        });
        
        if (event) {
          await sendNotification(
            payment.userId,
            'payment',
            '支付成功',
            `您已成功支付 "${event.title}" 的报名费用，电子票已生效，请查看电子票准备参加活动。`
          );
        }
      }
    }

    res.json({
      success: true,
      message: 'Payment callback processed successfully',
      data: {
        id: payment.id,
        transactionId: payment.transactionId,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Error handling payment callback:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取用户支付历史
export const getUserPayments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // 获取用户的支付记录
    const payments = await paymentRepository.find({
      where: { userId },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });

    // 格式化支付记录
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      orderId: payment.transactionId,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      eventTitle: payment.event.title
    }));

    res.json({
      success: true,
      data: formattedPayments
    });
  } catch (error) {
    console.error('Error getting user payments:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取支付详情
export const getPaymentDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { paymentId } = req.params;

    // 查找支付记录
    const payment = await paymentRepository.findOne({
      where: { id: Number(paymentId), userId },
      relations: ['event', 'registration']
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        event: {
          id: payment.event.id,
          title: payment.event.title,
          date: payment.event.date,
          location: payment.event.location
        },
        registration: {
          id: payment.registration.id,
          status: payment.registration.status,
          ticketId: payment.registration.ticketId
        }
      }
    });
  } catch (error) {
    console.error('Error getting payment details:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 创建支付宝沙箱支付订单
export const createAlipayPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { registrationId, eventId, amount } = req.body;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!registrationId || !eventId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const registration = await registrationRepository.findOne({
      where: { id: registrationId, userId }
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const event = await eventRepository.findOne({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const outTradeNo = `PAY_${Date.now()}_${userId}_${registrationId}`;
    
    const alipayOrder = await createAlipayOrder(
      outTradeNo,
      amount,
      `活动报名: ${event.title}`,
      `活动: ${event.title}, 报名ID: ${registrationId}`
    );

    const payment = new Payment();
    payment.userId = userId;
    payment.registrationId = registrationId;
    payment.eventId = eventId;
    payment.amount = amount;
    payment.paymentMethod = 'alipay_sandbox';
    payment.transactionId = outTradeNo;
    payment.status = 'pending';
    
    const user = new User();
    user.id = userId;
    payment.user = user;
    payment.registration = registration;
    payment.event = event;

    await paymentRepository.save(payment);

    console.log(`[支付宝沙箱] 支付订单已创建: ${outTradeNo}, 金额: ¥${amount}`);

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: outTradeNo,
        amount: alipayOrder.amount,
        qrCodeUrl: alipayOrder.qrCodeUrl,
        subject: alipayOrder.subject,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating alipay payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 模拟支付宝支付成功（测试用）
export const simulateAlipaySuccess = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const success = mockPayOrder(orderId);
    
    if (!success) {
      return res.status(400).json({ success: false, message: 'Invalid order or already paid' });
    }

    const payment = await paymentRepository.findOne({
      where: { transactionId: orderId }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    payment.status = 'completed';
    await paymentRepository.save(payment);

    const registration = await registrationRepository.findOne({
      where: { id: payment.registrationId }
    });

    if (registration) {
      registration.status = 'approved';
      registration.paymentId = payment.id;
      registration.paymentStatus = 'paid';
      await registrationRepository.save(registration);

      // 生成电子票（包含完整验证信息的二维码）- 先检查是否已存在
      const existingTicket = await ticketRepository.findOne({
        where: { registrationId: registration.id }
      });
      
      if (!existingTicket) {
        const ticketNumber = uuidv4();
        const ticketData = {
          ticketNumber,
          ticketId: 0,
          eventId: payment.eventId,
          userId: payment.userId,
          status: 'valid',
          issueTime: new Date().toISOString()
        };
        const qrCode = await generateQRCodeBase64(`TICKET:${JSON.stringify(ticketData)}`);
        
        const ticket = ticketRepository.create({
          userId: payment.userId,
          eventId: payment.eventId,
          registrationId: registration.id,
          ticketNumber,
          qrCode,
          status: 'valid',
          ticketType: registration.totalAmount > 0 ? '付费票' : '免费票'
        });
        const savedTicket = await ticketRepository.save(ticket);
        console.log('模拟支付成功，电子票已生成:', savedTicket.id, '票号:', ticketNumber);
      } else {
        console.log('电子票已存在，跳过创建:', existingTicket.id);
      }
    }

    const event = await eventRepository.findOne({
      where: { id: payment.eventId }
    });

    if (event) {
      await sendNotification(
        payment.userId,
        'payment',
        '支付成功',
        `您已成功支付 "${event.title}" 的报名费用，报名已确认。`
      );
    }

    console.log(`[支付宝沙箱] 模拟支付成功: ${orderId}`);

    res.json({
      success: true,
      message: 'Payment simulated successfully',
      data: {
        orderId,
        paymentId: payment.id,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Error simulating alipay success:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 查询支付宝订单状态
export const getAlipayOrderStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const orderId = req.params.orderId as string;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const status = checkOrderStatus(orderId);
    
    const payment = await paymentRepository.findOne({
      where: { transactionId: orderId as string, userId }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({
      success: true,
      data: {
        orderId,
        status: status === 'paid' ? 'completed' : status,
        paymentStatus: payment.status,
        amount: payment.amount
      }
    });
  } catch (error) {
    console.error('Error checking alipay order status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 创建支付宝网页支付（跳转）
export const createAlipayWebPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { registrationId, eventId, amount } = req.body;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!registrationId || !eventId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const registration = await registrationRepository.findOne({
      where: { id: registrationId, userId }
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const event = await eventRepository.findOne({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const outTradeNo = `PAY_${Date.now()}_${userId}_${registrationId}`;
    
    const alipayOrder = await createAlipayOrder(
      outTradeNo,
      amount,
      `活动报名: ${event.title}`,
      `活动: ${event.title}, 报名ID: ${registrationId}`
    );

    const payment = new Payment();
    payment.userId = userId;
    payment.registrationId = registrationId;
    payment.eventId = eventId;
    payment.amount = amount;
    payment.paymentMethod = 'alipay_sandbox_web';
    payment.transactionId = outTradeNo;
    payment.status = 'pending';
    
    const user = new User();
    user.id = userId;
    payment.user = user;
    payment.registration = registration;
    payment.event = event;

    await paymentRepository.save(payment);

    console.log(`[支付宝沙箱] 网页支付订单: ${outTradeNo}`);

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: outTradeNo,
        amount: alipayOrder.amount,
        payUrl: alipayOrder.payUrl,
        qrCodeUrl: alipayOrder.qrCodeUrl,
        subject: alipayOrder.subject,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating alipay web payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 支付宝异步通知回调
export const handleAlipayNotify = async (req: Request, res: Response) => {
  try {
    console.log('[支付宝沙箱] 收到异步通知:', req.body);

    const isValid = verifyAlipayNotify(req.body);
    
    if (!isValid) {
      console.error('[支付宝沙箱] 签名验证失败');
      return res.status(400).send('fail');
    }

    const { out_trade_no, trade_status } = req.body;
    
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      const payment = await paymentRepository.findOne({
        where: { transactionId: out_trade_no }
      });

      if (payment && payment.status === 'pending') {
        payment.status = 'completed';
        await paymentRepository.save(payment);

        const registration = await registrationRepository.findOne({
          where: { id: payment.registrationId }
        });

        if (registration) {
          registration.status = 'approved';
          registration.paymentId = payment.id;
          await registrationRepository.save(registration);
        }

        console.log(`[支付宝沙箱] 异步通知支付成功: ${out_trade_no}`);
      }
    }

    res.send('success');
  } catch (error) {
    console.error('Error handling alipay notify:', error);
    res.status(500).send('fail');
  }
};

// 钱包支付 - 即时扣款完成支付
export const createWalletPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { registrationId, eventId, amount } = req.body;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    if (!registrationId || !eventId || !amount) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const registration = await registrationRepository.findOne({
      where: { id: registrationId, userId }
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: '报名记录不存在' });
    }

    if (registration.status === 'approved') {
      return res.status(400).json({ success: false, message: '该报名已完成支付' });
    }

    const event = await eventRepository.findOne({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    // 使用事务处理钱包支付
    await dataSource.transaction(async (transactionalEntityManager) => {
      // 1. 从钱包扣款
      const paymentResult = await processWalletPayment(
        userId,
        amount,
        `活动报名: ${event.title}`,
        registrationId,
        transactionalEntityManager
      );

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: paymentResult.message
        });
      }

      // 2. 创建支付记录
      const payment = new Payment();
      payment.userId = userId;
      payment.registrationId = registrationId;
      payment.eventId = eventId;
      payment.amount = amount;
      payment.paymentMethod = 'wallet';
      payment.transactionId = `WALLET-${Date.now()}-${userId}`;
      payment.status = 'completed';
      
      const user = new User();
      user.id = userId;
      payment.user = user;
      payment.registration = registration;
      payment.event = event;

      // 保存支付记录并获取生成的ID
      const savedPayment = await transactionalEntityManager.save(payment);
      const paymentId = savedPayment.id;
      console.log('Payment created with ID:', paymentId);

      // 3. 更新报名状态
      registration.status = 'approved';
      registration.paymentId = paymentId;
      registration.paymentStatus = 'paid';
      console.log('Updating registration', registrationId, 'with paymentId:', paymentId);
      
      // 生成票号
      const ticketNumber = uuidv4();
      registration.ticketId = ticketNumber;
      registration.ticketStatus = 'valid';
      
      await transactionalEntityManager.save(registration);

      // 4. 创建电子票记录（包含二维码）- 先检查是否已存在
      const existingTicket = await ticketRepository.findOne({
        where: { registrationId: registration.id }
      });
      
      if (!existingTicket) {
        const qrCode = await generateQRCodeBase64(ticketNumber);
        const ticket = ticketRepository.create({
          userId,
          eventId,
          registrationId: registration.id,
          ticketNumber,
          qrCode,
          status: 'valid',
          ticketType: '付费票(钱包支付)'
        });
        await transactionalEntityManager.save(ticket);
        console.log('钱包支付成功，电子票已生成:', ticket.id);
      } else {
        console.log('电子票已存在，跳过创建:', existingTicket.id);
      }

      // 5. 发送支付成功通知
      await sendNotification(
        userId,
        'payment',
        '钱包支付成功',
        `您已通过钱包成功支付 "${event.title}" 的报名费用，电子票已生效！`
      );

      res.json({
        success: true,
        message: '支付成功',
        data: {
          paymentId: payment.id,
          ticketId: ticketNumber,
          balance: paymentResult.data?.balance,
          status: 'completed'
        }
      });
    });
  } catch (error: any) {
    console.error('钱包支付失败:', error);
    res.status(500).json({ success: false, message: error.message || '支付失败' });
  }
};

