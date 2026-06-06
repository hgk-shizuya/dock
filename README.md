# Dock

macOS 菜单栏项目启动器 — 扫描本地端口，一键管理并启动 Web 项目。

## 功能

- 🗼 **菜单栏托盘** — 灯塔图标，下拉显示所有项目及在线状态
- 🔍 **端口扫描** — 自动检测本地监听端口 + 工作目录
- 📦 **项目管理** — 增删改查、批量添加/删除、拖动排序
- 🎨 **双视图** — 方形卡片 / 长条列表，一键切换
- 🌓 **深色/浅色主题** — 设置窗口同步切换
- 📁 **Finder 定位** — 一键在 Finder 中打开项目路径
- 📤 **导入/导出** — JSON 配置文件备份

## 安装

下载 [最新 DMG](https://github.com/xuhyd-code/dock/releases) 拖入 Applications。

## 开发

```bash
npm install
npm start
```

## 技术栈

- Electron + 原生 HTML/CSS/JS
- lsof 端口检测
- electron-builder 打包
