const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;

// ============================================================
// 工具函数
// ============================================================

// 在系统终端窗口中执行命令（显示系统自带命令行软件）
function execInSystemTerminal(command, options = {}) {
    const { cwd } = options;
    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    
    return new Promise((resolve, reject) => {
        if (isWin) {
            // Windows: 打开新的 CMD 窗口执行命令
            // 使用 start 命令打开新窗口，/k 保持窗口打开
            const cmdCommand = `cmd /c "cd /d "${cwd || process.cwd()}" & ${command} & echo. & echo 按任意键关闭窗口... & pause >nul"`;
            const fullCommand = `start "OpenClaw Installer - 命令执行" cmd /k "${command} & echo. & echo ======================================== & echo 命令执行完成，按任意键关闭窗口... & pause >nul"`;
            
            exec(fullCommand, { cwd: cwd || process.cwd() }, (error, stdout, stderr) => {
                if (error) {
                    reject({ success: false, message: error.message });
                } else {
                    resolve({ success: true, stdout, stderr });
                }
            });
        } else if (isMac) {
            // macOS: 打开 Terminal 窗口执行命令
            const script = `tell application "Terminal" to do script "cd '${cwd || process.cwd()}' && ${command} && echo '' && echo '命令执行完成，按任意键关闭...' && read -n 1"`;
            exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
                if (error) {
                    reject({ success: false, message: error.message });
                } else {
                    resolve({ success: true, stdout, stderr });
                }
            });
        } else {
            // Linux: 打开终端窗口执行命令
            const terminalCommand = `gnome-terminal -- bash -c "cd '${cwd || process.cwd()}' && ${command} && echo '' && echo '命令执行完成，按回车关闭...' && read"`;
            exec(terminalCommand, (error, stdout, stderr) => {
                if (error) {
                    // 尝试其他终端
                    const altCommand = `xterm -e bash -c "cd '${cwd || process.cwd()}' && ${command}; read"`;
                    exec(altCommand, (err2, out2, err2out) => {
                        if (err2) {
                            reject({ success: false, message: err2.message });
                        } else {
                            resolve({ success: true, stdout: out2, stderr: err2out });
                        }
                    });
                } else {
                    resolve({ success: true, stdout, stderr });
                }
            });
        }
    });
}

// 执行命令（后台执行，用于获取信息）
function execCommand(command, options = {}) {
    const { cwd, env: extraEnv } = options;
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32';
        
        let stdout = '';
        let stderr = '';

        if (isWin) {
            const child = spawn('cmd.exe', ['/c', command], {
                cwd: cwd || undefined,
                shell: true,
                env: { ...process.env, ...extraEnv },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0 || code === null) {
                    resolve({ success: true, code: code || 0, stdout: stdout.trim(), stderr: stderr.trim() });
                } else {
                    reject({ success: false, code, stdout: stdout.trim(), stderr: stderr.trim(), message: `命令退出码: ${code}` });
                }
            });

            child.on('error', (err) => {
                reject({ success: false, message: err.message });
            });
        } else {
            const child = spawn('/bin/bash', ['-c', command], {
                cwd: cwd || undefined,
                env: { ...process.env, ...extraEnv }
            });

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, code, stdout: stdout.trim(), stderr: stderr.trim() });
                } else {
                    reject({ success: false, code, stdout: stdout.trim(), stderr: stderr.trim(), message: `命令退出码: ${code}` });
                }
            });

            child.on('error', (err) => {
                reject({ success: false, message: err.message });
            });
        }
    });
}

// ============================================================
// 主窗口
// ============================================================

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, height: 800, minWidth: 900, minHeight: 600,
        icon: path.join(__dirname, '../assets/icon.ico'),
        webPreferences: { nodeIntegration: true, contextIsolation: false, enableRemoteModule: true },
        show: false, backgroundColor: '#f5f7fa',
        title: 'OpenClaw Installer'
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ============================================================
// IPC: 获取信息
// ============================================================

// 获取 openclaw 包信息（真实从 npm 获取）
ipcMain.handle('get-openclaw-info', async () => {
    try {
        const result = await execCommand('npm view openclaw version description');
        const lines = result.stdout.split('\n').filter(l => l.trim());
        const version = lines.find(l => !l.includes(' ')) || '未知';
        const description = lines.find(l => l.includes(' ')) || 'OpenClaw 自动化框架';
        return {
            name: 'openclaw',
            description: description.trim(),
            version: version.trim(),
            icon: '🐾',
            npmPackage: 'openclaw'
        };
    } catch (e) {
        return {
            name: 'openclaw',
            description: 'OpenClaw 自动化框架',
            version: '未知（无法连接 npm）',
            icon: '🐾',
            npmPackage: 'openclaw'
        };
    }
});

// 检查 openclaw 是否已安装（真实检查）
ipcMain.handle('check-openclaw-installed', async () => {
    try {
        const result = await execCommand('npm list -g openclaw --json');
        const data = JSON.parse(result.stdout);
        const deps = data.dependencies || {};
        const info = deps['openclaw'];

        if (info) {
            // 获取安装路径
            let installPath = '';
            try {
                const whichResult = await execCommand(
                    process.platform === 'win32' ? 'npm root -g' : 'which openclaw'
                );
                installPath = whichResult.stdout.trim();
            } catch (e) {}

            return {
                installed: true,
                version: info.version || '未知',
                path: installPath
            };
        }
        return { installed: false, path: '' };
    } catch (e) {
        return { installed: false, path: '' };
    }
});

// 获取已安装的插件列表（真实扫描）
ipcMain.handle('get-plugins', async () => {
    try {
        const result = await execCommand('npm list -g --json --depth=0');
        const data = JSON.parse(result.stdout);
        const deps = data.dependencies || {};

        const pluginMap = {
            'openclaw-wechat-chatbot': {
                name: '微信ChatBot', description: '智能微信聊天机器人', icon: '💬', category: '通讯'
            },
            'openclaw-file-manager': {
                name: '文件管理器', description: '文件浏览和管理工具', icon: '📁', category: '工具'
            },
            'openclaw-task-scheduler': {
                name: '任务调度器', description: '定时任务和自动化工具', icon: '⏰', category: '自动化'
            },
            'openclaw-log-viewer': {
                name: '日志查看器', description: '日志和错误追踪工具', icon: '📋', category: '开发'
            }
        };

        const plugins = {};
        for (const [pkgName, info] of Object.entries(deps)) {
            if (pkgName === 'openclaw') continue; // 跳过主包
            const meta = pluginMap[pkgName] || {
                name: pkgName, description: info.description || '插件', icon: '🔌', category: '其他'
            };
            plugins[pkgName] = {
                ...meta,
                npmPackage: pkgName,
                version: info.version || '未知',
                author: info.author || '',
                installed: true,
                installPath: ''
            };
        }

        // 添加已知但未安装的插件
        for (const [pkgName, meta] of Object.entries(pluginMap)) {
            if (!plugins[pkgName]) {
                plugins[pkgName] = {
                    ...meta,
                    npmPackage: pkgName,
                    version: '',
                    author: '',
                    installed: false,
                    installPath: ''
                };
            }
        }

        return plugins;
    } catch (e) {
        // npm 查询失败，返回默认列表
        return {
            'openclaw-wechat-chatbot': { name: '微信ChatBot', description: '智能微信聊天机器人', icon: '💬', category: '通讯', npmPackage: 'openclaw-wechat-chatbot', version: '', installed: false, installPath: '' },
            'openclaw-file-manager': { name: '文件管理器', description: '文件浏览和管理工具', icon: '📁', category: '工具', npmPackage: 'openclaw-file-manager', version: '', installed: false, installPath: '' },
            'openclaw-task-scheduler': { name: '任务调度器', description: '定时任务和自动化工具', icon: '⏰', category: '自动化', npmPackage: 'openclaw-task-scheduler', version: '', installed: false, installPath: '' },
            'openclaw-log-viewer': { name: '日志查看器', description: '日志和错误追踪工具', icon: '📋', category: '开发', npmPackage: 'openclaw-log-viewer', version: '', installed: false, installPath: '' }
        };
    }
});

// ============================================================
// IPC: 安装 / 卸载 / 重启（在系统终端窗口中执行）
// ============================================================

// 安装 OpenClaw
ipcMain.handle('install-openclaw', async (event) => {
    try {
        mainWindow?.webContents.send('install-progress', { progress: 10, message: '正在打开系统终端...' });
        
        await execInSystemTerminal('npm install -g openclaw');
        
        mainWindow?.webContents.send('install-progress', { progress: 100, message: '命令已执行' });
        return { success: true, message: '安装命令已在系统终端中执行' };
    } catch (error) {
        mainWindow?.webContents.send('install-progress', { progress: 0, message: '执行失败' });
        return { success: false, message: error.message };
    }
});

// 卸载 OpenClaw
ipcMain.handle('uninstall-openclaw', async (event) => {
    try {
        mainWindow?.webContents.send('uninstall-progress', { progress: 30, message: '正在打开系统终端...' });
        
        await execInSystemTerminal('npm uninstall -g openclaw');
        
        mainWindow?.webContents.send('uninstall-progress', { progress: 100, message: '命令已执行' });
        return { success: true, message: '卸载命令已在系统终端中执行' };
    } catch (error) {
        mainWindow?.webContents.send('uninstall-progress', { progress: 0, message: '执行失败' });
        return { success: false, message: error.message };
    }
});

// 重启 OpenClaw（先卸载再安装）
ipcMain.handle('restart-openclaw', async (event) => {
    try {
        mainWindow?.webContents.send('restart-progress', { progress: 20, message: '正在打开系统终端...' });
        
        const isWin = process.platform === 'win32';
        const cmd = isWin 
            ? 'npm uninstall -g openclaw & npm install -g openclaw'
            : 'npm uninstall -g openclaw && npm install -g openclaw';
        
        await execInSystemTerminal(cmd);
        
        mainWindow?.webContents.send('restart-progress', { progress: 100, message: '命令已执行' });
        return { success: true, message: '重启命令已在系统终端中执行' };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// 安装插件
ipcMain.handle('install-plugin', async (event, pkgName) => {
    try {
        await execInSystemTerminal(`npm install -g ${pkgName}`);
        return { success: true, message: `安装 ${pkgName} 的命令已在系统终端中执行` };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// 卸载插件
ipcMain.handle('uninstall-plugin', async (event, pkgName) => {
    try {
        await execInSystemTerminal(`npm uninstall -g ${pkgName}`);
        return { success: true, message: `卸载 ${pkgName} 的命令已在系统终端中执行` };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// 更新 OpenClaw
ipcMain.handle('update-openclaw', async (event) => {
    try {
        mainWindow?.webContents.send('install-progress', { progress: 30, message: '正在打开系统终端...' });
        
        await execInSystemTerminal('npm update -g openclaw');
        
        mainWindow?.webContents.send('install-progress', { progress: 100, message: '命令已执行' });
        return { success: true, message: '更新命令已在系统终端中执行' };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// 一键安装所有
ipcMain.handle('install-all', async (event, options) => {
    try {
        const { plugins, installOpenclaw } = options;
        const isWin = process.platform === 'win32';
        const joinCmd = isWin ? ' & ' : ' && ';
        
        let commands = [];
        
        // 只有在 openclaw 未安装时才安装
        if (installOpenclaw) {
            commands.push('npm install -g openclaw');
        }
        
        // 安装选中的插件
        plugins.forEach(pkg => {
            commands.push(`npm install -g ${pkg}`);
        });
        
        if (commands.length === 0) {
            return { success: true, message: '没有需要安装的组件' };
        }
        
        await execInSystemTerminal(commands.join(joinCmd));
        
        mainWindow?.webContents.send('install-all-progress', { phase: 'complete', message: '命令已执行', progress: 100 });
        return { success: true, message: installOpenclaw ? 'OpenClaw 和插件安装命令已执行' : '插件安装命令已执行' };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// 获取 npm 全局安装路径
ipcMain.handle('get-npm-global-path', async () => {
    try {
        const result = await execCommand('npm root -g');
        return { success: true, path: result.stdout.trim() };
    } catch (e) {
        return { success: false, path: '' };
    }
});

// 打开目录
ipcMain.handle('open-install-path', async (event, targetPath) => {
    if (targetPath && fs.existsSync(targetPath)) {
        shell.openPath(targetPath);
        return { success: true };
    }
    // 尝试打开 npm 全局目录
    try {
        const result = await execCommand('npm root -g');
        shell.openPath(result.stdout.trim());
        return { success: true };
    } catch (e) {
        return { success: false, message: '路径不存在' };
    }
});

// 选择安装目录
ipcMain.handle('select-install-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], title: '选择目录'
    });
    return result.canceled ? { path: null } : { path: result.filePaths[0] };
});

// 打开 GitHub
ipcMain.handle('open-plugin-details', async (event, url) => {
    if (url) shell.openExternal(url);
    return { success: true };
});

// 运行自定义命令
ipcMain.handle('run-command', async (event, command) => {
    try {
        await execInSystemTerminal(command);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// ============================================================
// IPC: 配置管理
// ============================================================

// 获取 OpenClaw 配置文件路径
ipcMain.handle('get-config-path', async () => {
    try {
        const npmRoot = await execCommand('npm root -g');
        const configPath = path.join(npmRoot.stdout.trim(), 'openclaw', 'config.json');
        return { success: true, path: configPath };
    } catch (e) {
        // 默认路径
        const defaultPath = path.join(app.getPath('home'), '.openclaw', 'config.json');
        return { success: true, path: defaultPath };
    }
});

// 读取配置文件
ipcMain.handle('read-config', async (event, filePath) => {
    try {
        // 如果没有指定路径，尝试查找默认路径
        if (!filePath) {
            const npmRoot = await execCommand('npm root -g');
            const defaultPath = path.join(npmRoot.stdout.trim(), 'openclaw', 'config.json');
            if (fs.existsSync(defaultPath)) {
                filePath = defaultPath;
            } else {
                filePath = path.join(app.getPath('home'), '.openclaw', 'config.json');
            }
        }

        if (!fs.existsSync(filePath)) {
            // 返回默认配置
            const defaultConfig = {
                "name": "openclaw",
                "version": "latest",
                "port": 3000,
                "host": "localhost",
                "logLevel": "info",
                "plugins": {
                    "enabled": true,
                    "autoUpdate": false,
                    "directory": "./plugins"
                }
            };
            return { success: true, content: JSON.stringify(defaultConfig, null, 2), path: filePath, isNew: true };
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        return { success: true, content, path: filePath, isNew: false };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// 保存配置文件
ipcMain.handle('save-config', async (event, filePath, content) => {
    try {
        // 确保目录存在
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 验证 JSON 格式
        try {
            JSON.parse(content);
        } catch (e) {
            return { success: false, message: 'JSON 格式错误: ' + e.message };
        }

        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true, message: '配置已保存' };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// 选择配置文件
ipcMain.handle('select-config-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        title: '选择配置文件',
        filters: [
            { name: 'JSON 文件', extensions: ['json'] },
            { name: '所有文件', extensions: ['*'] }
        ]
    });
    return result.canceled ? { path: null } : { path: result.filePaths[0] };
});
