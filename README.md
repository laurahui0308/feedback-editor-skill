# 页面标注编辑器

让任何人在任何网页上「圈点批注」——点击页面元素、写下修改意见、一键导出。

**零依赖 · 单文件 · 一行 `<script>` 即用**

## 为什么需要它？

设计师给开发提修改意见，截图 + 箭头 + 标注很麻烦。产品经理 review 页面，要逐条截图对齐。

有了这个工具，任何网页右上角会出现一个**铅笔图标**，点击进入标注模式，直接在页面上点击打点、写意见、保存导出。无需安装任何软件，不依赖任何框架。

## 效果

| 操作 | 说明 |
|------|------|
| 点击铅笔图标 | 进入标注模式，鼠标变为十字准星 |
| 点击页面任意位置 | 放置一枚编号标注点 |
| 输入修改意见 | 弹窗内填写意见，按 Enter 确认 |
| Delete 键 | 删除当前选中的标注点 |
| 点击保存 | 汇总所有标注，导出 JSON |

标注点颜色：黄色（未填写意见）→ 红色（已确认）

## 快速开始

### Claude Code 用户

```
/plugin marketplace add laurahui0308/feedback-editor
```

在任何项目中输入 `feedback-editor`，自动完成安装。

### 通用安装（所有 Web 项目）

**第一步** — 下载 [`feedback-editor.js`](feedback-editor.js) 放到项目的静态资源目录，如 `public/`。

**第二步** — 在入口 HTML 的 `</body>` 前加一行：

```html
<script src="/feedback-editor.js"></script>
```

Next.js 项目则在 `layout.tsx` 中：

```tsx
import Script from "next/script";
// ...
<Script src="/feedback-editor.js" />
```

**完成。** 刷新页面，右上角出现铅笔图标。

## 技术支持

- 所有现代浏览器
- 不依赖任何框架（React / Vue / 纯 HTML 均可用）
- 无需构建工具、无需 npm install
- 如果项目没有 `/api/feedback` 接口，标注自动以 JSON 文件下载

## 适用场景

- 设计师审稿标注
- 产品经理页面 review
- QA 测试缺陷定位
- 团队协作讨论 UI 细节
