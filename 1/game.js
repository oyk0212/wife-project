(() => {
  "use strict";

  // 게임 전체 밸런스를 한곳에서 조정할 수 있도록 구성값을 분리한다.
  const CONFIG = {
    totalRounds: 10,
    cardsPerRound: 12,
    minForbidden: 1,
    maxForbidden: 2,
    startTimeSec: 8,
    minTimeSec: 6,
    shortSentenceWordLimit: 2,
    shortSentencePenalty: 8,
    score: {
      surviveRound: 50,
      timeBonusPerSec: 12,
    },
    animations: {
      successMs: 450,
      failMs: 500,
      nextRoundDelayMs: 650,
    },
  };

  const QUESTIONS = [
    { text: "오늘 뭐 했어?", theme: "daily" },
    { text: "이거 누가 했어?", theme: "blame" },
    { text: "내가 말했지?", theme: "logic" },
    { text: "지금 나랑 말장난해?", theme: "logic" },
    { text: "방금 내 말 들었어?", theme: "listen" },
    { text: "왜 이렇게 조용해?", theme: "mood" },
    { text: "이 표정은 뭐야?", theme: "mood" },
    { text: "그 말 다시 해볼래?", theme: "logic" },
    { text: "그게 최선이야?", theme: "decision" },
    { text: "정말 그게 맞아?", theme: "logic" },
    { text: "왜 거기서 웃어?", theme: "mood" },
    { text: "회의는 잘 끝났어?", theme: "work" },
    { text: "지금 시간 몇 시야?", theme: "time" },
    { text: "약속 기억하고 있지?", theme: "promise" },
    { text: "내가 예민한 거야?", theme: "mood" },
    { text: "이 계획 누가 짠 거야?", theme: "plan" },
    { text: "그 말의 의도가 뭐야?", theme: "logic" },
    { text: "나한테 숨기는 거 있어?", theme: "trust" },
    { text: "방금 그 한숨 뭐야?", theme: "mood" },
    { text: "그건 칭찬이야 뭐야?", theme: "mood" },
    { text: "지금 변명 중이야?", theme: "blame" },
    { text: "오늘 일정 기억하지?", theme: "time" },
    { text: "내 문자는 왜 늦게 봤어?", theme: "time" },
    { text: "이거 누가 어질렀어?", theme: "blame" },
    { text: "방금 내 이름 불렀어?", theme: "listen" },
    { text: "이건 장난으로 보이니?", theme: "logic" },
    { text: "다음엔 어떻게 할 거야?", theme: "plan" },
    { text: "지금 상황 파악했어?", theme: "plan" },
    { text: "이거 설명 가능해?", theme: "blame" },
    { text: "내가 과한 부탁 했어?", theme: "promise" },
    { text: "그 말 진심이야?", theme: "trust" },
    { text: "지금 나 놀리는 중이야?", theme: "logic" },
    { text: "이거 해결책 있어?", theme: "plan" },
    { text: "그럼 지금 뭘 해야 해?", theme: "plan" },
    { text: "지금 표정 관리 가능해?", theme: "mood" },
    { text: "내일 일정 다시 말해줘", theme: "time" },
    { text: "내가 오해한 거야?", theme: "trust" },
    { text: "그 말은 취소할 수 있어?", theme: "logic" },
    { text: "이 장면 어떻게 수습할래?", theme: "plan" },
    { text: "왜 갑자기 딴청이야?", theme: "listen" },
    { text: "이 대화 어디로 가는 거야?", theme: "logic" },
    { text: "내 말 핵심만 말해봐", theme: "listen" },
    { text: "내가 방금 뭐라고 했지?", theme: "listen" },
    { text: "그 선택 후회 안 해?", theme: "decision" },
    { text: "지금 웃을 타이밍이야?", theme: "mood" },
    { text: "이거 진짜 마지막 기회야", theme: "promise" },
  ];

  const WORD_POOL = [
    { text: "일단", themes: ["plan", "logic", "daily"] },
    { text: "그게", themes: ["logic", "blame", "listen"] },
    { text: "사실", themes: ["logic", "trust", "mood"] },
    { text: "조금", themes: ["mood", "daily"] },
    { text: "내일", themes: ["time", "plan"] },
    { text: "지금", themes: ["time", "mood", "listen"] },
    { text: "잠깐만", themes: ["mood", "logic"] },
    { text: "알겠어", themes: ["promise", "listen"] },
    { text: "미안해", themes: ["mood", "promise", "trust"] },
    { text: "먼저", themes: ["plan", "time"] },
    { text: "정리하면", themes: ["logic", "plan"] },
    { text: "천천히", themes: ["mood", "plan"] },
    { text: "분명히", themes: ["logic", "trust"] },
    { text: "확실히", themes: ["logic", "decision"] },
    { text: "의도는", themes: ["logic", "trust"] },
    { text: "없었어", themes: ["blame", "trust"] },
    { text: "오해", themes: ["trust", "logic"] },
    { text: "아니고", themes: ["logic", "blame"] },
    { text: "설명", themes: ["blame", "plan", "logic"] },
    { text: "가능해", themes: ["blame", "plan"] },
    { text: "바로", themes: ["time", "plan"] },
    { text: "수정할게", themes: ["plan", "promise"] },
    { text: "다음엔", themes: ["promise", "plan"] },
    { text: "주의할게", themes: ["promise", "plan"] },
    { text: "기억할게", themes: ["promise", "time"] },
    { text: "메모했어", themes: ["time", "plan", "work"] },
    { text: "일정", themes: ["time", "work", "plan"] },
    { text: "확인했어", themes: ["time", "listen", "work"] },
    { text: "방금", themes: ["time", "listen"] },
    { text: "들은", themes: ["listen", "logic"] },
    { text: "내용은", themes: ["listen", "logic"] },
    { text: "이거야", themes: ["listen", "logic"] },
    { text: "요약하면", themes: ["listen", "logic"] },
    { text: "핵심은", themes: ["listen", "logic"] },
    { text: "맞아", themes: ["trust", "logic"] },
    { text: "맞고", themes: ["logic", "trust"] },
    { text: "다만", themes: ["logic", "plan"] },
    { text: "그래도", themes: ["mood", "logic"] },
    { text: "우선", themes: ["plan", "time"] },
    { text: "방법은", themes: ["plan"] },
    { text: "두", themes: ["plan"] },
    { text: "가지", themes: ["plan"] },
    { text: "있어", themes: ["plan", "logic"] },
    { text: "첫째", themes: ["plan"] },
    { text: "둘째", themes: ["plan"] },
    { text: "바꿀게", themes: ["plan", "promise"] },
    { text: "고칠게", themes: ["plan", "promise"] },
    { text: "재발", themes: ["promise", "plan"] },
    { text: "방지", themes: ["promise", "plan"] },
    { text: "약속", themes: ["promise", "trust"] },
    { text: "진심으로", themes: ["trust", "mood"] },
    { text: "이해해", themes: ["listen", "trust"] },
    { text: "공감해", themes: ["listen", "mood"] },
    { text: "그럴", themes: ["mood", "trust"] },
    { text: "수", themes: ["mood", "logic"] },
    { text: "있지", themes: ["mood", "logic"] },
    { text: "맞지", themes: ["trust", "logic"] },
    { text: "그렇네", themes: ["mood", "listen"] },
    { text: "납득해", themes: ["logic", "trust"] },
    { text: "확인", themes: ["work", "time", "plan"] },
    { text: "다시", themes: ["plan", "listen"] },
    { text: "볼게", themes: ["plan", "work"] },
    { text: "바로잡을게", themes: ["plan", "promise"] },
    { text: "고마워", themes: ["mood", "trust"] },
    { text: "말해줘서", themes: ["listen", "trust"] },
    { text: "도움", themes: ["work", "plan"] },
    { text: "됐어", themes: ["work", "mood"] },
    { text: "이번", themes: ["time", "plan"] },
    { text: "건", themes: ["blame", "logic"] },
    { text: "내", themes: ["blame", "trust"] },
    { text: "실수야", themes: ["blame", "trust"] },
    { text: "인정해", themes: ["trust", "blame"] },
    { text: "책임", themes: ["blame", "trust"] },
    { text: "질게", themes: ["blame", "promise"] },
    { text: "바로잡자", themes: ["plan", "promise"] },
    { text: "함께", themes: ["plan", "trust"] },
    { text: "해보자", themes: ["plan", "mood"] },
    { text: "괜찮아", themes: ["mood", "trust"] },
    { text: "진정하고", themes: ["mood"] },
    { text: "차분히", themes: ["mood", "plan"] },
    { text: "말할게", themes: ["mood", "listen"] },
    { text: "부탁해", themes: ["mood", "trust"] },
    { text: "한", themes: ["plan", "time"] },
    { text: "번", themes: ["plan", "time"] },
    { text: "더", themes: ["listen", "plan"] },
    { text: "기회", themes: ["promise", "trust"] },
    { text: "줘", themes: ["mood", "trust"] },
    { text: "다음", themes: ["time", "plan"] },
    { text: "회의", themes: ["work"] },
    { text: "전에", themes: ["time", "work"] },
    { text: "준비", themes: ["work", "plan"] },
    { text: "완료", themes: ["work", "plan"] },
    { text: "하겠어", themes: ["promise", "work"] },
    { text: "체크", themes: ["work", "plan"] },
    { text: "리스트", themes: ["work", "plan"] },
    { text: "만들었어", themes: ["work", "plan"] },
    { text: "진행", themes: ["work", "plan"] },
    { text: "상황", themes: ["work", "plan"] },
    { text: "공유할게", themes: ["work", "promise"] },
    { text: "끝나고", themes: ["time", "work"] },
    { text: "바로", themes: ["time", "plan"] },
    { text: "연락할게", themes: ["promise", "time"] },
    { text: "잠시", themes: ["time", "mood"] },
    { text: "생각", themes: ["logic", "plan"] },
    { text: "정돈", themes: ["plan", "mood"] },
    { text: "하고", themes: ["plan", "logic"] },
    { text: "대답", themes: ["listen", "logic"] },
    { text: "할게", themes: ["promise", "listen"] },
    { text: "좋아", themes: ["mood", "trust"] },
    { text: "좋은", themes: ["mood", "work"] },
    { text: "포인트", themes: ["work", "listen"] },
    { text: "짚었어", themes: ["listen", "work"] },
    { text: "동의해", themes: ["trust", "logic"] },
    { text: "반영할게", themes: ["work", "plan"] },
    { text: "당장", themes: ["time", "plan"] },
    { text: "수습", themes: ["plan", "blame"] },
    { text: "시작", themes: ["plan", "time"] },
    { text: "하자", themes: ["plan", "mood"] },
    { text: "차라리", themes: ["mood", "logic"] },
    { text: "유머로", themes: ["mood"] },
    { text: "풀면", themes: ["mood", "plan"] },
    { text: "어때", themes: ["mood", "logic"] },
    { text: "오늘은", themes: ["daily", "time"] },
    { text: "컨디션", themes: ["daily", "mood"] },
    { text: "난조", themes: ["daily", "mood"] },
    { text: "였어", themes: ["daily", "mood"] },
    { text: "그래서", themes: ["logic", "blame"], risk: true },
    { text: "근데", themes: ["logic", "blame"], risk: true },
    { text: "아니", themes: ["logic", "mood"], risk: true },
    { text: "내가?", themes: ["blame", "logic"], risk: true },
    { text: "몰라", themes: ["blame", "mood"], risk: true },
    { text: "왜?", themes: ["blame", "logic"], risk: true },
    { text: "진짜?", themes: ["logic", "mood"], risk: true },
    { text: "설마", themes: ["logic", "mood"], risk: true },
    { text: "억울해", themes: ["blame", "mood"], risk: true },
    { text: "됐어", themes: ["mood", "blame"], risk: true },
    { text: "됐고", themes: ["blame", "logic"], risk: true },
    { text: "에이", themes: ["mood"], risk: true },
    { text: "글쎄", themes: ["logic", "blame"], risk: true },
    { text: "음...", themes: ["mood"], risk: true },
    { text: "그냥", themes: ["blame", "logic"], risk: true },
    { text: "됐네", themes: ["mood"], risk: true },
    { text: "뭐", themes: ["logic", "blame"], risk: true },
    { text: "그러게", themes: ["blame", "mood"], risk: true },
    { text: "됐잖아", themes: ["blame", "logic"], risk: true },
    { text: "아무튼", themes: ["logic", "blame"], risk: true },
  ];

  // 금지어 풀은 카드 텍스트와 일부 겹치도록 구성해 긴장감을 만든다.
  const FORBIDDEN_POOL = [
    { text: "근데", weight: 4 },
    { text: "아니", weight: 5 },
    { text: "내가?", weight: 4 },
    { text: "그래서", weight: 4 },
    { text: "몰라", weight: 4 },
    { text: "왜?", weight: 4 },
    { text: "진짜?", weight: 3 },
    { text: "설마", weight: 3 },
    { text: "억울해", weight: 3 },
    { text: "됐어", weight: 4 },
    { text: "됐고", weight: 4 },
    { text: "그냥", weight: 4 },
    { text: "뭐", weight: 3 },
    { text: "아무튼", weight: 3 },
    { text: "잠깐", weight: 2 },
    { text: "장난", weight: 2 },
    { text: "농담", weight: 2 },
    { text: "나중에", weight: 2 },
    { text: "귀찮아", weight: 2 },
    { text: "싫어", weight: 2 },
    { text: "됐네", weight: 3 },
    { text: "대충", weight: 2 },
    { text: "아마", weight: 2 },
    { text: "글쎄", weight: 2 },
    { text: "왜냐면", weight: 2 },
    { text: "헷갈려", weight: 2 },
    { text: "무조건", weight: 2 },
    { text: "절대", weight: 2 },
    { text: "보통", weight: 1 },
    { text: "그렇지", weight: 1 },
    { text: "그러게", weight: 3 },
    { text: "됐잖아", weight: 3 },
    { text: "음...", weight: 2 },
    { text: "에이", weight: 2 },
    { text: "됐다", weight: 2 },
    { text: "몰랐어", weight: 1 },
  ];

  const app = document.getElementById("app");
  const roundText = document.getElementById("roundText");
  const timerText = document.getElementById("timerText");
  const scoreText = document.getElementById("scoreText");
  const questionText = document.getElementById("questionText");
  const forbiddenWrap = document.getElementById("forbiddenWrap");
  const sentencePreview = document.getElementById("sentencePreview");
  const cardsGrid = document.getElementById("cardsGrid");

  const undoBtn = document.getElementById("undoBtn");
  const submitBtn = document.getElementById("submitBtn");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const copyBtn = document.getElementById("copyBtn");

  const startOverlay = document.getElementById("startOverlay");
  const resultOverlay = document.getElementById("resultOverlay");
  const resultTitle = document.getElementById("resultTitle");
  const resultSubtitle = document.getElementById("resultSubtitle");
  const resultFlavor = document.getElementById("resultFlavor");
  const toast = document.getElementById("toast");

  const state = {
    playing: false,
    round: 0,
    score: 0,
    timeLimit: CONFIG.startTimeSec,
    timeLeft: CONFIG.startTimeSec,
    currentQuestion: null,
    currentForbidden: [],
    currentCards: [],
    selectedWords: [],
    usedQuestionIndexes: new Set(),
    rafId: null,
    roundStartAt: 0,
    lastResultText: "",
  };

  function randInt(max) {
    return Math.floor(Math.random() * max);
  }

  function shuffle(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = randInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 900);
  }

  function computeRoundTimeLimit(roundNumber) {
    // 1~10 라운드에서 8초 -> 6초로 선형 감소
    const progress = (roundNumber - 1) / Math.max(1, CONFIG.totalRounds - 1);
    return CONFIG.startTimeSec - (CONFIG.startTimeSec - CONFIG.minTimeSec) * progress;
  }

  function weightedPick(items, weightKey, excludedTexts) {
    const filtered = items.filter((item) => !excludedTexts.has(item.text));
    const total = filtered.reduce((sum, item) => sum + item[weightKey], 0);
    let cursor = Math.random() * total;
    for (const item of filtered) {
      cursor -= item[weightKey];
      if (cursor <= 0) return item;
    }
    return filtered[filtered.length - 1];
  }

  function pickQuestion() {
    if (state.usedQuestionIndexes.size >= QUESTIONS.length) {
      state.usedQuestionIndexes.clear();
    }

    let index = randInt(QUESTIONS.length);
    while (state.usedQuestionIndexes.has(index)) {
      index = randInt(QUESTIONS.length);
    }
    state.usedQuestionIndexes.add(index);
    return QUESTIONS[index];
  }

  function pickForbiddenWords(roundNumber) {
    const result = [];
    const excluded = new Set();

    let count = CONFIG.minForbidden;
    if (roundNumber >= 4 && Math.random() < 0.55) count = 2;
    if (roundNumber >= 8) count = CONFIG.maxForbidden;

    for (let i = 0; i < count; i += 1) {
      const picked = weightedPick(FORBIDDEN_POOL, "weight", excluded);
      result.push(picked.text);
      excluded.add(picked.text);
    }
    return result;
  }

  function pickWordCards(theme) {
    const unique = new Set();
    const cards = [];

    // 질문 테마와 맞는 단어를 우선 섞고, 부족하면 전체 풀에서 채운다.
    const preferred = shuffle(WORD_POOL.filter((w) => w.themes.includes(theme)));
    const fallback = shuffle(WORD_POOL.filter((w) => !w.themes.includes(theme)));
    const combined = [...preferred, ...fallback];

    for (const word of combined) {
      if (cards.length >= CONFIG.cardsPerRound) break;
      if (unique.has(word.text)) continue;
      unique.add(word.text);
      cards.push(word);
    }

    return cards;
  }

  function renderHud() {
    roundText.textContent = `${state.round}/${CONFIG.totalRounds}`;
    timerText.textContent = `${state.timeLeft.toFixed(1)}s`;
    scoreText.textContent = `${Math.max(0, Math.floor(state.score))}`;
  }

  function renderForbidden() {
    forbiddenWrap.innerHTML = "";
    state.currentForbidden.forEach((word) => {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = `금지어: ${word}`;
      forbiddenWrap.appendChild(badge);
    });
  }

  function renderSentence() {
    sentencePreview.textContent =
      state.selectedWords.length > 0
        ? state.selectedWords.join(" ")
        : "(카드를 눌러 문장을 만드세요)";
  }

  function renderCards() {
    cardsGrid.innerHTML = "";

    state.currentCards.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `word-card${card.risk ? " risk" : ""}`;
      button.textContent = card.text;
      button.dataset.index = String(index);

      button.addEventListener("click", () => {
        if (!state.playing) return;
        state.selectedWords.push(card.text);
        renderSentence();
      });

      cardsGrid.appendChild(button);
    });
  }

  function beginRound() {
    state.round += 1;
    state.currentQuestion = pickQuestion();
    state.currentForbidden = pickForbiddenWords(state.round);
    state.currentCards = pickWordCards(state.currentQuestion.theme);
    state.selectedWords = [];

    state.timeLimit = computeRoundTimeLimit(state.round);
    state.timeLeft = state.timeLimit;
    state.roundStartAt = performance.now();

    questionText.textContent = state.currentQuestion.text;
    renderForbidden();
    renderCards();
    renderSentence();
    renderHud();
  }

  function animateSuccess() {
    app.classList.remove("shake");
    app.classList.add("relief");
    setTimeout(() => app.classList.remove("relief"), CONFIG.animations.successMs);
  }

  function animateFail() {
    app.classList.remove("relief");
    app.classList.add("shake");
    setTimeout(() => app.classList.remove("shake"), CONFIG.animations.failMs);
  }

  function calcSlipIndex(score, survivedRounds) {
    // 점수가 높을수록 말실수 지수는 낮게 나오도록 반전 계산
    const base = 100 - Math.min(95, Math.floor(score / 8 + survivedRounds * 2));
    return Math.max(5, base + randInt(8));
  }

  function finishGame(type, reason, titleOverride = "") {
    state.playing = false;
    cancelAnimationFrame(state.rafId);

    const survived = type === "win" ? CONFIG.totalRounds : state.round - 1;
    const slipIndex = calcSlipIndex(state.score, survived);
    const ending = type === "win" ? "평화 엔딩" : "대폭발 엔딩";
    const randomEnding = ending;

    resultTitle.textContent =
      titleOverride || (type === "win" ? "WIN: 평화 엔딩 달성" : "GAME OVER");

    resultSubtitle.textContent =
      type === "win"
        ? `10라운드 생존 성공! 최종 점수 ${Math.floor(state.score)}점`
        : `${reason} (라운드 ${state.round})`;

    resultFlavor.textContent = `오늘의 말실수 지수: ${slipIndex} / ${randomEnding}`;

    state.lastResultText = [
      "[금지어 회피: 말실수 로그라이크 결과]",
      `${resultTitle.textContent}`,
      `${resultSubtitle.textContent}`,
      `${resultFlavor.textContent}`,
      `최종 점수: ${Math.floor(state.score)}`,
    ].join("\n");

    resultOverlay.classList.add("show");
    animateFail();
  }

  function checkForbidden(sentence) {
    return state.currentForbidden.find((word) => sentence.includes(word)) || null;
  }

  function submitSentenceByUser() {
    if (!state.playing) return;

    const sentence = state.selectedWords.join(" ").trim();
    if (!sentence) {
      showToast("문장을 먼저 만들어주세요.");
      return;
    }

    const hitWord = checkForbidden(sentence);
    if (hitWord) {
      finishGame("lose", `금지어 사용: "${hitWord}"`, "GAME OVER: 금지어 사용");
      return;
    }

    const roundTimeBonus = Math.floor(state.timeLeft * CONFIG.score.timeBonusPerSec);
    state.score += CONFIG.score.surviveRound + roundTimeBonus;

    const wordCount = sentence.split(/\s+/).filter(Boolean).length;
    if (wordCount <= CONFIG.shortSentenceWordLimit) {
      state.score -= CONFIG.shortSentencePenalty;
      showToast(`무성의 패널티 -${CONFIG.shortSentencePenalty}`);
    }

    renderHud();
    animateSuccess();

    if (state.round >= CONFIG.totalRounds) {
      state.playing = false;
      cancelAnimationFrame(state.rafId);
      resultOverlay.classList.add("show");

      const slipIndex = calcSlipIndex(state.score, CONFIG.totalRounds);
      resultTitle.textContent = "WIN: 평화 엔딩 달성";
      resultSubtitle.textContent = `10라운드 생존 성공! 최종 점수 ${Math.floor(state.score)}점`;
      resultFlavor.textContent = `오늘의 말실수 지수: ${slipIndex} / 평화 엔딩`;

      state.lastResultText = [
        "[금지어 회피: 말실수 로그라이크 결과]",
        `${resultTitle.textContent}`,
        `${resultSubtitle.textContent}`,
        `${resultFlavor.textContent}`,
        `최종 점수: ${Math.floor(state.score)}`,
      ].join("\n");
      return;
    }

    state.playing = false;
    setTimeout(() => {
      if (!resultOverlay.classList.contains("show")) {
        state.playing = true;
        beginRound();
        tick(performance.now());
      }
    }, CONFIG.animations.nextRoundDelayMs);
  }

  function tick(now) {
    if (!state.playing) return;

    const elapsed = (now - state.roundStartAt) / 1000;
    state.timeLeft = Math.max(0, state.timeLimit - elapsed);
    renderHud();

    if (state.timeLeft <= 0) {
      finishGame("lose", "시간 초과", "GAME OVER: 시간 초과");
      return;
    }

    state.rafId = requestAnimationFrame(tick);
  }

  function startGame() {
    state.playing = true;
    state.round = 0;
    state.score = 0;
    state.usedQuestionIndexes.clear();
    resultOverlay.classList.remove("show");
    startOverlay.classList.remove("show");

    beginRound();
    cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(tick);
  }

  async function copyResult() {
    if (!state.lastResultText) {
      showToast("복사할 결과가 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(state.lastResultText);
      showToast("결과를 복사했습니다.");
    } catch (err) {
      showToast("클립보드 복사에 실패했습니다.");
    }
  }

  undoBtn.addEventListener("click", () => {
    if (!state.playing) return;
    state.selectedWords.pop();
    renderSentence();
  });

  submitBtn.addEventListener("click", submitSentenceByUser);
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);
  copyBtn.addEventListener("click", copyResult);

  // 엔터/스페이스로 카드와 버튼 조작이 가능한 기본 접근성은 브라우저 기본 동작을 사용한다.
  renderHud();
})();
