# Heybo Smart Pet UI — V1.0

> 以宠物为中心的智能健康管理仪表盘，基于 IoT 传感器数据提供实时健康预警。

## ✨ V1.0 核心功能

### 🐱 宠物档案管理
- 宠物名称（可编辑）+ 头像上传
- 16 个猫咪品种选择（含孟加拉豹猫、缅因猫等），支持自定义品种
- 生日记录（年/月/日）

### 📊 健康数据可视化（3 大图表）
- **猫砂盆趋势图**：体重 + 排便/排尿次数与重量（7 个时间维度）
- **喂食喂水图**：喂食量 + 饮水量趋势对比
- **全生命周期成长曲线**：品种标准区间（随品种动态更新）vs 传感器实测数据

### 🏥 AI 健康预警引擎
实时分析 4 大核心指标（体重、食量、饮水量、如厕频率），识别 5 大疾病模式：

| 疾病模式 | 核心信号 |
|---|---|
| 慢性肾脏病 (CKD) | 多饮 + 体重下降 |
| 糖尿病 | 多饮 + 多食 + 体重下降 |
| 甲状腺功能亢进 | 多食 + 体重下降 |
| FLUTD / 尿路梗阻 | 食减 + 频繁排尿 |
| 慢性胰腺炎 | 食减 + 饮水不降反升 |

**急性 vs 慢性判断**：对比今日数据与品种标准 + 7日个人基线，自动分级预警。

### 🔬 演示调试模式
- 当日传感器数据面板可实时编辑，验证预警逻辑

---

## 🚀 快速开始

### 前提条件
- Node.js 18+
- npm 9+

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/<your-username>/smart-pet-ui.git
cd smart-pet-ui

# 启动后端
cd backend
npm install
npm run dev   # 运行在 http://localhost:3000

# 启动前端（新终端）
cd ../frontend
npm install
npm run dev   # 运行在 http://localhost:5173
```

### 演示账号
- 邮箱：`demo@pet.com`
- 密码：`123456`

---

## 🗂️ 项目结构

```
smart-pet-ui/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── PetHeaderInfo.jsx       # 宠物档案 + 品种选择 + 头像
│       │   ├── HealthSummaryCards.jsx  # 今日数据快览卡片
│       │   ├── LitterBoxChart.jsx      # 猫砂盆数据图表
│       │   ├── DietWaterChart.jsx      # 喂食喂水图表
│       │   ├── GrowthChart.jsx         # 生命周期成长曲线
│       │   ├── EditableSensorPanel.jsx # 可编辑传感器数据面板
│       │   └── HealthAdvice.jsx        # AI 综合健康建议
│       ├── data/
│       │   ├── breedStandards.js       # 16 品种生理标准数据库
│       │   └── healthEngine.js         # 健康分析引擎
│       └── pages/
│           ├── Dashboard.jsx           # 主仪表盘页面
│           └── Login.jsx               # 登录页面
├── backend/
│   ├── server.js
│   └── data/
│       └── mockData.js
└── docs/
    ├── 2_PRD.md                        # 产品需求文档
    └── 3_Architecture.md               # 架构文档
```

---

## 🛠️ 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 18 + Vite 5 |
| 样式 | Tailwind CSS 3 + Glassmorphism |
| 图表 | Recharts |
| 图标 | Lucide React |
| 路由 | React Router 6 |
| 后端 | Express.js + JWT |

---

## 📋 版本历史

### V1.0 (2026-04-06)
- 初始发布
- 宠物档案管理（16 品种数据库）
- 3 大健康数据图表
- AI 健康预警引擎（5 大疾病模式识别）
- 急性/慢性自动分级预警
- 可编辑传感器数据演示面板

---

*Built with ❤️ for cats everywhere.*
