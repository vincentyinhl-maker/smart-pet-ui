# 智能宠物用品 - 系统架构设计

**状态**: 初稿
**作者**: 资深软件架构师 (Software Architect)

## 1. 技术选型建议
- **前端 (Web/App UI)**: React + Tailwind CSS (Vite 作为构建工具)，考虑到未来易于通过 Capacitor/React Native 转换为原生 App。
- **后端 (API 服务)**: Node.js + Express。轻量、非阻塞 I/O 优势适合 IoT 事件通信。
- **数据库**: MongoDB (可通过 Mongoose 操作) 或轻量级 JSON 存储以快速跑通 MVP。
- **通信协议**:
  - Web端与后端短连接：HTTP/HTTPS + RESTful API
  - 实控与实时状态更新：WebSocket / MQTT (鉴于本次轻量化，前期以模拟 REST 或者简易 WebSocket 替代)
- **鉴权方案**: JWT (JSON Web Token)，实现无状态认证。

## 2. 系统架构图设计 (Mermaid)

```mermaid
graph TD
    %% Frontend
    subgraph Frontend [移动端 Web UI (React + Tailwind)]
        A1(登录/设置页)
        A2(设备主页)
        A3(远程控制/视频页)
    end
    
    %% API Gateway & Backend
    subgraph Backend [Node.js Express 服务端]
        B1(Auth API - JWT验证)
        B2(Device API - 状态查询/控制)
        B3(History API - 数据日志记录)
        
        B1 --- B2
        B2 --- B3
    end
    
    %% Database
    subgraph Data [数据持久层]
        C1[(MongoDB/Firebase)]
    end
    
    %% IoT Hardware Mock
    subgraph Hardware [智能硬件终端 / Mock]
        D1[智能喂食器]
        D2[监控摄像头]
    end

    Frontend -- HTTP/REST (JWT) --> Backend
    Backend -- Mongoose/SDK --> Data
    Backend -- MQTT / HTTPS --> Hardware
```

## 3. 核心模块划分与接口设计初稿

**UI模块**：
- `AuthModule` (包含登录鉴权UI与请求逻辑)
- `DashboardModule` (设备状态轮询与总览)
- `ControlModule` (视频渲染窗，命令下发面板，历史列表)

**API规范初步**：
1. `POST /api/login`: `(email, password) => { token, user }`
2. `GET /api/devices`: `(header: Authorization) => { devices: [...] }`
3. `POST /api/feed`: `(deviceId, amount) => { status: "success", timestamp }`
4. `GET /api/history`: `(deviceId, limit) => { records: [...] }`

## 4. 安全与通信协议建议
- **HTTPS加密传输**：前后端务必采用 HTTPS。
- **设备双向认证**：设备端使用 MQTT TLS 加密连接，避免局域网或公网被劫持操作。
- **防重放攻击**：`/api/feed` 手动喂食接口应带唯一 nonce（随机数）或时间戳防重放，防止网络卡顿导致的重复出粮危险。
