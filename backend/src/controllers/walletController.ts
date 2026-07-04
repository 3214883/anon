import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { EntityManager } from 'typeorm';

const walletRepository = dataSource.getRepository(Wallet);
const transactionRepository = dataSource.getRepository(WalletTransaction);

// 获取或创建用户钱包
export const getOrCreateWallet = async (userId: number, transactionalEntityManager?: EntityManager) => {
  const repo = transactionalEntityManager ? transactionalEntityManager.getRepository(Wallet) : walletRepository;
  
  let wallet = await repo.findOne({ where: { userId } });
  
  if (!wallet) {
    wallet = repo.create({
      userId,
      balance: 0.00, // 初始余额为0，需管理员手动充值
      status: 'active'
    });
    await repo.save(wallet);
  }
  
  return wallet;
};

// 获取钱包余额
export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }
    
    const wallet = await getOrCreateWallet(userId);
    
    res.json({
      success: true,
      data: {
        walletId: wallet.id,
        balance: Number(wallet.balance),
        status: wallet.status
      }
    });
  } catch (error) {
    console.error('获取钱包失败:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取交易记录
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }
    
    const wallet = await getOrCreateWallet(userId);
    
    const transactions = await transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: 50
    });
    
    res.json({
      success: true,
      data: transactions.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type,
        description: tx.description,
        status: tx.status,
        createdAt: tx.createdAt
      }))
    });
  } catch (error) {
    console.error('获取交易记录失败:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 钱包充值（模拟）
export const recharge = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { amount } = req.body;
    
    if (userId === undefined || userId === null) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: '充值金额必须大于0' });
    }
    
    if (amount > 10000) {
      return res.status(400).json({ success: false, message: '单次充值不能超过10000元' });
    }
    
    await dataSource.transaction(async (transactionalEntityManager) => {
      const wallet = await getOrCreateWallet(userId, transactionalEntityManager);
      
      wallet.balance = Number(wallet.balance) + Number(amount);
      await transactionalEntityManager.save(wallet);
      
      const tx = transactionalEntityManager.create(WalletTransaction, {
        walletId: wallet.id,
        userId,
        amount: Number(amount),
        type: 'deposit',
        description: `钱包充值 ${amount} 元`,
        status: 'completed'
      });
      await transactionalEntityManager.save(tx);
      
      res.json({
        success: true,
        message: `充值成功 ${amount} 元`,
        data: {
          balance: Number(wallet.balance)
        }
      });
    });
  } catch (error) {
    console.error('充值失败:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 钱包支付（内部接口）
export const processWalletPayment = async (
  userId: number,
  amount: number,
  description: string,
  relatedId?: number,
  transactionalEntityManager?: EntityManager
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const repo = transactionalEntityManager ? transactionalEntityManager.getRepository(Wallet) : walletRepository;
    const txRepo = transactionalEntityManager ? transactionalEntityManager.getRepository(WalletTransaction) : transactionRepository;
    
    const wallet = await getOrCreateWallet(userId, transactionalEntityManager);
    
    if (Number(wallet.balance) < Number(amount)) {
      return {
        success: false,
        message: `钱包余额不足，当前余额: ${wallet.balance}元，需要: ${amount}元`
      };
    }
    
    wallet.balance = Number(wallet.balance) - Number(amount);
    await repo.save(wallet);
    
    const tx = txRepo.create({
      walletId: wallet.id,
      userId,
      amount: Number(amount),
      type: 'payment',
      description,
      status: 'completed',
      relatedId
    });
    await txRepo.save(tx);
    
    return {
      success: true,
      message: '支付成功',
      data: {
        balance: Number(wallet.balance),
        transactionId: tx.id
      }
    };
  } catch (error: any) {
    console.error('钱包支付失败:', error);
    return {
      success: false,
      message: error.message || '支付失败'
    };
  }
};