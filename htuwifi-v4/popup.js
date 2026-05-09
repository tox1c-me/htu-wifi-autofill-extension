document.addEventListener('DOMContentLoaded', function() {

  // ==================== 开屏动画 ====================
  initSplashScreen();

  function initSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const mainScreen = document.getElementById('main-screen');
    const progressBar = document.getElementById('progress-bar');
    const particlesContainer = document.getElementById('particles');

    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 3 + 1;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.bottom = -(Math.random() * 40) + 'px';
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      particle.style.animationDelay = (Math.random() * 3) + 's';
      particlesContainer.appendChild(particle);
    }

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 18 + 88;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        setTimeout(() => {
          splashScreen.classList.add('hide');
          mainScreen.classList.add('show');
          setTimeout(() => {
            splashScreen.style.display = 'none';
          }, 600);
        }, 300);
      }
      progressBar.style.width = progress + '%';
    }, 100);
  }

  // ==================== 选项卡切换 ====================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById('tab-' + targetTab).classList.add('active');
    });
  });

  // ==================== 加载配置 ====================
  loadConfig('jiaoxueConfig', {
    username: 'j-username',
    password: 'j-password',
    autoSubmit: 'j-autoSubmit',
    enabled: 'j-enabled'
  });

  loadConfig('susheConfig', {
    username: 's-username',
    password: 's-password',
    operator: 's-operator',
    autoSubmit: 's-autoSubmit',
    enabled: 's-enabled'
  });

  loadConfig('teacherConfig', {
    username: 't-username',
    password: 't-password',
    autoSubmit: 't-autoSubmit',
    enabled: 't-enabled'
  });

  function loadConfig(storageKey, fieldIds) {
    chrome.storage.sync.get([storageKey], function(data) {
      const config = data[storageKey] || {};
      if (config.username) document.getElementById(fieldIds.username).value = config.username;
      if (config.password) document.getElementById(fieldIds.password).value = config.password;
      if (fieldIds.operator) {
        document.getElementById(fieldIds.operator).value = config.operator || '';
      }
      document.getElementById(fieldIds.autoSubmit).checked = config.autoSubmit !== false;
      document.getElementById(fieldIds.enabled).checked = config.enabled !== false;
    });
  }

  // ==================== 保存配置 ====================
  document.getElementById('j-saveBtn').addEventListener('click', function() {
    saveConfig('jiaoxueConfig', {
      username: 'j-username',
      password: 'j-password',
      autoSubmit: 'j-autoSubmit',
      enabled: 'j-enabled'
    }, '教学区');
  });

  document.getElementById('s-saveBtn').addEventListener('click', function() {
    saveConfig('susheConfig', {
      username: 's-username',
      password: 's-password',
      operator: 's-operator',
      autoSubmit: 's-autoSubmit',
      enabled: 's-enabled'
    }, '宿舍区');
  });

  document.getElementById('t-saveBtn').addEventListener('click', function() {
    saveConfig('teacherConfig', {
      username: 't-username',
      password: 't-password',
      autoSubmit: 't-autoSubmit',
      enabled: 't-enabled'
    }, '教师区');
  });

  function saveConfig(storageKey, fieldIds, areaName) {
    const username = document.getElementById(fieldIds.username).value.trim();
    const password = document.getElementById(fieldIds.password).value.trim();

    if (!username || !password) {
      showStatus('⚠️ 请填写账号和密码', 'error');
      return;
    }

    const config = {
      username: username,
      password: password,
      autoSubmit: document.getElementById(fieldIds.autoSubmit).checked,
      enabled: document.getElementById(fieldIds.enabled).checked
    };

    if (fieldIds.operator) {
      config.operator = document.getElementById(fieldIds.operator).value;
    }

    chrome.storage.sync.set({ [storageKey]: config }, function() {
      showStatus(`✅ ${areaName}配置已保存`, 'success');
    });
  }

  // ==================== 立即填充 ====================
  document.getElementById('j-fillBtn').addEventListener('click', refreshCurrentTab);
  document.getElementById('s-fillBtn').addEventListener('click', refreshCurrentTab);
  document.getElementById('t-fillBtn').addEventListener('click', refreshCurrentTab);

  function refreshCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
        showStatus('🔄 正在刷新并填充...', 'success');
      }
    });
  }

  // ==================== 快捷跳转 ====================
  document.getElementById('go-sushe').addEventListener('click', function() {
    chrome.tabs.update({ url: 'http://10.101.2.194:6060/' });
  });

  document.getElementById('go-teacher').addEventListener('click', function() {
    chrome.tabs.update({ url: 'http://10.10.36.2/' });
  });

  document.getElementById('go-logout').addEventListener('click', function() {
    chrome.tabs.update({ url: 'http://logout.htu.cn/' });
  });

  // ==================== 状态提示 ====================
  function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'status';
    }, 2000);
  }
});