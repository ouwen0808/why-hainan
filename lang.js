/**
 * Why Hainan 全局语言切换
 * 默认英文（隐藏所有中文对照），导航右侧注入「EN / 中文」切换按钮。
 * 中文态 = 中英对照（显示中文；英文为主内容保持不变）。
 *
 * 用法：页面在 config.js 之后引入 <script src="lang.js"></script>
 *  - 语言记忆在 localStorage 的 wh_lang（'en' | 'zh'）
 *  - 切换后触发 window 的 'whlangchange' 事件（detail.lang），供动态渲染监听重渲染
 *  - window.WH_LANG = { get, set, toggle, isZh }
 */
(function (global) {
  var KEY = 'wh_lang';
  var SUPPORTED = ['en', 'zh'];
  var DEFAULT = 'en';

  function get() {
    try {
      var v = localStorage.getItem(KEY);
      return SUPPORTED.indexOf(v) >= 0 ? v : DEFAULT;
    } catch (e) { return DEFAULT; }
  }

  var lang = get();

  function apply() {
    var el = document.documentElement;
    el.lang = lang;
    el.classList.remove('lang-en', 'lang-zh');
    el.classList.add('lang-' + lang);
    document.querySelectorAll('[data-wh-lang]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-wh-lang') === lang);
    });
  }

  function set(l) {
    if (SUPPORTED.indexOf(l) < 0) return;
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    apply();
    try {
      global.dispatchEvent(new CustomEvent('whlangchange', { detail: { lang: lang } }));
    } catch (e) {
      var ev = document.createEvent('Event');
      ev.initEvent('whlangchange', true, true);
      global.dispatchEvent(ev);
    }
  }

  function toggle() { set(lang === 'zh' ? 'en' : 'zh'); }

  // 注入 CSS：英文态隐藏所有中文对照元素
  var HIDE_SELECTORS = [
    '.cn', '.cn-line', '.cn-title', '.cn-block', '.cn-block::before',
    '.st-cn', '.label-cn', '.slide-title-cn', '.slide-sub-cn',
    '.fc-cn', '.li-cn', '.rec-cn', '.src-cn', '.tip-cn', '.zh-only'
  ];
  var css = 'html.lang-en ' + HIDE_SELECTORS.join(', html.lang-en ') + ' { display: none !important; }';
  css += '\n.wh-lang-switch { display: inline-flex; gap: 4px; margin-left: 16px; flex-shrink: 0; }';
  css += '\n.wh-lang-switch button { background: transparent; border: 1px solid #e2e8f0; color: #334155; font-size: 0.78rem; font-weight: 700; padding: 5px 12px; border-radius: 16px; cursor: pointer; transition: all .15s; font-family: inherit; }';
  css += '\n.wh-lang-switch button:hover { border-color: #0d9488; color: #0d9488; }';
  css += '\n.wh-lang-switch button.active { background: #0d9488; border-color: #0d9488; color: #fff; }';
  // showcase 深色背景适配
  css += '\nbody .wh-lang-switch.dark button { background: rgba(15,23,42,0.55); border-color: rgba(255,255,255,0.25); color: #fff; }';
  css += '\nbody .wh-lang-switch.dark button.active { background: #c8963e; border-color: #c8963e; color: #0f172a; }';

  function injectCss() {
    var style = document.createElement('style');
    style.id = 'wh-lang-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // 注入切换按钮到导航右侧
  function injectToggle() {
    var navInner = document.querySelector('.nav-inner');
    var host;
    var dark = false;
    if (navInner) {
      host = navInner;
    } else {
      // 兜底（如 showcase 无 .nav-inner）：固定定位右上角
      var body = document.body;
      if (!body) return;
      host = document.createElement('div');
      host.style.cssText = 'position:fixed;top:16px;right:20px;z-index:9999;display:flex;';
      dark = true;
      body.appendChild(host);
    }

    var sw = document.createElement('div');
    sw.className = 'wh-lang-switch' + (dark ? ' dark' : '');
    sw.innerHTML = '<button data-wh-lang="en" title="English">EN</button>' +
                   '<button data-wh-lang="zh" title="中文">中文</button>';
    sw.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('button[data-wh-lang]') : null;
      if (b) set(b.getAttribute('data-wh-lang'));
    });
    host.appendChild(sw);
  }

  global.WH_LANG = {
    get: get,
    set: set,
    toggle: toggle,
    isZh: function () { return lang === 'zh'; }
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  injectCss();
  ready(function () {
    injectToggle();
    apply();
  });
})(window);
