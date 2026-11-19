(function () {
  window.LIAR_SCENE = window.LIAR_SCENE || {};
  window.LIAR_SCENE.vault = {
    roomId: 'vault',
    place: '등대지기의 방',
    image: 'assets/vault.jpg',
    goal: '네 조각의 문장을 모아 금고의 비밀번호를 찾아라.',
    intro: {
      title: '등대지기의 방에\n들어섰다.',
      lines: [
        '창고 안쪽 문 너머는 돌로 쌓은 작은 방이었다.',
        '벽 한가운데에 무쇠 금고 문이 버티고 서 있다.',
        '금고를 여는 문제는 모둠원 네 사람의 조각에 한 줄씩 나뉘어 있다.',
        '위의 「🧩 조각」을 열어 네 문장을 모아라.'
      ],
      button: '금고 앞으로 간다',
      then: [{ say: '폭풍이 창을 두드린다. 램프 불빛이 금고 문 위에서 흔들린다.' }]
    },
    items: {},
    hotspots: [
      { id: 'window', rect: [40, 0, 250, 450], do: [{ say: '창밖으로 폭풍 치는 바다 너머 등대가 보인다. 불빛이 어둠을 가른다.' }] },
      { id: 'ropeL', rect: [30, 590, 120, 210], do: [{ say: '굵은 밧줄이 벽에 감겨 걸려 있다.' }] },
      { id: 'sextant', rect: [35, 455, 140, 160], do: [{ say: '황동 육분의이다. 별의 높이를 재어 배의 위치를 찾는 도구이다.' }] },
      { id: 'spyglass', rect: [180, 529, 135, 82], do: [{ say: '창턱에 놓인 망원경이다. 들여다보니 멀리 등대 불빛이 흔들린다.' }] },
      { id: 'mapL', rect: [378, 128, 202, 236], do: [{ say: '해안선을 그린 낡은 지도이다. 섬 둘레에 암초 표시가 빼곡하다.' }] },
      { id: 'mapS', rect: [455, 366, 125, 158], do: [{ say: '나침반 무늬가 그려진 작은 해도이다.' }] },
      { id: 'mapR', rect: [1265, 100, 305, 400], do: [{ say: '섬 전체를 그린 큰 지도이다. 등대와 부두, 창고 자리에 작은 표시가 있다.' }] },
      { id: 'shelf', rect: [1490, 0, 182, 590], do: [{ say: '선반에 밧줄과 낡은 책, 기름 램프가 놓여 있다.' }] },
      { id: 'keybox', rect: [1575, 590, 97, 115], do: [{ say: '열쇠가 가득 든 나무 상자이다. 너무 어두워서 열쇠의 색은 하나도 보이지 않는다.' }] },
      { id: 'chair', rect: [1265, 625, 285, 316], do: [{ say: '등대지기가 쓰던 낡은 나무 의자이다.' }] },
      { id: 'door', rect: [625, 30, 590, 800], do: [{ say: '리벳이 촘촘히 박힌 무쇠 문이다. 밀어도 꿈쩍하지 않는다. 가운데에 둥근 숫자판이 달려 있다.' }] },
      { id: 'dial', rect: [855, 250, 150, 145], do: [
        { say: '둥근 숫자판이다. 비밀번호를 맞추면 문이 열릴 것이다.' }, { answer: true }
      ] },
      { id: 'handle', rect: [725, 390, 115, 195], do: [
        { say: '손잡이를 당겨 보지만 움직이지 않는다. 먼저 숫자판의 비밀번호를 맞춰야 한다.' }, { answer: true }
      ] },
      { id: 'cup', rect: [265, 680, 125, 95], do: [{ say: '식은 차가 반쯤 남은 주석 잔이다.' }] },
      { id: 'book', rect: [60, 755, 345, 125], do: [{ say: '가죽으로 묶은 항해 일지이다. 날마다 날씨와 드나든 배의 이름이 꼼꼼히 적혀 있다.' }] },
      { id: 'tableMap', rect: [500, 765, 475, 120], do: [{ say: '책상 위에 펼친 해도와 디바이더이다. 섬에서 육지까지 뱃길이 그려져 있다.' }] },
      { id: 'lamp', rect: [405, 480, 130, 310], do: [{ say: '기름 램프의 불꽃이 금고 문을 비춘다.' }] },
      { id: 'compass', rect: [385, 794, 115, 82], do: [{ say: '작은 나침반이다. 바늘이 북쪽을 가리킨 채 떨리고 있다.' }] }
    ],
    answer: {
      title: '금고 숫자판',
      text: '네 문장을 모아 완성한 문제를 풀고, 그 답으로 만든 비밀번호를 입력한다.',
      inputMode: 'numeric', wide: true, submitText: '맞춘다',
      correctText: '딸깍— 숫자판이 돌아간다.', wrongText: '숫자판이 꿈쩍도 하지 않는다. 네 문장을 다시 맞춰 보자.',
      emptyText: '먼저 비밀번호를 적는다.'
    },
    hintSpot: 'keybox',
    onSolved: [
      { goal: '금고 문이 열렸다. 밖으로 나가자.' },
      { story: {
        title: '금고 문이\n열렸다.',
        lines: [
          '무거운 문이 천천히 열린다.',
          '안에는 배 열쇠 하나와 접힌 쪽지 한 장이 놓여 있다.',
          '열쇠를 쥐고 바깥문을 밀자 눈부신 햇살이 쏟아져 들어온다.'
        ],
        button: '밖으로 나간다', next: 'ending'
      } }
    ],
    onSolvedGo: 'ending',
    solvedIdle: '금고 문이 열려 있다. 밖으로 나가자.'
  };

  window.LIAR_SCENE.ending = {
    roomId: 'ending',
    place: '탈출',
    image: 'assets/ending_beach.jpg',
    goal: '탈출 성공!',
    noAnswer: true,
    items: {},
    hotspots: [
      { id: 'stairs', rect: [0, 0, 260, 941], do: [{ say: '등대 위로 이어지는 나선 계단이다. 밤새 오르내린 계단이다.' }] },
      { id: 'window', rect: [140, 130, 170, 340], do: [{ say: '작은 창으로 아침 햇살이 비쳐 든다.' }] },
      { id: 'barrel', rect: [260, 655, 160, 130], do: [{ say: '오래된 나무통이다.' }] },
      { id: 'rope', rect: [265, 765, 255, 176], do: [{ say: '굵은 밧줄이 둥글게 감겨 있다.' }] },
      { id: 'lantern', rect: [490, 690, 85, 175], do: [{ say: '밤새 타던 랜턴의 불이 아직 꺼지지 않았다.' }] },
      { id: 'sky', rect: [600, 0, 825, 260], do: [{ say: '파란 하늘에 흰 구름이 천천히 흘러간다.' }] },
      { id: 'sea', rect: [600, 340, 825, 290], do: [{ say: '맑은 바다가 반짝인다. 밤새 몰아치던 폭풍은 흔적도 없다.' }] },
      { id: 'harbor', rect: [980, 262, 445, 140], do: [{ say: '언덕 아래 마을과 항구가 보인다. 작은 배들이 물결에 흔들린다.' }] },
      { id: 'path', rect: [600, 740, 825, 201], do: [{ say: '바닷가로 이어지는 돌길이다.' }] },
      { id: 'door', rect: [1425, 0, 247, 941], do: [
        { say: '활짝 열린 등대 문이다. 접어 둔 쪽지를 다시 펼쳐 본다.' }, { popup: 'ending-note' }
      ] }
    ],
    onEnter: [{ popup: 'ending-note' }],
    idleText: '눈부신 햇살 아래 바다가 반짝인다.',
    emptyLines: ['따뜻한 바닷바람이 분다.', '파도 소리가 들린다.', '햇살이 눈부시다.']
  };

  var CSS = [
    '.pop[data-popup="ending-note"]{background:none;pointer-events:none;align-items:center;justify-content:flex-start;container-type:size}',
    '.pop[data-popup="ending-note"] .panel{pointer-events:auto;margin-left:3%;width:46%;max-height:90%;overflow:hidden;padding:4.2cqh 4.4cqh 3.6cqh;text-align:left;border-radius:6px;border:0;',
    'background:linear-gradient(170deg,#fbf3dc,#efe0b8 70%,#e6d2a2);color:#2b2214;box-shadow:0 2cqh 6cqh rgba(40,25,5,.45),inset 0 0 4cqh rgba(150,110,40,.25);transform:rotate(-1.2deg)}',
    '.pop[data-popup="ending-note"] .close{color:#8a7448;min-width:44px;min-height:44px}',
    '.ending-note-text{font:400 4.7cqh/1.42 "Dokdo",cursive;color:#2b2214;word-break:keep-all;overflow-wrap:break-word}',
    '.ending-sign{font:400 4.5cqh/1.3 "Dokdo",cursive;color:#3a2c18;text-align:right;margin-top:1.4cqh}',
    '.ending-time{margin-top:2.6cqh;padding-top:2cqh;border-top:1px dashed rgba(90,64,24,.45);font:400 4.6cqh/1.3 "Song Myung",serif;color:#6a420e;letter-spacing:.06em}',
    '.ending-home{margin-top:2.6cqh;min-height:max(44px,8.6cqh);padding:0 4cqh;border:0;border-radius:10px;background:linear-gradient(#d4ad55,#b88f35);color:#1b1407;font:700 max(14px,3cqh) "Hahmlet",serif;cursor:pointer;box-shadow:0 3px 0 #7a5d1c}',
    '.ending-card>*{animation:ending-in .9s ease-out both}',
    '.ending-card>.ending-sign{animation-delay:.5s}.ending-card>.ending-time{animation-delay:1.3s}.ending-card>.ending-home{animation-delay:2s}',
    '@keyframes ending-in{from{opacity:0;transform:translateY(1cqh)}to{opacity:1;transform:none}}'
  ].join('');

  window.Scene.registerPopup('ending-note', function (el, api) {
    var doc = el.ownerDocument || document;
    if (!doc.getElementById('ending-style')) {
      var st = doc.createElement('style'); st.id = 'ending-style'; st.textContent = CSS;
      doc.head.appendChild(st);
    }
    function mk(tag, cls, text) { var n = doc.createElement(tag); n.className = cls; if (text != null) n.textContent = text; return n; }
    var m = window.Scene.endingModel(api.game(), window.LIAR.vault);
    var card = mk('div', 'ending-card');
    card.appendChild(mk('div', 'ending-note-text', m.note));
    card.appendChild(mk('div', 'ending-sign', m.sign));
    card.appendChild(mk('div', 'ending-time', m.timeLine));
    var home = mk('button', 'ending-home', '처음 화면으로');
    home.type = 'button';
    home.addEventListener('click', function () { window.location.href = api.url('index.html'); });
    card.appendChild(home);
    el.appendChild(card);
  });
})();
