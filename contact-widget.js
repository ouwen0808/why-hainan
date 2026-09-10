/**
 * Why Hainan — Contact / Unlock Widget
 * 自包含组件：注入样式 + 浮动「Contact 联系」入口 + 解锁弹窗 + 联系方式展示 + 留资表单。
 *
 * 引入方式：在 </body> 前加一行 <script src="contact-widget.js"></script>
 *
 * 行为：
 *   1. 右下角悬浮「Contact 联系」按钮（与现有 ow-tools 并存）
 *   2. 点击弹窗 → 未解锁时显示「手机号/邮箱一键解锁」
 *   3. 解锁后（localStorage 记住）展示欧闻联系方式（电话/微信/邮箱，空值自动隐藏）
 *   4. 底部「联系我们」表单：联系人 + 电话（可选留言），提交到后端
 *
 * 联系方式数据来源：
 *   优先调后端 GET /api/public/contact-info 动态读取；后端不可达时用内置兜底值，
 *   保证公网静态站也能正常展示联系方式。
 */
(function () {
  'use strict';
  if (window.__WH_CONTACT_LOADED__) return;
  window.__WH_CONTACT_LOADED__ = true;

  var cfg = (window.WH_CONFIG || {});
  var apiBase = (cfg.apiBase || '').replace(/\/$/, '');
  var API = {
    contactInfo: apiBase + '/api/public/contact-info',
    unlock: apiBase + '/api/public/unlock',
    contact: apiBase + '/api/public/contact',
  };

  // 兜底联系方式（后端不可达时使用；与 site_settings.contact_info 保持一致）
  var FALLBACK_CONTACT = { phone: '1380018000', wechat: '', email: '' };
  var UNLOCK_KEY = 'wh_contact_unlocked';

  /* ---------- 样式注入 ---------- */
  var css = [
    '.whcw-fab{position:fixed;left:16px;bottom:16px;z-index:9998;display:flex;align-items:center;gap:8px;',
    'background:#0d9488;color:#fff;border:none;border-radius:26px;padding:13px 20px;cursor:pointer;',
    'font-size:15px;font-weight:600;font-family:inherit;box-shadow:0 4px 18px rgba(13,148,136,.35);transition:transform .15s,background .15s;}',
    '.whcw-fab:hover{background:#0f766e;transform:translateY(-2px);}',
    '.whcw-overlay{position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);',
    'display:none;align-items:center;justify-content:center;padding:20px;}',
    '.whcw-overlay.open{display:flex;}',
    '.whcw-modal{background:#fff;color:#0f172a;border-radius:16px;width:100%;max-width:440px;max-height:90vh;overflow:auto;',
    'box-shadow:0 20px 60px rgba(0,0,0,.3);padding:26px 26px 22px;position:relative;font-family:Inter,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;}',
    '.whcw-close{position:absolute;top:14px;right:16px;background:none;border:none;font-size:24px;line-height:1;color:#64748b;cursor:pointer;}',
    '.whcw-close:hover{color:#0f172a;}',
    '.whcw-title{font-size:20px;font-weight:800;margin:0 0 4px;}',
    '.whcw-sub{font-size:13px;color:#64748b;margin:0 0 18px;}',
    '.whcw-label{display:block;font-size:13px;font-weight:600;margin:0 0 6px;color:#334155;}',
    '.whcw-input{width:100%;padding:11px 13px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:12px;color:#0f172a;}',
    '.whcw-input:focus{border-color:#0d9488;}',
    '.whcw-btn{width:100%;background:#0d9488;color:#fff;border:none;border-radius:10px;padding:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s;}',
    '.whcw-btn:hover{background:#0f766e;}',
    '.whcw-btn:disabled{opacity:.6;cursor:default;}',
    '.whcw-err{color:#dc2626;font-size:13px;margin:8px 0 0;min-height:18px;}',
    '.whcw-ok{color:#16a34a;font-size:13px;margin:8px 0 0;min-height:18px;}',
    '.whcw-divider{height:1px;background:#e2e8f0;margin:18px 0;}',
    '.whcw-contact-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:10px;}',
    '.whcw-contact-ico{width:38px;height:38px;border-radius:10px;background:#e6f7f5;color:#0d9488;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}',
    '.whcw-contact-meta{min-width:0;}',
    '.whcw-contact-k{font-size:12px;color:#64748b;font-weight:600;}',
    '.whcw-contact-v{font-size:15px;font-weight:700;word-break:break-all;}',
    '.whcw-contact-v a{color:#0d9488;text-decoration:none;}',
    '.whcw-hint{font-size:12px;color:#94a3b8;margin:0 0 14px;}'
  ].join('');
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- DOM 注入 ---------- */
  var fab = document.createElement('button');
  fab.className = 'whcw-fab';
  fab.innerHTML = '💬 <span>Contact · 联系我们</span>';

  var overlay = document.createElement('div');
  overlay.className = 'whcw-overlay';
  overlay.innerHTML =
    '<div class="whcw-modal" role="dialog" aria-modal="true">' +
      '<button class="whcw-close" aria-label="Close">×</button>' +
      '<div class="whcw-body"></div>' +
    '</div>';

  document.body.appendChild(fab);
  document.body.appendChild(overlay);
  var body = overlay.querySelector('.whcw-body');

  /* ---------- 工具 ---------- */
  function esc(s) { return String(s == null ? '' : s); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isPhone(v) { return /^[0-9+\-\s()]{6,20}$/.test(v); }
  function unlocked() { try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return false; } }
  function markUnlocked() { try { localStorage.setItem(UNLOCK_KEY, '1'); } catch (e) {} }

  /* ---------- 联系方式数据 ---------- */
  var contactCache = null;
  function fetchContact() {
    return fetch(API.contactInfo)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { return (d && d.contact) || FALLBACK_CONTACT; })
      .catch(function () { return FALLBACK_CONTACT; });
  }

  function contactRows(c) {
    var rows = [];
    if (c.phone) rows.push({ ico: '📞', k: 'Phone · 电话', v: c.phone });
    if (c.wechat) rows.push({ ico: '💬', k: 'WeChat · 微信', v: c.wechat });
    if (c.email) rows.push({ ico: '✉️', k: 'Email · 邮箱', v: c.email });
    return rows;
  }

  /* ---------- 视图 ---------- */
  function viewUnlock() {
    var wrap = el('<div></div>');
    wrap.innerHTML =
      '<h3 class="whcw-title">Unlock Contact Info · 解锁联系方式</h3>' +
      '<p class="whcw-sub">Enter your phone or email to view Ouwen\'s contact details. 输入手机号或邮箱即可查看欧闻联系方式。</p>' +
      '<label class="whcw-label">Phone or Email · 手机号 / 邮箱</label>' +
      '<input class="whcw-input" id="whcw-id" placeholder="+86 138xxxx or you@email.com">' +
      '<button class="whcw-btn" id="whcw-unlock">Unlock · 解锁</button>' +
      '<p class="whcw-err" id="whcw-err"></p>';
    body.innerHTML = '';
    body.appendChild(wrap);

    var input = body.querySelector('#whcw-id');
    var err = body.querySelector('#whcw-err');
    var btn = body.querySelector('#whcw-unlock');

    function doUnlock() {
      var v = input.value.trim();
      if (!v) { err.textContent = 'Please enter phone or email · 请输入手机号或邮箱'; return; }
      if (!isEmail(v) && !isPhone(v)) { err.textContent = 'Invalid phone/email · 手机号或邮箱格式不正确'; return; }
      btn.disabled = true; btn.textContent = 'Unlocking… · 解锁中';
      // 记录解锁线索（后端可选，失败不影响解锁）
      fetch(API.unlock, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: v })
      }).catch(function () {}).then(function () {
        markUnlocked();
        fetchContact().then(function (c) { contactCache = c; viewContact(c); });
      });
    }
    btn.addEventListener('click', doUnlock);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doUnlock(); });
    setTimeout(function () { input.focus(); }, 50);
  }

  function viewContact(c) {
    var rows = contactRows(c).map(function (r) {
      return '<div class="whcw-contact-row"><div class="whcw-contact-ico">' + r.ico + '</div>' +
        '<div class="whcw-contact-meta"><div class="whcw-contact-k">' + esc(r.k) + '</div>' +
        '<div class="whcw-contact-v">' + esc(r.v) + '</div></div></div>';
    }).join('');

    var wrap = el('<div></div>');
    wrap.innerHTML =
      '<h3 class="whcw-title">Contact Ouwen · 联系欧闻</h3>' +
      '<p class="whcw-sub">Reach us directly · 直接联系我们</p>' +
      (rows || '<p class="whcw-hint">No contact info yet · 暂无联系方式</p>') +
      '<div class="whcw-divider"></div>' +
      '<h3 class="whcw-title" style="font-size:17px;">Leave a Message · 联系我们</h3>' +
      '<p class="whcw-sub">Leave your name and phone, we\'ll get back to you. 留下联系人和电话，我们会尽快回复。</p>' +
      '<label class="whcw-label">Name · 联系人</label>' +
      '<input class="whcw-input" id="whcw-name" placeholder="Your name">' +
      '<label class="whcw-label">Phone · 电话</label>' +
      '<input class="whcw-input" id="whcw-phone" placeholder="+86 138xxxx">' +
      '<label class="whcw-label">Message · 留言（可选）</label>' +
      '<textarea class="whcw-input" id="whcw-msg" rows="2" placeholder="Anything you want to ask"></textarea>' +
      '<button class="whcw-btn" id="whcw-send">Submit · 提交</button>' +
      '<p class="whcw-ok" id="whcw-ok"></p>' +
      '<p class="whcw-err" id="whcw-err"></p>';
    body.innerHTML = '';
    body.appendChild(wrap);

    var ok = body.querySelector('#whcw-ok');
    var err = body.querySelector('#whcw-err');
    var btn = body.querySelector('#whcw-send');
    btn.addEventListener('click', function () {
      var name = body.querySelector('#whcw-name').value.trim();
      var phone = body.querySelector('#whcw-phone').value.trim();
      var msg = body.querySelector('#whcw-msg').value.trim();
      if (!name) { err.textContent = 'Please enter your name · 请填写联系人'; ok.textContent = ''; return; }
      if (!phone) { err.textContent = 'Please enter your phone · 请填写电话'; ok.textContent = ''; return; }
      if (!isPhone(phone)) { err.textContent = 'Invalid phone number · 电话号码格式不正确'; ok.textContent = ''; return; }
      btn.disabled = true; btn.textContent = 'Submitting… · 提交中';
      fetch(API.contact, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone, email: '', message: msg })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function () {
        ok.textContent = 'Submitted! We\'ll contact you soon. · 提交成功，我们会尽快联系您。';
        err.textContent = '';
        btn.disabled = false; btn.textContent = 'Submit · 提交';
        body.querySelector('#whcw-name').value = '';
        body.querySelector('#whcw-phone').value = '';
        body.querySelector('#whcw-msg').value = '';
      }).catch(function () {
        // 后端不可达：降级提示直接致电
        err.textContent = '';
        ok.textContent = '';
        var phone = (contactCache && contactCache.phone) || FALLBACK_CONTACT.phone;
        alert('Unable to submit online. Please call us directly · 无法在线提交，请直接致电：' + phone);
        btn.disabled = false; btn.textContent = 'Submit · 提交';
      });
    });
  }

  /* ---------- 打开/关闭 ---------- */
  function open() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (unlocked() && contactCache) {
      viewContact(contactCache);
    } else if (unlocked()) {
      fetchContact().then(function (c) { contactCache = c; viewContact(c); });
    } else {
      viewUnlock();
    }
  }
  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  fab.addEventListener('click', open);
  overlay.querySelector('.whcw-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // 若已解锁，预取联系方式缓存，避免打开时闪烁
  if (unlocked()) {
    fetchContact().then(function (c) { contactCache = c; });
  }
})();
