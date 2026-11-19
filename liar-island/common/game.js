(function (root, factory) {
  var Game = factory(root);
  if (typeof module === 'object' && module && module.exports) module.exports = Game;
  if (typeof window !== 'undefined') window.Game = Game;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var KEY = 'liar-island.v1';
  var ROOMS = ['room1', 'room2', 'room3'];
  var PIECES = ['piece1', 'piece2', 'piece3', 'piece4'];
  var HINT_WRONG = 2;
  var HINT_MS = 180 * 1000;
  var HAS_DOM = typeof document !== 'undefined';

  var memory = {};
  var memoryStore = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; },
    setItem: function (k, v) { memory[k] = String(v); },
    removeItem: function (k) { delete memory[k]; }
  };
  function pickStore() {
    if (typeof window === 'undefined') return memoryStore;
    try {
      var ls = window.localStorage;
      ls.setItem(KEY + '.probe', '1');
      ls.removeItem(KEY + '.probe');
      return ls;
    } catch (e) {
      return memoryStore;
    }
  }
  var store = pickStore();

  function blankSlot(withEnter) {
    var s = { solved: false, wrong: 0, wrongAt: [] };
    if (withEnter) s.enteredAt = null;
    return s;
  }
  function defaultState() {

    var st = { memberNo: null, startedAt: null, rooms: {}, pieces: {}, vault: blankSlot(true), scene: {} };
    ROOMS.forEach(function (r) { st.rooms[r] = blankSlot(true); });
    PIECES.forEach(function (p) { st.pieces[p] = blankSlot(false); });
    st.vault.escapedAt = null;
    return st;
  }
  function fill(target, saved) {
    if (!saved || typeof saved !== 'object') return target;
    Object.keys(target).forEach(function (k) {
      if (!(k in saved)) return;
      var t = target[k], v = saved[k];
      if (t && typeof t === 'object' && !Array.isArray(t)) fill(t, v);
      else if (Array.isArray(t)) { if (Array.isArray(v)) target[k] = v.slice(); }
      else target[k] = v;
    });
    return target;
  }
  function load() {
    var raw = null;
    try { raw = store.getItem(KEY); } catch (e) { raw = null; }
    var saved = null;
    if (raw) { try { saved = JSON.parse(raw); } catch (e) { saved = null; } }
    var st = fill(defaultState(), saved);

    if (saved && saved.scene && typeof saved.scene === 'object' && !Array.isArray(saved.scene)) {
      try { st.scene = JSON.parse(JSON.stringify(saved.scene)); } catch (e) { st.scene = {}; }
    }
    return st;
  }
  function save(state) {
    try { store.setItem(KEY, JSON.stringify(state)); } catch (e) {   }
    if (HAS_DOM && typeof CustomEvent === 'function') {
      document.dispatchEvent(new CustomEvent('liar:change'));
    }
    return state;
  }
  function _reset() {
    try { store.removeItem(KEY); } catch (e) {   }
    memory = {};
  }

  function slotOf(state, id) {
    if (state.rooms[id]) return state.rooms[id];
    if (state.pieces[id]) return state.pieces[id];
    if (id === 'vault') return state.vault;
    throw new Error('Game: unknown id "' + id + '"');
  }

  function normalize(value) {
    return String(value == null ? '' : value)
      .trim()
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
  }
  function data() { return root.LIAR || {}; }
  function pieceData(id) {
    var n = Number(String(id).replace('piece', ''));
    var v = data().vault;
    return (v && Array.isArray(v.pieces) && v.pieces[n - 1]) || null;
  }
  function answerOf(id) {
    if (/^piece[1-4]$/.test(id)) {
      var p = pieceData(id);
      return p && p.task ? p.task.answer : undefined;
    }
    var d = data()[id];
    if (!d) return undefined;

    if (id === 'vault' && d.answer == null) return d.password;
    return d.answer;
  }

  function schedule(slot, now) {
    var wrongAt = Array.isArray(slot.wrongAt) ? slot.wrongAt : [];
    var wrong = Math.max(slot.wrong || 0, wrongAt.length);
    var byWrong = wrongAt.length >= HINT_WRONG ? wrongAt[HINT_WRONG - 1] : (wrong >= HINT_WRONG ? -Infinity : null);
    var byTime = slot.enteredAt != null ? slot.enteredAt + HINT_MS : null;
    var t1 = null, before = 0;
    if (byWrong != null && (byTime == null || byWrong <= byTime)) {
      t1 = byWrong; before = HINT_WRONG;
    } else if (byTime != null && now >= byTime) {
      t1 = byTime;
      before = wrongAt.filter(function (t) { return t < byTime; }).length;
    }
    if (t1 == null || now < t1) {
      return { level: 0, nextAt: byTime, wrongLeft: HINT_WRONG - wrong };
    }
    var after = wrong - before;
    var t2 = t1 === -Infinity ? null : t1 + HINT_MS;
    if (after >= HINT_WRONG || (t2 != null && now >= t2)) return { level: 2, nextAt: null, wrongLeft: 0 };
    return { level: 1, nextAt: t2, wrongLeft: HINT_WRONG - after };
  }
  function hintsUnlocked(id, now) {
    if (now == null) now = Date.now();
    return schedule(slotOf(load(), id), now).level;
  }

  function setMember(no) {
    no = Number(no);
    if (!(no >= 1 && no <= 4 && Math.floor(no) === no)) throw new Error('Game: memberNo must be 1-4');
    var st = load();
    st.memberNo = no;
    if (st.startedAt == null) st.startedAt = Date.now();
    save(st);
    return st;
  }
  function enter(id, now) {
    if (now == null) now = Date.now();
    var st = load();
    var slot = slotOf(st, id);
    if (!('enteredAt' in slot)) return st;
    if (slot.enteredAt == null) slot.enteredAt = now;
    if (st.startedAt == null) st.startedAt = now;
    save(st);
    return st;
  }
  function submit(id, value, now) {
    if (now == null) now = Date.now();
    var st = load();
    var slot = slotOf(st, id);
    var answer = answerOf(id);
    var correct = answer != null && normalize(answer) !== '' && normalize(value) === normalize(answer);
    if (correct) {
      if (!slot.solved) {
        slot.solved = true;
        if (id === 'vault' && st.vault.escapedAt == null) st.vault.escapedAt = now;
      }
    } else if (!slot.solved) {
      slot.wrong = (slot.wrong || 0) + 1;
      slot.wrongAt = (slot.wrongAt || []).concat([now]);
    }
    save(st);
    return { correct: correct, hintsUnlocked: schedule(slot, now).level };
  }
  function canEnterVault() {
    var st = load();
    return ROOMS.every(function (r) { return st.rooms[r].solved === true; });
  }

  function elapsed(now) {
    if (now == null) now = Date.now();
    var st = load();
    if (st.startedAt == null) return 0;
    var end = st.vault.escapedAt != null ? st.vault.escapedAt : now;
    return Math.max(0, end - st.startedAt);
  }
  function formatTime(ms) {
    var s = Math.floor(Math.max(0, ms) / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  var base = (function () {
    if (!HAS_DOM) return '';
    var src = document.currentScript && document.currentScript.src;
    if (!src) {
      var tags = document.getElementsByTagName('script');
      for (var i = tags.length - 1; i >= 0; i--) {
        if (/common\/game\.js(\?|#|$)/.test(tags[i].src)) { src = tags[i].src; break; }
      }
    }
    try { return new URL('../', src || document.baseURI).href; } catch (e) { return ''; }
  })();
  function url(path) {
    try { return new URL(path, base).href; } catch (e) { return path; }
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'className') n.className = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  var timers = [];
  function every(fn) { fn(); timers.push(setInterval(fn, 1000)); }

  var DEFAULTS = {
    label: '답',
    placeholder: '',
    submitText: '확인',
    correctText: '맞았다. 잠겨 있던 것이 풀린다.',
    wrongText: '아무 일도 일어나지 않는다. 다시 따져 보자.',
    emptyText: '답을 먼저 적는다.',
    nextText: '다음으로 →',
    inputMode: 'numeric'
  };
  function mount(id, container, opts) {
    if (!HAS_DOM || !container) return null;
    opts = opts || {};
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = opts[k] != null ? opts[k] : DEFAULTS[k]; });
    var nextHref = opts.nextHref || (id === 'vault' ? url('vault/vault.html#ending') : url('index.html'));
    var hints = (data()[id] && Array.isArray(data()[id].hints)) ? data()[id].hints : [];

    var input = el('input', {
      className: 'lr-input', type: 'text', id: 'lr-answer-' + id, autocomplete: 'off',
      inputmode: o.inputMode, placeholder: o.placeholder || null
    });
    var button = el('button', { className: 'lr-btn', type: 'submit', text: o.submitText });
    var msg = el('p', { className: 'lr-msg', 'aria-live': 'polite' });
    var next = el('a', { className: 'lr-btn lr-next', href: nextHref, text: o.nextText, hidden: true });
    var form = el('form', { className: 'lr-answer-form' }, [
      el('label', { className: 'lr-label', 'for': input.id, text: o.label }),
      el('div', { className: 'lr-answer-row' }, [input, button])
    ]);

    var hintBtns = [], hintText = el('p', { className: 'lr-hint-text', hidden: true });
    var hintBox = null;
    if (hints.length) {
      hintBox = el('div', { className: 'lr-hints' });
      hints.slice(0, 2).forEach(function (h, i) {
        var b = el('button', { className: 'lr-hint-btn', type: 'button', disabled: true });
        b.addEventListener('click', function () {
          var open = !hintText.hidden && hintText.getAttribute('data-hint') === String(i + 1);
          hintText.hidden = open;
          hintText.textContent = open ? '' : String(h);
          hintText.setAttribute('data-hint', String(i + 1));
          hintBtns.forEach(function (x, j) { x.setAttribute('aria-pressed', String(!open && j === i)); });
        });
        hintBtns.push(b);
        hintBox.appendChild(b);
      });
      hintBox.appendChild(hintText);
    }

    var box = el('section', { className: 'lr-answer', 'data-for': id }, [form, msg, hintBox, next]);
    container.appendChild(box);

    function showSolved() {
      input.disabled = true; button.disabled = true;
      msg.textContent = o.correctText;
      msg.className = 'lr-msg lr-ok';
      next.hidden = false;
    }
    function refreshHints() {
      if (!hintBtns.length) return;
      var st = load(), slot = slotOf(st, id), sc = schedule(slot, Date.now());
      hintBtns.forEach(function (b, i) {
        var lvl = i + 1, open = slot.solved || sc.level >= lvl;
        b.disabled = !open;
        if (open) { b.textContent = '힌트 ' + lvl; return; }
        var wait = '';
        if (sc.level === lvl - 1) {
          var parts = [];
          if (sc.nextAt != null) parts.push(formatTime(sc.nextAt - Date.now()) + ' 뒤');
          if (sc.wrongLeft > 0) parts.push('오답 ' + sc.wrongLeft + '번 더');
          wait = parts.join(' 또는 ');
        }
        b.textContent = '🔒 힌트 ' + lvl + (wait ? ' · ' + wait : '');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (normalize(input.value) === '') { msg.textContent = o.emptyText; msg.className = 'lr-msg'; return; }
      var r = submit(id, input.value);
      if (r.correct) {
        showSolved();
        if (typeof opts.onSolved === 'function') opts.onSolved(r);
      } else {
        msg.textContent = o.wrongText;
        msg.className = 'lr-msg lr-bad';
        input.select();
      }
      refreshHints();
    });

    if (slotOf(load(), id).solved) showSolved();
    every(refreshHints);
    return box;
  }

  var chrome = null;
  function mountChrome() {
    if (!HAS_DOM) return null;
    if (chrome) { chrome.render(); return chrome; }
    if (!document.body) { ready(mountChrome); return null; }
    var body = document.body;
    var here = body.getAttribute('data-room') || '';

    var cells = [['room1', '방 1'], ['room2', '방 2'], ['room3', '방 3'], ['vault', '금고']].map(function (c) {
      return { id: c[0], node: el('li', { className: 'lr-cell', 'data-id': c[0] }), label: c[1] };
    });
    var timer = el('span', { className: 'lr-timer', 'aria-label': '경과 시간' });
    var pieceBtn = el('button', { className: 'lr-piece-btn', type: 'button', 'aria-expanded': 'false', text: '내 조각 🧩' });
    var bar = el('header', { className: 'lr-topbar' }, [
      el('a', { className: 'lr-home', href: url('index.html'), text: '거짓말쟁이 섬의 금고' }),
      el('ol', { className: 'lr-progress', 'aria-label': '진행' }, cells.map(function (c) { return c.node; })),
      timer,
      pieceBtn
    ]);

    var tabs = el('div', { className: 'lr-tabs', role: 'tablist' });
    var view = el('div', { className: 'lr-piece-view' });
    var closeBtn = el('button', { className: 'lr-close', type: 'button', 'aria-label': '닫기', text: '×' });
    var panel = el('aside', { className: 'lr-panel', hidden: true, 'aria-label': '조각' }, [
      el('div', { className: 'lr-panel-head' }, [el('h2', { className: 'lr-panel-title', text: '조각' }), closeBtn]),
      tabs, view
    ]);
    var shade = el('div', { className: 'lr-shade', hidden: true });

    body.insertBefore(bar, body.firstChild);
    body.appendChild(shade);
    body.appendChild(panel);

    var current = null;
    function setOpen(open) {
      panel.hidden = !open; shade.hidden = !open;
      pieceBtn.setAttribute('aria-expanded', String(open));
      if (open) renderPanel();
    }
    pieceBtn.addEventListener('click', function () { setOpen(panel.hidden); });
    closeBtn.addEventListener('click', function () { setOpen(false); });
    shade.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });

    function renderBar() {
      var st = load();
      cells.forEach(function (c) {
        var solved = c.id === 'vault' ? st.vault.solved : st.rooms[c.id].solved;
        c.node.textContent = c.label + (solved ? ' ✓' : '');
        c.node.className = 'lr-cell' + (solved ? ' is-solved' : '') + (c.id === here ? ' is-here' : '');
      });
    }
    function renderTabs(st) {
      tabs.textContent = '';
      [1, 2, 3, 4].forEach(function (n) {
        var solved = st.pieces['piece' + n].solved;
        var t = el('button', {
          className: 'lr-tab' + (n === current ? ' is-active' : '') + (solved ? ' is-solved' : ''),
          type: 'button', role: 'tab', 'aria-selected': String(n === current),
          text: n + '번' + (n === st.memberNo ? ' (나)' : '') + (solved ? ' ✓' : '')
        });
        t.addEventListener('click', function () { current = n; renderPanel(); });
        tabs.appendChild(t);
      });
    }
    function renderPanel() {
      var st = load();
      if (current == null) current = st.memberNo || 1;
      renderTabs(st);
      view.textContent = '';
      var id = 'piece' + current, slot = st.pieces[id], p = pieceData(id) || {};
      var task = p.task || {};
      view.appendChild(el('h3', { className: 'lr-piece-title', text: '조각 ' + current }));
      if (slot.solved) {
        view.appendChild(el('p', { className: 'lr-sentence', text: p.sentence || '' }));
        return;
      }
      view.appendChild(el('p', { className: 'lr-lock', text: '🔒 잠긴 조각이다. 아래 문제를 풀면 문장 한 줄이 드러난다.' }));
      if (!task.text) {
        view.appendChild(el('p', { className: 'lr-task', text: '이 조각에는 아직 아무것도 적혀 있지 않다.' }));
        return;
      }
      view.appendChild(el('p', { className: 'lr-task', text: String(task.text) }));
      var input = el('input', { className: 'lr-input', type: 'text', autocomplete: 'off', 'aria-label': '조각 ' + current + ' 답' });
      var msg = el('p', { className: 'lr-msg', 'aria-live': 'polite' });
      var hint = el('p', { className: 'lr-hint-text', hidden: true, text: task.hint ? String(task.hint) : '' });
      var form = el('form', { className: 'lr-answer-row' }, [input, el('button', { className: 'lr-btn', type: 'submit', text: '확인' })]);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (normalize(input.value) === '') { msg.textContent = DEFAULTS.emptyText; msg.className = 'lr-msg'; return; }
        var r = submit(id, input.value);
        if (r.correct) { renderPanel(); return; }
        msg.textContent = DEFAULTS.wrongText;
        msg.className = 'lr-msg lr-bad';
        hint.hidden = !(task.hint && r.hintsUnlocked >= 1);
        input.select();
      });
      hint.hidden = !(task.hint && schedule(slot, Date.now()).level >= 1);
      view.appendChild(form);
      view.appendChild(msg);
      view.appendChild(hint);
      input.focus();
    }

    document.addEventListener('liar:change', renderBar);
    every(function () { timer.textContent = formatTime(elapsed()); });
    renderBar();
    chrome = { bar: bar, panel: panel, render: renderBar, open: function () { setOpen(true); }, close: function () { setOpen(false); } };
    return chrome;
  }

  return {
    KEY: KEY,
    normalize: normalize,
    load: load,
    save: save,
    setMember: setMember,
    enter: enter,
    submit: submit,
    hintsUnlocked: hintsUnlocked,
    canEnterVault: canEnterVault,
    elapsed: elapsed,
    formatTime: formatTime,
    url: url,
    get base() { return base; },
    mount: mount,
    mountChrome: mountChrome,
    ready: HAS_DOM ? ready : function (fn) { fn(); },
    reset: _reset,
    _reset: _reset
  };
});
