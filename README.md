# 🎪 活动平台系统

一个基于全栈技术开发的活动管理平台，支持活动创建、报名、支付、结算等完整业务流程。

---

## ✨ 功能特性

### 👤 用户系统
- 用户注册与登录
- 角色管理（普通用户 / 组织者 / 管理员）
- 个人中心与资料编辑
- 密码修改功能

### 📅 活动管理
- 活动创建与编辑
- 活动状态管理（进行中 / 已结束）
- 活动搜索与分类筛选
- 首页推荐活动展示

### 🎟️ 报名票务
- 在线报名系统
- 电子票生成与展示
- 签到功能
- 票种管理

### 💳 支付结算
- 在线支付接口
- 自动结算系统
- 平台手续费管理
- 钱包余额管理

### 💬 互动交流
- 实时聊天室
- 活动评论与评分
- 活动收藏
- 点赞功能

### 🔔 通知系统
- 活动通知推送
- 结算通知
- 消息管理

---

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI框架**: Tailwind CSS 3
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios

### 后端
- **框架**: Node.js + Express + TypeScript
- **ORM**: TypeORM
- **数据库**: SQLite
- **认证**: JWT Token
- **密码加密**: bcryptjs

### 开发工具
- **编辑器**: VS Code
- **版本控制**: Git + GitHub
- **API测试**: Postman

---

## 📊 数据库表结构

| 分类 | 表名 | 说明 |
|------|------|------|
| 用户中心 | `user`, `wallet`, `wallet_transaction` | 用户信息、钱包、交易记录 |
| 活动核心 | `event`, `ticket` | 活动信息、票种管理 |
| 报名票务 | `registration`, `checkin` | 报名记录、签到记录 |
| 支付结算 | `payment`, `settlement` | 支付记录、结算记录 |
| 互动交流 | `comment`, `rating`, `event_like`, `favorite` | 评论、评分、点赞、收藏 |
| 通知消息 | `notification`, `chat_message` | 通知、聊天消息 |

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/3214883/anon.git
cd anon
```

#### 2. 安装依赖

**后端依赖**
```bash
cd backend
npm install
```

**前端依赖**
```bash
cd vue-project
npm install
```

#### 3. 启动项目

**启动后端服务**（端口：3000）
```bash
cd backend
npm run dev
```

**启动前端服务**（端口：5173）
```bash
cd vue-project
npm run dev
```

#### 4. 访问项目
- 前端页面：http://localhost:5173
- 后端 API：http://localhost:3000

---

## 🔑 默认账户

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 组织者 | organizer | 123456 |
| 普通用户 | user | 123456 |

---

## 📁 项目结构

```
event-platform/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── controllers/        # 控制器
│   │   ├── routes/             # 路由
│   │   ├── models/             # 数据模型
│   │   ├── middleware/         # 中间件
│   │   ├── services/           # 服务层
│   │   └── config/             # 配置文件
│   ├── package.json
│   └── tsconfig.json
├── vue-project/                # 前端应用
│   ├── src/
│   │   ├── views/              # 页面组件
│   │   ├── components/         # 通用组件
│   │   ├── stores/             # 状态管理
│   │   ├── router/             # 路由配置
│   │   └── api/                # API请求
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 📜 API 接口

### 用户认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册

### 活动管理
- `GET /api/events` - 获取活动列表
- `POST /api/events` - 创建活动
- `GET /api/events/:id` - 获取活动详情
- `PUT /api/events/:id` - 更新活动

### 报名系统
- `POST /api/registrations` - 创建报名
- `GET /api/registrations` - 获取报名列表

### 支付结算
- `POST /api/payments` - 创建支付
- `GET /api/settlements` - 获取结算列表

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues: https://github.com/3214883/anon/issues
