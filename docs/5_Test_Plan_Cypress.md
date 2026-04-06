# 智能宠物用品集成与自动化测试方案

**状态**: 初稿
**作者**: 测试经理 (QA/Test Manager)

## 1. 功能测试用例 (主要流程)

| 用例编号 | 测试模块 | 测试场景 | 预期结果 |
| --- | --- | --- | --- |
| TC-01 | 登录模块 | 输入正确的默认邮箱与密码登录 | 成功跳转到设备主页Dashboard |
| TC-02 | 登录模块 | 输入错误的密码 | 留在登录页，提示“邮箱或密码错误” |
| TC-03 | 设备列表 | 用户登录后查看设备主页 | 成功获取并渲染模拟喂食器设备，显示余粮属性 |
| TC-04 | 远程控制 | 点击“手动喂食”并设定克数 | 弹出出粮成功提示动画并自动刷新喂食历史记录 |
| TC-05 | 远程控制 | 点击进入非喂食设备(如摄像头)的控制台 | UI兼容或拦截无效的出粮操作 |

## 2. 自动化测试脚本 (Cypress E2E 示例)

我们采用 Cypress 进行前端E2E自动化测试以保障核心交易链路稳定：

```javascript
// cypress/e2e/pet_feeder.cy.js

describe('Smart Pet App Core Flows', () => {
  beforeEach(() => {
    // 拦截API避免真实触发，使用mock数据
    cy.intercept('POST', '/api/login').as('loginReq');
    cy.intercept('GET', '/api/devices').as('devicesReq');
    cy.intercept('POST', '/api/feed').as('feedReq');
  });

  it('Should login and display devices', () => {
    cy.visit('http://localhost:5173/login');
    
    // 登录动作
    cy.get('input[type="email"]').type('demo@pet.com');
    cy.get('input[type="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@loginReq').its('response.statusCode').should('eq', 200);
    
    // 验证 Dashboard 渲染
    cy.url().should('eq', 'http://localhost:5173/');
    cy.contains('我的设备').should('be.visible');
    cy.wait('@devicesReq');
    cy.contains('在线').should('be.visible');
  });

  it('Should successfully trigger manual feeding', () => {
    cy.login('demo@pet.com', '123456'); // 假设封装了自定义login命令
    cy.visit('http://localhost:5173/');
    
    // 点击设备进入详情
    cy.contains('主卧智能喂食器').click();
    cy.url().should('include', '/control/');
    
    // 触发喂食动作
    cy.contains('出粮').click();
    
    // 验证API请求及UI反馈
    cy.wait('@feedReq').then((interception) => {
      expect(interception.request.body.amount).to.eq(20);
      expect(interception.response.statusCode).to.eq(200);
    });
    
    cy.contains('出粮成功').should('be.visible');
    cy.contains('手动喂食').should('be.visible'); // 历史记录新增
  });
});
```

## 3. 测试覆盖率目标
- **Frontend 分层覆盖**: 
  - 组件UI单元测试 (Jest/RTL): >75%
  - 核心业务流程 (Cypress E2E): >90%
- **Backend API**: 采用 Jest + Supertest 保证接口测试覆盖率 >85%。

## 4. 测试报告模板结构
- **测试通过率**: [X]%
- **发现缺陷数**: P0(0), P1(1), P2(3)
- **风险提示**: 当前未涵盖硬件真实弱网环境下的出粮成功回执状态上报，极小概率导致前端UI已成功但实际未出粮的假象，建议下阶段增加前端长轮询补偿机制。
