import { dataSource } from '../config/database';
import { Event } from '../models/Event';

const eventRepository = dataSource.getRepository(Event);

export const seedEvents = async () => {
  // Check if events already exist
  const eventCount = await eventRepository.count();
  
  if (eventCount === 0) {
    const events = [
      {
        title: '周末户外徒步活动',
        description: '一起去郊外徒步，呼吸新鲜空气，欣赏自然风光',
        date: new Date('2024-05-15'),
        startTime: '09:00',
        endTime: '17:00',
        location: '香山公园',
        address: '北京市海淀区香山公园',
        capacity: 30,
        price: 50,
        coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=outdoor%20hiking%20activity%20in%20mountain&image_size=landscape_4_3',
        category: 'outdoor',
        tags: '徒步,户外,自然',
        status: 'published',
        organizerId: 2
      },
      {
        title: '城市摄影工作坊',
        description: '学习城市摄影技巧，捕捉城市的美丽瞬间',
        date: new Date('2024-05-20'),
        startTime: '14:00',
        endTime: '18:00',
        location: '798艺术区',
        address: '北京市朝阳区798艺术区',
        capacity: 20,
        price: 120,
        coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=urban%20photography%20workshop&image_size=landscape_4_3',
        category: 'culture',
        tags: '摄影,艺术,城市',
        status: 'published',
        organizerId: 2
      },
      {
        title: '编程技术分享会',
        description: '分享最新的前端技术和开发经验',
        date: new Date('2024-05-25'),
        startTime: '19:00',
        endTime: '21:00',
        location: '中关村创业大街',
        address: '北京市海淀区中关村创业大街',
        capacity: 50,
        price: 0,
        coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=programming%20tech%20sharing%20meeting&image_size=landscape_4_3',
        category: 'tech',
        tags: '编程,技术,分享',
        status: 'published',
        organizerId: 2
      },
      {
        title: '瑜伽冥想课程',
        description: '通过瑜伽和冥想，放松身心，减轻压力',
        date: new Date('2024-05-18'),
        startTime: '08:00',
        endTime: '09:30',
        location: '朝阳区瑜伽馆',
        address: '北京市朝阳区建国路88号',
        capacity: 15,
        price: 80,
        coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yoga%20meditation%20class&image_size=landscape_4_3',
        category: 'sports',
        tags: '瑜伽,冥想,健康',
        status: 'published',
        organizerId: 2
      },
      {
        title: '美食烹饪班',
        description: '学习制作正宗的意大利面和披萨',
        date: new Date('2024-05-22'),
        startTime: '15:00',
        endTime: '18:00',
        location: '西城区厨艺学校',
        address: '北京市西城区西长安街',
        capacity: 12,
        price: 150,
        coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20class%20italian%20food&image_size=landscape_4_3',
        category: 'food',
        tags: '烹饪,美食,意大利菜',
        status: 'published',
        organizerId: 2
      }
    ];
    
    await eventRepository.save(events);
    console.log('Seed events created successfully');
  }
};
