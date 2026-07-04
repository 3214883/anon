import QRCode from 'qrcode';

/**
 * 生成二维码图片 (Base64)
 * @param ticketNumber 票号
 * @returns Base64 编码的二维码图片
 */
export const generateQRCodeBase64 = async (ticketNumber: string): Promise<string> => {
  try {
    // 生成包含票号的二维码（前后端统一格式）
    const qrCodeData = `tickeT:${ticketNumber}`;
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeData, {
      width: 150,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return qrCodeBase64;
  } catch (error) {
    console.error('生成二维码失败:', error);
    return '';
  }
};

/**
 * 验证扫码结果是否匹配票号
 * @param scannedContent 扫码得到的内容
 * @param ticketNumber 票号
 * @returns 是否匹配
 */
export const verifyQRCode = (scannedContent: string, ticketNumber: string): boolean => {
  // 扫码内容格式: tickeT:xxxx-xxxx-xxxx-xxxx
  const expectedContent = `tickeT:${ticketNumber}`;
  return scannedContent === expectedContent;
};
