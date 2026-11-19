(function (root, factory) {
  var G = root.Game;
  if (!G && typeof require === 'function') { try { G = require('./game.js'); } catch (e) { G = null; } }
  var Scene = factory(root, G);
  if (typeof module === 'object' && module && module.exports) module.exports = Scene;
  if (typeof window !== 'undefined') window.Scene = Scene;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, Game) {
  'use strict';

  var W = 1672, H = 941;
  var MIN_SPOT = 82;
  var FLY_MS = 2100;
  var FLASH_MS = 2000;
  var TOP_H = 108, BAR_H = 62;
  var BUBBLE_MS = 5000;
  var BUBBLE_W = 340;
  var NOTHING = '아무 일도 일어나지 않는다.';
  var EMPTY_LINES = ['특별한 것은 없다.', '먼지만 쌓여 있다.', '아무것도 눈에 띄지 않는다.'];
  var ACTIONS = ['say', 'goal', 'set', 'ifFlag', 'give', 'requireItem', 'container', 'popup', 'answer', 'story', 'bubble'];
  var EXTRA = { say: ['who'], ifFlag: ['then', 'else'], requireItem: ['then', 'else'] };
  var STOPS = ['room1', 'room2', 'room3', 'vault', 'ending'];
  var PAGES = { room1: 'room1/room.html', room2: 'room2/room.html', room3: 'room3/room.html', vault: 'vault/vault.html', ending: 'vault/vault.html#ending' };
  var HAS_DOM = typeof document !== 'undefined';

  function fit(areaW, areaH) {
    var aw = Math.max(0, Math.floor(areaW || 0)), ah = Math.max(0, Math.floor(areaH || 0));
    if (!aw || !ah) return { w: 0, h: 0 };
    if (aw * 9 >= ah * 16) return { w: Math.floor(ah * 16 / 9), h: ah };
    return { w: aw, h: Math.floor(aw * 9 / 16) };
  }

  function eul(noun) {
    var s = String(noun || '').trim();
    var c = s.charCodeAt(s.length - 1) - 0xAC00;
    return (c >= 0 && c <= 11171 && c % 28) ? '을' : '를';
  }

  function pickHit(rects, x, y) {
    for (var i = (rects || []).length - 1; i >= 0; i--) {
      var r = rects[i].rect;
      if (r && x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]) return rects[i].id;
    }
    return null;
  }

  function nextStop(st) {
    if (!st.rooms.room1.solved) return 'room1';
    if (!st.rooms.room2.solved) return 'room2';
    if (!st.rooms.room3.solved) return 'room3';
    if (!st.vault.solved) return 'vault';
    return 'ending';
  }

  function hasProgress(st) {
    if (!st || typeof st !== 'object') return false;
    if (st.startedAt != null) return true;
    var solved = function (slots) {
      return !!slots && Object.keys(slots).some(function (k) { return slots[k] && slots[k].solved === true; });
    };
    if (solved(st.rooms) || solved(st.pieces) || (st.vault && st.vault.solved === true)) return true;
    var sc = st.scene || {};
    return Object.keys(sc).some(function (r) {
      var s = sc[r] || {};
      return (Array.isArray(s.items) && s.items.length > 0) ||
        (!!s.flags && Object.keys(s.flags).length > 0) || (!!s.opened && Object.keys(s.opened).length > 0);
    });
  }

  function titleMode(st) { return hasProgress(st) ? 'resume' : 'fresh'; }

  function isSolved(st, id) {
    if (!st) return false;
    if (id === 'vault') return !!st.vault && st.vault.solved === true;
    return !!st.rooms && !!st.rooms[id] && st.rooms[id].solved === true;
  }

  function blockedStop(target, st) {
    var ok = target === 'vault' ? ['room1', 'room2', 'room3'].every(function (r) { return isSolved(st, r); })
      : target === 'ending' ? isSolved(st, 'vault') : true;
    return ok ? null : nextStop(st);
  }

  function bubbleStep(state, now, event) {
    var next = {};
    Object.keys(state || {}).forEach(function (k) { if (state[k] > now) next[k] = state[k]; });
    if (event && event.open != null) next[String(event.open)] = now + BUBBLE_MS;
    return next;
  }

  function bubblesOn(state, now) {
    return Object.keys(state || {}).filter(function (k) { return state[k] > now; }).sort();
  }

  function pieceTab(memberNo) {
    var n = Number(memberNo);
    return (n >= 1 && n <= 4 && Math.floor(n) === n) ? n : 1;
  }

  function pieceView(st, n, vault) {
    var pieces = (vault && Array.isArray(vault.pieces)) ? vault.pieces : [];
    var slots = (st && st.pieces) || {};
    function solvedAt(k) { return !!slots['piece' + k] && slots['piece' + k].solved === true; }
    var p = pieces[n - 1] || {}, task = p.task || {}, slot = slots['piece' + n] || {};
    var solved = solvedAt(n);
    var wrong = Math.max(slot.wrong || 0, Array.isArray(slot.wrongAt) ? slot.wrongAt.length : 0);
    var hintReady = !solved && wrong >= 2 && !!task.hint;
    var tabs = [1, 2, 3, 4].map(function (k) { return { n: k, solved: solvedAt(k), mine: !!st && st.memberNo === k }; });
    return {
      n: n, mine: !!st && st.memberNo === n, solved: solved,
      task: solved ? null : (task.text != null ? String(task.text) : null),
      sentence: solved ? String(p.sentence || '') : null,
      hintReady: hintReady, hint: hintReady ? String(task.hint) : null,
      tabs: tabs, count: tabs.filter(function (t) { return t.solved; }).length
    };
  }

  function escapeText(line, time) {
    line = String(line || '');
    if (/\{time\}/.test(line)) return line.replace(/\{time\}/g, time);
    return line ? line + ' ' + time : time;
  }

  function endingModel(st, vault) {
    var e = (vault && vault.ending) || {};
    var parts = String(e.note || '').split(' — ');
    var v = (st && st.vault) || {};
    var ms = (st && st.startedAt != null && v.escapedAt != null) ? Math.max(0, v.escapedAt - st.startedAt) : 0;
    var time = Game.formatTime(ms);
    return {
      note: parts[0], sign: parts.length > 1 ? '— ' + parts.slice(1).join(' — ') : '',
      time: time, timeLine: escapeText(e.escapeLine, time)
    };
  }

  function blank() { return { items: [], flags: {}, opened: {}, goal: null }; }
  function norm(s) {
    var b = blank();
    if (!s || typeof s !== 'object') return b;
    if (Array.isArray(s.items)) b.items = s.items.filter(function (x) { return typeof x === 'string'; });
    if (s.flags && typeof s.flags === 'object') b.flags = JSON.parse(JSON.stringify(s.flags));
    if (s.opened && typeof s.opened === 'object') b.opened = JSON.parse(JSON.stringify(s.opened));
    if (typeof s.goal === 'string') b.goal = s.goal;
    return b;
  }
  function stateOf(roomId) {
    var st = Game.load();
    return norm(st.scene && st.scene[roomId]);
  }
  function saveState(roomId, s) {
    var st = Game.load();
    if (!st.scene || typeof st.scene !== 'object') st.scene = {};
    st.scene[roomId] = norm(s);
    Game.save(st);
  }

  function context(roomId, ui) {
    var ctx = { roomId: roomId, hotspot: null, state: stateOf(roomId), sel: null, ui: ui || {} };
    ctx.save = function () { saveState(roomId, ctx.state); };
    return ctx;
  }
  function call(ctx, name) {
    var f = ctx.ui && ctx.ui[name];
    if (typeof f === 'function') return f.apply(ctx.ui, Array.prototype.slice.call(arguments, 2));
  }
  function hasFlags(state, f) {
    var list = Array.isArray(f) ? f : [f];
    return list.every(function (k) { return state.flags[k] === true; });
  }
  function unselect(ctx) { if (ctx.sel != null) { ctx.sel = null; call(ctx, 'select', null); } }

  function give(ctx, id, done) {
    if (ctx.state.items.indexOf(id) >= 0) return false;
    ctx.state.items.push(id);
    ctx.save();
    var finished = false;
    var fin = function () { if (finished) return; finished = true; if (done) done(); };
    if (ctx.ui && typeof ctx.ui.acquire === 'function') ctx.ui.acquire(id, fin); else fin();
    return true;
  }

  function container(spec, ctx) {
    var s = ctx.state, id = spec.id || ctx.hotspot || spec.item;
    s.opened[id] = true;
    ctx.save();
    if (spec.item && s.items.indexOf(spec.item) >= 0) {
      call(ctx, 'say', spec.emptyText || '비어 있다.', null);
      return;
    }
    if (spec.openText) call(ctx, 'say', spec.openText, null);
    call(ctx, 'container', spec, function take() {
      if (!spec.item) return;
      give(ctx, spec.item, function () { run(spec.then, ctx); });
    });
  }

  function step(a, ctx) {
    if (!a || typeof a !== 'object') return;
    var s = ctx.state;
    if ('say' in a) call(ctx, 'say', a.say, a.who || null);
    else if ('goal' in a) { s.goal = a.goal; ctx.save(); call(ctx, 'goal', a.goal); }
    else if ('set' in a) { s.flags[a.set] = true; ctx.save(); }
    else if ('ifFlag' in a) run(hasFlags(s, a.ifFlag) ? a.then : a['else'], ctx);
    else if ('give' in a) give(ctx, a.give);
    else if ('requireItem' in a) {
      if (ctx.sel === a.requireItem) { unselect(ctx); run(a.then, ctx); }
      else if (ctx.sel != null) { unselect(ctx); call(ctx, 'say', NOTHING, null); }
      else run(a['else'], ctx);
    }
    else if ('container' in a) container(a.container, ctx);
    else if ('popup' in a) call(ctx, 'popup', a.popup);
    else if ('answer' in a) call(ctx, 'answer', a.answer);
    else if ('story' in a) call(ctx, 'story', a.story);
    else if ('bubble' in a) call(ctx, 'bubble', a.bubble);
  }
  function run(actions, ctx) {
    (actions || []).forEach(function (a) { step(a, ctx); });
  }

  function usesItem(actions, itemId) {
    return (actions || []).some(function (a) {
      if (!a || typeof a !== 'object') return false;
      if (a.requireItem === itemId) return true;
      return usesItem(a.then, itemId) || usesItem(a['else'], itemId) ||
        !!(a.container && usesItem(a.container.then, itemId));
    });
  }

  function clickHotspot(h, ctx) {
    ctx.hotspot = h.id;
    if (ctx.sel != null && !usesItem(h['do'], ctx.sel)) {
      unselect(ctx);
      call(ctx, 'say', NOTHING, null);
      return;
    }
    run(h['do'], ctx);
    unselect(ctx);
  }

  function validate(cfg, opts) {
    var p = [];
    if (!cfg || typeof cfg !== 'object') return ['config missing'];
    var registered = (opts && opts.popups) || Object.keys(popups);
    ['roomId', 'place', 'image'].forEach(function (k) { if (typeof cfg[k] !== 'string' || !cfg[k]) p.push('missing ' + k); });
    var items = cfg.items || {};
    Object.keys(items).forEach(function (k) { if (!items[k] || !items[k].name) p.push('items.' + k + ': missing name'); });
    var ids = {}, used = { answer: false, popups: {} };
    function stop(where, target) {
      if (STOPS.indexOf(target) < 0) p.push(where + ': unknown stop "' + target + '" (known: ' + STOPS.join(', ') + ')');
    }
    function checkActions(list, where, inHotspot) {
      if (list == null) return;
      if (!Array.isArray(list)) { p.push(where + ': action list is not an array'); return; }
      list.forEach(function (a, i) {
        var at = where + '[' + i + ']';
        if (!a || typeof a !== 'object') { p.push(at + ': action is not an object'); return; }
        var main = Object.keys(a).filter(function (k) { return ACTIONS.indexOf(k) >= 0; });
        if (main.length !== 1) { p.push(at + ': expected exactly one action kind, got keys ' + Object.keys(a).join(',')); return; }
        var kind = main[0], allowed = [kind].concat(EXTRA[kind] || []);
        Object.keys(a).forEach(function (k) { if (allowed.indexOf(k) < 0) p.push(at + ': unknown key ' + k); });
        if (kind === 'give' || kind === 'requireItem') { if (!items[a[kind]]) p.push(at + ': unknown item ' + a[kind]); }
        if (kind === 'container') {
          var c = a.container || {};
          if (!c.title) p.push(at + ': container.title missing');
          if (c.item && !items[c.item]) p.push(at + ': unknown item ' + c.item);
          if (!inHotspot && !c.id) p.push(at + ': container outside a hotspot needs container.id');
          checkActions(c.then, at + '.container.then', inHotspot);
        }
        if (kind === 'story') {
          if (!(a.story && a.story.title)) p.push(at + ': story.title missing');
          if (a.story && a.story.next != null) stop(at + '.story.next', a.story.next);
          if (a.story) checkActions(a.story.then, at + '.story.then', false);
        }
        if (kind === 'say' && typeof a.say !== 'string') p.push(at + ': say is not a string');
        if (kind === 'bubble') {
          var bb = a.bubble || {};
          if (!bb.id) p.push(at + ': bubble.id missing');
          if (typeof bb.text !== 'string') p.push(at + ': bubble.text is not a string');
          if (typeof bb.x !== 'number' || typeof bb.y !== 'number') p.push(at + ': bubble.x/y must be numbers');
          else if (bb.x < 0 || bb.y < 0 || bb.x + BUBBLE_W > W || bb.y >= H) p.push(at + ': bubble leaves the picture (width ' + BUBBLE_W + ')');
        }
        if (kind === 'answer' && inHotspot) used.answer = true;
        if (kind === 'popup') {
          used.popups[a.popup] = true;
          if (registered.indexOf(a.popup) < 0) p.push(at + ': popup "' + a.popup + '" is not registered (Scene.registerPopup)');
          if (typeof a.popup === 'string' && a.popup.indexOf(cfg.roomId + '-') !== 0) p.push(at + ': popup name must start with "' + cfg.roomId + '-"');
        }
        checkActions(a.then, at + '.then', inHotspot);
        checkActions(a['else'], at + '.else', inHotspot);
      });
    }
    if (!Array.isArray(cfg.hotspots) || !cfg.hotspots.length) p.push('no hotspots');
    (cfg.hotspots || []).forEach(function (h, i) {
      var at = 'hotspots[' + i + '] ' + (h && h.id);
      if (!h || !h.id) { p.push(at + ': missing id'); return; }
      if (ids[h.id]) p.push(at + ': duplicate id');
      ids[h.id] = true;
      var r = h.rect;
      if (!Array.isArray(r) || r.length !== 4 || r.some(function (v) { return typeof v !== 'number'; })) { p.push(at + ': rect must be [x,y,w,h]'); return; }
      if (r[0] < 0 || r[1] < 0 || r[0] + r[2] > W || r[1] + r[3] > H) p.push(at + ': rect leaves the 1672x941 picture');
      if (r[2] < MIN_SPOT || r[3] < MIN_SPOT) p.push(at + ': rect smaller than ' + MIN_SPOT + 'x' + MIN_SPOT + ' (touch)');
      checkActions(h['do'], at + '.do', true);
    });
    if (cfg.hintSpot && !ids[cfg.hintSpot]) p.push('hintSpot "' + cfg.hintSpot + '" is not a hotspot id');
    checkActions(cfg.onSolved, 'onSolved', false);
    if (cfg.intro) checkActions(cfg.intro.then, 'intro.then', false);
    checkActions(cfg.onEnter, 'onEnter', false);
    if (cfg.onSolvedGo != null) stop('onSolvedGo', cfg.onSolvedGo);

    if (cfg.answerPopup != null) {
      if (registered.indexOf(cfg.answerPopup) < 0) p.push('answerPopup "' + cfg.answerPopup + '" is not registered (Scene.registerPopup)');
      if (!used.popups[cfg.answerPopup]) p.push('answerPopup "' + cfg.answerPopup + '" is never opened by a {popup} action');
    }
    var hasEntry = used.answer || cfg.answerButton === true || (cfg.answerPopup != null && registered.indexOf(cfg.answerPopup) >= 0 && used.popups[cfg.answerPopup]);
    if (!cfg.noAnswer && !hasEntry) p.push('no answer entry: add {answer:true} to a hotspot, or answerButton:true, or answerPopup:"<registered popup>" (or noAnswer:true for a story-only stop)');
    return p;
  }

  function requestFull(el) {
    try {
      var p = el && typeof el.requestFullscreen === 'function' && el.requestFullscreen({ navigationUI: 'hide' });
      if (p && typeof p.then === 'function') p.then(null, function () {   });
    } catch (e) {   }
  }

  function enterGame(o) {
    o = o || {};
    requestFull(o.el);
    if (o.member != null) Game.setMember(o.member);
    return start(o.roomId || 'room1');
  }

  var BLOCKED = {
    vault: { title: '아직 금고로 갈 수 없다.', lines: ['금고로 가는 문은 굳게 닫혀 있다.', '풀지 못한 곳이 남아 있다. 그곳으로 돌아간다.'], button: '돌아간다' },
    ending: { title: '금고는 아직 잠겨 있다.', lines: ['비밀번호를 맞춰야 밖으로 나갈 수 있다.'], button: '돌아간다' }
  };

  function start(roomId) {
    if (Game.load().memberNo == null) Game.setMember(1);
    var notice = null, to = blockedStop(roomId, Game.load());
    if (to) {
      notice = BLOCKED[roomId];
      roomId = to;
      if (HAS_DOM && !(root.LIAR_SCENE || {})[roomId]) { location.href = Game.url(PAGES[roomId]); return null; }
    }
    try { Game.enter(roomId); } catch (e) {   }
    if (!HAS_DOM) return stateOf(roomId);
    var cfg = (root.LIAR_SCENE || {})[roomId];
    if (!cfg) throw new Error('Scene: no config window.LIAR_SCENE.' + roomId);
    var problems = validate(cfg);
    if (problems.length && root.console) console.warn('Scene: ' + roomId + ' config problems:\n' + problems.join('\n'));
    mount(cfg, notice);
    return cur.ctx.state;
  }

  function go(target) {
    if (!target) return;
    if (root.LIAR_SCENE && root.LIAR_SCENE[target]) { start(target); return; }
    location.href = Game.url(PAGES[target] || target);
  }

  var popups = {};
  function registerPopup(name, fn) { popups[name] = fn; }

  var cur = null;
  var timers = [];
  var listening = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function lines(node, text) {
    node.textContent = '';
    String(text == null ? '' : text).split('\n').forEach(function (t, i) {
      if (i) node.appendChild(document.createElement('br'));
      node.appendChild(document.createTextNode(t));
    });
    return node;
  }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  function layout() {
    if (!cur) return;
    var a = cur.el.area.getBoundingClientRect();
    if (!a.width || !a.height) return;
    var f = fit(a.width, a.height);
    cur.el.box.style.width = f.w + 'px';
    cur.el.box.style.height = f.h + 'px';
    cur.el.box.style.setProperty('--u', (f.w / W) + 'px');
  }

  function mount(cfg, notice) {
    timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = [];
    if (cur && cur.el.pcKey) document.removeEventListener('keydown', cur.el.pcKey);
    var host = document.getElementById('game');
    if (!host) { host = el('div'); host.id = 'game'; document.body.appendChild(host); }
    var old = document.getElementById('play');
    if (old) old.parentNode.removeChild(old);
    document.body.setAttribute('data-room', cfg.roomId);

    var E = {};
    E.play = el('div'); E.play.id = 'play';

    var storyOnly = cfg.noAnswer === true;
    E.top = el('div', 'top');
    E.tr1 = el('div', 'tr1');
    E.place = el('span', 'place');
    E.place.appendChild(el('b', null, cfg.place));
    if (cfg.placeSub) E.place.appendChild(el('small', null, cfg.placeSub));
    E.goalbar = el('span', 'goalbar'); E.goalbar.appendChild(el('b', null, '목표'));
    E.goal = el('span', 'goal'); E.goalbar.appendChild(E.goal);
    E.right = el('span', 'r');
    E.rt = el('span', 'rt');
    E.mno = el('b'); E.time = el('b');
    E.rt.appendChild(document.createTextNode('모둠 번호 ')); E.rt.appendChild(E.mno);
    E.rt.appendChild(document.createTextNode(' · 경과 ')); E.rt.appendChild(E.time);
    E.right.appendChild(E.rt);
    if (!storyOnly) {
      E.pcBtn = el('button', 'pcbtn'); E.pcBtn.type = 'button'; E.pcBtn.setAttribute('aria-haspopup', 'dialog');
      E.right.appendChild(E.pcBtn);
    }
    if (storyOnly) { E.goalbar.hidden = true; E.right.hidden = true; }
    E.tr1.appendChild(E.place); E.tr1.appendChild(E.goalbar); E.tr1.appendChild(E.right);
    E.msg = el('div', 'msg txt');
    E.top.appendChild(E.tr1); E.top.appendChild(E.msg);

    E.area = el('div', 'artarea');
    E.backdrop = el('div', 'backdrop');
    E.backdrop.style.backgroundImage = 'url("' + Game.url(cfg.image) + '")';
    E.box = el('div', 'artbox');
    E.art = el('img', 'art'); E.art.alt = ''; E.art.src = Game.url(cfg.image); E.art.draggable = false;
    E.hs = el('div', 'hs');
    E.bubbles = el('div', 'bubbles');
    E.box.appendChild(E.art); E.box.appendChild(E.hs); E.box.appendChild(E.bubbles);
    E.area.appendChild(E.backdrop); E.area.appendChild(E.box);

    E.bar = el('div', 'bar');
    E.bag = el('div', 'bagrow');
    E.tools = el('div', 'tools');
    E.hintBtn = el('button', 'hintbtn'); E.hintBtn.type = 'button';
    if (!storyOnly) E.tools.appendChild(E.hintBtn);
    if (storyOnly) { E.bar.hidden = true; E.bag.hidden = true; E.tools.hidden = true; }
    if (cfg.answerButton) {
      E.ansBtn = el('button', 'hintbtn', '정답 입력'); E.ansBtn.type = 'button';
      E.tools.insertBefore(E.ansBtn, E.hintBtn);
    }
    E.bar.appendChild(E.bag); E.bar.appendChild(E.tools);
    E.play.appendChild(E.top); E.play.appendChild(E.area); E.play.appendChild(E.bar);
    host.appendChild(E.play);

    var flying = {};
    var ui = {};
    var ctx = context(cfg.roomId, ui);
    cur = { cfg: cfg, ctx: ctx, el: E };

    ui.say = function (text, who) {
      E.msg.textContent = '';
      E.msg.appendChild(el('span', 'tag', '살펴보기'));
      var s = el('span', 'line');
      if (who) s.appendChild(el('b', null, who));
      s.appendChild(document.createTextNode(text));
      E.msg.appendChild(s);
    };
    function idle(text) { E.msg.textContent = ''; E.msg.appendChild(el('span', 'idle', text)); }
    ui.goal = function (t) { E.goal.textContent = t; E.goalbar.title = t; };

    var bubEls = {}, bubT = {}, bubState = {};
    function bubbleSync() {
      var t = Date.now();
      bubState = bubbleStep(bubState, t);
      var on = bubblesOn(bubState, t);
      Object.keys(bubEls).forEach(function (k) { bubEls[k].classList.toggle('on', on.indexOf(k) >= 0); });
    }
    function bubbleTimer(id, ms) {
      bubT[id] = later(function () {
        var left = (bubState[id] || 0) - Date.now();
        if (left > 0) bubbleTimer(id, left); else bubbleSync();
      }, ms);
    }
    ui.bubble = function (spec) {
      var id = String(spec.id), d = bubEls[id];
      if (!d) { d = el('div', 'bub'); E.bubbles.appendChild(d); bubEls[id] = d; }
      d.textContent = '';
      if (spec.who) d.appendChild(el('span', 'nm', spec.who));
      d.appendChild(document.createTextNode(spec.text || ''));
      d.style.left = (spec.x / W * 100) + '%'; d.style.top = (spec.y / H * 100) + '%';
      d.style.setProperty('--tx', spec.tail || '50%');
      void d.offsetWidth;
      bubState = bubbleStep(bubState, Date.now(), { open: id });
      bubbleSync();
      clearTimeout(bubT[id]);
      bubbleTimer(id, BUBBLE_MS);
    };

    function itemNode(id, cls) {
      var it = (cfg.items || {})[id] || {};
      var wrap = el('span', cls);
      if (it.img) { var im = el('img'); im.src = Game.url(it.img); im.alt = it.name || ''; im.draggable = false; wrap.appendChild(im); }
      else wrap.textContent = it.icon || '?';
      return wrap;
    }
    function renderBag(pulseIdx) {
      E.bag.textContent = '';
      var its = ctx.state.items.filter(function (id) { return !flying[id]; });
      for (var i = 0; i < 6; i++) {
        var d = el('div', 'slot');
        var id = its[i];
        if (id) {
          d.appendChild(itemNode(id, 'slotitem'));
          d.title = ((cfg.items || {})[id] || {}).name || '';
          if (ctx.sel === id) d.classList.add('sel');
          (function (id) {
            d.addEventListener('click', function () {
              ctx.sel = ctx.sel === id ? null : id;
              renderBag();
              var it = (cfg.items || {})[id] || {};
              if (ctx.sel === id) ui.say(it.desc || it.name || '');
            });
          })(id);
        } else d.classList.add('empty');
        if (i === pulseIdx) d.classList.add('pulse');
        E.bag.appendChild(d);
      }
    }
    ui.select = function () { renderBag(); };

    ui.acquire = function (id, done) {
      var it = (cfg.items || {})[id] || {};
      var name = it.name || id;
      flying[id] = true;
      renderBag();
      var idx = Math.min(5, ctx.state.items.filter(function (x) { return !flying[x] || x === id; }).indexOf(id));
      var slot = E.bag.children[idx].getBoundingClientRect();
      var f = itemNode(id, 'fly');
      var lab = el('div', 'flylab', name + eul(name) + ' 획득했다');
      var shade = el('div', 'flyshade');
      document.body.appendChild(shade); document.body.appendChild(f); document.body.appendChild(lab);
      var fw = f.getBoundingClientRect().width || 240;
      var end = Math.max(0.1, (slot.width - 4) / fw);
      var tx = slot.left + slot.width / 2 - innerWidth / 2, ty = slot.top + slot.height / 2 - innerHeight / 2;
      if (typeof f.animate === 'function') {
        f.animate([
          { transform: 'translate(-50%,-50%) scale(.25)', opacity: 0 },
          { transform: 'translate(-50%,-50%) scale(1.25)', opacity: 1, offset: 0.22 },
          { transform: 'translate(-50%,-50%) scale(1.25)', opacity: 1, offset: 0.72 },
          { transform: 'translate(calc(-50% + ' + tx + 'px),calc(-50% + ' + ty + 'px)) scale(' + end + ')', opacity: 0.95 }
        ], { duration: FLY_MS, easing: 'ease-in-out', fill: 'forwards' });
        lab.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: FLY_MS, fill: 'forwards' });
        shade.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.68 }, { opacity: 0, offset: 0.85 }, { opacity: 0 }], { duration: FLY_MS, fill: 'forwards' });
      }
      later(function () {
        f.remove(); lab.remove(); shade.remove();
        delete flying[id];
        renderBag(idx);
        ui.say(name + eul(name) + ' 획득했다. 가방에 넣었다.');
        done();
      }, FLY_MS);
    };

    function closeBtn(onClose) {
      var b = el('button', 'close', '×'); b.type = 'button'; b.setAttribute('aria-label', '닫기');
      b.addEventListener('click', function (e) { e.stopPropagation(); onClose(); });
      return b;
    }

    E.cont = el('div', 'cont');
    var contPanel = el('div', 'panel');
    E.ctitle = el('div', 'ptitle');
    E.well = el('div', 'well');
    E.ph = el('div', 'ph txt');
    contPanel.appendChild(closeBtn(function () { E.cont.classList.remove('on'); }));
    contPanel.appendChild(E.ctitle); contPanel.appendChild(E.well); contPanel.appendChild(E.ph);
    E.cont.appendChild(contPanel);
    E.box.appendChild(E.cont);
    ui.container = function (spec, take) {
      E.ctitle.textContent = spec.title || '';
      E.well.textContent = '';
      E.well.style.backgroundImage = spec.image ? 'url("' + Game.url(spec.image) + '")' : '';
      E.well.style.backgroundPosition = spec.imagePos || 'center';
      if (spec.item) {
        var it = itemNode(spec.item, 'it');
        it.setAttribute('role', 'button');
        it.setAttribute('aria-label', ((cfg.items || {})[spec.item] || {}).name || '');
        it.addEventListener('click', function () { E.cont.classList.remove('on'); take(); });
        E.well.appendChild(it);
      }
      E.ph.textContent = spec.hint || '';
      E.cont.classList.add('on');
    };

    E.pop = el('div', 'cont pop');
    var popPanel = el('div', 'panel');
    var popBody = el('div', 'popbody');
    popPanel.appendChild(closeBtn(function () { E.pop.classList.remove('on'); }));
    popPanel.appendChild(popBody);
    E.pop.appendChild(popPanel);
    E.box.appendChild(E.pop);
    ui.popup = function (name) {
      var fn = popups[name];
      if (typeof fn !== 'function') { if (root.console) console.warn('Scene: no popup "' + name + '"'); return; }
      popBody.textContent = '';
      popBody.className = 'popbody pop-' + name;
      E.pop.setAttribute('data-popup', name);
      E.pop.classList.add('on');
      fn(popBody, {
        say: ui.say,
        give: function (id, done) { return give(ctx, id, done); },
        set: function (flag) { ctx.state.flags[flag] = true; ctx.save(); },
        close: function () { E.pop.classList.remove('on'); },
        state: function () { return ctx.state; },
        submit: submitAnswer,
        game: function () { return Game.load(); },
        roomId: cfg.roomId,
        url: Game.url
      });
    };

    var A = cfg.answer || {};
    E.kp = el('div', 'keypad txt');
    var kpTitle = el('div', 'kptitle', A.title || '정답 입력');
    var kpText = el('div', 'kptext', A.text || '답을 입력한다.');
    var kpForm = el('form', 'kpform');
    E.kin = el('input'); E.kin.type = 'text'; E.kin.autocomplete = 'off';
    E.kin.setAttribute('inputmode', A.inputMode || 'numeric');
    if (A.maxLength) E.kin.maxLength = A.maxLength;
    if (A.wide) E.kin.className = 'wide';
    E.kin.setAttribute('aria-label', A.title || '정답');
    E.kok = el('button', 'btn small', A.submitText || '입력'); E.kok.type = 'submit';
    kpForm.appendChild(E.kin); kpForm.appendChild(E.kok);
    E.kres = el('div', 'res');
    E.knext = el('button', 'btn small knext', '다음으로 →'); E.knext.type = 'button'; E.knext.hidden = true;
    E.knext.addEventListener('click', function () { go(cfg.onSolvedGo); });
    E.kp.appendChild(closeBtn(function () { E.kp.classList.remove('on'); }));
    E.kp.appendChild(kpTitle); E.kp.appendChild(kpText); E.kp.appendChild(kpForm); E.kp.appendChild(E.kres); E.kp.appendChild(E.knext);
    E.box.appendChild(E.kp);
    function solvedNow() { return isSolved(Game.load(), cfg.roomId); }
    function showSolved() {
      E.kin.disabled = true; E.kok.disabled = true;
      E.kres.textContent = A.correctText || '맞았다.';
      E.kres.className = 'res ok';
      E.knext.hidden = !cfg.onSolvedGo;
    }
    function submitAnswer(v) {
      if (Game.normalize(v) === '') return { correct: false, hintsUnlocked: Game.hintsUnlocked(cfg.roomId), empty: true };
      var r = Game.submit(cfg.roomId, v);
      refreshHint();
      if (r.correct) {
        showSolved();
        later(function () { E.kp.classList.remove('on'); E.pop.classList.remove('on'); run(cfg.onSolved, ctx); }, 1300);
      }
      return r;
    }
    kpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = submitAnswer(E.kin.value);
      if (r.empty) { E.kres.textContent = A.emptyText || '먼저 답을 적는다.'; E.kres.className = 'res'; return; }
      if (!r.correct) { E.kres.textContent = A.wrongText || '맞지 않는다.'; E.kres.className = 'res bad'; E.kin.select(); }
    });
    ui.answer = function () {
      if (solvedNow()) showSolved();
      E.kp.classList.add('on');
      if (!E.kin.disabled) { try { E.kin.focus({ preventScroll: true }); } catch (e) {   } }
    };
    if (E.ansBtn) E.ansBtn.addEventListener('click', function () { ui.answer(); });

    var hints = ((root.LIAR || {})[cfg.roomId] || {}).hints || [];
    E.hp = el('div', 'hintpanel txt');
    var hpTitle = el('div', 'kptitle', '힌트');
    var hpTabs = el('div', 'hptabs');
    var hpText = el('div', 'hptext');
    E.hp.appendChild(closeBtn(function () { E.hp.classList.remove('on'); }));
    E.hp.appendChild(hpTitle); E.hp.appendChild(hpTabs); E.hp.appendChild(hpText);
    E.box.appendChild(E.hp);
    var hpShown = 0;
    function level() { return solvedNow() ? 2 : Game.hintsUnlocked(cfg.roomId); }
    function refreshHint() {
      if (storyOnly) return;
      var lv = level();
      E.hintBtn.textContent = lv ? '💡 힌트 ' + lv + '/2' : '🔒 힌트';
    }
    function showHint(n) {
      var lv = level();
      hpShown = n;
      hpTabs.textContent = '';
      [1, 2].forEach(function (k) {
        var t = el('button', 'hptab' + (k === n ? ' on' : ''), (k <= lv ? '' : '🔒 ') + '힌트 ' + k);
        t.type = 'button';
        t.addEventListener('click', function () { showHint(k); });
        hpTabs.appendChild(t);
      });
      if (n <= lv) hpText.textContent = String(hints[n - 1] || '');
      else if (n === 1) hpText.textContent = '아직 열리지 않았다. 이 방에 들어오고 3분이 지나거나, 답을 두 번 틀리면 열린다.';
      else hpText.textContent = '아직 열리지 않았다. 힌트 1이 열리고 3분이 지나거나, 답을 두 번 더 틀리면 열린다.';
      if (n === 2 && lv >= 2) flash(cfg.hintSpot);
    }
    E.hintBtn.addEventListener('click', function () {
      if (E.hp.classList.contains('on')) { E.hp.classList.remove('on'); return; }
      E.hp.classList.add('on');
      showHint(Math.max(1, level()));
    });

    function flash(spotId) {
      var h = (cfg.hotspots || []).filter(function (x) { return x.id === spotId; })[0];
      if (!h) return;
      var r = h.rect, d = el('div', 'flash');
      d.style.left = (r[0] / W * 100) + '%'; d.style.top = (r[1] / H * 100) + '%';
      d.style.width = (r[2] / W * 100) + '%'; d.style.height = (r[3] / H * 100) + '%';
      E.box.appendChild(d);
      later(function () { d.remove(); }, FLASH_MS);
    }

    E.story = el('div', 'story');
    var stIn = el('div', 'in txt');
    var stTitle = el('h2'), stP = el('p');
    var stGo = el('button', 'btn'); stGo.type = 'button';
    var stSkip = el('button', 'skip', '건너뛰기'); stSkip.type = 'button';
    stIn.appendChild(stTitle); stIn.appendChild(stP); stIn.appendChild(stGo);
    E.story.appendChild(stIn); E.story.appendChild(stSkip);
    E.box.appendChild(E.story);
    var storyDone = null;
    function openStory(spec, onClose) {
      lines(stTitle, spec.title || '');
      lines(stP, (spec.lines || []).join('\n'));
      stP.hidden = !(spec.lines && spec.lines.length);
      stGo.textContent = spec.button || '계속';
      E.story.classList.add('on'); E.story.style.opacity = '';
      E.art.classList.add('blur');
      storyDone = onClose;
    }
    function closeStory() {
      if (!storyDone) return;
      var fn = storyDone; storyDone = null;
      E.story.style.opacity = '0';
      E.art.classList.remove('blur');
      later(function () { E.story.classList.remove('on'); E.story.style.opacity = ''; fn(); }, 900);
    }
    stGo.addEventListener('click', closeStory);
    stSkip.addEventListener('click', closeStory);
    ui.story = function (spec) {
      openStory(spec, function () {
        if (spec.next) go(spec.next);
        else run(spec.then, ctx);
      });
    };

    var pcTab = pieceTab(Game.load().memberNo);
    function vaultData() { return (root.LIAR || {}).vault || {}; }
    function pcCount() {
      if (E.pcBtn) E.pcBtn.textContent = '🧩 조각 ' + pieceView(Game.load(), 1, vaultData()).count + '/4';
    }
    if (E.pcBtn) {
      E.pc = el('div', 'pcwrap');
      var pcPanel = el('div', 'pcpanel txt'); pcPanel.setAttribute('role', 'dialog'); pcPanel.setAttribute('aria-label', '모둠 조각');
      var pcHead = el('div', 'pchead');
      var pcTabs = el('div', 'pctabs'); pcTabs.setAttribute('role', 'tablist');
      var pcBody = el('div', 'pcbody');
      var pcClose = el('button', 'pcclose', '×'); pcClose.type = 'button'; pcClose.setAttribute('aria-label', '닫기');
      pcHead.appendChild(el('div', 'pctitle', '모둠 조각')); pcHead.appendChild(pcTabs); pcHead.appendChild(pcClose);
      pcPanel.appendChild(pcHead); pcPanel.appendChild(pcBody);
      E.pc.appendChild(pcPanel);
      E.area.appendChild(E.pc);
      var pcOpen = function (on) { E.pc.classList.toggle('on', on); if (on) pcRender(pcTab); };
      var pcRender = function (n, res) {
        pcTab = n;
        var v = pieceView(Game.load(), n, vaultData());
        pcTabs.textContent = '';
        v.tabs.forEach(function (t) {
          var b = el('button', 'pctab' + (t.n === n ? ' on' : '') + (t.solved ? ' ok' : ''),
            (t.solved ? '✓ ' : '🔒 ') + t.n + '번' + (t.mine ? ' (나)' : ''));
          b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(t.n === n));
          b.addEventListener('click', function () { pcRender(t.n); });
          pcTabs.appendChild(b);
        });
        pcBody.textContent = '';
        if (v.solved) {
          pcBody.appendChild(el('div', 'pcstate ok', (res ? res + ' ' : '') + '조각 ' + n + '의 문장이 드러났다.'));
          pcBody.appendChild(el('p', 'pcsentence', v.sentence));
          pcBody.appendChild(el('div', 'pcnote', '괄호 속 빈칸은 직접 풀어 낸 답으로 채운다. 방 1은 입구 경비실, 방 2는 꼭대기 등불 제어판, 방 3은 부두 창고이다. 네 문장을 모아 금고의 문제를 완성하라.'));
        } else {
          pcBody.appendChild(el('div', 'pcstate', '🔒 잠긴 조각이다. 아래 과제를 풀면 금고 문제의 문장 한 줄이 드러난다.'));
          pcBody.appendChild(el('div', 'pctask', v.task || ''));
          var f = el('form', 'pcform');
          var inp = el('input'); inp.type = 'text'; inp.autocomplete = 'off'; inp.setAttribute('inputmode', 'numeric');
          inp.setAttribute('aria-label', '조각 ' + n + ' 답');
          var ok = el('button', 'pcok', '확인'); ok.type = 'submit';
          var out = el('span', 'pcres' + (res ? ' bad' : ''), res || '');
          f.appendChild(inp); f.appendChild(ok); f.appendChild(out);
          if (v.hintReady) {
            var hb = el('button', 'pchintbtn', '힌트'); hb.type = 'button';
            var ht = el('div', 'pchint', v.hint); ht.hidden = true;
            hb.addEventListener('click', function () { ht.hidden = !ht.hidden; });
            f.appendChild(hb);
          }
          f.addEventListener('submit', function (e) {
            e.preventDefault();
            if (Game.normalize(inp.value) === '') { out.textContent = '먼저 답을 적는다.'; out.className = 'pcres'; return; }
            var r = Game.submit('piece' + n, inp.value);
            pcCount();
            pcRender(n, r.correct ? '맞다.' : '맞지 않는다.');
          });
          pcBody.appendChild(f);
          if (ht) pcBody.appendChild(ht);
          if (!res) { try { inp.focus({ preventScroll: true }); } catch (e) {   } }
        }
      };
      E.pcBtn.addEventListener('click', function () { pcOpen(!E.pc.classList.contains('on')); });
      pcClose.addEventListener('click', function () { pcOpen(false); });
      E.pc.addEventListener('click', function (e) { if (e.target === E.pc) pcOpen(false); });
      E.pcKey = function (e) { if (e.key === 'Escape' && E.pc.classList.contains('on')) pcOpen(false); };
      document.addEventListener('keydown', E.pcKey);
      pcCount();
    }

    E.hs.addEventListener('click', function (e) {
      var r = E.box.getBoundingClientRect();
      if (!r.width) return;
      var px = e.clientX - r.left, py = e.clientY - r.top;
      var id = pickHit(cfg.hotspots, px / r.width * W, py / r.height * H);
      if (id) {
        var h = cfg.hotspots.filter(function (x) { return x.id === id; })[0];
        clickHotspot(h, ctx);
        renderBag();
        return;
      }
      var d = el('div', 'ripple');
      d.style.left = (px - 14) + 'px'; d.style.top = (py - 14) + 'px';
      E.box.appendChild(d);
      requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('go'); }); });
      later(function () { d.remove(); }, 700);
      var t = cfg.emptyLines || EMPTY_LINES;
      ui.say(t[Math.floor(Math.random() * t.length)]);
    });

    E.mno.textContent = String(Game.load().memberNo || 1);
    function tick() { E.time.textContent = Game.formatTime(Game.elapsed()); refreshHint(); }
    tick(); timers.push(setInterval(tick, 1000));
    ui.goal(ctx.state.goal || cfg.goal || '');
    renderBag();

    function begin() {
      if (cfg.intro && !ctx.state.flags._intro) {
        idle(cfg.idleText || '주위를 살펴보자.');
        openStory(cfg.intro, function () {
          ctx.state.flags._intro = true; ctx.save();
          run(cfg.intro.then, ctx);
          run(cfg.onEnter, ctx);
        });
      } else {
        idle(solvedNow() ? (cfg.solvedIdle || cfg.idleText || '주위를 살펴보자.') : (cfg.idleText || '주위를 살펴보자.'));
        run(cfg.onEnter, ctx);
      }
    }
    if (notice) { idle(cfg.idleText || '주위를 살펴보자.'); openStory(notice, begin); } else begin();

    if (!listening) {
      listening = true;
      addEventListener('resize', layout);
      document.addEventListener('fullscreenchange', function () { setTimeout(layout, 120); });
    }
    if (typeof ResizeObserver === 'function') new ResizeObserver(layout).observe(E.area);
    layout(); later(layout, 200); later(layout, 700);
    return cur;
  }

  return {
    W: W, H: H, MIN_SPOT: MIN_SPOT, FLY_MS: FLY_MS, NOTHING: NOTHING, EMPTY_LINES: EMPTY_LINES, PAGES: PAGES, STOPS: STOPS,
    TOP_H: TOP_H, BAR_H: BAR_H, BUBBLE_MS: BUBBLE_MS,
    fit: fit, eul: eul, bubbleStep: bubbleStep, bubblesOn: bubblesOn, pickHit: pickHit, nextStop: nextStop, hasProgress: hasProgress, titleMode: titleMode,
    isSolved: isSolved, blockedStop: blockedStop, pieceTab: pieceTab, pieceView: pieceView, escapeText: escapeText, endingModel: endingModel,
    stateOf: stateOf, saveState: saveState,
    context: context, run: run, clickHotspot: clickHotspot, usesItem: usesItem, validate: validate,
    requestFull: requestFull, enterGame: enterGame, start: start, go: go,
    registerPopup: registerPopup, layout: layout,
    get current() { return cur; }
  };
});
