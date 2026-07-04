import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { User } from '../models/User';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationCode, verifyCode } from '../services/smsService';

const userRepository = dataSource.getRepository(User);

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, phone, password } = req.body;
    
    // Check if user already exists
    const whereConditions: any[] = [{ email }];
    if (phone && phone.trim() !== '') {
      whereConditions.push({ phone });
    }
    const existingUser = await userRepository.findOne({
      where: whereConditions
    });
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user - handle empty phone as null to avoid UNIQUE constraint issues
    const newUser = userRepository.create({
      username,
      email,
      phone: phone && phone.trim() !== '' ? phone : null,
      password,
      role: 'user'
    });
    
    await userRepository.save(newUser);
    
    // Generate token pair
    const tokenPair = generateTokenPair(newUser.id);
    
    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        contact: newUser.contact,
        address: newUser.address,
        avatar: newUser.avatar,
        bio: newUser.bio,
        location: newUser.location,
        role: newUser.role,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token is required' 
      });
    }
    
    console.log('Refreshing token with refreshToken:', refreshToken.substring(0, 30) + '...');
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }
    
    // Get user
    const user = await userRepository.findOne({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Generate new token pair
    const tokenPair = generateTokenPair(user.id);
    
    console.log('Token refreshed successfully for userId:', user.id);
    
    res.json({
      success: true,
      data: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await userRepository.findOne({
      where: { email }
    });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: '该账号已被禁用，请联系管理员' });
    }
    
    // Generate token pair
    const tokenPair = generateTokenPair(user.id);
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        contact: user.contact,
        address: user.address,
        avatar: user.avatar,
        coverImage: user.coverImage,
        bio: user.bio,
        location: user.location,
        role: user.role,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    console.log('🔥🔥🔥 调用了getUserInfo！userId:', userId);
    
    const user = await userRepository.findOne({
      where: { id: userId }
    });
    console.log('🔥🔥🔥 数据库查到的user.coverImage:', user.coverImage ? '有数据' : '空');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        contact: user.contact,
        address: user.address,
        avatar: user.avatar,
        coverImage: user.coverImage,
        gender: user.gender,
        birthday: user.birthday,
        bio: user.bio,
        location: user.location,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateUserInfo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    console.log('收到更新用户信息请求，userId:', userId);
    console.log('请求体内容:', req.body);
    
    const { username, avatar, coverImage, gender, birthday, bio, location, phone, contact, address } = req.body;
    
    const user = await userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user) {
      console.log('未找到用户');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('更新前的用户信息:', {
      username: user.username,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      contact: user.contact,
      address: user.address
    });
    
    // Update user information
    if (username !== undefined && username !== '') user.username = username;
    if (avatar !== undefined && avatar !== '') user.avatar = avatar;
    if (coverImage !== undefined && coverImage !== '') user.coverImage = coverImage;
    if (gender !== undefined && gender !== '') user.gender = gender;
    if (birthday !== undefined) user.birthday = new Date(birthday);
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (phone !== undefined && phone !== '') user.phone = phone;  // 避免唯一约束冲突
    if (contact !== undefined) user.contact = contact;
    if (address !== undefined) user.address = address;
    
    console.log('🔴 coverImage变量值:', coverImage ? '有数据，长度:' + coverImage.length : '空/undefined');
    console.log('🔴 user.coverImage赋值前:', user.coverImage);
    
    // 强制赋值！不管什么条件
    if (coverImage) {
      user.coverImage = coverImage;
    }
    
    console.log('更新后的用户信息:', {
      username: user.username,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      contact: user.contact,
      coverImage: user.coverImage ? '有数据' : '空'
    });
    
    await userRepository.save(user);
    console.log('✅ 用户信息已保存到数据库，coverImage:', user.coverImage ? '成功写入' : '空');
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        contact: user.contact,
        address: user.address,
        avatar: user.avatar,
        coverImage: user.coverImage,
        gender: user.gender,
        birthday: user.birthday,
        bio: user.bio,
        location: user.location,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendCode = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    
    // 发送验证码
    const code = sendVerificationCode(phone);
    
    res.json({
      success: true,
      message: '验证码发送成功',
      data: {
        phone,
        code // 实际生产环境中不应该返回验证码
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const loginWithPhone = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Phone number and code are required' });
    }
    
    // 验证验证码
    const isValid = verifyCode(phone, code);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid or expired code' });
    }
    
    // 查找用户
    let user = await userRepository.findOne({
      where: { phone }
    });
    
    // 如果用户不存在，自动注册
    if (!user) {
      user = userRepository.create({
        username: `用户${phone.slice(-4)}`,
        phone,
        role: 'user'
      });
      await userRepository.save(user);
    }
    
    // 生成token pair
    const tokenPair = generateTokenPair(user.id);
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        contact: user.contact,
        address: user.address,
        avatar: user.avatar,
        coverImage: user.coverImage,
        bio: user.bio,
        location: user.location,
        role: user.role,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUserInfoById = async (req: Request, res: Response) => {
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
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        coverImage: user.coverImage,
        gender: user.gender,
        birthday: user.birthday,
        bio: user.bio,
        location: user.location,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请输入当前密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码至少需要6位字符' });
    }

    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (user.password !== currentPassword) {
      return res.status(400).json({ success: false, message: '当前密码不正确' });
    }

    user.password = newPassword;
    user.updatedAt = new Date();
    await userRepository.save(user);

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ success: false, message: '修改密码失败' });
  }
};
