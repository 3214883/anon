import { Request, Response } from 'express';
import { dataSource } from '../config/database';
import { ChatMessage } from '../models/ChatMessage';
import { Event } from '../models/Event';

const chatMessageRepository = dataSource.getRepository(ChatMessage);
const eventRepository = dataSource.getRepository(Event);

export const getEventMessages = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).userId;

    // Check if event exists
    const event = await eventRepository.findOne({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Get messages for the event
    const messages = await chatMessageRepository.find({
      where: { eventId: Number(eventId) },
      relations: ['user'],
      order: { createdAt: 'ASC' }
    });

    // Format messages with user info
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      user: {
        id: message.user.id,
        username: message.user.username,
        avatar: message.user.avatar
      }
    }));

    res.json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    console.error('Error getting event messages:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).userId;
    const { content } = req.body;

    // Validate content
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Check if event exists
    const event = await eventRepository.findOne({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Create message
    const message = chatMessageRepository.create({
      eventId: Number(eventId),
      userId,
      content
    });

    await chatMessageRepository.save(message);

    // Get the message with user info
    const savedMessage = await chatMessageRepository.findOne({
      where: { id: message.id },
      relations: ['user']
    });

    if (savedMessage) {
      res.status(201).json({
        success: true,
        data: {
          id: savedMessage.id,
          content: savedMessage.content,
          createdAt: savedMessage.createdAt,
          user: {
            id: savedMessage.user.id,
            username: savedMessage.user.username,
            avatar: savedMessage.user.avatar
          }
        }
      });
    } else {
      res.status(500).json({ success: false, message: 'Failed to create message' });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).userId;

    // Get message
    const message = await chatMessageRepository.findOne({
      where: { id: Number(messageId) }
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is the message sender
    if (message.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    // Delete message
    await chatMessageRepository.delete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
