# 数据库表结构说明文档

## 总览

当前数据库共 15 张表，全部已投入使用，无空表。

============================================================================

## 1. 用户表 (user)

字段名       类型       可为空     描述
------------------------------------------------------------------------
id           INTEGER    否         用户ID，自增主键
username     VARCHAR    否         用户名/昵称
email        VARCHAR    是         邮箱地址
phone        VARCHAR    是         手机号码
password     VARCHAR    否         密码
avatar       VARCHAR    是         头像URL
coverImage   VARCHAR    是         个人主页封面图
gender       TINYINT    是         性别：0未知 1男 2女
birthday     DATE       是         生日
bio          TEXT       是         个人简介
location     VARCHAR    是         所在地
role         VARCHAR    否         角色：user普通用户 admin管理员
isActive     TINYINT    否         状态：0封禁 1正常
contact      VARCHAR    是         联系方式
address      VARCHAR    是         联系地址
createdAt    DATETIME   否         创建时间
updatedAt    DATETIME   否         更新时间

============================================================================

## 2. 活动表 (event)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         活动ID，自增主键
title              VARCHAR    否         活动标题
description        TEXT       是         活动详情描述
date               DATE       否         活动日期
time               VARCHAR    否         开始时间
endTime            VARCHAR    是         结束时间
location           VARCHAR    否         活动地点
latitude           DOUBLE     是         纬度
longitude          DOUBLE     是         经度
price              DECIMAL    否         报名费（0为免费）
capacity           INTEGER    否         最大人数
image              VARCHAR    是         活动图片URL
coverImage         VARCHAR    是         活动封面大图
category           VARCHAR    是         活动分类
tags               VARCHAR    是         标签，逗号分隔
status             VARCHAR    否         pending审核中 active已上线 rejected已拒绝
visibility         VARCHAR    否         public公开 private私有
organizerId        INTEGER    否         主办方用户ID
registeredCount    INTEGER    否         已报名人数
viewCount          INTEGER    否         浏览次数
isSponsored        TINYINT    否         是否首页推荐：0否 1是
createdAt          DATETIME   否         创建时间
updatedAt          DATETIME   否         更新时间

============================================================================

## 3. 报名表 (registration)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         报名ID，自增主键
eventId            INTEGER    否         活动ID
userId             INTEGER    否         用户ID
status             VARCHAR    否         registered已报名 cancelled已取消 attended已出席
ticketTypeId       INTEGER    是         票种ID
quantity           INTEGER    否         购票数量
totalAmount        DECIMAL    否         总金额
paymentId          INTEGER    是         关联支付ID
paymentStatus      VARCHAR    否         unpaid未支付 paid已支付 refunded已退款
checkedIn          TINYINT    否         是否已签到：0否 1是
checkedInAt        DATETIME   是         签到时间
registerName       VARCHAR    是         报名人姓名
registerPhone      VARCHAR    是         报名人电话
registerEmail      VARCHAR    是         报名人邮箱
extraData          TEXT       是         额外报名信息（JSON）
createdAt          DATETIME   否         报名时间
updatedAt          DATETIME   否         更新时间

============================================================================

## 4. 钱包表 (wallet)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         钱包ID，自增主键
userId             INTEGER    否         用户ID
balance            DECIMAL    否         账户余额
frozenBalance      DECIMAL    是         冻结余额
createdAt          DATETIME   否         创建时间
updatedAt          DATETIME   否         更新时间

============================================================================

## 5. 钱包交易记录表 (wallet_transaction)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         交易ID，自增主键
walletId           INTEGER    否         钱包ID
userId             INTEGER    否         用户ID
amount             DECIMAL    否         交易金额
type               VARCHAR    否         deposit充值 payment支付 refund退款 settlement结算 platform_fee平台手续费
description        VARCHAR    是         交易描述
status             VARCHAR    否         pending处理中 completed成功 failed失败
relatedId          INTEGER    是         关联ID（活动/订单等）
createdAt          DATETIME   否         交易时间
updatedAt          DATETIME   否         更新时间

============================================================================

## 6. 支付表 (payment)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         支付ID，自增主键
registrationId     INTEGER    否         报名ID
userId             INTEGER    否         支付用户ID
eventId            INTEGER    否         活动ID
amount             DECIMAL    否         支付金额
paymentMethod      VARCHAR    否         支付方式：alipay wechat test
transactionId      VARCHAR    是         第三方支付流水号
status             VARCHAR    否         pending处理中 completed成功 failed失败
paidAt             DATETIME   是         支付成功时间
createdAt          DATETIME   否         创建时间

============================================================================

## 7. 结算申请表 (settlement)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         结算ID，自增主键
eventId            INTEGER    否         活动ID
organizerId        INTEGER    否         主办方用户ID
totalAmount        DECIMAL    否         活动总营收
participantCount   INTEGER    否         实际参与人数
feeAmount          DECIMAL    否         平台手续费（0.5%）
settleAmount       DECIMAL    否         实际结算金额
status             VARCHAR    否         pending待审核 approved已通过 rejected已拒绝
rejectReason       VARCHAR    是         拒绝原因
approvedBy         INTEGER    是         审核管理员ID
approvedAt         DATETIME   是         审核通过时间
walletTransactionId INTEGER   是         关联钱包交易ID
createdAt          DATETIME   否         申请时间
updatedAt          DATETIME   否         更新时间

============================================================================

## 8. 门票表 (ticket)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         票种ID，自增主键
eventId            INTEGER    否         活动ID
name               VARCHAR    否         票种名称（普通票/VIP票）
description        VARCHAR    是         票种说明
price              DECIMAL    否         票价
quantity           INTEGER    否         总票数
soldCount          INTEGER    否         已售出数量
maxPerUser         INTEGER    否         每人限购数量
saleStartTime      DATETIME   是         售票开始时间
saleEndTime        DATETIME   是         售票结束时间

============================================================================

## 9. 聊天消息表 (chat_message)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         消息ID，自增主键
eventId            INTEGER    否         活动聊天室ID
userId             INTEGER    否         发送用户ID
content            TEXT       否         消息内容
createdAt          DATETIME   否         发送时间

============================================================================

## 10. 通知表 (notification)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         通知ID，自增主键
userId             INTEGER    否         接收用户ID
type               VARCHAR    否         通知类型
title              VARCHAR    否         通知标题
content            TEXT       否         通知内容
read               TINYINT    否         是否已读：0未读 1已读
createdAt          DATETIME   否         创建时间

============================================================================

## 11. 评论表 (comment)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         评论ID，自增主键
eventId            INTEGER    否         活动ID
userId             INTEGER    否         评论用户ID
content            TEXT       否         评论内容
parentId           INTEGER    是         父评论ID（用于回复）
likes              INTEGER    否         点赞数
isPinned           TINYINT    否         是否置顶
createdAt          DATETIME   否         评论时间
updatedAt          DATETIME   否         更新时间

============================================================================

## 12. 评分表 (rating)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         评分ID，自增主键
eventId            INTEGER    否         活动ID
userId             INTEGER    否         评分用户ID
score              INTEGER    否         评分：1-5星
content            TEXT       是         评价内容
createdAt          DATETIME   否         评分时间

============================================================================

## 13. 活动点赞表 (event_like)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         点赞ID，自增主键
eventId            INTEGER    否         活动ID
userId             INTEGER    否         点赞用户ID
createdAt          DATETIME   否         点赞时间

============================================================================

## 14. 收藏表 (favorite)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         收藏ID，自增主键
eventId            INTEGER    否         活动ID
userId             INTEGER    否         收藏用户ID
createdAt          DATETIME   否         收藏时间

============================================================================

## 15. 签到表 (checkin)

字段名             类型       可为空     描述
------------------------------------------------------------------------
id                 INTEGER    否         签到ID，自增主键
eventId            INTEGER    否         活动ID
userId             INTEGER    否         签到用户ID
latitude           DOUBLE     是         签到纬度
longitude          DOUBLE     是         签到经度
createdAt          DATETIME   否         签到时间

============================================================================

## 实体关系图


user (1) ---< (N) registration >--- (1) event
  |                          |
  |                          |
  +---< (N) wallet           +---< (N) payment
        |
        +---< (N) wallet_transaction
  |
  +---< (N) settlement (organizerId)
  |
  +---< (N) comment
  +---< (N) rating
  +---< (N) event_like
  +---< (N) favorite
  +---< (N) checkin
  +---< (N) chat_message

event (1) ---< (N) ticket
event (1) ---< (N) settlement


============================================================================

## 数据库状态

总表数      15 张（全部投入使用）
总数据量    约 182 条记录
清理状态    已删除 4 个冗余空表
空表数      0 张
