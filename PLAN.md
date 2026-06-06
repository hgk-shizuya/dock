# Dock — 本地项目启动器

## 项目概述

macOS 菜单栏应用，集中管理所有本地 Web 项目，一键打开，不用记端口。

## 交互流程

- 菜单栏显示火箭图标
- 点击弹出下拉：项目列表（名称 + 端口 + 在线/离线状态灯）
- 在线项目点击 → 浏览器打开 `localhost:{port}`
- 离线项目灰显不可点击
- 下拉底部：「管理项目」打开管理窗口 / 「退出」
- 管理窗口：项目列表卡片 + 搜索 + 添加/编辑/删除

## 核心功能

| 功能 | 说明 |
|------|------|
| 菜单栏下拉 | 点火箭图标 → 弹出项目列表 |
| 一键打开 | 在线项目用浏览器打开 |
| 在线检测 | TCP 端口检测，绿 ○ 在线 / 灰 ○ 离线 |
| 管理窗口 | 增删改查项目 + 搜索筛选 |
| 配置文件 | `~/.dock/projects.json`，手动改也生效 |
| 开机自启 | 可选，登录时自动启动（后续迭代） |

## 技术栈

- Electron — 桌面壳 + 菜单栏 + 打包 DMG
- 原生 HTML/CSS/JS — 管理窗口前端（零框架）
- electron-builder — 打包 .dmg

## 目录结构

```
project-dock/
├── package.json
├── electron-builder.yml
├── main.js              # Electron 主进程 + 菜单栏 + 配置
├── preload.js           # 安全桥接
├── lib/
│   ├── config.js        # 配置文件读写
│   ├── port-check.js    # TCP 端口检测
│   └── project-manager.js  # 项目 CRUD
├── public/
│   ├── index.html       # 管理仪表盘页面
│   └── style.css
├── assets/
│   └── icon.png         # 菜单栏图标 + 应用图标
├── prototype.html       # 交互原型（已完成）
└── PLAN.md              # 本文件
```

## 配置文件格式

```json
{
  "projects": [
    {
      "id": "a1b2c3",
      "name": "Open Claw",
      "port": 3000,
      "desc": "Claw 前端项目"
    }
  ]
}
```

## 实现步骤

1. 初始化 Electron 项目 + 安装依赖
2. 配置读写模块 + 端口检测模块
3. 菜单栏下拉（项目列表 + 状态灯 + 打开浏览器）
4. 管理窗口（增删改查 + 搜索）
5. 菜单栏图标 + 空状态处理
6. 配置 electron-builder，打包 DMG

## 交付物

`Dock-1.0.0.dmg`，拖进 Applications 即可使用。

## 对话历史摘要

- 用户需要类似 GitHub "网端起动器"的本地工具
- 否决了纯网页方案，确定要做可分发的 macOS 应用
- 最终命名：Dock
- 先做了 HTML 交互原型确认 UI 效果
- 效果满意后，开始正式开发
