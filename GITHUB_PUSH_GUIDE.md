# 📤 推送到 GitHub 指南

## 🎯 快速推送（3 步完成）

### 步骤 1：在 GitHub 创建仓库

**访问：** https://github.com/new

**填写信息：**
- **仓库名：** `twitter-scraper-pro`
- **描述：** Twitter/Reddit 智能抓取工具 - Chrome 扩展
- **可见性：** Public（公开）或 Private（私有）
- ❌ **不要勾选** "Add a README file"
- ❌ **不要勾选** "Add .gitignore"
- ❌ **不要勾选** "Choose a license"

**点击：** "Create repository"

---

### 步骤 2：获取 Personal Access Token

**访问：** https://github.com/settings/tokens

**步骤：**
1. 点击 "Generate new token" → "Generate new token (classic)"
2. **Note：** 填写 `Twitter Scraper Pro Push`
3. **Expiration：** 选择 `90 days` 或 `No expiration`
4. **Permissions：** 勾选 `repo` (Full control of private repositories)
5. 点击 "Generate token"
6. **复制 Token**（格式：`ghp_xxxxxxxxxxxx`）
   - ⚠️ **只显示一次！请保存好**

---

### 步骤 3：执行推送

**打开命令行，执行：**

```bash
cd "E:\Vibe coding\intel\twitter-scraper-extension-v2"
git push -u origin master
```

**输入凭证：**
- **Username:** `LegionZYX`
- **Password:** 粘贴刚才复制的 Token（不会显示）

**成功输出：**
```
Enumerating objects: 123, done.
Counting objects: 100% (123/123), done.
...
To https://github.com/LegionZYX/twitter-scraper-pro.git
 * [new branch]      master -> master
Branch 'master' set up to track remote branch 'master' from 'origin'.
```

---

## ✅ 验证推送

**访问你的仓库：**
https://github.com/LegionZYX/twitter-scraper-pro

**应该看到：**
- ✅ 所有代码文件
- ✅ README.md 显示
- ✅ 提交历史

---

## 🐛 故障排除

### 问题 1：仓库不存在

**错误：**
```
remote: Repository not found.
fatal: repository 'https://github.com/LegionZYX/twitter-scraper-pro.git/' not found
```

**解决：**
1. 访问 https://github.com/new
2. 创建仓库 `twitter-scraper-pro`
3. 不要初始化
4. 重新推送

---

### 问题 2：认证失败

**错误：**
```
remote: Invalid username or password.
fatal: Authentication failed
```

**解决：**
1. 重新获取 Token：https://github.com/settings/tokens
2. 确保勾选了 `repo` 权限
3. 推送时使用 Token 作为密码

---

### 问题 3：网络超时

**错误：**
```
fatal: unable to access 'https://github.com/...': Failed to connect
```

**解决：**
```bash
# 增加 Git 超时时间
git config --global http.postBuffer 524288000

# 重试推送
git push -u origin master
```

---

### 问题 4：远程仓库已存在

**错误：**
```
fatal: remote origin already exists.
```

**解决：**
```bash
# 删除旧配置
git remote remove origin

# 重新添加
git remote add origin https://github.com/LegionZYX/twitter-scraper-pro.git

# 推送
git push -u origin master
```

---

## 🔄 后续更新推送

**修改代码后推送：**

```bash
git add -A
git commit -m "描述你的改动"
git push
```

**示例：**
```bash
git add -A
git commit -m "feat: 添加新功能"
git push
```

---

## 📊 仓库统计

推送完成后，GitHub 会显示：
- 📦 文件大小
- 📅 提交历史
- 👥 贡献者
- ⭐ Stars
- 🍴 Forks

---

## 🔗 快速链接

| 链接 | 说明 |
|------|------|
| https://github.com/new | 创建新仓库 |
| https://github.com/settings/tokens | 获取 Token |
| https://github.com/LegionZYX/twitter-scraper-pro | 你的仓库 |

---

**最后更新：** 2026-02-27
