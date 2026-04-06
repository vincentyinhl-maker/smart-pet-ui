export const mockDevices = [
  { id: "dev_001", name: "主卧智能喂食器", status: "online", foodLevel: 65, lastFed: "2023-10-27T08:30:00Z", type: "feeder" },
  { id: "dev_002", name: "客厅监控摄像头", status: "online", type: "camera" }
];

export const mockHistory = [
  { id: "his_001", deviceId: "dev_001", amount: 15, timestamp: "2023-10-27T08:30:00Z", target: "手动喂食" },
  { id: "his_002", deviceId: "dev_001", amount: 20, timestamp: "2023-10-26T20:00:00Z", target: "计划喂食" },
  { id: "his_003", deviceId: "dev_001", amount: 20, timestamp: "2023-10-26T08:00:00Z", target: "计划喂食" }
];
