import { Category } from '../models/Category';
import { dataSource } from '../config/database';

const categories = [
  { name: '社交聚会', icon: 'users', sortOrder: 1, description: '朋友聚会、单身交友、主题派对等' },
  { name: '教育培训', icon: 'graduation-cap', sortOrder: 2, description: '讲座沙龙、培训课程、工作坊等' },
  { name: '商务会议', icon: 'briefcase', sortOrder: 3, description: '企业会议、行业峰会、产品发布等' },
  { name: '文化艺术', icon: 'palette', sortOrder: 4, description: '展览演出、文化体验、影视活动等' },
  { name: '体育健身', icon: 'dumbbell', sortOrder: 5, description: '运动赛事、健身活动、运动体验等' },
  { name: '亲子家庭', icon: 'baby', sortOrder: 6, description: '亲子活动、儿童教育、家庭出游等' },
  { name: '公益慈善', icon: 'heart', sortOrder: 7, description: '公益活动、社区活动等' },
  { name: '展览展销', icon: 'shopping-bag', sortOrder: 8, description: '展会展览、市集活动等' },
  { name: '娱乐休闲', icon: 'gamepad-2', sortOrder: 9, description: '户外活动、游戏竞技、休闲体验等' },
  { name: '行业专业', icon: 'building', sortOrder: 10, description: '创新创业、行业培训等' },
];

async function initCategories() {
  await dataSource.initialize();
  
  const categoryRepository = dataSource.getRepository(Category);
  
  for (const categoryData of categories) {
    const existingCategory = await categoryRepository.findOne({
      where: { name: categoryData.name }
    });
    
    if (!existingCategory) {
      const category = new Category();
      category.name = categoryData.name;
      category.icon = categoryData.icon;
      category.sortOrder = categoryData.sortOrder;
      category.description = categoryData.description;
      await categoryRepository.save(category);
      console.log(`Created category: ${categoryData.name}`);
    } else {
      console.log(`Category already exists: ${categoryData.name}`);
    }
  }
  
  await dataSource.destroy();
  console.log('Categories initialization completed!');
}

initCategories().catch(console.error);