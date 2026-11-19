(function () {
  var D = window.LIAR.room3;
  var TOO_SMALL = '라벨의 글씨가 너무 작아 읽을 수 없다. 더 크게 볼 수 있다면 읽을 수 있을 것 같다.';

  function crate(no, rect) {
    return { id: 'crate' + no, rect: rect, do: [
      { requireItem: 'magnifier',
        then: [{ popup: 'room3-barcodeZoom' + no }, { goal: '가짜 상자를 찾아 그 번호를 오른쪽 통 뚜껑에 적어라.' }],
        else: [{ say: TOO_SMALL }] }
    ] };
  }

  window.LIAR_SCENE = window.LIAR_SCENE || {};
  window.LIAR_SCENE.room3 = {
    roomId: 'room3',
    place: '부두 창고',
    placeSub: '새벽 전 부두',
    image: 'assets/room3_warehouse.jpg',
    goal: '선반 위 화물 상자를 살펴라.',
    intro: {
      title: '동이 트기 전,\n부두에 닿았다.',
      lines: ['등대를 나서자 짙은 새벽 안개가 부두를 덮고 있었다.', '끝에 낡은 창고 하나가 서 있다.', '문틈으로 상자 다섯 개가 보인다.'],
      button: '창고로 들어간다',
      then: [{ say: '축축한 나무 냄새가 난다. 선반마다 화물 상자가 놓여 있다.' }]
    },
    items: {
      magnifier: { icon: '🔍', name: '돋보기', img: 'assets/item_magnifier.jpg', desc: '황동 테를 두른 돋보기이다. 작은 글씨를 크게 볼 수 있다.' }
    },
    hotspots: [
      { id: 'chest', rect: [0, 480, 275, 190], do: [{ container: {
        title: '낡은 함 안', image: 'assets/inside_chest.jpg', item: 'magnifier', openText: '녹슨 걸쇠가 풀리며 함이 열렸다.',
        hint: '바닥에 무언가 놓여 있다. 눌러서 집어 보자.', emptyText: '함은 비어 있다.',
        then: [{ goal: '라벨의 작은 글씨를 읽을 방법을 써 보자.' }]
      } }] },
      { id: 'nets', rect: [400, 80, 760, 360], do: [{ say: '바닷바람에 낡은 그물이 걸려 있다. 아무도 만지지 않은 지 오래된 듯하다.' }] },
      { id: 'window', rect: [545, 0, 850, 150], do: [{ say: '창밖은 아직 어둡고, 유리에 물방울이 맺혀 있다.' }] },
      { id: 'trap', rect: [0, 680, 270, 261], do: [{ say: '통발이 바닥에 놓여 있다. 안은 비어 있다.' }] },
      crate(1, [292, 458, 210, 200]),
      crate(2, [513, 415, 205, 240]),
      crate(3, [745, 475, 215, 182]),
      crate(4, [980, 440, 210, 215]),
      crate(5, [1198, 415, 262, 240]),
      { id: 'barrel', rect: [1500, 420, 172, 310], do: [
        { say: '등불이 얹힌 통이다. 통 뚜껑에 분필로 답을 적어 둘 수 있다.' }, { answer: true }
      ] }
    ],
    answer: {
      title: '통 뚜껑의 분필',
      text: '검증 규칙을 통과하지 못하는 상자의 번호를 적는다.',
      maxLength: 1, inputMode: 'numeric', submitText: '적는다',
      correctText: '맞았다. 창고 안쪽 문이 열렸다.', wrongText: '아니다. 다시 계산해 보자.', emptyText: '먼저 번호를 적는다.'
    },
    hintSpot: 'crate1',
    onSolved: [
      { goal: '창고 안쪽 문이 열렸다. 금고로 가자.' },
      { story: { title: '안쪽 문이 열렸다.', lines: ['창고 깊은 곳에서 낮은 소리가 울린다.', '금고가 있는 곳으로 길이 열렸다.', '방금 맞힌 수를 적어 두자. 금고 앞에서 다시 쓰게 된다.'], button: '금고로 간다', next: 'vault' } }
    ],
    onSolvedGo: 'vault',
    solvedIdle: '창고 안쪽 문이 열려 있다. 금고로 가자.'
  };
})();
