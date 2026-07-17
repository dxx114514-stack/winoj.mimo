const config = require('../config/config');

const LM_STUDIO_URL = config.security.lmStudioUrl;
const LM_STUDIO_MODEL = config.security.lmStudioModel;
const CODE_LENGTH_LIMIT = config.security.codeLengthLimit;

const SECURITY_PROMPT = `你是一个代码安全审查专家。请审查以下用户提交的代码，判断是否包含恶意代码。

恶意代码包括但不限于：
1. 文件系统攻击：删除、覆盖、加密重要系统文件（如 rm -rf /、format、del /s）
2. 网络攻击：反弹shell、DDoS、端口扫描、网络钓鱼
3. 权限提升：提权操作、修改系统配置
4. 恶意软件：病毒、蠕虫、勒索软件、挖矿程序
5. 资源滥用：无限循环fork、大量占用内存/磁盘、crypto miner
6. 敏感信息窃取：读取密码文件、键盘记录、截屏
7. 系统破坏：蓝屏触发、MBR覆写、注册表破坏

请只回复一个JSON对象，不要包含其他内容：
{"safe": true/false, "reason": "原因说明", "threat_level": "none/low/medium/high/critical"}

只输出JSON，不要有其他文字。`;

async function reviewCode(sourceCode, language) {
  if (!sourceCode || sourceCode.length < 50) {
    return { safe: true, reason: '代码过短，无需审查', threat_level: 'none' };
  }

  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LM_STUDIO_MODEL,
        messages: [
          { role: 'system', content: SECURITY_PROMPT },
          { role: 'user', content: `语言: ${language}\n\n代码:\n\`\`\`\n${sourceCode}\n\`\`\`` }
        ],
        temperature: 0.1,
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error(`LM Studio error: ${response.status}`);
      return { safe: true, reason: '审查服务暂时不可用', threat_level: 'none' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { safe: true, reason: '无法解析审查结果', threat_level: 'none' };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      safe: result.safe !== false,
      reason: result.reason || '未提供原因',
      threat_level: result.threat_level || 'none'
    };
  } catch (err) {
    console.error('Security review error:', err.message);
    return { safe: true, reason: '审查服务暂时不可用', threat_level: 'none' };
  }
}

module.exports = { reviewCode, CODE_LENGTH_LIMIT, LM_STUDIO_URL, LM_STUDIO_MODEL };
