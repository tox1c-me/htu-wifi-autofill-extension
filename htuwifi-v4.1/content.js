// content.js - 河师大校园网通用自动认证助手
// 支持：教学区学生 | 宿舍区学生 | 教师区
// made by 0xHydro & DS

(function() {
  'use strict';

  const currentUrl = window.location.href;
  const hostname = window.location.hostname;

  // ==================== 区域识别 ====================
  function getPageType() {
    if (currentUrl.includes('wlanacname=HNSFDX-XXQ-ME60-X8A') || hostname === '10.10.36.2') {
      return 'teacher';
    }
    if (currentUrl.includes('wlanacname=HSD-BRAS-2') || currentUrl.includes('vlan=19951083')) {
      return 'jiaoxue';
    }
    if (currentUrl.includes('wlanacname=HSD-BRAS-1') || currentUrl.includes('vlan=19961078')) {
      return 'sushe';
    }
    if (hostname === '10.101.2.194') {
      return 'sushe';
    }
    console.log('[河师大认证] 无法识别区域，默认使用宿舍区配置');
    return 'sushe';
  }

  const pageType = getPageType();
  const storageKeyMap = {
    'teacher': 'teacherConfig',
    'jiaoxue': 'jiaoxueConfig',
    'sushe': 'susheConfig'
  };
  const storageKey = storageKeyMap[pageType];
  const areaNameMap = {
    'teacher': '教师区',
    'jiaoxue': '教学区',
    'sushe': '宿舍区'
  };

  console.log(`[河师大认证] 当前区域：${areaNameMap[pageType]}，读取配置：${storageKey}`);

  chrome.storage.local.get([storageKey], function(data) {
    const localConfig = data[storageKey] || {};
    if (localConfig.username && localConfig.password) {
      useConfig(localConfig);
      return;
    }

    // Migrate configurations created by v4.0 without blocking new local-only installs.
    chrome.storage.sync.get([storageKey], function(syncData) {
      const legacyConfig = syncData[storageKey] || {};
      if (legacyConfig.username && legacyConfig.password) {
        chrome.storage.local.set({ [storageKey]: legacyConfig }, function() {
          chrome.storage.sync.remove(storageKey);
          useConfig(legacyConfig);
        });
      }
    });
  });

  function useConfig(config) {
    const enabled = config.enabled !== false;
    const autoSubmit = config.autoSubmit !== false;

    if (!enabled) return;
    if (!config.username || !config.password) return;

    console.log(`[河师大认证-${areaNameMap[pageType]}] 准备填充认证信息`);

    if (pageType === 'teacher') {
      fillTeachingArea(config, autoSubmit);
    } else {
      fillDormitoryArea(config, autoSubmit);
    }
  }

  // ==================== 教师区填充逻辑 ====================
  function fillTeachingArea(config, autoSubmit) {
    console.log('[河师大认证-教师] 开始填充 Dr.COM 系统');

    function tryFill() {
      let visibleUsername = document.querySelector('input[type="text"][name="DDDDD"]') ||
                            document.querySelector('input[name="DDDDD"]:not([type="hidden"])');

      let passwordInput = document.querySelector('input[type="password"][name="upass"]') ||
                          document.querySelector('input[name="upass"]:not([type="hidden"])');

      let hiddenUsername = document.querySelector('input[type="hidden"][name="DDDDD"]');
      let hiddenPassword = document.querySelector('input[type="hidden"][name="upass"]');

      if (visibleUsername && passwordInput) {
        visibleUsername.click();
        visibleUsername.focus();
        setNativeValue(visibleUsername, config.username);

        if (hiddenUsername) {
          setNativeValue(hiddenUsername, config.username);
        }

        console.log('[河师大认证-教师] ✅ 账号已填充');

        passwordInput.click();
        passwordInput.focus();
        setNativeValue(passwordInput, config.password);

        if (hiddenPassword) {
          setNativeValue(hiddenPassword, config.password);
        }

        console.log('[河师大认证-教师] ✅ 密码已填充');

        if (autoSubmit) {
          setTimeout(() => {
            let loginBtn = document.querySelector('input[name="OMKKey"]') ||
                          document.querySelector('input.edit_lobo_cell[type="button"]');

            if (loginBtn) {
              loginBtn.click();
              console.log('[河师大认证-教师] ✅ 已点击登录按钮');
            } else {
              console.log('[河师大认证-教师] ⚠️ 未找到登录按钮');
            }
          }, 600);
        }

        return true;
      }
      return false;
    }

    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
      attempts++;
      if (tryFill() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.log('[河师大认证-教师] ⚠️ 超时未找到输入框');
        }
      }
    }, 1000);

    const observer = new MutationObserver(function(mutations) {
      for (let mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          const hasInput = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === 1) {
              return node.tagName === 'INPUT' || (node.querySelector && node.querySelector('input'));
            }
            return false;
          });
          if (hasInput) tryFill();
        }
      }
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 15000);
    }

    tryFill();
  }

  // ==================== 学生区填充逻辑 ====================
  function fillDormitoryArea(config, autoSubmit) {
    function tryFill() {
      const usernameInput = document.getElementById('userName') ||
                            document.querySelector('input[name="userName"]');
      const passwordInput = document.getElementById('password') ||
                            document.querySelector('input[name="password"]');

      if (!usernameInput || !passwordInput) return false;

      setNativeValue(usernameInput, config.username);
      setNativeValue(passwordInput, config.password);
      console.log('[河师大认证] ✅ 账号密码已填充');

      selectOperator(config.operator);

      if (autoSubmit) {
        setTimeout(() => {
          const loginBtn = document.getElementById('loginBtn') ||
                          document.querySelector('.loginBtn') ||
                          document.querySelector('input[type="button"]');
          if (loginBtn) {
            loginBtn.click();
            console.log('[河师大认证] ✅ 已点击登录按钮');
          } else {
            console.log('[河师大认证] ⚠️ 未找到登录按钮，请手动点击');
          }
        }, 400);
      }
      return true;
    }

    function selectOperator(operator) {
      const operatorMap = {
        'jzg': '教职公',
        'xnzy': '资源',
        'yd': '移动',
        'lt': '联通',
        'dx': '电信'
      };

      const allRadios = document.querySelectorAll('input[name="operator"]');

      if (operator) {
        let targetRadio = document.querySelector(`input[name="operator"][value="${operator}"]`);

        if (!targetRadio) {
          const selectorMap = { 'jzg': 0, 'xnzy': 1, 'yd': 2, 'lt': 3, 'dx': 4 };
          const idx = selectorMap[operator];
          if (idx !== undefined && allRadios[idx]) {
            targetRadio = allRadios[idx];
          }
        }

        if (targetRadio) {
          allRadios.forEach(r => r.checked = false);
          targetRadio.checked = true;
          targetRadio.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          targetRadio.dispatchEvent(new Event('change', { bubbles: true }));

          const parentLabel = targetRadio.closest('label');
          if (parentLabel) parentLabel.click();

          setTimeout(() => {
            targetRadio.checked = true;
            targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
            if (parentLabel) parentLabel.click();
          }, 150);

          console.log(`[河师大认证] ✅ 已选择运营商：${operatorMap[operator] || operator}`);
        }
      } else {
        allRadios.forEach(r => {
          r.checked = false;
          r.dispatchEvent(new Event('change', { bubbles: true }));
        });
        console.log('[河师大认证] ✅ 未选择运营商（直连模式）');
      }
    }

    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      if (tryFill() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.log('[河师大认证] ⚠️ 超时未找到输入框');
        }
      }
    }, 800);

    tryFill();
  }

  // ==================== 工具函数 ====================
  function setNativeValue(element, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(element, value);

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  }

})();
