// 화면 문구. 기준은 docs/copy.md다. 화면 코드에 문구를 직접 쓰지 않고 여기서 가져온다.
// 재료 이름 뒤에 받침에 따라 달라지는 조사를 붙이지 않는다. 양념 검색 안내만 예외다.
import { topicParticle } from '@/shared/lib/korean';

const joinWithTopic = (names: string[]) => `${names.join(', ')}${topicParticle(names[names.length - 1])}`;

export const copy = {
  service: {
    name: '탈탈'
  },

  // 브라우저 탭의 제목. 서비스 이름은 루트 레이아웃의 title.template이 붙인다
  pageTitle: {
    intro: '서비스 소개',
    ingredients: '재료와 양 넣기',
    results: '추천 결과'
  },

  intro: {
    title: '이 재료들을\n어떻게 다 먹지?',
    description: '산 재료를 탈탈 털어 나눠 쓰는 요리를 알려 드려요.',
    // 소개의 세 미리 보기가 이어 쓰는 가상 예시. 첫 재료(두부)를 요리 세 가지에 나눠 쓴다
    exampleIngredients: [
      { name: '두부', amount: '300g' },
      { name: '대파', amount: '1단' },
      { name: '계란', amount: '5개' }
    ],
    exampleMeals: [
      { name: '두부조림', amount: '150g' },
      { name: '두부찌개', amount: '100g' },
      { name: '두부전', amount: '30g' }
    ],
    exampleLeftover: '20g 남아요',
    start: '내 재료로 시작하기',
    steps: ['가진 재료와 양을 넣어요.', '재료를 나눠 쓸 요리를 확인해요.', '어디에 얼마나 쓰고 남는지 봐요.'],
    carouselLabel: '서비스 소개'
  },

  home: {
    title: '냉장고에\n뭐가 있나요?',
    guide: '가진 재료부터 담아 주세요.',
    pickDirectly: '직접 고르기',
    sampleTitle: '이렇게 나눠 쓸 수 있어요',
    sampleCarouselLabel: '예시 요리 묶음',
    // 재료 이름을 쉼표로 이은 문자열을 받는다
    toBuy: (ingredients: string) => `따로 사요: ${ingredients}`
  },

  ingredientSheet: {
    title: '재료 고르기',
    searchPlaceholder: '산 재료를 찾아보세요',
    alreadyAdded: '담김',
    add: (count: number) => `${count}개 담기`,
    addDisabledReason: '재료를 고르면 담을 수 있어요.',
    // 따옴표가 있어 조사를 "는"으로 고정한다
    noResult: (query: string) => `"${query}"는 목록에 없어요. 다른 이름으로 찾아보세요.`,
    clearSearch: '검색어 지우기',
    // 양념 이름은 표준명이고 여럿이면 쉼표로 잇는다. 은/는은 마지막 이름의 받침에 맞춘다
    basicSeasoning: (names: string[]) =>
      `${joinWithTopic(names)} 기본 양념이라 넣지 않아도 돼요. 있다고 보고 계산해요.`,
    specialSeasoning: (names: string[]) =>
      `${joinWithTopic(names)} 양념이라 넣지 않아도 돼요. 요리에 필요하면 ‘필요한 양념’으로 알려 드려요.`
  },

  ingredients: {
    title: '재료와 양을 알려 주세요',
    emptyTitle: '아직 고른 재료가 없어요',
    emptyDescription: '장 본 재료를 고르면 나눠 쓸 요리를 찾아 드려요.',
    addIngredient: '재료 추가',
    amountTitle: '얼마나 가지고 있나요?',
    amountUnset: '양 고르기',
    customAmount: '직접 입력',
    customAmountSave: '이 양으로 정하기',
    unit: '단위',
    remove: '재료 삭제',
    amountError: '0보다 크고 100,000 이하인 숫자로 넣어 주세요.',
    pantryGuide: '기본 양념은 직접 입력하지 않아도 돼요.',
    pantryExpand: (count: number) => `${count}개 보기`,
    pantryCollapse: '목록 접기',
    servings: '한 번에 몇 인분씩 만들까요?',
    servingsOption: (servings: number) => `${servings}인분`,
    findMeals: '요리 찾기',
    findMealsDisabledReason: '재료를 담으면 요리를 찾을 수 있어요.',
    setRemainingAmounts: (count: number) => `남은 ${count}개 양 정하기`
  },

  loading: {
    announcement: '나눠 쓸 요리를 찾고 있어요',
    phrases: ['나눠 쓸 요리를 찾고 있어요', '빨리 상하는 재료부터 살펴보고 있어요', '남는 양을 세고 있어요'],
    ingredientPhrase: (ingredient: string) => `${ingredient} 쓸 곳을 찾고 있어요`
  },

  results: {
    title: '이렇게 나눠 쓰면 이만큼 남아요',
    titleAllUsed: '가진 재료를 다 써요',
    titleWithPurchase: '조금 사면 이렇게 나눠 쓸 수 있어요',
    // 조건 칩. 재료는 앞의 두 개만 쓰고 나머지는 개수로 줄인다
    condition: (names: string[], servings: number) => {
      const shown = names.slice(0, 2).join(' · ');
      const rest = names.length - 2;
      return `${rest > 0 ? `${shown} 외 ${rest}개` : shown} · ${servings}인분`;
    },
    conditionLabel: (condition: string) => `재료 수정: ${condition}`,
    dishCountLabel: '몇 가지 요리를 만들까요?',
    dishCountTab: (count: number) => `${count}가지`,
    // 요약은 라벨 태그와 개수를 나눠 그린다. 이어 읽으면 "다 써요 1개"다
    summaryUsedUpLabel: '다 써요',
    summaryLeftoverLabel: '남아요',
    summaryCount: (count: number) => `${count}개`,
    summaryNoLeftover: '남는 재료 없음',
    openUsage: '재료별 사용량 보기',
    estimateNotice: '양은 일반적인 무게로 계산해서 실제와 조금 다를 수 있어요.'
  },

  mealCard: {
    order: (order: number) => `${order}번째 요리`,
    // urgency가 "빨리 상함"일 때만 보여 준다. 재료가 여럿이면 쉼표로 이은 문자열을 넘긴다
    orderReason: (ingredients: string) => `빨리 상하는 ${ingredients}부터 써요`,
    // 레시피의 cookingTime이 "20분"처럼 오므로 앞에 붙인다
    cookingTime: (time: string) => `조리 ${time}`,
    // 재료와 양을 "청고추 2개 (20g)"처럼 쓰고, 여럿이면 쉼표로 이은 문자열을 넘긴다
    toBuy: (ingredients: string) => `따로 사야 해요: ${ingredients}`,
    // 이름만 굵게 그리고 뒤에 ": 재료"를 잇는다
    optionalLabel: '있으면 좋음',
    specialSeasoningLabel: '필요한 양념'
  },

  purchaseMode: {
    suggestTitle: '조금 사서 더 써 볼까요?',
    suggestButton: '조금 사는 요리 보기',
    backToNoPurchase: '사지 않는 요리 보기',
    noPurchaseUnavailable: '가진 재료만으로는 나눠 쓸 요리를 찾지 못해서 조금 사서 만드는 요리를 보여 드려요.'
  },

  recovery: {
    emptyTitle: '나눠 쓸 요리를 찾지 못했어요',
    emptyDescription: '재료를 더 넣거나 양을 늘려 보세요. 넣은 재료는 그대로 있어요.',
    emptyAction: '재료 수정하기',
    errorTitle: '요리를 불러오지 못했어요',
    errorDescription: '넣은 재료는 그대로 있어요.',
    errorRetry: '다시 찾기',
    errorEdit: '재료 수정하기'
  },

  usageSheet: {
    title: '재료별 사용량',
    description: '막대는 가진 양 중 쓰는 양이에요. 재료를 펼치면 요리별로 볼 수 있어요.',
    leftover: (amount: string) => `${amount} 남아요`,
    usedUp: '다 써요',
    roundingNotice: '표시는 반올림한 값이라 합이 다를 수 있어요.'
  },

  recipeSheet: {
    ingredientsTitle: '이 요리에 쓰는 재료',
    ownedTitle: '가진 재료',
    toBuyTitle: '따로 사야 해요',
    // 따로 사야 해요 무리 안에서 고명 이름 옆에 붙인다
    optional: '있으면 좋음',
    seasoningsTitle: '양념',
    // 양념 소제목 뒤에 " · "로 붙인다. 양념은 g이 없어 인분에 맞춰 바꾸지 못한다
    seasoningsBasis: (servings: number) => `원문 ${servings}인분 기준`,
    originalAmounts: '원문 분량 보기',
    originalServings: (servings: number) => `원문은 ${servings}인분 기준이에요.`,
    stepsTitle: '만드는 법',
    tip: '팁',
    loading: '레시피를 불러오고 있어요',
    error: '레시피를 불러오지 못했어요. 시트를 닫고 다시 열어 주세요.',
    saveImage: '이미지로 저장',
    savingImage: '이미지를 만들고 있어요',
    saveImageError: '이미지를 만들지 못했어요. 다시 눌러 주세요.',
    // 레시피 이미지 맺음에 쓴다
    recipeSource: '레시피 출처: 농림축산식품 공공데이터 포털'
  },

  // 아이콘만 있는 버튼의 이름. 화면 읽기 프로그램이 읽는다
  common: {
    back: '뒤로',
    closeSheet: '닫기',
    prev: '이전',
    next: '다음',
    goToSlide: (slide: number) => `${slide}번째 장으로 이동`,
    slideLabel: (current: number, total: number) => `${total}장 중 ${current}번째`
  }
} as const;
