# 废铅蓄电池供应链服务系统

这是一个基于 Vue 3 + TypeScript + Vite 的前端门户，围绕废铅蓄电池供应链的地图监管、AI 预测、图片真伪检查、AI 比价、库房距离监测和用户权限管理展开。

系统以登录和权限控制为核心，顶部导航会根据当前账号权限动态展示可用模块；具备相应权限的账号可以进入用户管理、角色管理与权限字段维护。

## 功能概览

- 电子地图：展示库房、冶炼厂等点位，支持比价、路径流向、点位搜索、省份筛选和地图工具。
- AI 预测：包含历史数据管理、历史数据查询、送货量预测三个子功能。
- 图片真伪检查：在门户内嵌独立的图像真伪检测子应用。
- AI 比价系统：通过 iframe 嵌入独立的比价子系统，入口受权限控制。
- 库房距离监测配置：维护源库房到对标库房的单向绑定关系，并展示距离数据。
- 用户管理：支持账号管理、角色管理、权限分配、权限字段定义维护。

## 目录说明

- `src/App.vue`：门户主入口、登录门禁、权限导航、嵌入页切换。
- `src/pages/ElectronicMap.vue`：电子地图主页面。
- `src/pages/HistoryManage.vue`：AI 预测 - 历史数据管理。
- `src/pages/HistoryQuery.vue`：AI 预测 - 历史数据查询。
- `src/pages/PurchaseQuantity.vue`：AI 预测 - 送货量预测。
- `src/components/WarehouseDistanceConfig.vue`：库房距离监测配置。
- `src/pages/UserManage.vue`：用户管理。
- `src/components/RoleManagePanel.vue`：角色管理与权限分配。
- `PD_max_fronted/`：图片真伪检查独立子工程。
- `public/embedded/`：嵌入式静态站点产物。

## 常用脚本

```bash
npm run dev
npm run build
npm run preview
npm run seed:permissions
npm run seed:permissions:dry
```

## 说明

- 主门户会在登录后加载当前用户权限，再显示可用导航。
- 图片检测和 AI 比价通过嵌入静态站点方式接入主门户。
- 具体功能说明以 [项目功能简介.md](项目功能简介.md) 为准。
