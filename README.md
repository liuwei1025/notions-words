# Notions Words - 智能翻译助手

一个功能强大的浏览器翻译插件，支持将单词和翻译结果保存到Notion数据库。采用 Feature-Sliced Design (FSD) 架构设计，提供优雅的用户体验。

## ✨ 功能特性

### 🔤 智能文本选择
- 自动检测用户选中的文本
- 支持鼠标和键盘选择
- 智能过滤有效单词
- 提取上下文信息

### 🌐 多平台翻译
- 支持 Google 翻译、DeepL、有道翻译
- 智能语言检测
- 翻译缓存机制
- 质量评估系统

### 📚 Notion 集成
- 自动同步到 Notion 数据库
- 可配置字段映射
- 批量同步支持
- 同步状态管理

### ⚙️ 灵活配置
- 自定义翻译语言
- 快捷键设置
- 主题切换
- 触发模式选择

## 🏗️ 架构设计

本项目采用 Feature-Sliced Design (FSD) 架构，具有良好的可维护性和可扩展性：

```
src/
├── app/                    # 应用层 - 应用配置
│   ├── manifest.json       # Chrome扩展配置
│   ├── background/         # 后台脚本
│   ├── content/           # 内容脚本
│   ├── popup/             # 弹窗页面
│   └── options/           # 选项页面
├── pages/                 # 页面层 - 完整页面
├── widgets/               # 组件层 - 复合组件
│   ├── TranslationCard/   # 翻译结果卡片
│   ├── SettingsPanel/     # 设置面板
│   └── NotionSaveDialog/  # Notion保存对话框
├── features/              # 功能层 - 业务功能
│   ├── text-selection/    # 文本选择检测
│   ├── translation/       # 翻译功能
│   ├── notion-sync/       # Notion同步
│   └── settings-config/   # 配置管理
├── entities/              # 实体层 - 业务实体
│   ├── word/              # 单词实体
│   ├── translation/       # 翻译实体
│   ├── notion-record/     # Notion记录实体
│   └── user-config/       # 用户配置实体
└── shared/                # 共享层 - 通用代码
    ├── api/               # API接口
    ├── ui/                # 基础组件
    ├── lib/               # 工具函数
    └── config/            # 常量配置
```

## 🚀 技术栈

- **框架**: Chrome Extension (Manifest V3) + TypeScript + React
- **构建工具**: Vite + CRXJS
- **样式**: Tailwind CSS
- **翻译API**: Google Translate API / DeepL API
- **存储**: Notion API + Chrome Storage

## 📦 安装使用

### 开发环境

1. 克隆项目
```bash
git clone https://github.com/your-username/notions-words.git
cd notions-words
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 在 Chrome 中加载扩展
   - 打开 `chrome://extensions/`
   - 启用开发者模式
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

### 生产构建

```bash
npm run build
```

## ⚙️ 配置指南

### 翻译API配置

1. **Google 翻译**
   - 获取 Google Cloud Translation API 密钥
   - 在插件选项页面中配置API密钥

2. **DeepL**（即将支持）
   - 注册 DeepL API 账户
   - 获取API密钥

### Notion集成配置

1. 创建 Notion 集成
   - 访问 [Notion Developers](https://developers.notion.com/)
   - 创建新的集成，获取API Token

2. 准备数据库
   - 在 Notion 中创建数据库
   - 添加以下字段：
     - 单词 (Title)
     - 翻译 (Text)
     - 例句 (Text)
     - 来源链接 (URL)
     - 标签 (Multi-select)
     - 备注 (Text)
     - 熟练度 (Number)
     - 创建时间 (Date)

3. 配置字段映射
   - 在插件选项页面中配置字段映射关系

## 🎯 使用方法

### 基本翻译

1. 在任意网页上选中文本
2. 等待翻译卡片弹出（自动模式）或按快捷键（手动模式）
3. 查看翻译结果

### 保存到Notion

1. 完成翻译后，点击翻译卡片中的"保存"按钮
2. 可选择添加标签、备注等信息
3. 确认保存到Notion数据库

### 快捷键

- `Ctrl+Shift+T` (Mac: `Cmd+Shift+T`) - 翻译选中文本
- `Ctrl+Shift+A` (Mac: `Cmd+Shift+A`) - 切换自动翻译模式
- `Ctrl+Shift+S` (Mac: `Cmd+Shift+S`) - 快速保存到Notion
- `Esc` - 关闭翻译卡片

## 🔧 开发指南

### 添加新的翻译提供商

1. 在 `src/shared/api/translation/` 中创建新的API客户端
2. 实现 `ITranslationAPI` 接口
3. 在 `TranslationAPIFactory` 中注册新提供商
4. 更新 `TranslationProvider` 枚举

### 添加新功能

1. 在对应的 FSD 层级创建功能模块
2. 遵循既定的文件结构和命名规范
3. 添加相应的类型定义
4. 编写单元测试

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 使用 Prettier 格式化代码
- 编写 JSDoc 注释

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)
- [Notion API](https://developers.notion.com/)
- [Google Translate API](https://cloud.google.com/translate)
- [Feature-Sliced Design](https://feature-sliced.design/)

## 📞 支持

如有问题或建议，请：

- 提交 [Issue](https://github.com/your-username/notions-words/issues)
- 发起 [Discussion](https://github.com/your-username/notions-words/discussions)
- 联系维护者

---

**Notions Words** - 让语言学习更高效 🚀 