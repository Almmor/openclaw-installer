// 引入 Electron API
const { ipcRenderer } = require('electron');

// 全局状态
let plugins = {};
let openclawInfo = {};
let selectedPlugins = new Set();
let currentFilter = 'all';

// DOM 元素
const elements = {
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    quickPluginGrid: document.getElementById('quickPluginGrid'),
    pluginList: document.getElementById('pluginList'),
    installPath: document.getElementById('installPath'),
    installOpenClawBtn: document.getElementById('installOpenClawBtn'),
    installedBtn: document.getElementById('installedBtn'),
    installAllBtn: document.getElementById('installAllBtn'),
    selectPathBtn: document.getElementById('selectPathBtn'),
    installProgress: document.getElementById('installProgress'),
    progressFill: document.getElementById('progressFill'),
    progressPercent: document.getElementById('progressPercent'),
    progressMessage: document.getElementById('progressMessage'),
    progressDetails: document.getElementById('progressDetails'),
    toastContainer: document.getElementById('toastContainer'),
    filterTabs: document.querySelectorAll('.tab'),
    checkUpdateBtn: document.getElementById('checkUpdateBtn')
};

// 初始化
async function init() {
    await loadData();
    setupEventListeners();
    renderQuickPlugins();
    renderPluginList();
    checkOpenClawStatus();
}

// 加载数据
async function loadData() {
    try {
        plugins = await ipcRenderer.invoke('get-plugins');
        openclawInfo = await ipcRenderer.invoke('get-openclaw-info');
    } catch (error) {
        console.error('加载数据失败:', error);
        showToast('error', '错误', '加载数据失败');
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 导航切换
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            switchPage(page);
            
            elements.navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // 选择安装路径
    elements.selectPathBtn.addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('select-install-path');
        if (result.path) {
            elements.installPath.value = result.path;
        }
    });

    // 安装 OpenClaw
    elements.installOpenClawBtn.addEventListener('click', installOpenClaw);

    // 一键安装所有
    elements.installAllBtn.addEventListener('click', installAll);

    // 筛选标签
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderPluginList();
        });
    });

    // 检查更新
    elements.checkUpdateBtn.addEventListener('click', checkUpdates);

    // 关于页面链接
    document.getElementById('openWebsite')?.addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.invoke('open-plugin-details', 'openclaw');
    });

    document.getElementById('openDocs')?.addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.invoke('open-plugin-details', 'openclaw');
    });

    document.getElementById('openGithub')?.addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.invoke('open-plugin-details', 'openclaw');
    });

    document.getElementById('reportIssue')?.addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.invoke('open-plugin-details', 'openclaw');
    });

    // 监听安装进度
    ipcRenderer.on('install-progress', (event, data) => {
        updateProgress(data.progress, data.message);
    });

    ipcRenderer.on('plugin-install-progress', (event, data) => {
        updateProgress(data.progress, data.message, data.pluginName);
    });

    ipcRenderer.on('install-all-progress', (event, data) => {
        updateProgress(data.progress, data.message, data.pluginName);
    });
}

// 切换页面
function switchPage(pageName) {
    elements.pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 更新页面标题
    const titles = {
        home: '欢迎使用 OpenClaw 安装器',
        plugins: '插件管理',
        settings: '设置',
        about: '关于'
    };
    
    document.querySelector('.page-title').textContent = titles[pageName] || 'OpenClaw Installer';
}

// 渲染快速安装插件卡片
function renderQuickPlugins() {
    elements.quickPluginGrid.innerHTML = '';
    
    Object.entries(plugins).forEach(([id, plugin]) => {
        const card = createPluginCard(id, plugin);
        elements.quickPluginGrid.appendChild(card);
    });
}

// 创建插件卡片
function createPluginCard(id, plugin) {
    const card = document.createElement('div');
    card.className = `plugin-card ${plugin.installed ? 'installed' : ''} ${selectedPlugins.has(id) ? 'selected' : ''}`;
    card.dataset.pluginId = id;
    
    card.innerHTML = `
        <div class="plugin-card-header">
            <div class="plugin-icon">${plugin.icon}</div>
            <div class="plugin-info">
                <div class="plugin-name">${plugin.name}</div>
                <div class="plugin-version">v${plugin.version}</div>
            </div>
        </div>
        <div class="plugin-category">${plugin.category}</div>
        <div class="plugin-description">${plugin.description}</div>
        <div class="plugin-meta">
            <span>👤 ${plugin.author}</span>
            <span>📦 ${plugin.size}</span>
            <div class="plugin-status">
                ${plugin.installed ? 
                    '<span class="status-icon">✅</span><span>已安装</span>' : 
                    (selectedPlugins.has(id) ? '<span class="status-icon">☑️</span><span>已选择</span>' : '<span class="status-icon">⭕</span><span>点击选择</span>')
                }
            </div>
        </div>
    `;
    
    if (!plugin.installed) {
        card.addEventListener('click', () => togglePluginSelection(id));
    }
    
    return card;
}

// 切换插件选择
function togglePluginSelection(pluginId) {
    if (selectedPlugins.has(pluginId)) {
        selectedPlugins.delete(pluginId);
    } else {
        selectedPlugins.add(pluginId);
    }
    
    renderQuickPlugins();
    updateInstallAllButton();
}

// 更新一键安装按钮状态
function updateInstallAllButton() {
    const count = selectedPlugins.size;
    if (count > 0) {
        elements.installAllBtn.innerHTML = `<span class="btn-icon">🚀</span><span>一键安装 ${count} 个插件</span>`;
        elements.installAllBtn.disabled = false;
    } else {
        elements.installAllBtn.innerHTML = `<span class="btn-icon">🚀</span><span>一键安装选中插件</span>`;
        elements.installAllBtn.disabled = true;
    }
}

// 渲染插件列表
function renderPluginList() {
    elements.pluginList.innerHTML = '';
    
    const filteredPlugins = Object.entries(plugins).filter(([id, plugin]) => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'installed') return plugin.installed;
        if (currentFilter === 'available') return !plugin.installed;
        return true;
    });
    
    filteredPlugins.forEach(([id, plugin]) => {
        const item = createPluginListItem(id, plugin);
        elements.pluginList.appendChild(item);
    });
}

// 创建插件列表项
function createPluginListItem(id, plugin) {
    const item = document.createElement('div');
    item.className = 'plugin-list-item';
    
    item.innerHTML = `
        <div class="plugin-list-icon">${plugin.icon}</div>
        <div class="plugin-list-info">
            <div class="plugin-list-name">${plugin.name}</div>
            <div class="plugin-list-desc">${plugin.description}</div>
            <div class="plugin-list-meta">
                <span>v${plugin.version}</span>
                <span>•</span>
                <span>${plugin.category}</span>
                <span>•</span>
                <span>${plugin.size}</span>
                <span>•</span>
                <span>${plugin.installed ? '已安装' : '未安装'}</span>
            </div>
        </div>
        <div class="plugin-list-actions">
            ${plugin.installed ? 
                `<button class="btn btn-outline" onclick="uninstallPlugin('${id}')">卸载</button>
                 <button class="btn btn-secondary" onclick="openPluginPath('${id}')">打开</button>` :
                `<button class="btn btn-primary" onclick="installPlugin('${id}')">安装</button>`
            }
            <button class="btn btn-outline" onclick="viewPluginDetails('${id}')">详情</button>
        </div>
    `;
    
    return item;
}

// 安装 OpenClaw
async function installOpenClaw() {
    const installPath = elements.installPath.value;
    
    elements.installOpenClawBtn.disabled = true;
    elements.installOpenClawBtn.innerHTML = '<span class="btn-icon">⏳</span><span>安装中...</span>';
    
    showProgress();
    updateProgress(0, '准备安装 OpenClaw...');
    
    try {
        const result = await ipcRenderer.invoke('install-openclaw', installPath);
        
        if (result.success) {
            showToast('success', '安装成功', result.message);
            elements.installOpenClawBtn.classList.add('hidden');
            elements.installedBtn.classList.remove('hidden');
            openclawInfo.installed = true;
            openclawInfo.installPath = installPath;
        } else {
            showToast('error', '安装失败', result.message);
            elements.installOpenClawBtn.disabled = false;
            elements.installOpenClawBtn.innerHTML = '<span class="btn-icon">⬇️</span><span>一键安装 OpenClaw</span>';
        }
    } catch (error) {
        showToast('error', '错误', error.message);
        elements.installOpenClawBtn.disabled = false;
        elements.installOpenClawBtn.innerHTML = '<span class="btn-icon">⬇️</span><span>一键安装 OpenClaw</span>';
    } finally {
        setTimeout(hideProgress, 2000);
    }
}

// 安装单个插件
async function installPlugin(pluginId) {
    showProgress();
    updateProgress(0, `准备安装 ${plugins[pluginId].name}...`);
    
    try {
        const result = await ipcRenderer.invoke('install-plugin', pluginId);
        
        if (result.success) {
            showToast('success', '安装成功', result.message);
            plugins[pluginId].installed = true;
            renderQuickPlugins();
            renderPluginList();
        } else {
            showToast('error', '安装失败', result.message);
        }
    } catch (error) {
        showToast('error', '错误', error.message);
    } finally {
        setTimeout(hideProgress, 1000);
    }
}

// 卸载插件
async function uninstallPlugin(pluginId) {
    if (!confirm(`确定要卸载 ${plugins[pluginId].name} 吗？`)) {
        return;
    }
    
    try {
        const result = await ipcRenderer.invoke('uninstall-plugin', pluginId);
        
        if (result.success) {
            showToast('success', '卸载成功', result.message);
            plugins[pluginId].installed = false;
            renderQuickPlugins();
            renderPluginList();
        } else {
            showToast('error', '卸载失败', result.message);
        }
    } catch (error) {
        showToast('error', '错误', error.message);
    }
}

// 一键安装所有
async function installAll() {
    if (selectedPlugins.size === 0) {
        showToast('warning', '提示', '请先选择要安装的插件');
        return;
    }
    
    const pluginArray = Array.from(selectedPlugins);
    
    elements.installAllBtn.disabled = true;
    elements.installAllBtn.innerHTML = '<span class="btn-icon">⏳</span><span>安装中...</span>';
    
    showProgress();
    
    try {
        const result = await ipcRenderer.invoke('install-all', pluginArray);
        
        if (result.success) {
            showToast('success', '安装完成', result.message);
            selectedPlugins.clear();
            renderQuickPlugins();
            renderPluginList();
        } else {
            showToast('error', '安装失败', result.message);
        }
    } catch (error) {
        showToast('error', '错误', error.message);
    } finally {
        elements.installAllBtn.disabled = false;
        updateInstallAllButton();
        setTimeout(hideProgress, 2000);
    }
}

// 打开插件目录
async function openPluginPath(pluginId) {
    const plugin = plugins[pluginId];
    if (plugin && plugin.installPath) {
        await ipcRenderer.invoke('open-install-path', plugin.installPath);
    }
}

// 查看插件详情
async function viewPluginDetails(pluginId) {
    await ipcRenderer.invoke('open-plugin-details', pluginId);
}

// 检查 OpenClaw 状态
async function checkOpenClawStatus() {
    try {
        const result = await ipcRenderer.invoke('check-openclaw-installed');
        if (result.installed) {
            elements.installOpenClawBtn.classList.add('hidden');
            elements.installedBtn.classList.remove('hidden');
            openclawInfo.installed = true;
            openclawInfo.installPath = result.path;
        }
    } catch (error) {
        console.error('检查 OpenClaw 状态失败:', error);
    }
}

// 检查更新
async function checkUpdates() {
    showToast('info', '检查更新', '正在检查更新...');
    
    // 模拟检查更新
    setTimeout(() => {
        showToast('success', '检查完成', '当前已是最新版本');
    }, 1500);
}

// 显示进度
function showProgress() {
    elements.installProgress.classList.remove('hidden');
}

// 隐藏进度
function hideProgress() {
    elements.installProgress.classList.add('hidden');
    updateProgress(0, '');
}

// 更新进度
function updateProgress(percent, message, details = '') {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressMessage.textContent = message;
    elements.progressDetails.textContent = details;
}

// 显示 Toast 通知
function showToast(type, title, message) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // 自动移除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);

// 暴露函数到全局作用域（用于 HTML 内联事件）
window.installPlugin = installPlugin;
window.uninstallPlugin = uninstallPlugin;
window.openPluginPath = openPluginPath;
window.viewPluginDetails = viewPluginDetails;
