import { v4 as uuidv4 } from 'uuid';
import { getAlipaySdk, createMockAlipayQrCode, ALIPAY_KEYS, ALIPAY_CONFIG } from '../config/alipay';

export interface AlipayOrder {
  orderId: string;
  amount: number;
  subject: string;
  body: string;
  qrCodeUrl: string;
  payUrl?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
}

const mockOrders = new Map<string, AlipayOrder>();

let SDK_ENABLED = true;
(() => {
  if (ALIPAY_KEYS.privateKey.includes('PLEASE_REPLACE')) {
    console.warn('[支付宝沙箱] ⚠️  未配置应用私钥，使用模拟模式');
    SDK_ENABLED = false;
  } else {
    console.log('[支付宝沙箱] ✅ SDK模式已启用');
  }
})();

export const createAlipayOrder = async (
  outTradeNo: string,
  totalAmount: number,
  subject: string,
  body: string
): Promise<AlipayOrder> => {
  const orderId = outTradeNo || uuidv4();
  
  const order: AlipayOrder = {
    orderId,
    amount: totalAmount,
    subject,
    body,
    qrCodeUrl: createMockAlipayQrCode(orderId, totalAmount),
    status: 'pending',
    createdAt: new Date()
  };

  if (SDK_ENABLED) {
    try {
      const alipaySdk = getAlipaySdk();
      
      const payForm = await alipaySdk.pageExecute({
        method: 'alipay.trade.page.pay',
        bizContent: {
          out_trade_no: orderId,
          product_code: 'FAST_INSTANT_TRADE_PAY',
          total_amount: totalAmount.toFixed(2),
          subject,
          body,
          timeout_express: '30m'
        },
        return_url: ALIPAY_CONFIG.returnUrl,
        notify_url: ALIPAY_CONFIG.notifyUrl
      });
      
      const formHtml = payForm as string;
      const actionMatch = formHtml.match(/action="([^"]+)"/);
      if (actionMatch && actionMatch[1]) {
        order.payUrl = actionMatch[1].replace(/&amp;/g, '&');
        console.log(`[支付宝沙箱] ✅ 从表单提取支付URL: ${order.payUrl.substring(0, 80)}...`);
      } else {
        order.payUrl = 'https://openhome.alipay.com/platform/appDaily.htm?tab=tool';
      }
      
      console.log(`[支付宝沙箱] ✅ 真实SDK订单创建成功: ${orderId}`);
    } catch (error) {
      console.warn(`[支付宝沙箱] ⚠️  SDK调用失败，降级为模拟模式:`, (error as Error).message);
      console.error(error);
      SDK_ENABLED = false;
    }
  }

  mockOrders.set(orderId, order);
  console.log(`[支付宝沙箱] 订单: ${orderId}, 金额: ¥${totalAmount}, 模式: ${SDK_ENABLED ? 'SDK' : '模拟'}`);
  
  return order;
};

export const createAlipayQrCodeOrder = async (
  outTradeNo: string,
  totalAmount: number,
  subject: string,
  body: string
): Promise<AlipayOrder> => {
  const orderId = outTradeNo || uuidv4();
  
  const order: AlipayOrder = {
    orderId,
    amount: totalAmount,
    subject,
    body,
    qrCodeUrl: createMockAlipayQrCode(orderId, totalAmount),
    status: 'pending',
    createdAt: new Date()
  };

  if (SDK_ENABLED) {
    try {
      const alipaySdk = getAlipaySdk();
      
      const result = await alipaySdk.exec('alipay.trade.precreate', {
        bizContent: {
          out_trade_no: orderId,
          total_amount: totalAmount.toFixed(2),
          subject,
          body,
          timeout_express: '30m'
        }
      } as any);

      if (result && result.qr_code) {
        order.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&margin=10&data=${encodeURIComponent(result.qr_code)}`;
      }
      
      console.log(`[支付宝沙箱] ✅ 预下单接口调用成功: ${orderId}`);
    } catch (error) {
      console.warn(`[支付宝沙箱] ⚠️  预下单失败，使用模拟二维码:`, (error as Error).message);
    }
  }

  mockOrders.set(orderId, order);
  return order;
};

export const getAlipayOrder = (orderId: string): AlipayOrder | undefined => {
  return mockOrders.get(orderId);
};

export const mockPayOrder = (orderId: string): boolean => {
  const order = mockOrders.get(orderId);
  if (!order || order.status !== 'pending') {
    return false;
  }
  
  order.status = 'paid';
  order.paidAt = new Date();
  console.log(`[支付宝沙箱] 模拟支付成功: ${orderId}, 时间: ${order.paidAt.toISOString()}`);
  
  return true;
};

export const verifyAlipayNotify = (params: Record<string, any>): boolean => {
  if (!SDK_ENABLED) {
    console.log('[支付宝沙箱] 模拟模式下回调验证通过');
    return params.trade_status === 'TRADE_SUCCESS';
  }
  
  try {
    const alipaySdk = getAlipaySdk();
    const isValid = alipaySdk.checkNotifySign(params);
    console.log(`[支付宝沙箱] 回调签名验证结果: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error('[支付宝沙箱] 签名验证失败:', error);
    return false;
  }
};

export const queryAlipayOrder = async (orderId: string): Promise<string> => {
  const localOrder = mockOrders.get(orderId);
  
  if (localOrder && localOrder.status === 'paid') {
    return 'TRADE_SUCCESS';
  }
  
  if (SDK_ENABLED && localOrder && localOrder.status === 'pending') {
    try {
      const alipaySdk = getAlipaySdk();
      const result = await alipaySdk.exec('alipay.trade.query', {
        bizContent: {
          out_trade_no: orderId
        }
      } as any);
      
      if (result && result.trade_status === 'TRADE_SUCCESS') {
        if (localOrder) {
          localOrder.status = 'paid';
          localOrder.paidAt = new Date();
        }
        return 'TRADE_SUCCESS';
      }
      return result?.trade_status || 'WAIT_BUYER_PAY';
    } catch (error) {
      console.warn(`[支付宝沙箱] 查询订单状态失败，使用本地状态`);
    }
  }
  
  return localOrder?.status === 'paid' ? 'TRADE_SUCCESS' : 'WAIT_BUYER_PAY';
};

export const cancelOrder = (orderId: string): boolean => {
  const order = mockOrders.get(orderId);
  if (!order) {
    return false;
  }
  
  order.status = 'cancelled';
  console.log(`[支付宝沙箱] 取消订单: ${orderId}`);
  
  return true;
};

export const checkOrderStatus = (orderId: string): string => {
  const order = mockOrders.get(orderId);
  if (!order) {
    return 'not_found';
  }
  return order.status;
};

export const cleanupExpiredOrders = () => {
  const now = new Date();
  const timeout = 30 * 60 * 1000;
  
  for (const [orderId, order] of mockOrders) {
    if (order.status === 'pending' && now.getTime() - order.createdAt.getTime() > timeout) {
      order.status = 'expired';
      console.log(`[支付宝沙箱] 订单超时: ${orderId}`);
    }
  }
};

setInterval(cleanupExpiredOrders, 60000);
