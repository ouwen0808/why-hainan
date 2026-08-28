/**
 * Why Hainan 前端配置
 * 统一管理后端 API 地址，方便切换本地/云端部署。
 *
 * 用法：页面先 <script src="config.js"></script>，再引用 window.WH_CONFIG.apiBase
 *
 * 部署时只需改这一处 apiBase：
 *  - 本地开发：http://localhost:3000
 *  - 云端部署：https://your-backend.example.com
 */
(function (global) {
  var apiBase =
    // 若页面 URL 带 ?api= 参数，则优先使用（便于测试）
    new URLSearchParams(window.location.search).get('api') ||
    // 默认后端地址（部署后改成你的云端后端 URL）
    'http://localhost:3000';

  global.WH_CONFIG = {
    apiBase: apiBase.replace(/\/$/, ''),
    api: {
      content: apiBase.replace(/\/$/, '') + '/api/public/content',
      guides: apiBase.replace(/\/$/, '') + '/api/public/guides',
      today: apiBase.replace(/\/$/, '') + '/api/public/guides/today',
    },
  };
})(window);
