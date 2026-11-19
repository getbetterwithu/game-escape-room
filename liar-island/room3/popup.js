(function () {
  var tools = {

    weightedSum: function (barcode) {
      var s = 0, i;
      for (i = 0; i < barcode.length; i++) s += Number(barcode.charAt(i)) * (i % 2 === 0 ? 3 : 1);
      return s;
    },

    ruleText: function (intro) {
      var parts = String(intro).split('\n\n');
      for (var i = 0; i < parts.length; i++) if (parts[i].indexOf('3, 1, 3, 1') >= 0) return parts[i];
      return parts[0];
    },

    barWidths: function (barcode) {
      var w = [1, 2, 1], i, d;
      for (i = 0; i < barcode.length; i++) {
        d = Number(barcode.charAt(i));
        w.push(1 + (d * 3 + i) % 3, 1 + (d + i * 2) % 2 + 1, 1 + (d * 5 + 1) % 3, 1);
      }
      return w.concat([1, 2, 1]);
    }
  };
  window.LIAR = window.LIAR || {};
  window.LIAR.room3Tools = tools;

  var CSS =
    '.room3-zoom .room3-title{font:400 clamp(15px,2.8vh,19px) "Song Myung",serif;color:#f4d58a;letter-spacing:.1em;margin-bottom:14px}' +
    '.room3-label{background:#ece6d6;color:#1b1b1b;border-radius:4px;padding:clamp(6px,1.6vh,12px) 12px;box-shadow:0 2px 10px rgba(0,0,0,.6);transform:rotate(-1deg)}' +
    '.room3-bars{display:flex;align-items:stretch;justify-content:center;height:clamp(34px,8vh,58px)}' +
    '.room3-bars i{display:block;background:#161616}' +
    '.room3-bars i:nth-child(even){background:transparent}' +
    '.room3-digits{font:700 clamp(18px,4.4vh,28px) "Share Tech Mono",ui-monospace,Menlo,monospace;letter-spacing:.32em;text-align:center;margin-top:4px;padding-left:.32em}' +
    '.room3-rule{margin-top:8px;font-size:clamp(11px,2vh,13px);line-height:1.5;color:#d9cba4;text-align:left}' +
    '.room3-notes{display:block;box-sizing:border-box;width:100%;margin-top:8px;height:clamp(54px,11vh,90px);resize:none;background:#1b130b;color:#f2e7c9;border:1px solid rgba(244,213,138,.4);border-radius:6px;padding:6px 8px;font:400 clamp(12px,2.2vh,15px) "Share Tech Mono",ui-monospace,Menlo,monospace}' +
    '.room3-notesnote{font-size:11px;color:#bfae83;margin-top:3px;text-align:left}';

  function make(i) {
    return function (el) {
      var doc = el.ownerDocument;
      var box = window.LIAR.room3.boxes[i - 1];
      if (!doc.getElementById('room3-style')) {
        var st = doc.createElement('style'); st.id = 'room3-style'; st.textContent = CSS; doc.head.appendChild(st);
      }
      function add(parent, tag, cls, text) {
        var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; parent.appendChild(e); return e;
      }
      el.className += ' room3-zoom';
      add(el, 'div', 'room3-title', i + '번 상자의 라벨');
      var label = add(el, 'div', 'room3-label');
      var bars = add(label, 'div', 'room3-bars');
      tools.barWidths(box.barcode).forEach(function (w) { var b = add(bars, 'i'); b.style.width = (w * 2.2) + 'px'; });
      add(label, 'div', 'room3-digits', box.barcode);
      add(el, 'div', 'room3-rule', tools.ruleText(window.LIAR.room3.intro));
      var ta = add(el, 'textarea', 'room3-notes');
      ta.setAttribute('aria-label', '계산 메모'); ta.setAttribute('placeholder', '여기에 계산을 적어 본다.'); ta.setAttribute('spellcheck', 'false');
      add(el, 'div', 'room3-notesnote', '메모는 저장되지 않는다.');
    };
  }
  for (var n = 1; n <= 5; n++) window.Scene.registerPopup('room3-barcodeZoom' + n, make(n));
})();
