# WinOJ API 接口文档

所有接口前缀为 `/api/v1`。响应格式统一为 JSON。

## 通用说明

### 认证方式

大部分接口需要在请求头中携带 JWT Token：

```
Authorization: Bearer <access_token>
```

Access Token 有效期 15 分钟，过期后通过 `POST /auth/refresh` 刷新（需携带 HttpOnly Cookie 中的 refresh_token）。

### 角色层级

```
user（用户） < teacher（教师） < admin（管理员） < su（超级管理员）
```

### 错误响应格式

```json
{
  "code": 错误码,
  "reason": "ERR_错误类型",
  "message": "错误描述"
}
```

错误码：`1`=参数错误，`2`=状态错误，`3`=未找到，`4`=限流，`5`=未认证，`6`=权限不足。

---

## 1. 认证模块 `/auth`

### POST /auth/login — 登录

无需认证。

**请求体：**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应 (200)：**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id": 1,
    "username": "admin",
    "nickname": "Super Admin",
    "role": "su"
  }
}
```

同时在 Cookie 中设置 `refresh_token`（HttpOnly）。

**错误：**
- 401：用户名或密码错误
- 403：账号已被封禁

---

### POST /auth/register — 注册

无需认证。

**请求体：**
```json
{
  "username": "newuser",
  "password": "123456",
  "nickname": "新用户"
}
```

`nickname` 为选填，默认使用 username。

**成功响应 (201)：** 同登录响应，角色为 `user`。

**校验规则：**
- 用户名：3-32 个字符，不能重复
- 密码：至少 6 个字符

---

### POST /auth/refresh — 刷新 Token

无需认证，需携带 HttpOnly Cookie 中的 refresh_token。

**请求体：** 无

**成功响应 (200)：**
```json
{
  "access_token": "新的 access_token"
}
```

同时更新 Cookie 中的 refresh_token（轮换机制，旧 token 失效）。

---

### POST /auth/logout — 退出登录

需认证。

**成功响应 (200)：**
```json
{ "message": "Logged out successfully." }
```

删除该用户所有 refresh_token 并清除 Cookie。

---

### POST /auth/change-password — 修改密码

需认证。

**请求体：**
```json
{
  "old_password": "旧密码",
  "new_password": "新密码"
}
```

**成功响应 (200)：**
```json
{ "message": "Password changed successfully." }
```

修改后所有 refresh_token 失效，需重新登录。

---

## 2. 题目模块 `/problems`

### GET /problems — 题目列表

无需认证。

**查询参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 50 | 每页数量 |
| search | string | '' | 搜索关键词（匹配标题和描述） |

**响应 (200)：**
```json
{
  "total": 100,
  "page": 1,
  "limit": 50,
  "problems": [
    {
      "id": 1,
      "title": "A + B",
      "problem_type": "traditional",
      "time_limit": 1000,
      "memory_limit": 256,
      "is_public": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /problems/:id — 题目详情

无需认证（非公开题目需教师权限）。

**响应 (200)：**
```json
{
  "id": 1,
  "title": "A + B",
  "description": "给定两个整数 A 和 B，输出它们的和",
  "input_desc": "一行两个整数",
  "output_desc": "输出一个整数",
  "time_limit": 1000,
  "memory_limit": 256,
  "problem_type": "traditional",
  "compare_mode": "text_strict",
  "test_cases_count": 4,
  "scoring_script": "..."
}
```

> 注意：`scoring_script` 和 `spj_code` 仅对教师及以上角色返回。

---

### POST /problems — 创建题目

需教师权限。

**请求体：**
```json
{
  "title": "题目标题",
  "description": "题目描述",
  "input_desc": "输入格式",
  "output_desc": "输出格式",
  "hint": "提示",
  "time_limit": 1000,
  "memory_limit": 256,
  "problem_type": "traditional",
  "compare_mode": "text_strict",
  "allowed_languages": ["cpp", "python3"],
  "is_public": true
}
```

`problem_type`：`traditional` / `interactive` / `communication` / `submit_answer`

`compare_mode`：`text_strict` / `text_relaxed` / `real_number` / `spj`

---

### PUT /problems/:id — 更新题目

需教师权限。不能更新已在比赛中的题目。

**请求体：** 同创建题目，只需传要修改的字段。

---

### DELETE /problems/:id — 删除题目

需教师权限。不能删除已在比赛中的题目。级联删除测试点和分组。

---

### POST /problems/:id/testcases — 添加测试点（内联）

需教师权限。

**请求体：**
```json
{
  "test_cases": [
    { "input_data": "1 2", "output_data": "3", "score": 25, "group_id": 1 },
    { "input_data": "10 20", "output_data": "30", "score": 25 }
  ]
}
```

`group_id` 为选填，关联到测试分组。

---

### PUT /problems/:id/testcases/:tcid — 更新测试点

需教师权限。

**请求体：**
```json
{
  "input_data": "新输入",
  "output_data": "新输出",
  "score": 50,
  "group_id": 2,
  "sort_order": 5
}
```

---

### DELETE /problems/:id/testcases/:tcid — 删除单个测试点

需教师权限。

---

### DELETE /problems/:id/testcases — 删除所有测试点

需教师权限。

---

### GET /problems/:id/testdata — 查看测试点列表

需教师权限。

**响应 (200)：**
```json
[
  {
    "id": 1,
    "input_data": "1 2",
    "output_data": "3",
    "score": 25,
    "sort_order": 1
  }
]
```

---

### POST /problems/:id/testdata — 上传测试数据文件

需教师权限。multipart/form-data，字段名 `files`，支持最多 100 个文件。

文件命名规则：`name.in` 和 `name.out` 配对，如 `1.in` / `1.out`。

---

### POST /problems/:id/groups — 创建测试分组

需教师权限。

**请求体：**
```json
{
  "subtask_id": "st1",
  "score": 30,
  "aggregator": "sum",
  "dependency": [],
  "scoring_script": ""
}
```

`aggregator`：`sum` / `min` / `max` / `min_score` / `max_time` / `custom`

`dependency`：依赖的分组 ID 数组，如 `[1, 2]` 表示必须等分组 1 和 2 都完成后才执行。

---

### PUT /problems/:id/groups/:gid — 更新测试分组

需教师权限。字段同创建。

---

### DELETE /problems/:id/groups/:gid — 删除测试分组

需教师权限。会解除该分组下所有测试点的关联，并从其他分组的依赖中移除。

---

### PUT /problems/:id/scoring-script — 设置题目级计分脚本

需教师权限。

**请求体：**
```json
{
  "scoring_script": "if @status1==AC; then @total_score=100; @final_status=AC; fi"
}
```

---

### PUT /problems/:id/testcases/:tcid/group — 设置测试点所属分组

需教师权限。

**请求体：**
```json
{ "group_id": 2 }
```

设为 `null` 或不传 `group_id` 则取消分组。

---

## 3. 提交模块 `/submissions`

### GET /submissions — 提交列表

需认证。普通用户只能看自己的提交。

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| page | int | 页码 |
| limit | int | 每页数量 |
| user_id | int | 按用户筛选（教师+） |
| problem_id | int | 按题目筛选 |
| status | string | 按状态筛选 |

**状态值：** `pending` / `running` / `judging` / `accepted` / `wrong_answer` / `time_limit_exceeded` / `memory_limit_exceeded` / `runtime_error` / `compile_error` / `system_error`

---

### GET /submissions/:id — 提交详情

需认证。普通用户只能看自己的。

**响应包含：** 提交基本信息 + `details` 数组（每个测试点的结果）+ `source_code`（非本人隐藏为 `[HIDDEN]`）。

---

### POST /submissions — 提交代码

需认证，有速率限制。

**请求体：**
```json
{
  "problem_id": 1,
  "language": "cpp",
  "source_code": "#include <iostream>..."
}
```

**成功响应 (201)：**
```json
{
  "submission_id": 1,
  "message": "Submission received and queued for judging."
}
```

提交后自动入队评测。

---

## 4. 在线编程模块 `/ide`

### GET /ide/languages — 获取可用语言列表

无需认证。

**响应 (200)：**
```json
[
  { "name": "cpp", "display_name": "C++", "extension": ".cpp" },
  { "name": "python3", "display_name": "Python 3", "extension": ".py" }
]
```

---

### POST /ide/run — 运行代码

无需认证（可选），有速率限制。时限 10 秒，内存 256MB。

**请求体：**
```json
{
  "language": "cpp",
  "source_code": "#include <iostream>\nusing namespace std;\nint main(){cout<<\"hello\";}",
  "stdin": ""
}
```

**响应 (200)：**
```json
{
  "stdout": "hello",
  "stderr": "",
  "exit_code": 0,
  "time_used": 45,
  "compile_error": false
}
```

---

## 5. 用户管理模块 `/users`

### GET /users/online — 在线用户列表

需管理员权限。返回 5 分钟内有请求的用户。

**响应 (200)：**
```json
{
  "total": 3,
  "users": [
    {
      "id": 2,
      "username": "user1",
      "nickname": "用户一",
      "role": "user",
      "lastActive": 1718000000000
    }
  ]
}
```

---

### GET /users — 用户列表

需管理员权限。

**查询参数：** `page`、`limit`、`search`、`role`

---

### PUT /users/:id/role — 修改角色

需超级管理员权限。不能修改自己的角色，不能降级另一个超级管理员。

**请求体：**
```json
{ "role": "teacher" }
```

`role` 可选值：`user` / `teacher` / `admin` / `su`

---

### POST /users/:id/ban — 封禁用户

需管理员权限，不能封禁同级或更高级用户。封禁时同时踢出登录（删除 refresh_token）。

---

### POST /users/:id/unban — 解封用户

需管理员权限。

---

### POST /users/:id/force-logout — 强制登出

需管理员权限，不能对同级或更高级用户操作。删除 refresh_token，Access Token 最长 15 分钟后失效。

---

### POST /users/:id/reset-password — 重置密码

需超级管理员权限。

**请求体：**
```json
{ "new_password": "新密码（至少6位）" }
```

---

### POST /users/sudo-login — 免密登录

需超级管理员权限。以指定用户身份生成 Token。

**请求体：**
```json
{ "user_id": 2 }
```

**响应：** 同登录响应。

---

### POST /users — 创建用户

需超级管理员权限。

**请求体：**
```json
{
  "username": "newuser",
  "password": "123456",
  "nickname": "新用户",
  "role": "teacher"
}
```

---

### DELETE /users/:id — 删除用户

需超级管理员权限。不能删除最后一个超级管理员。

---

## 6. 语言管理模块 `/languages`

### GET /languages — 语言列表

无需认证。返回所有语言（含已禁用的）。

---

### POST /languages — 添加语言

需超级管理员权限。

**请求体：**
```json
{
  "name": "rust",
  "display_name": "Rust",
  "compile_cmd": "rustc -o \"{exe}\" \"{src}\"",
  "run_cmd": "\"{exe}\"",
  "extension": ".rs"
}
```

占位符：`{src}` 源码路径，`{exe}` 可执行文件路径，`{workdir}` 工作目录。

---

### PUT /languages/:id — 更新语言

需超级管理员权限。可更新任意字段，包括 `is_enabled` 启用/禁用。

---

### DELETE /languages/:id — 删除语言

需超级管理员权限。

---

## 7. 比赛模块 `/contests`

### GET /contests — 比赛列表

无需认证。包含 `creator_name` 和 `problem_count`。

---

### GET /contests/:id — 比赛详情

无需认证。包含比赛下的题目列表（按 sort_order 排序）。

---

### POST /contests — 创建比赛

需教师权限。

**请求体：**
```json
{
  "title": "比赛标题",
  "description": "比赛描述",
  "start_time": "2024-06-01T09:00:00",
  "end_time": "2024-06-01T14:00:00",
  "is_virtual": false
}
```

---

### PUT /contests/:id — 更新比赛

需教师权限。

---

### POST /contests/:id/problems — 添加题目到比赛

需教师权限。

**请求体：**
```json
{
  "problem_id": 1,
  "alias": "A"
}
```

`alias` 为选填的题目别名。

---

### DELETE /contests/:id — 删除比赛

需教师权限。级联删除比赛题目关联。

---

## 自定义计分脚本

计分脚本用于自定义测试点组或整题的评分逻辑。

### 语法

**语句**：以分号 `;` 分隔。

**变量**：以 `@` 开头，如 `@total_score`、`@status1`。

**赋值**：`@var = value;`

**算术运算**：`+`、`-`、`*`、`/`、`%`（同 C 语言优先级）

**位运算**：`and`、`or`、`not`、`xor`

**比较运算**：`==`、`!=`、`>=`、`<=`、`>`、`<`

**逻辑运算**：`and`、`or`、`not`（在条件语句中）

**条件语句**：
```
if 条件; then
    语句;
else
    语句;
fi
```

### 常量

测试点级别：`AC`(1)、`WA`(2)、`TLE`(3)、`MLE`(4)

Subtask/整题级别：`AC`(1)、`UNAC`(2)

### 传入变量

每组评测传入：`@statusX`、`@scoreX`、`@timeX`、`@memoryX`（X 为测试点/Subtask ID）。

### 需定义变量

- `@total_score` — 最终得分
- `@final_status` — 最终状态（AC/UNAC）
- `@final_time` — 最终耗时
- `@final_memory` — 最终内存

### 示例

子任务评分：测试点 #3、#4、#5 中，#4 必须通过且 #3 或 #5 至少一个通过，得 30 分：

```
if (@status4==AC) and (@status3==AC or @status5==AC); then
    @total_score = 30;
    @final_status = AC;
    @final_time = @time4;
    @final_memory = @memory4;
else
    @total_score = 0;
    @final_status = UNAC;
    @final_time = 0;
    @final_memory = 0;
fi
```

整题评分：所有子任务都通过则满分：

```
if (@status1==AC) and (@status2==AC); then
    @total_score = 100;
    @final_status = AC;
else
    @total_score = 0;
    @final_status = UNAC;
fi
```

---

## 前端页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/pages/index.html` | 系统介绍、统计信息 |
| 题库 | `/pages/problems.html` | 题目列表、搜索 |
| 题目详情 | `/pages/problem.html?id=X` | 查看题目描述 |
| 提交代码 | `/pages/submit.html?id=X` | 代码编辑器、选择语言、提交 |
| 提交记录 | `/pages/submissions.html` | 提交历史列表 |
| 提交详情 | `/pages/submission.html?id=X` | 评测详情、测试点结果 |
| 在线编程 | `/pages/ide.html` | IDE 即时运行 |
| 比赛 | `/pages/contests.html` | 比赛列表 |
| 管理面板 | `/pages/admin.html` | 题目/用户/在线用户/比赛管理 |
| 语言管理 | `/pages/languages.html` | 动态语言配置 |
| 登录 | `/pages/login.html` | 用户登录 |
| 注册 | `/pages/register.html` | 用户注册 |
