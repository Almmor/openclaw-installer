// 引入 Electron API
const { ipcRenderer, shell } = require('electron');

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
    manageOpenClawBtn: document.getElementById('manageOpenClawBtn'),
    installAllBtn: document.getElementById('installAllBtn'),
    selectPathBtn: document.getElementById('selectPathBtn'),
    installProgress: document.getElementById('installProgress'),
    progressFill: document.getElementById('progressFill'),
    progressPercent: document.getElementById('progressPercent'),
    progressMessage: document.getElementById('progressMessage'),
    progressDetails: document.getElementById('progressDetails'),
    toastContainer: document.getElementById('toastContainer'),
    filterTabs: document.querySelectorAll('.tab'),
    checkUpdateBtn: document.getElementById('checkUpdateBtn'),
    restartOpenClawBtn: document.getElementById('restartOpenClawBtn'),
    uninstallOpenClawBtn: document.getElementById('uninstallOpenClawBtn'),
    openManagePathBtn: document.getElementById('openManagePathBtn'),
    manageInstallPath: document.getElementById('manageInstallPath'),
    managePluginCount: document.getElementById('managePluginCount'),
    uninstallProgress: document.getElementById('uninstallProgress'),
    uninstallProgressFill: document.getElementById('uninstallProgressFill'),
    uninstallProgressPercent: document.getElementById('uninstallProgressPercent'),
    uninstallProgressMessage: document.getElementById('uninstallProgressMessage'),
    installedPluginList: document.getElementById('installedPluginList')
};

// ============================================================
// 初始化
// ============================================================

async function init() {
    await loadData();
    setupEventListeners();
    renderQuickPlugins();
    renderPluginList();
    renderInstalledPlugins();
    checkOpenClawStatus();
    setupManageEvents();
}

// 加载数据（真实从 npm 获取）
async function loadData() {
    try {
        const [info, pluginData] = await Promise.all([
            ipcRenderer.invoke('get-openclaw-info'),
            ipcRenderer.invoke('get-plugins')
        ]);
        openclawInfo = info;
        plugins = pluginData;

        // 更新首页显示
        const heroVersion = document.querySelector('.version-badge');
        if (heroVersion && info.version) {
            heroVersion.textContent = `v${info.version}`;
        }
        const heroDesc = document.querySelector('.hero-description');
        if (heroDesc && info.description) {
            heroDesc.textContent = info.description;
        }

        // 更新安装路径显示
        try {
            const npmPath = await ipcRenderer.invoke('get-npm-global-path');
            if (npmPath.success && elements.installPath) {
                elements.installPath.value = npmPath.path;
            }
        } catch (e) {}

    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// ============================================================
// 事件监听
// ============================================================

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

    // 安装 OpenClaw
    elements.installOpenClawBtn?.addEventListener('click', installOpenClaw);

    // 一键安装所有
    elements.installAllBtn?.addEventListener('click', installAll);

    // 配置页面事件
    setupConfigEvents();

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
    elements.checkUpdateBtn?.addEventListener('click', updateOpenClaw);

    // GitHub 链接
    document.getElementById('openGithub')?.addEventListener('click', (e) => {
        e.preventDefault();
        shell.openExternal('https://github.com/Almmor/openclaw-installer');
    });
    document.getElementById('reportIssue')?.addEventListener('click', (e) => {
        e.preventDefault();
        shell.openExternal('https://github.com/Almmor/openclaw-installer/issues');
    });

    // 监听安装进度
    ipcRenderer.on('install-progress', (event, data) => {
        updateProgress(data.progress, data.message);
    });
    ipcRenderer.on('plugin-install-progress', (event, data) => {
        updateProgress(data.progress, data.message, data.pkgName);
    });
    ipcRenderer.on('install-all-progress', (event, data) => {
        updateProgress(data.progress, data.message, data.pluginName);
    });
    ipcRenderer.on('uninstall-progress', (event, data) => {
        updateUninstallProgress(data.progress, data.message);
    });
    ipcRenderer.on('restart-progress', (event, data) => {
        updateProgress(data.progress, data.message);
    });
}

// 管理页面事件
function setupManageEvents() {
    elements.manageOpenClawBtn?.addEventListener('click', () => {
        switchPage('manage');
        elements.navItems.forEach(nav => nav.classList.remove('active'));
        document.querySelector('[data-page="manage"]')?.classList.add('active');
    });
    elements.restartOpenClawBtn?.addEventListener('click', restartOpenClaw);
    elements.uninstallOpenClawBtn?.addEventListener('click', uninstallOpenClaw);
    elements.openManagePathBtn?.addEventListener('click', async () => {
        await ipcRenderer.invoke('open-install-path', '');
    });
}

// ============================================================
// 页面切换
// ============================================================

function switchPage(pageName) {
    elements.pages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) targetPage.classList.add('active');
}

// ============================================================
// 渲染
// ============================================================

function renderQuickPlugins() {
    if (!elements.quickPluginGrid) return;
    elements.quickPluginGrid.innerHTML = '';
    Object.entries(plugins).forEach(([pkgName, plugin]) => {
        elements.quickPluginGrid.appendChild(createPluginCard(pkgName, plugin));
    });
}

function createPluginCard(pkgName, plugin) {
    const card = document.createElement('div');
    card.className = `plugin-card ${plugin.installed ? 'installed' : ''} ${selectedPlugins.has(pkgName) ? 'selected' : ''}`;

    card.innerHTML = `
        <div class="plugin-card-header">
            <div class="plugin-icon">${plugin.icon}</div>
            <div class="plugin-info">
                <div class="plugin-name">${plugin.name}</div>
                <div class="plugin-version">${plugin.version ? 'v' + plugin.version : plugin.npmPackage}</div>
            </div>
        </div>
        <div class="plugin-category">${plugin.category}</div>
        <div class="plugin-description">${plugin.description}</div>
        <div class="plugin-meta">
            <span>📦 ${plugin.npmPackage}</span>
            <div class="plugin-status">
                ${plugin.installed ?
                    '<span class="status-icon">✅</span><span>已安装</span>' :
                    (selectedPlugins.has(pkgName) ? '<span class="status-icon">☑️</span><span>已选择</span>' : '<span class="status-icon">⭕</span><span>点击选择</span>')
                }
            </div>
        </div>
    `;

    if (!plugin.installed) {
        card.addEventListener('click', () => togglePluginSelection(pkgName));
    }
    return card;
}

function togglePluginSelection(pkgName) {
    if (selectedPlugins.has(pkgName)) {
        selectedPlugins.delete(pkgName);
    } else {
        selectedPlugins.add(pkgName);
    }
    renderQuickPlugins();
    updateInstallAllButton();
}

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

function renderPluginList() {
    if (!elements.pluginList) return;
    elements.pluginList.innerHTML = '';

    const filtered = Object.entries(plugins).filter(([_, p]) => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'installed') return p.installed;
        if (currentFilter === 'available') return !p.installed;
        return true;
    });

    filtered.forEach(([pkgName, plugin]) => {
        elements.pluginList.appendChild(createPluginListItem(pkgName, plugin));
    });
}

function createPluginListItem(pkgName, plugin) {
    const item = document.createElement('div');
    item.className = 'plugin-list-item';

    item.innerHTML = `
        <div class="plugin-list-icon">${plugin.icon}</div>
        <div class="plugin-list-info">
            <div class="plugin-list-name">${plugin.name}</div>
            <div class="plugin-list-desc">${plugin.description}</div>
            <div class="plugin-list-meta">
                <span>${plugin.version ? 'v' + plugin.version : '未安装'}</span>
                <span>•</span>
                <span>${plugin.category}</span>
                <span>•</span>
                <span>npm: ${plugin.npmPackage}</span>
                <span>•</span>
                <span>${plugin.installed ? '✅ 已安装' : '⭕ 未安装'}</span>
            </div>
        </div>
        <div class="plugin-list-actions">
            ${plugin.installed ?
                `<button class="btn btn-outline" data-action="uninstall" data-pkg="${pkgName}">卸载</button>` :
                `<button class="btn btn-primary" data-action="install" data-pkg="${pkgName}">安装</button>`
            }
        </div>
    `;

    // 事件委托
    item.querySelector('[data-action="install"]')?.addEventListener('click', () => installPlugin(pkgName));
    item.querySelector('[data-action="uninstall"]')?.addEventListener('click', () => uninstallPlugin(pkgName));

    return item;
}

function renderInstalledPlugins() {
    if (!elements.installedPluginList) return;
    elements.installedPluginList.innerHTML = '';

    const installed = Object.entries(plugins).filter(([_, p]) => p.installed);

    if (installed.length === 0) {
        elements.installedPluginList.innerHTML = '<p class="no-plugins">暂无已安装的插件</p>';
    } else {
        installed.forEach(([pkgName, plugin]) => {
            elements.installedPluginList.appendChild(createPluginListItem(pkgName, plugin));
        });
    }

    if (elements.managePluginCount) {
        elements.managePluginCount.textContent = `${installed.length} 个`;
    }
}

// ============================================================
// 操作函数（真实执行）
// ============================================================

async function checkOpenClawStatus() {
    try {
        const result = await ipcRenderer.invoke('check-openclaw-installed');
        if (result.installed) {
            elements.installOpenClawBtn?.classList.add('hidden');
            elements.installedBtn?.classList.remove('hidden');
            elements.manageOpenClawBtn?.classList.remove('hidden');
            openclawInfo.installed = true;
            if (elements.manageInstallPath) {
                elements.manageInstallPath.textContent = result.path || 'npm 全局目录';
            }
        } else {
            elements.manageOpenClawBtn?.classList.add('hidden');
        }
    } catch (e) {}
}

async function installOpenClaw() {
    elements.installOpenClawBtn.disabled = true;
    elements.installOpenClawBtn.innerHTML = '<span class="btn-icon">⏳</span><span>安装中...</span>';
    showProgress();
    updateProgress(0, '准备安装...');

    try {
        const result = await ipcRenderer.invoke('install-openclaw');
        if (result.success) {
            showToast('success', '安装成功', result.message);
            elements.installOpenClawBtn.classList.add('hidden');
            elements.installedBtn.classList.remove('hidden');
            elements.manageOpenClawBtn.classList.remove('hidden');
            openclawInfo.installed = true;
            // 刷新数据
            await loadData();
            renderQuickPlugins();
            renderPluginList();
            renderInstalledPlugins();
        } else {
            showToast('error', '安装失败', result.message);
            elements.installOpenClawBtn.disabled = false;
            elements.installOpenClawBtn.innerHTML = '<span class="btn-icon">⬇️</span><span>安装 OpenClaw</span>';
        }
    } catch (error) {
        showToast('error', '错误', error.message);
        elements.installOpenClawBtn.disabled = false;
        elements.installOpenClawBtn.innerHTML = '<span class="btn-icon">⬇️</span><span>安装 OpenClaw</span>';
    } finally {
        setTimeout(hideProgress, 2000);
    }
}

async function uninstallOpenClaw() {
    if (!confirm('确定要卸载 OpenClaw 吗？这将同时卸载所有已安装的插件。')) return;

    elements.uninstallProgress?.classList.remove('hidden');
    updateUninstallProgress(0, '准备卸载...');

    try {
        const result = await ipcRenderer.invoke('uninstall-openclaw');
        if (result.success) {
            showToast('success', '卸载成功', result.message);
            openclawInfo.installed = false;
            elements.manageOpenClawBtn?.classList.add('hidden');
            elements.installOpenClawBtn?.classList.remove('hidden');
            elements.installOpenClawBtn.disabled = false;
            elements.installOpenClawBtn.innerHTML = '<span class="btn-icon">⬇️</span><span>安装 OpenClaw</span>';
            await loadData();
            renderQuickPlugins();
            renderPluginList();
            renderInstalledPlugins();
            setTimeout(() => {
                switchPage('home');
                elements.navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelector('[data-page="home"]')?.classList.add('active');
            }, 1500);
        } else {
            showToast('error', '卸载失败', result.message);
        }
    } catch (error) {
        showToast('error', '错误', error.message);
    } finally {
        setTimeout(() => elements.uninstallProgress?.classList.add('hidden'), 2000);
    }
}

async function restartOpenClaw() {
    showToast('info', '重启中', '正在重启 OpenClaw...');
    try {
        const result = await ipcRenderer.invoke('restart-openclaw');
        showToast(result.success ? 'success' : 'error', result.success ? '重启成功' : '重启失败', result.message);
        if (result.success) await loadData();
    } catch (error) {
        showToast('error', '错误', error.message);
    }
}

async function updateOpenClaw() {
    showToast('info', '更新中', '正在检查并更新 OpenClaw...');
    showProgress();
    updateProgress(0, '正在更新...');
    try {
        const result = await ipcRenderer.invoke('update-openclaw');
        showToast(result.success ? 'success' : 'error', result.success ? '更新成功' : '更新失败', result.message);
        if (result.success) await loadData();
    } catch (error) {
        showToast('error', '错误', error.message);
    } finally {
        setTimeout(hideProgress, 2000);
    }
}

async function installPlugin(pkgName) {
    showProgress();
    updateProgress(0, `准备安装 ${pkgName}...`);
    try {
        const result = await ipcRenderer.invoke('install-plugin', pkgName);
        showToast(result.success ? 'success' : 'error', result.success ? '安装成功' : '安装失败', result.message);
        if (result.success) {
            await loadData();
            renderQuickPlugins();
            renderPluginList();
            renderInstalledPlugins();
        }
    } catch (error) {
        showToast('error', '错误', error.message);
    } finally {
        setTimeout(hideProgress, 1000);
    }
}

async function uninstallPlugin(pkgName) {
    const plugin = plugins[pkgName];
    if (!confirm(`确定要卸载 ${plugin?.name || pkgName} 吗？`)) return;
    try {
        const result = await ipcRenderer.invoke('uninstall-plugin', pkgName);
        showToast(result.success ? 'success' : 'error', result.success ? '卸载成功' : '卸载失败', result.message);
        if (result.success) {
            await loadData();
            renderQuickPlugins();
            renderPluginList();
            renderInstalledPlugins();
        }
    } catch (error) {
        showToast('error', '错误', error.message);
    }
}

async function installAll() {
    if (selectedPlugins.size === 0) {
        showToast('warning', '提示', '请先选择要安装的插件');
        return;
    }
    const pkgArray = Array.from(selectedPlugins);
    elements.installAllBtn.disabled = true;
    elements.installAllBtn.innerHTML = '<span class="btn-icon">⏳</span><span>安装中...</span>';
    showProgress();
    try {
        const result = await ipcRenderer.invoke('install-all', pkgArray);
        showToast(result.success ? 'success' : 'error', result.success ? '安装完成' : '安装失败', result.message);
        selectedPlugins.clear();
        await loadData();
        renderQuickPlugins();
        renderPluginList();
        renderInstalledPlugins();
    } catch (error) {
        showToast('error', '错误', error.message);
    } finally {
        elements.installAllBtn.disabled = false;
        updateInstallAllButton();
        setTimeout(hideProgress, 2000);
    }
}

// ============================================================
// UI 工具
// ============================================================

function showProgress() { elements.installProgress?.classList.remove('hidden'); }
function hideProgress() { elements.installProgress?.classList.add('hidden'); }

function updateProgress(percent, message) {
    if (elements.progressFill) elements.progressFill.style.width = `${percent}%`;
    if (elements.progressPercent) elements.progressPercent.textContent = `${percent}%`;
    if (elements.progressMessage) elements.progressMessage.textContent = message;
}

function updateUninstallProgress(percent, message) {
    if (elements.uninstallProgressFill) elements.uninstallProgressFill.style.width = `${percent}%`;
    if (elements.uninstallProgressPercent) elements.uninstallProgressPercent.textContent = `${percent}%`;
    if (elements.uninstallProgressMessage) elements.uninstallProgressMessage.textContent = message;
}

function showToast(type, title, message) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
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
    elements.toastContainer?.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ============================================================
// 配置管理
// ============================================================

let currentConfigPath = '';

async function setupConfigEvents() {
    // 加载配置
    document.getElementById('loadConfigBtn')?.addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('read-config', currentConfigPath);
        if (result.success) {
            document.getElementById('configEditor').value = result.content;
            currentConfigPath = result.path;
            document.getElementById('configFilePath').value = result.path;
            if (result.isNew) {
                showToast('info', '新配置', '未找到配置文件，已生成默认配置');
            } else {
                showToast('success', '加载成功', '配置文件已加载');
            }
        } else {
            showToast('error', '加载失败', result.message);
        }
    });

    // 保存配置
    document.getElementById('saveConfigBtn')?.addEventListener('click', async () => {
        const content = document.getElementById('configEditor').value;
        if (!currentConfigPath) {
            showToast('warning', '提示', '请先加载配置文件');
            return;
        }
        const result = await ipcRenderer.invoke('save-config', currentConfigPath, content);
        showToast(result.success ? 'success' : 'error', result.success ? '保存成功' : '保存失败', result.message);
    });

    // 重置默认配置
    document.getElementById('resetConfigBtn')?.addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('read-config', '');
        if (result.success) {
            document.getElementById('configEditor').value = result.content;
            currentConfigPath = result.path;
            document.getElementById('configFilePath').value = result.path;
            showToast('info', '已重置', '配置已恢复为默认值');
        }
    });

    // 浏览配置文件
    document.getElementById('browseConfigBtn')?.addEventListener('click', async () => {
        const result = await ipcRenderer.invoke('select-config-file');
        if (result.path) {
            currentConfigPath = result.path;
            document.getElementById('configFilePath').value = result.path;
            // 自动加载
            const readResult = await ipcRenderer.invoke('read-config', result.path);
            if (readResult.success) {
                document.getElementById('configEditor').value = readResult.content;
                showToast('success', '加载成功', '配置文件已加载');
            }
        }
    });

    // 打开 npm 全局路径
    document.getElementById('openNpmPathBtn')?.addEventListener('click', async () => {
        await ipcRenderer.invoke('open-install-path', '');
    });

    // 执行自定义命令
    document.getElementById('runCustomCmdBtn')?.addEventListener('click', async () => {
        const cmd = document.getElementById('customCommand').value.trim();
        if (!cmd) return;
        const result = await ipcRenderer.invoke('run-command', cmd);
        showToast(result.success ? 'success' : 'error', result.success ? '执行完成' : '执行失败', result.message || '');
    });

    // 快捷命令按钮
    document.querySelectorAll('[data-cmd]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const cmd = btn.dataset.cmd;
            document.getElementById('customCommand').value = cmd;
            const result = await ipcRenderer.invoke('run-command', cmd);
        });
    });

    // 初始化路径显示
    try {
        const npmPath = await ipcRenderer.invoke('get-npm-global-path');
        if (npmPath.success) {
            document.getElementById('npmGlobalPath').value = npmPath.path;
        }
        const configPath = await ipcRenderer.invoke('get-config-path');
        if (configPath.success) {
            document.getElementById('configFilePath').value = configPath.path;
            currentConfigPath = configPath.path;
        }
    } catch (e) {}
}

// ============================================================
// 启动
// ============================================================

document.addEventListener('DOMContentLoaded', init);
