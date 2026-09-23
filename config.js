/**
 * Why Hainan 前端配置
 * 统一管理后端 API 地址，方便切换本地/云端部署。
 *
 * 用法：页面先 <script src="config.js"></script>，再引用 window.WH_CONFIG.apiBase
 *
 * apiBase 解析优先级：
 *   1. URL 带 ?api= 参数（便于测试，最高优先）
 *   2. 本机访问（localhost/127.0.0.1/file://）→ http://localhost:3000
 *   3. 公网访问（GitHub Pages / Cloudflare）→ 隧道地址（下方 TUNNEL 常量）
 *
 * 隧道地址（trycloudflare quick tunnel）会随隧道重启而变化，
 * 由后端 watchdog 联动脚本自动更新下方 TUNNEL 常量并重新发布本文件。
 */
(function (global) {
  // SYNC_TUNNEL_URL —— 隧道地址（自动同步脚本会替换此行常量值）
  var TUNNEL = 'https://treo-lat-heading-dining.trycloudflare.com';

  var qs = new URLSearchParams(window.location.search).get('api');

  // 是否本机访问（开发调试）
  var isLocal = false;
  try {
    var h = window.location.hostname || '';
    isLocal = window.location.protocol === 'file:' ||
              h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
  } catch (e) { isLocal = false; }

  var apiBase =
    qs ||
    (isLocal ? 'http://localhost:3000' : TUNNEL);

  global.WH_CONFIG = {
    apiBase: apiBase.replace(/\/$/, ''),
    api: {
      content: apiBase.replace(/\/$/, '') + '/api/public/content',
      guides: apiBase.replace(/\/$/, '') + '/api/public/guides',
      today: apiBase.replace(/\/$/, '') + '/api/public/guides/today',
    },
  };
})(window);
