(function () {
  var D = window.LIAR.room2;
  var CX = [488, 670, 846, 1025, 1202];
  var LAMP = [[495, 515], [670, 515], [845, 515], [1020, 515], [1195, 515]];
  var PLATE_Y = 733, W = 1672, H = 941;

  function plate(i) {
    return { id: 'plate' + i, rect: [CX[i] - 45, 660, 90, 120], do: [
      { ifFlag: 'unlocked',
        then: [{ popup: 'room2-lampCard' + (i + 1) }],
        else: [{ say: '스위치가 꿈쩍도 하지 않는다. 무언가 빠져 있는 것 같다.' }] }
    ] };
  }

  var toolboxInside = { container: {
    id: 'toolbox', title: '공구함 안', image: 'assets/inside_toolbox.jpg', imagePos: 'center 55%', item: 'lever',
    hint: '황동 손잡이가 놓여 있다. 눌러서 집어 보자.', emptyText: '공구함은 비어 있다.',
    then: [{ goal: '제어판에 이 손잡이를 끼울 곳이 있을 것이다.' }]
  } };

  window.LIAR_SCENE = window.LIAR_SCENE || {};
  window.LIAR_SCENE.room2 = {
    roomId: 'room2',
    place: '꼭대기 등불 제어판',
    placeSub: '등대 꼭대기',
    image: 'assets/room2_lamproom.jpg',
    goal: '꺼진 제어판을 움직일 방법을 찾아라.',
    intro: {
      title: '꼭대기에\n올라섰다.',
      lines: ['좁은 계단 끝에 둥근 방이 있다.', '거대한 렌즈 아래, 등불 다섯 개가 어둠 속에 잠겨 있다.', '제어판은 아무 반응이 없다.'],
      button: '주위를 둘러본다',
      then: [{ say: '폭풍이 창문을 두드린다. 제어판의 스위치를 움직이려면 무언가 필요해 보인다.' }]
    },
    items: {
      lever: { icon: '🔧', name: '황동 레버', img: 'assets/item_lever.jpg', desc: '황동 레버를 골랐다. 제어판 어딘가에 끼울 수 있을 것 같다.' }
    },
    hotspots: [
      { id: 'lens', rect: [590, 0, 470, 330], do: [{ say: '거대한 등대 렌즈이다. 등불이 켜지면 바다 멀리까지 빛을 보낼 것이다.' }] },
      { id: 'windowL', rect: [70, 40, 290, 520], do: [{ say: '폭풍 속에서 파도가 부서진다. 창은 굳게 닫혀 있다.' }] },
      { id: 'windowR', rect: [1350, 40, 260, 520], do: [{ say: '구름 사이로 달이 보인다. 파도가 거세다.' }] },
      { id: 'lamps', rect: [420, 440, 800, 150], do: [{ say: '둥근 철망 속의 등불 다섯 개이다. 등불 아래 명판에 숫자가 새겨져 있다.' }] },
      { id: 'gear', rect: [775, 345, 140, 90], do: [
        { say: '제어판 위 중앙 장치의 눈금판이다. 켜진 등불의 숫자를 모두 더한 값을 여기에 입력한다.' }, { answer: true }
      ] },
      { id: 'socket', rect: [750, 575, 190, 82], do: [
        { ifFlag: 'unlocked',
          then: [{ say: '레버가 단단히 끼워져 있다. 제어판이 낮게 웅웅거린다.' }],
          else: [{ requireItem: 'lever',
            then: [{ set: 'unlocked' },
              { say: '레버를 끼우고 돌리자 제어판이 낮게 웅웅거리며 깨어났다. 이제 명판을 눌러 볼 수 있다.' },
              { goal: '참인 등불만 켜고, 켜진 숫자의 합을 제어판 위 톱니 장치에 넣어라.' }],
            else: [{ say: '황동 띠 가운데에 레버를 끼울 홈이 있다. 손잡이가 빠져 있다.' }] }] }
      ] },
      plate(0), plate(1), plate(2), plate(3), plate(4),
      { id: 'toolbox', rect: [65, 675, 290, 200], do: [ toolboxInside ] }
    ],
    answer: {
      title: '제어판 눈금판',
      text: '켜진 등불 밑의 숫자를 모두 더한 값을 입력한다.',
      maxLength: 2, inputMode: 'numeric', submitText: '입력',
      correctText: '철컹— 제어판이 열렸다.', wrongText: '삐익. 맞지 않는다.', emptyText: '먼저 합계를 적는다.'
    },
    hintSpot: 'plate0',
    onSolved: [
      { goal: '제어판이 열렸다. 아래로 이어진 길을 찾자.' },
      { story: { title: '등불이 환하게\n빛난다.', lines: ['켜진 등불이 바다 위로 길을 낸다.', '제어판 뒤에서 아래로 이어지는 쇠사다리가 드러났다.', '방금 맞힌 수를 적어 두자. 금고 앞에서 다시 쓰게 된다.'], button: '사다리를 내려간다', next: 'room3' } }
    ],
    onSolvedGo: 'room3',
    solvedIdle: '제어판이 열려 있다. 사다리를 내려가자.'
  };

  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
  var L = window.LIAR.room2Lamp;
  function pct(v, t) { return (v / t * 100) + '%'; }
  function build(box) {
    var ov = document.createElement('div'); ov.className = 'room2-ov';
    ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;container-type:size;overflow:hidden';
    var tone = document.createElement('div'); tone.className = 'room2-tone';
    tone.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,rgba(244,213,138,.95),rgba(201,162,74,.5) 60%,rgba(120,80,20,.2));mix-blend-mode:soft-light;opacity:0;transition:opacity .8s';
    ov.appendChild(tone);
    for (var i = 0; i < 5; i++) {
      var g = document.createElement('div'); g.className = 'room2-glow'; g.dataset.i = i;
      var s = 260;
      g.style.cssText = 'position:absolute;border-radius:50%;opacity:0;transition:opacity .6s;mix-blend-mode:screen;' +
        'left:' + pct(LAMP[i][0] - s / 2, W) + ';top:' + pct(LAMP[i][1] - s / 2, H) + ';width:' + pct(s, W) + ';height:' + pct(s, H) + ';' +
        'background:radial-gradient(circle,rgba(255,236,170,.95) 0%,rgba(244,196,90,.7) 28%,rgba(244,180,60,.25) 55%,rgba(244,180,60,0) 72%)';
      ov.appendChild(g);
      var lb = document.createElement('div'); lb.className = 'room2-lab';
      lb.textContent = L.VALUES[i];
      lb.style.cssText = 'position:absolute;display:flex;align-items:center;justify-content:center;' +
        'left:' + pct(CX[i] - 40, W) + ';top:' + pct(PLATE_Y - 18, H) + ';width:' + pct(80, W) + ';height:' + pct(36, H) + ';' +
        'font:700 3.4cqh/1 "Hahmlet",serif;color:#2a1c08;text-shadow:0 1px 0 rgba(255,236,170,.45)';
      ov.appendChild(lb);
    }
    var art = box.querySelector('img.art');
    box.insertBefore(ov, art ? art.nextSibling : box.firstChild);
    return ov;
  }
  function sync() {
    var cur = window.Scene && window.Scene.current;
    if (!cur || !cur.cfg || cur.cfg.roomId !== 'room2') return;
    var box = cur.el.box, ov = box.querySelector('.room2-ov') || build(box);
    var st = L.lampStates(cur.ctx.state), n = st.reduce(function (a, b) { return a + b; }, 0);
    ov.querySelectorAll('.room2-glow').forEach(function (g) { g.style.opacity = st[g.dataset.i] ? 1 : 0; });
    ov.querySelector('.room2-tone').style.opacity = String(n * 0.16);
  }
  new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('liar:change', sync);
})();
