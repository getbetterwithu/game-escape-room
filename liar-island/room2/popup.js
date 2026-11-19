(function () {
  var VALUES = [16, 8, 4, 2, 1];

  function lampValue(states) {
    var sum = 0;
    (states || []).forEach(function (s, i) { if (s && i < VALUES.length) sum += VALUES[i]; });
    return sum;
  }
  function lampStates(state) {
    var f = (state && state.flags) || {};
    return VALUES.map(function (v, i) { return f['lampOn' + i] === true ? 1 : 0; });
  }

  window.LIAR = window.LIAR || {};
  window.LIAR.room2Lamp = { VALUES: VALUES, lampValue: lampValue, lampStates: lampStates };

  function addStyle() {
    if (document.getElementById('room2-style')) return;
    var st = document.createElement('style'); st.id = 'room2-style';
    st.textContent =
      '.room2-card{color:#efe6c8;text-align:center}' +
      '.room2-card .room2-no{font:400 clamp(15px,2.8vh,19px) "Song Myung",serif;color:#f4d58a;letter-spacing:.1em}' +
      '.room2-card .room2-val{font-size:clamp(12px,2.2vh,14px);color:#bfae83;margin-top:2px}' +
      '.room2-card .room2-text{margin:clamp(10px,2.4vh,18px) 6px;padding:clamp(10px,2.2vh,16px) 12px;background:rgba(0,0,0,.3);border:1px solid rgba(244,213,138,.3);border-radius:8px;font-size:clamp(15px,2.9vh,19px);line-height:1.7}' +
      '.room2-card .room2-ch{display:flex;gap:14px;justify-content:center}' +
      '.room2-card .room2-ch button{min-width:clamp(90px,16vh,130px);padding:clamp(8px,1.8vh,12px) 14px;border-radius:10px;border:1px solid rgba(244,213,138,.5);background:#141c2b;color:#efe6c8;font:700 clamp(15px,2.8vh,19px) "Hahmlet",serif;cursor:pointer}' +
      '.room2-card .room2-ch button.on{background:linear-gradient(#d4ad55,#b88f35);color:#1b1407;border-color:#f4d58a}' +
      '.room2-card .room2-now{margin-top:10px;min-height:20px;font-size:clamp(12px,2.2vh,14px);color:#bfae83}';
    document.head.appendChild(st);
  }

  function makeCard(i) {
    return function (el, api) {
      addStyle();
      var P = ((window.LIAR || {}).room2 || {}).propositions || [];
      var prop = P[i] || { text: '' };
      var f = api.state().flags;
      el.className += ' room2-card';
      var no = document.createElement('div'); no.className = 'room2-no'; no.textContent = (i + 1) + '번 등불의 명제 카드';
      var val = document.createElement('div'); val.className = 'room2-val'; val.textContent = '이 등불 밑의 숫자: ' + VALUES[i];
      var tx = document.createElement('div'); tx.className = 'room2-text'; tx.textContent = prop.text;
      var ch = document.createElement('div'); ch.className = 'room2-ch';
      var now = document.createElement('div'); now.className = 'room2-now';
      function paint() {
        var set = f['lampSet' + i] === true, on = f['lampOn' + i] === true;
        bt.classList.toggle('on', set && on); bf.classList.toggle('on', set && !on);
        now.textContent = !set ? '참이면 등불이 켜지고, 거짓이면 꺼진 채로 남는다.' : (on ? '지금 이 등불은 켜져 있다.' : '지금 이 등불은 꺼져 있다.');
      }
      function choose(truth) {
        api.state().flags['lampOn' + i] = truth;
        api.set('lampSet' + i);
        api.say(truth ? (i + 1) + '번 카드를 참으로 보았다. 등불이 켜졌다.' : (i + 1) + '번 카드를 거짓으로 보았다. 등불은 꺼진 채로 남는다.');
        api.close();
      }
      var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = '참';
      var bf = document.createElement('button'); bf.type = 'button'; bf.textContent = '거짓';
      bt.addEventListener('click', function () { choose(true); });
      bf.addEventListener('click', function () { choose(false); });
      ch.appendChild(bt); ch.appendChild(bf);
      el.appendChild(no); el.appendChild(val); el.appendChild(tx); el.appendChild(ch); el.appendChild(now);
      paint();
    };
  }
  for (var i = 0; i < VALUES.length; i++) window.Scene.registerPopup('room2-lampCard' + (i + 1), makeCard(i));
})();
