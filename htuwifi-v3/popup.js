document.addEventListener('DOMContentLoaded', function() {

  // ========== 开屏动画 ==========
  initSplashScreen();

  function initSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const mainScreen = document.getElementById('main-screen');
    const progressBar = document.getElementById('progress-bar');
    const particlesContainer = document.getElementById('particles');

    // 生成粒子
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 3 + 1;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.bottom = -(Math.random() * 30) + 'px';
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      particle.style.animationDelay = (Math.random() * 3) + 's';
      particlesContainer.appendChild(particle);
    }

    // 进度条动画
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20 + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        // 动画结束，显示主界面
        setTimeout(() => {
          splashScreen.classList.add('hide');
          mainScreen.classList.add('show');
          // 动画结束后移除splash
          setTimeout(() => {
            splashScreen.style.display = 'none';
          }, 600);
        }, 300);
      }
      progressBar.style.width = progress + '%';
    }, 200);
  }

  // ========== 选项卡切换 ==========
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

  // ========== 加载保存的配置 ==========
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

  function loadConfig(storageKey, fieldIds) {
    chrome.storage.sync.get([storageKey], function(data) {
      const config = data[storageKey] || {};
      if (config.username) document.getElementById(fieldIds.username).value = config.username;
      if (config.password) document.getElementById(fieldIds.password).value = config.password;
      if (fieldIds.operator && config.operator) document.getElementById(fieldIds.operator).value = config.operator;
      document.getElementById(fieldIds.autoSubmit).checked = config.autoSubmit !== false;
      document.getElementById(fieldIds.enabled).checked = config.enabled !== false;
    });
  }

  // ========== 教学区保存 ==========
  document.getElementById('j-saveBtn').addEventListener('click', function() {
    saveAndShowStatus('jiaoxueConfig', {
      username: 'j-username',
      password: 'j-password',
      autoSubmit: 'j-autoSubmit',
      enabled: 'j-enabled'
    }, '教学区');
  });

  // ========== 宿舍区保存 ==========
  document.getElementById('s-saveBtn').addEventListener('click', function() {
    saveAndShowStatus('susheConfig', {
      username: 's-username',
      password: 's-password',
      operator: 's-operator',
      autoSubmit: 's-autoSubmit',
      enabled: 's-enabled'
    }, '宿舍区');
  });

  function saveAndShowStatus(storageKey, fieldIds, areaName) {
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

  // ========== 立即填充 ==========
  document.getElementById('j-fillBtn').addEventListener('click', function() {
    fillCurrentTab();
  });

  document.getElementById('s-fillBtn').addEventListener('click', function() {
    fillCurrentTab();
  });

  function fillCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
        showStatus('🔄 正在刷新并填充...', 'success');
      }
    });
  }

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