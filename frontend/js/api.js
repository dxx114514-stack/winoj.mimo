const API_BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('access_token');
}

function setToken(token) {
  localStorage.setItem('access_token', token);
}

function isTokenExpired() {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch { return true; }
}

function clearToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

function getUser() {
  try {
    if (isTokenExpired()) { clearToken(); return null; }
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { clearToken(); return null; }
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function refreshUser() {
  try {
    const u = await apiCall('GET', '/users/me');
    setUser({ id: u.id, username: u.username, nickname: u.nickname, role: u.role, rating: u.rating });
  } catch {}
}

async function apiCall(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers, credentials: 'include' };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch (e) {
    throw { status: 0, message: 'Network error' };
  }
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (res.status === 401 && data.reason === 'ERR_UNAUTHORIZED') {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setToken(refreshData.access_token);
        headers['Authorization'] = `Bearer ${refreshData.access_token}`;
        const retryRes = await fetch(`${API_BASE}${path}`, { method, headers, credentials: 'include', body: opts.body });
        const retryData = await retryRes.json();
        if (!retryRes.ok) throw { status: retryRes.status, ...retryData };
        return retryData;
      }
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshRes.status === 403 || refreshData.reason === 'ERR_FORBIDDEN') {
        clearToken();
        if (window.location.pathname !== '/pages/login.html') window.location.href = '/pages/login.html';
        throw { status: 403, message: '账号已被封禁' };
      }
    } catch (e) {
      if (e && e.status !== undefined) throw e;
    }
    clearToken();
    if (window.location.pathname !== '/pages/login.html') window.location.href = '/pages/login.html';
    throw data;
  }
  if (res.status === 403 && data.reason === 'ERR_FORBIDDEN') {
    clearToken();
    if (window.location.pathname !== '/pages/login.html') window.location.href = '/pages/login.html';
    throw { status: 403, message: data.message || '账号已被封禁' };
  }
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function statusColor(status) {
  const colors = {
    accepted: 'text-green-600 bg-green-50',
    wrong_answer: 'text-red-600 bg-red-50',
    time_limit_exceeded: 'text-orange-600 bg-orange-50',
    memory_limit_exceeded: 'text-purple-600 bg-purple-50',
    runtime_error: 'text-red-600 bg-red-50',
    compile_error: 'text-yellow-600 bg-yellow-50',
    system_error: 'text-gray-600 bg-gray-50',
    pending: 'text-blue-600 bg-blue-50',
    running: 'text-blue-600 bg-blue-50',
    judging: 'text-blue-600 bg-blue-50',
    compiling: 'text-blue-600 bg-blue-50',
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
}

function statusText(status) {
  const texts = {
    accepted: '通过',
    wrong_answer: '答案错误',
    time_limit_exceeded: '时间超限',
    memory_limit_exceeded: '内存超限',
    runtime_error: '运行错误',
    compile_error: '编译错误',
    system_error: '系统错误',
    pending: '等待中',
    running: '运行中',
    judging: '评测中',
    compiling: '编译中',
    pending_rejudge: '等待重测',
  };
  return texts[status] || status;
}

function roleBadge(role) {
  const badges = {
    user: '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">用户</span>',
    teacher: '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">教师</span>',
    admin: '<span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">管理员</span>',
    su: '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">超级管理员</span>',
  };
  return badges[role] || '';
}

function renderNav(activePage) {
  try {
    const user = getUser();
    const isAdmin = user && ['admin', 'su'].includes(user.role);
    const isTeacher = user && ['teacher', 'admin', 'su'].includes(user.role);

    return `
    <nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-14">
          <div class="flex items-center space-x-8">
            <a href="/pages/index.html" class="flex items-center space-x-2">
              <svg class="w-7 h-7 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
              <span class="text-xl font-bold text-gray-900">WinOJ</span>
            </a>
            <div class="hidden md:flex space-x-1">
              <a href="/pages/problems.html" class="px-3 py-2 rounded-md text-sm font-medium ${activePage==='problems'?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}">题库</a>
              <a href="/pages/submissions.html" class="px-3 py-2 rounded-md text-sm font-medium ${activePage==='submissions'?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}">提交记录</a>
              <a href="/pages/articles.html" class="px-3 py-2 rounded-md text-sm font-medium ${activePage==='articles'?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}">文章</a>
              <a href="/pages/ide.html" class="px-3 py-2 rounded-md text-sm font-medium ${activePage==='ide'?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}">在线编程</a>
              <a href="/pages/upload.html" class="px-3 py-2 rounded-md text-sm font-medium ${activePage==='upload'?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}">图床</a>
              <a href="/pages/rating.html" class="px-3 py-2 rounded-md text-sm font-medium ${activePage==='rating'?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}">排行</a>
              <a href="/pages/contests.html" class="px-3 py-2 rounded-md text-sm font-medium ${activePage==='contests'?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}">比赛</a>
              ${isTeacher ? `<a href="/pages/admin.html" class="px-3 py-2 rounded-md text-sm font-medium ${activePage==='admin'?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}">管理</a>` : ''}
              ${isAdmin ? `<a href="/pages/languages.html" class="px-3 py-2 rounded-md text-sm font-medium ${activePage==='languages'?'bg-indigo-50 text-indigo-700':'text-gray-600 hover:bg-gray-50'}">语言</a>` : ''}
            </div>
          </div>
          <div class="flex items-center space-x-4">
            ${user ? `
              <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-700">${escapeHtml(user.nickname || user.username || '')}</span>
                <span class="px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">R:${user.rating || 1500}</span>
                ${roleBadge(user.role)}
                <a href="/pages/profile.html" class="text-sm text-gray-500 hover:text-gray-700">资料</a>
                <button onclick="showPasswordModal()" class="text-sm text-gray-500 hover:text-gray-700">设置</button>
                <button onclick="logout()" class="text-sm text-red-600 hover:text-red-800">退出</button>
              </div>
            ` : `
              <a href="/pages/login.html" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">登录</a>
              <a href="/pages/register.html" class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium">注册</a>
            `}
          </div>
        </div>
      </div>
    </nav>
    <div id="passwordModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">修改密码</h3>
        <input id="oldPwd" type="password" placeholder="当前密码" class="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
        <input id="newPwd" type="password" placeholder="新密码" class="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
        <div class="flex justify-end space-x-3">
          <button onclick="closePasswordModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
          <button onclick="changePassword()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
        </div>
      </div>
    </div>`;
  } catch(e) {
    console.error('renderNav error:', e);
    return `<nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"><div class="max-w-7xl mx-auto px-4 h-14 flex items-center"><a href="/pages/index.html" class="text-xl font-bold text-gray-900">WinOJ</a></div></nav>`;
  }
}

function showPasswordModal() { document.getElementById('passwordModal').classList.remove('hidden'); }
function closePasswordModal() { document.getElementById('passwordModal').classList.add('hidden'); }

async function changePassword() {
  const old_password = document.getElementById('oldPwd').value;
  const new_password = document.getElementById('newPwd').value;
  try {
    await apiCall('POST', '/auth/change-password', { old_password, new_password });
    alert('密码修改成功');
    closePasswordModal();
  } catch (e) {
    alert(e.message || '密码修改失败');
  }
}

async function logout() {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch {}
  }
  clearToken();
  window.location.href = '/pages/index.html';
}
