const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;

// 插件配置
const PLUGINS = {
  wechatChatbot: {
    name: '微信ChatBot',
    description: '智能微信聊天机器人，支持自动回复、群管理等功能',
    version: '1.2.0',
    author: 'OpenClaw Team',
    size: '15.2 MB',
    icon: '💬',
    category: '通讯',
    installed: false,
    installPath: '',
    github: 'https://github.com/openclaw/wechat-chatbot'
  },
  fileManager: {
    name: '文件管理器',
    description: '强大的文件浏览和管理工具，支持批量操作',
    version: '2.1.3',
    author: 'OpenClaw Team',
    size: '8.7 MB',
    icon: '📁',
    category: '工具',
    installed: false,
    installPath: '',
    github: 'https://github.com/openclaw/file-manager'
  },
  taskScheduler: {
    name: '任务调度器',
    description: '定时任务和自动化工具，支持Cron表达式',
    version: '1.5.0',
    author: 'OpenClaw Team',
    size: '12.4 MB',
    icon: '⏰',
    category: '自动化',
    installed: false,
    installPath: '',
    github: 'https://github.com/openclaw/task-scheduler'
  },
  logViewer: {
    name: '日志查看器',
    description: '系统日志和错误追踪工具，支持实时查看',
    version: '1.0.8',
    author: 'OpenClaw Team',
    size: '6.3 MB',
    icon: '📋',
    category: '开发',
    installed: false,
    installPath: '',
    github: 'https://github.com/openclaw/log-viewer'
  }
};

// OpenClaw 配置
const OPENCLAW_CONFIG = {
  name: 'OpenClaw',
  description: '强大的开源自动化框架',
  version: '3.2.1',
  size: '45.8 MB',
  icon: '🐾',
  installed: false,
  installPath: '',
  github: 'https://github.com/openclaw/openclaw',
  requirements: ['Node.js >= 16.0', 'Python >= 3.8', 'Git']
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: '#f5f7fa'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 开发工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 处理程序

// 获取 OpenClaw 信息
ipcMain.handle('get-openclaw-info', () => {
  return OPENCLAW_CONFIG;
});

// 获取插件列表
ipcMain.handle('get-plugins', () => {
  return PLUGINS;
});

// 检查 OpenClaw 是否已安装
ipcMain.handle('check-openclaw-installed', async () => {
  try {
    const platform = os.platform();
    let checkCommand = '';
    
    if (platform === 'win32') {
      checkCommand = 'where openclaw';
    } else {
      checkCommand = 'which openclaw';
    }
    
    return new Promise((resolve) => {
      exec(checkCommand, (error, stdout) => {
        if (error) {
          resolve({ installed: false, path: '' });
        } else {
          resolve({ installed: true, path: stdout.trim() });
        }
      });
    });
  } catch (error) {
    return { installed: false, path: '', error: error.message };
  }
});

// 安装 OpenClaw
ipcMain.handle('install-openclaw', async (event, installPath) => {
  try {
    const platform = os.platform();
    let installCommand = '';
    
    // 模拟安装过程
    const steps = [
      { message: '正在检查系统环境...', progress: 10 },
      { message: '正在下载 OpenClaw...', progress: 30 },
      { message: '正在解压安装包...', progress: 50 },
      { message: '正在配置环境变量...', progress: 70 },
      { message: '正在验证安装...', progress: 90 },
      { message: '安装完成！', progress: 100 }
    ];
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      event.sender.send('install-progress', step);
    }
    
    OPENCLAW_CONFIG.installed = true;
    OPENCLAW_CONFIG.installPath = installPath || 'C:\\Program Files\\OpenClaw';
    
    return { success: true, message: 'OpenClaw 安装成功！' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 安装插件
ipcMain.handle('install-plugin', async (event, pluginId) => {
  try {
    const plugin = PLUGINS[pluginId];
    if (!plugin) {
      return { success: false, message: '插件不存在' };
    }
    
    const steps = [
      { message: `正在下载 ${plugin.name}...`, progress: 20 },
      { message: '正在解压插件...', progress: 50 },
      { message: '正在配置插件...', progress: 80 },
      { message: '安装完成！', progress: 100 }
    ];
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 600));
      event.sender.send('plugin-install-progress', { pluginId, ...step });
    }
    
    PLUGINS[pluginId].installed = true;
    PLUGINS[pluginId].installPath = `plugins/${pluginId}`;
    
    return { success: true, message: `${plugin.name} 安装成功！` };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 卸载插件
ipcMain.handle('uninstall-plugin', async (event, pluginId) => {
  try {
    const plugin = PLUGINS[pluginId];
    if (!plugin) {
      return { success: false, message: '插件不存在' };
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    PLUGINS[pluginId].installed = false;
    PLUGINS[pluginId].installPath = '';
    
    return { success: true, message: `${plugin.name} 已卸载` };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 一键安装所有
ipcMain.handle('install-all', async (event, selectedPlugins) => {
  try {
    // 先安装 OpenClaw
    event.sender.send('install-all-progress', { 
      phase: 'openclaw', 
      message: '正在安装 OpenClaw...', 
      progress: 10 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    OPENCLAW_CONFIG.installed = true;
    
    // 安装选中的插件
    const totalPlugins = selectedPlugins.length;
    for (let i = 0; i < totalPlugins; i++) {
      const pluginId = selectedPlugins[i];
      const plugin = PLUGINS[pluginId];
      
      event.sender.send('install-all-progress', {
        phase: 'plugin',
        pluginName: plugin.name,
        message: `正在安装 ${plugin.name}...`,
        progress: 20 + (70 * (i + 1) / totalPlugins)
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      PLUGINS[pluginId].installed = true;
    }
    
    event.sender.send('install-all-progress', {
      phase: 'complete',
      message: '所有组件安装完成！',
      progress: 100
    });
    
    return { success: true, message: '安装完成！' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 打开插件详情
ipcMain.handle('open-plugin-details', async (event, pluginId) => {
  const plugin = PLUGINS[pluginId];
  if (plugin && plugin.github) {
    shell.openExternal(plugin.github);
  }
  return { success: true };
});

// 选择安装目录
ipcMain.handle('select-install-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择安装目录'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { path: result.filePaths[0] };
  }
  return { path: null };
});

// 打开安装目录
ipcMain.handle('open-install-path', async (event, targetPath) => {
  if (targetPath && fs.existsSync(targetPath)) {
    shell.openPath(targetPath);
    return { success: true };
  }
  return { success: false, message: '路径不存在' };
});
