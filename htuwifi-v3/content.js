(function() {
  'use strict';

  const currentHost = window.location.hostname;

  // 判断当前是哪个认证页面
  function getPageType() {
    if (currentHost === '10.10.36.2') return 'jiaoxue';   // 教学区 Dr.COM
    if (currentHost === '10.101.2.194') return 'sushe';   // 宿舍区
    return null;
  }

  const pageType = getPageType();
  if (!pageType) return;

  // 根据页面类型读取对应的存储配置
  const storageKey = pageType === 'jiaoxue' ? 'jiaoxueConfig' : 'susheConfig';

  chrome.storage.sync.get([storageKey], function(data) {
    const config = data[storageKey] || {};
    const enabled = config.enabled !== false;
    const autoSubmit = config.autoSubmit !== false;

    if (!enabled) return;
    if (!config.username || !config.password) {
      console.log(`[河师大认证-${pageType}] 未配置账号密码`);
      return;
    }

    if (pageType === 'jiaoxue') {
      fillTeachingArea(config, autoSubmit);
    } else if (pageType === 'sushe') {
      fillDormitoryArea(config, autoSubmit);
    }
  });

  // ========== 教学区填充逻辑 ==========
  function fillTeachingArea(config, autoSubmit) {
    console.log('[河师大认证-教学区] 开始填充 Dr.COM 哆点系统');

    function tryFill() {
      // Dr.COM 系统动态渲染，输入框可能延迟出现
      // 查找用户名输入框
      let usernameInput = document.querySelector('input[name="DDDDD"]') ||
                          document.querySelector('input[id*="user"]') ||
                          document.querySelector('input[type="text"]');

      // 查找密码输入框
      let passwordInput = document.querySelector('input[name="upass"]') ||
                          document.querySelector('input[type="password"]');

      if (usernameInput && passwordInput) {
        setNativeValue(usernameInput, config.username);
        setNativeValue(passwordInput, config.password);
        console.log('[河师大认证-教学区] ✅ 账号密码已填充');

        if (autoSubmit) {
          setTimeout(() => {
            // Dr.COM 的登录按钮可能是 a 标签或 input
            let loginBtn = document.querySelector('a[href*="Login"], #login, .login_btn, input[type="submit"], button[type="submit"]');
            if (!loginBtn) {
              const allBtns = document.querySelectorAll('a, button, input[type="button"]');
              for (let btn of allBtns) {
                if (btn.textContent.trim() === '登录' || btn.value === '登录') {
                  loginBtn = btn;
                  break;
                }
              }
            }
            if (loginBtn) {
              loginBtn.click();
              console.log('[河师大认证-教学区] ✅ 已点击登录');
            } else {
              console.log('[河师大认证-教学区] ⚠️ 未找到登录按钮');
            }
          }, 600);
        }
        return true;
      }
      return false;
    }

    // 多次尝试，因为 Dr.COM 页面渲染较慢
    let attempts = 0;
    const maxAttempts = 15;
    const interval = setInterval(() => {
      attempts++;
      if (tryFill() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.log('[河师大认证-教学区] ⚠️ 超时未找到输入框');
        }
      }
    }, 1000);

    tryFill();
  }

  // ========== 宿舍区填充逻辑 ==========
  function fillDormitoryArea(config, autoSubmit) {
    console.log('[河师大认证-宿舍区] 开始填充');

    function tryFill() {
      const usernameInput = document.getElementById('userName') || 
                            document.querySelector('input[name="userName"]');
      const passwordInput = document.getElementById('password') || 
                            document.querySelector('input[name="password"]');

      if (!usernameInput || !passwordInput) return false;

      // 填充账号密码
      setNativeValue(usernameInput, config.username);
      setNativeValue(passwordInput, config.password);
      console.log('[河师大认证-宿舍区] ✅ 账号密码已填充');

      // 选择运营商
      if (config.operator) {
        const operatorMap = {
          'jzg': '教职公',
          'xnzy': '资源',
          'yd': '移动',
          'lt': '联通',
          'dx': '电信'
        };
        const operatorRadio = document.querySelector(`input[name="operator"][value="${config.operator}"]`);
        if (operatorRadio) {
          operatorRadio.checked = true;
          // 触发change事件
          operatorRadio.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`[河师大认证-宿舍区] ✅ 已选择运营商：${operatorMap[config.operator] || config.operator}`);
        } else {
          // 如果value对不上，尝试通过索引选择
          const allRadios = document.querySelectorAll('input[name="operator"]');
          const valueToIndex = { 'jzg': 0, 'xnzy': 1, 'yd': 2, 'lt': 3, 'dx': 4 };
          const index = valueToIndex[config.operator];
          if (index !== undefined && allRadios[index]) {
            allRadios[index].checked = true;
            allRadios[index].dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`[河师大认证-宿舍区] ✅ 已通过索引选择运营商：${operatorMap[config.operator]}`);
          }
        }
      }

      // 自动点击登录
      if (autoSubmit) {
        setTimeout(() => {
          const loginBtn = document.getElementById('loginBtn') ||
                          document.querySelector('.loginBtn') ||
                          document.querySelector('input[type="button"][value*="登录"]');
          if (loginBtn) {
            loginBtn.click();
            console.log('[河师大认证-宿舍区] ✅ 已点击登录');
          } else {
            console.log('[河师大认证-宿舍区] ⚠️ 未找到登录按钮');
          }
        }, 600);
      }
      return true;
    }

    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      if (tryFill() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 800);

    tryFill();
  }

  // ========== 工具函数 ==========
  function setNativeValue(element, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.focus();
    element.blur();
  }

})();