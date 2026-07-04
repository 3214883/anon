const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [__dirname + '/src/models/*.ts'],
  synchronize: false,
  logging: true,
});

const resetAdminPassword = async () => {
  try {
    await dataSource.initialize();
    console.log('数据库连接成功');

    const userRepository = dataSource.getRepository('User');
    
    // 查看所有用户
    const allUsers = await userRepository.find();
    console.log('\n所有用户:');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}, 角色: ${user.role}, 密码: ${user.password}, 状态: ${user.isActive ? '激活' : '禁用'}`);
    });

    // 查找或创建管理员账号 2230053853@qq.com
    let admin = await userRepository.findOne({ where: { email: '2230053853@qq.com' } });
    
    if (admin) {
      console.log('\n找到管理员账号，重置密码...');
      admin.password = 'admin123';
      admin.role = 'admin';
      admin.isActive = true;
      await userRepository.save(admin);
      console.log('已重置管理员 2230053853@qq.com 密码为: admin123');
    } else {
      console.log('\n未找到管理员账号，创建新账号...');
      admin = userRepository.create({
        username: '杨硕',
        email: '2230053853@qq.com',
        phone: '13800138000',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      });
      await userRepository.save(admin);
      console.log('已创建管理员账号:');
      console.log('邮箱: 2230053853@qq.com');
      console.log('密码: admin123');
    }

    // 也确保 admin@example.com 可用
    let defaultAdmin = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    if (defaultAdmin) {
      defaultAdmin.password = 'admin123';
      defaultAdmin.role = 'admin';
      defaultAdmin.isActive = true;
      await userRepository.save(defaultAdmin);
    }

    console.log('\n操作完成！');
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
};

resetAdminPassword();
