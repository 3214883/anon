import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { Settlement } from '../models/Settlement';
import { Event } from '../models/Event';
import { Payment } from '../models/Payment';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';

const settlementRepository = dataSource.getRepository(Settlement);
const eventRepository = dataSource.getRepository(Event);
const paymentRepository = dataSource.getRepository(Payment);
const walletRepository = dataSource.getRepository(Wallet);
const walletTransactionRepository = dataSource.getRepository(WalletTransaction);

const PLATFORM_FEE_RATE = 0.05;

export const applySettlement = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.body;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const event = await eventRepository.findOne({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    if (event.organizerId !== userId) {
      return res.status(403).json({ success: false, message: '只有活动主办方可以申请结算' });
    }

    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate > now) {
      return res.status(400).json({ success: false, message: '活动尚未结束，不能申请结算' });
    }

    const existingSettlement = await settlementRepository.findOne({
      where: { eventId: Number(eventId) }
    });

    if (existingSettlement) {
      return res.status(400).json({ 
        success: false, 
        message: '该活动已申请结算，请勿重复申请',
        data: existingSettlement
      });
    }

    const payments = await paymentRepository.find({
      where: { eventId: Number(eventId), status: 'completed' }
    });

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const participantCount = payments.length;
    const feeAmount = totalAmount * PLATFORM_FEE_RATE;
    const settleAmount = totalAmount - feeAmount;

    const settlement = settlementRepository.create({
      eventId: Number(eventId),
      organizerId: event.organizerId,
      totalAmount,
      participantCount,
      feeAmount,
      settleAmount,
      status: 'pending'
    });

    await settlementRepository.save(settlement);

    res.json({
      success: true,
      message: '结算申请已提交，请等待管理员审核',
      data: settlement
    });
  } catch (error) {
    console.error('申请结算错误:', error);
    res.status(500).json({ success: false, message: '申请结算失败', error: (error as any).message });
  }
};

export const getMySettlements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const settlements = await settlementRepository.find({
      where: { organizerId: userId },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });

    res.json({
      success: true,
      data: settlements.map(s => ({
        id: s.id,
        eventId: s.eventId,
        eventTitle: s.event?.title || '',
        totalAmount: s.totalAmount,
        participantCount: s.participantCount,
        feeAmount: s.feeAmount,
        settleAmount: s.settleAmount,
        status: s.status,
        rejectReason: s.rejectReason,
        approvedAt: s.approvedAt,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('获取结算列表错误:', error);
    res.status(500).json({ success: false, message: '获取结算列表失败' });
  }
};

export const getAllSettlements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await dataSource.getRepository('User').findOne({
      where: { id: userId }
    }) as any;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以查看' });
    }

    const settlements = await settlementRepository.find({
      relations: ['event', 'organizer'],
      order: { createdAt: 'DESC' }
    });

    res.json({
      success: true,
      data: settlements.map(s => ({
        id: s.id,
        eventId: s.eventId,
        eventTitle: s.event?.title || '',
        organizerId: s.organizerId,
        organizerName: s.organizer?.username || '',
        totalAmount: s.totalAmount,
        participantCount: s.participantCount,
        feeAmount: s.feeAmount,
        settleAmount: s.settleAmount,
        status: s.status,
        rejectReason: s.rejectReason,
        approvedBy: s.approvedBy,
        approvedAt: s.approvedAt,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('获取结算列表错误:', error);
    res.status(500).json({ success: false, message: '获取结算列表失败' });
  }
};

export const approveSettlement = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const { settlementId } = req.params;

    const admin = await dataSource.getRepository('User').findOne({
      where: { id: adminId }
    }) as any;

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以审核' });
    }

    const settlement = await settlementRepository.findOne({
      where: { id: Number(settlementId) }
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: '结算申请不存在' });
    }

    if (settlement.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该结算申请已处理' });
    }

    let organizerWallet = await walletRepository.findOne({
      where: { userId: settlement.organizerId }
    });

    if (!organizerWallet) {
      organizerWallet = walletRepository.create({
        userId: settlement.organizerId,
        balance: 0
      });
      await walletRepository.save(organizerWallet);
    }

    let adminWallet = await walletRepository.findOne({
      where: { userId: adminId }
    });

    if (!adminWallet) {
      adminWallet = walletRepository.create({
        userId: adminId,
        balance: 0
      });
      await walletRepository.save(adminWallet);
    }

    const settleAmount = Number(settlement.settleAmount);
    const feeAmount = Number(settlement.feeAmount);

    organizerWallet.balance = Number(organizerWallet.balance) + settleAmount;
    await walletRepository.save(organizerWallet);

    adminWallet.balance = Number(adminWallet.balance) + feeAmount;
    await walletRepository.save(adminWallet);

    const organizerTransaction = walletTransactionRepository.create({
      walletId: organizerWallet.id,
      userId: settlement.organizerId,
      amount: settleAmount,
      type: 'settlement',
      description: `活动结算: 活动ID #${settlement.eventId}`,
      status: 'completed',
      relatedId: settlement.eventId
    });
    await walletTransactionRepository.save(organizerTransaction);

    const adminTransaction = walletTransactionRepository.create({
      walletId: adminWallet.id,
      userId: adminId,
      amount: feeAmount,
      type: 'platform_fee',
      description: `平台手续费: 活动ID #${settlement.eventId}`,
      status: 'completed',
      relatedId: settlement.eventId
    });
    await walletTransactionRepository.save(adminTransaction);

    settlement.status = 'approved';
    settlement.approvedBy = adminId;
    settlement.approvedAt = new Date();
    settlement.walletTransactionId = organizerTransaction.id;
    await settlementRepository.save(settlement);

    res.json({
      success: true,
      message: `结算审核通过，主办方收到 ¥${settleAmount.toFixed(2)}，平台手续费 ¥${feeAmount.toFixed(2)} 已转入管理员钱包`,
      data: settlement
    });
  } catch (error) {
    console.error('审核结算错误:', error);
    res.status(500).json({ success: false, message: '审核结算失败', error: (error as any).message });
  }
};

export const rejectSettlement = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const { settlementId } = req.params;
    const { reason } = req.body;

    const admin = await dataSource.getRepository('User').findOne({
      where: { id: adminId }
    }) as any;

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以审核' });
    }

    const settlement = await settlementRepository.findOne({
      where: { id: Number(settlementId) }
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: '结算申请不存在' });
    }

    if (settlement.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该结算申请已处理' });
    }

    settlement.status = 'rejected';
    settlement.rejectReason = reason || '未说明原因';
    settlement.approvedBy = adminId;
    settlement.approvedAt = new Date();
    await settlementRepository.save(settlement);

    res.json({
      success: true,
      message: '结算申请已拒绝',
      data: settlement
    });
  } catch (error) {
    console.error('拒绝结算错误:', error);
    res.status(500).json({ success: false, message: '拒绝结算失败', error: (error as any).message });
  }
};

export const getSettlementSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const pendingCount = await settlementRepository.count({
      where: { organizerId: userId, status: 'pending' }
    });

    const approvedCount = await settlementRepository.count({
      where: { organizerId: userId, status: 'approved' }
    });

    const rejectedCount = await settlementRepository.count({
      where: { organizerId: userId, status: 'rejected' }
    });

    const totalSettled = await settlementRepository.createQueryBuilder('s')
      .select('SUM(s.settleAmount)', 'sum')
      .where('s.organizerId = :userId AND s.status = :status', { userId, status: 'approved' })
      .getRawOne();

    res.json({
      success: true,
      data: {
        pendingCount,
        approvedCount,
        rejectedCount,
        totalSettled: Number(totalSettled?.sum || 0)
      }
    });
  } catch (error) {
    console.error('获取结算统计错误:', error);
    res.status(500).json({ success: false, message: '获取结算统计失败' });
  }
};
