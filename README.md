# 孩子学到的一切 · 小学知识图谱

一张可旋转、可探索的 3D 知识图谱：每个圆点是一个课程概念，按学科着色、按年龄分层，连线表示"学会这个之前必须先学会什么"。点任意圆点即可追溯它的全部前置知识链路。

基于国家义务教育课程方案整理，方便家长按图索骥。

## 目录结构

```
index.html              页面骨架（HTML）
style.css               全部样式
app.js                  3D 渲染引擎与交互逻辑
data/
  subjects.json          学科定义（key / 名称 / 配色）
  concepts.json          概念节点（图谱的「点」）
  dependencies.json      前置依赖（图谱的「边」）
  manifest.json          计数、年龄范围、SHA-256 校验和（自动生成）
schema/
  subjects.schema.json   学科 JSON Schema
  concepts.schema.json   概念 JSON Schema
  dependencies.schema.json  依赖 JSON Schema
scripts/
  validate.py            数据完整性校验（无依赖，仅需 Python 3）
  build_bundle.py        生成 manifest.json 与 dist/data.js
dist/
  data.js                渲染用打包数据（window.KID_DATA，自动生成）
```

数据与渲染彻底分离：`data/*.json` 是纯数据，`schema/*.json` 是约定规格，`app.js` 只负责读取 `dist/data.js` 并绘制。

## 准备数据

数据由三份 JSON 文件组成，每份都有对应的 JSON Schema 约束。扫描新书时只需产出符合规格的数据即可并入图谱。数据模型、字段说明及扫描流程详见 **[数据录入指南](数据录入指南.md)**。

## 校验

```bash
python3 scripts/validate.py
```

无依赖（仅需 Python 3），校验内容：

- 声明计数与实际数量一致
- 学科 `key` 唯一且被概念正确引用
- 概念 `id` 唯一、字段完整
- 依赖端点可解析（无悬空引用）
- 无自依赖、无重复边
- 有向无环检测（Kahn 拓扑排序）

## 构建打包

```bash
python3 scripts/build_bundle.py
```

- 重新生成 `data/manifest.json`（计数、年龄范围、各文件 SHA-256）
- 生成 `dist/data.js`（`window.KID_DATA`，供 `index.html` 通过 `<script>` 加载）

> 每次修改 `data/*.json` 后需重新构建，否则页面不会更新。

## 本地运行

无需安装任何依赖，只需 Python 3：

```bash
python3 -m http.server 8000
```

浏览器打开 **http://localhost:8000** 即可。

也可以直接双击 `index.html` 用 `file://` 打开——`dist/data.js` 经 `<script>` 加载，不依赖服务器。

### 操作方式

- **拖动** — 旋转图谱
- **右键拖动** — 平移
- **滚轮** — 缩放
- **点圆点** — 查看该概念的前置知识链路
- **双击空白** — 复位视角

## 部署

纯静态站点，任意静态文件托管服务均可。

### GitHub Pages

```bash
git push origin main
# 仓库 Settings → Pages → Source: Deploy from branch → main / root
```

访问 `https://<用户名>.github.io/<仓库名>/`。

### Netlify / Vercel / Cloudflare Pages

- 构建命令：`python3 scripts/build_bundle.py`
- 输出目录：`.`（根目录）
- 或直接拖拽整个目录上传（已包含 `dist/data.js` 时无需构建命令）

### Nginx

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/kid;
    index index.html;
}
```

### 对象存储

将整个目录上传至 S3 / OSS / COS 等对象存储，开启静态网站托管即可。确保 `index.html`、`style.css`、`app.js`、`dist/data.js` 均已上传。

## 技术栈

- 纯 HTML / CSS / JavaScript，零运行时依赖
- Canvas 2D 伪 3D 投影渲染
- Python 3 脚本（仅用于数据校验与打包，非运行时）
- JSON Schema 约定数据规格

## 许可

数据与代码均可自由使用。
