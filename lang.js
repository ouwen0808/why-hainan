/**
 * Why Hainan 全局语言切换（双向）
 *  - 英文态（默认）：隐藏所有中文，只显示英文 + 数字/emoji
 *  - 中文态：隐藏所有英文，只显示中文 + 数字/emoji
 *
 * 用法：页面在 config.js 之后引入 <script src="lang.js"></script>
 *  - 语言记忆在 localStorage 的 wh_lang（'en' | 'zh'）
 *  - 切换后触发 window 的 'whlangchange' 事件（detail.lang）
 *  - window.WH_LANG = { get, set, toggle, isZh }
 *
 * 约定：英文主体内容加 class="en"；中文内容用 class="cn"/"zh-only"
 * （"cn" 系列为动态字段中文；"zh-only" 为静态内联中文）。数字与 emoji 不加类，两种语言都显示。
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

  // 中文相关选择器（英文态隐藏）
  var CN_SELECTORS = [
    '.cn', '.cn-line', '.cn-title', '.cn-block',
    '.st-cn', '.label-cn', '.slide-title-cn', '.slide-sub-cn',
    '.fc-cn', '.li-cn', '.rec-cn', '.src-cn', '.tip-cn',
    '.zh-only'
  ];
  var css = 'html.lang-en ' + CN_SELECTORS.join(', html.lang-en ') + ' { display: none !important; }';

  // 英文主体（中文态隐藏）——覆盖通用 .en 及各页不规范命名的英文 class
  var EN_SELECTORS = [
    '.en', '.fc-en', '.li-en', '.tip-en', '.rec-title', '.sol-list'
  ];
  css += '\nhtml.lang-zh ' + EN_SELECTORS.join(', html.lang-zh ') + ' { display: none !important; }';

  // 中文态排版增强：提升字号、优化行高与对比度，避免中文页面过空
  var ZH_CSS = [
    'html.lang-zh body { letter-spacing: 0.005em; }',
    // 标题
    'html.lang-zh .hero h1 .cn { font-size: clamp(1.5rem, 3vw, 2rem) !important; line-height: 1.35 !important; letter-spacing: 4px; }',
    'html.lang-zh .section-title .cn { font-size: clamp(1.35rem, 2.4vw, 1.7rem) !important; line-height: 1.45 !important; }',
    'html.lang-zh .card h3 .cn { font-size: 0.95rem !important; line-height: 1.5 !important; }',
    'html.lang-zh .policy-card h3 .cn { font-size: 0.95rem !important; line-height: 1.5 !important; }',
    'html.lang-zh .elig-card h3 .cn { font-size: 0.98rem !important; line-height: 1.5 !important; }',
    'html.lang-zh .path-text h2 .cn { font-size: 1.2rem !important; line-height: 1.45 !important; }',
    // 正文
    'html.lang-zh .hero p.cn { font-size: 1.05rem !important; color: rgba(255,255,255,0.82) !important; line-height: 1.85 !important; }',
    'html.lang-zh .section-sub.cn { font-size: 1.02rem !important; line-height: 1.8 !important; }',
    'html.lang-zh .card p.cn { font-size: 0.95rem !important; line-height: 1.8 !important; }',
    'html.lang-zh .policy-card p.cn { font-size: 0.95rem !important; line-height: 1.8 !important; }',
    'html.lang-zh .elig-card p.cn { font-size: 0.95rem !important; line-height: 1.8 !important; }',
    'html.lang-zh .path-text p.cn { font-size: 0.95rem !important; line-height: 1.85 !important; }',
    'html.lang-zh .cta-section p.cn { font-size: 1.02rem !important; opacity: 0.85; line-height: 1.8 !important; }',
    'html.lang-zh .quote .cn { font-size: 1.1rem !important; opacity: 0.85; line-height: 1.9 !important; }',
    'html.lang-zh .quote { padding: 72px 24px !important; }',
    'html.lang-zh .quote blockquote { font-size: clamp(1.05rem, 2vw, 1.25rem) !important; }',
    'html.lang-zh .path-list li { align-items: flex-start !important; line-height: 1.7 !important; }',
    'html.lang-zh .path-list li::before { line-height: 1.7 !important; }',
    'html.lang-zh .path-list li .cn { line-height: 1.7 !important; }',
    // 标签 / 统计
    'html.lang-zh .stat .label-cn { font-size: 0.85rem !important; }',
    'html.lang-zh .num-card .l.cn { font-size: 0.88rem !important; line-height: 1.7 !important; }',
    'html.lang-zh .section-label .cn { letter-spacing: 3px; }'
  ].join('\n');
  css += '\n' + ZH_CSS;

  // 切换按钮样式
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

  function injectToggle() {
    var navInner = document.querySelector('.nav-inner');
    var host;
    var dark = false;
    if (navInner) {
      host = navInner;
    } else {
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
