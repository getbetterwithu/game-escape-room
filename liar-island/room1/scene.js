(function () {
  var D = window.LIAR.room1;
  var HEARD = D.guards.map(function (g, i) { return 'heard' + i; });

  var BUBBLE = [{ x: 600, y: 40, tail: '62%' }, { x: 945, y: 12, tail: '52%' }, { x: 1290, y: 56, tail: '42%' }];

  function guard(i, rect) {
    var g = D.guards[i], b = BUBBLE[i];
    return { id: 'g' + i, rect: rect, do: [
      { bubble: { id: 'g' + i, who: '경비 ' + g.name, text: g.says, x: b.x, y: b.y, tail: b.tail } },
      { set: HEARD[i] },
      { ifFlag: HEARD,
        then: [{ say: '세 사람의 말을 나란히 놓고 비교해 보자.' }, { goal: '진실한 경비가 말한 칸 수로 숫자판의 암호를 되돌려라.' }],
        else: [{ say: '경비 ' + g.name + '의 말을 들었다.' }] }
    ] };
  }

  var lockerInside = { container: {
    title: '사물함 안', image: 'assets/inside_locker.jpg', imagePos: 'center 62%', item: 'scroll',
    hint: '접힌 쪽지가 놓여 있다. 눌러서 집어 보자.', emptyText: '사물함은 비어 있다.',
    then: [{ goal: '경비들의 말을 듣고 진실한 사람을 찾아라.' }]
  } };

  window.LIAR_SCENE = window.LIAR_SCENE || {};
  window.LIAR_SCENE.room1 = {
    roomId: 'room1',
    place: '입구 경비실',
    placeSub: '등대 1층',
    image: 'assets/room1_guardroom.jpg',
    goal: '이곳을 빠져나갈 방법을 찾아라.',
    intro: {
      title: '깨어나 보니,\n등대 안이었다.',
      lines: ['체험학습 첫날, 바닷가 마을 빵집에서 나눠 준 쿠키를 먹었다.', '그 뒤로 기억이 없다.', '차가운 돌바닥 위에서 눈을 떴다.', '철문 앞에 섬사람 셋이 서 있다.'],
      button: '주위를 둘러본다',
      then: [{ say: '낡은 등대 1층이다. 차가운 공기 속에서 횃불이 흔들린다.' }]
    },
    items: {
      key: { icon: '🗝️', name: '낡은 열쇠', img: 'assets/item_key.jpg', desc: '낡은 열쇠를 골랐다. 어디에 쓸 수 있을까?' },
      scroll: { icon: '📜', name: '접힌 쪽지', img: 'assets/item_scroll.jpg', desc: '접힌 쪽지이다. “자리마다 따로 되돌려라.”' }
    },
    hotspots: [
      { id: 'door', rect: [0, 80, 285, 810], do: [{ say: '굳게 닫힌 철문이다. 문에 숫자 ' + D.cipher + '가 새겨져 있다. 누군가 각 자리를 같은 칸 수만큼 올려 놓았다. 9 다음은 다시 0이다.' }] },
      { id: 'desk', rect: [410, 540, 460, 300], do: [{ say: '오래 쓴 나무 책상이다.' }] },
      { id: 'pad', rect: [304, 315, 82, 105], do: [{ say: '숫자판에 두 자리 수를 입력할 수 있다. 경비들의 말을 듣고 암호를 되돌려 보자.' }, { answer: true }] },
      { id: 'torch', rect: [371, 85, 82, 205], do: [{ say: '타오르는 횃불이다. 뜨거워서 손을 댈 수 없다.' }] },
      { id: 'frame', rect: [490, 90, 325, 305], do: [{ say: '폭풍 속 등대를 그린 그림이다.' }] },
      { id: 'lamp', rect: [505, 390, 85, 155], do: [{ say: '기름 램프가 따뜻하게 타고 있다.' }] },
      { id: 'books', rect: [605, 440, 190, 100], do: [{ say: '낡은 책에 섬의 전설이 적혀 있다. “이 섬에는 늘 진실만 말하는 사람과 늘 거짓만 말하는 사람이 산다. 경비 셋 가운데 진실을 말하는 사람은 정확히 한 명이다.”' }] },
      { id: 'drawer', rect: [575, 559, 195, 82], do: [{ container: {
        title: '서랍 안', image: 'assets/inside_drawer.jpg', item: 'key', openText: '서랍이 열렸다.',
        hint: '안에서 무언가 반짝인다. 눌러서 집어 보자.', emptyText: '서랍은 비어 있다.',
        then: [{ goal: '얻은 물건을 쓸 곳이 있을 것이다.' }]
      } }] },
      { id: 'locker', rect: [838, 200, 127, 575], do: [
        { ifFlag: 'lockerOpen', then: [lockerInside], else: [
          { requireItem: 'key',
            then: [{ set: 'lockerOpen' }, { say: '열쇠가 맞았다. 사물함이 열렸다.' }, lockerInside],
            else: [{ say: '철제 사물함이 잠겨 있다. 열쇠 구멍이 보인다.' }] }
        ] }
      ] },
      { id: 'window', rect: [1400, 0, 272, 470], do: [{ say: '창밖으로 달빛 아래 어두운 바다가 보인다. 창살이 굵어서 나갈 수 없다.' }] },
      guard(0, [940, 125, 240, 735]),
      guard(1, [1180, 175, 190, 690]),
      guard(2, [1370, 170, 215, 720])
    ],
    answer: {
      title: '문 옆 숫자판',
      text: '문에 새겨진 수는 ' + D.cipher + '이다. 해독한 두 자리 수를 입력한다.',
      maxLength: 2, inputMode: 'numeric', submitText: '입력',
      correctText: '철컹— 문이 열렸다.', wrongText: '삑. 맞지 않는다.', emptyText: '먼저 두 자리 수를 적는다.'
    },
    hintSpot: 'g1',
    onSolved: [
      { goal: '철문이 열렸다. 계단을 올라가자.' },
      { story: { title: '철문이 열렸다.', lines: ['문 너머로 좁은 돌계단이 등대 위쪽으로 이어진다.', '꼭대기 쪽에서 희미한 불빛이 새어 나온다.', '방금 맞힌 수를 적어 두자. 금고 앞에서 다시 쓰게 된다.'], button: '계단을 오른다', next: 'room2' } }
    ],
    onSolvedGo: 'room2',
    solvedIdle: '철문이 열려 있다. 계단을 올라가자.'
  };
})();
