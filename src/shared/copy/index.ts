// 화면 문구. 기준은 docs/copy.md다. 화면 코드에 문구를 직접 쓰지 않고 여기서 가져온다.
// 재료 이름 뒤에 받침에 따라 달라지는 조사를 붙이지 않는다.

export const copy = {
  service: {
    name: '탈탈'
  },

  intro: {
    title: '이 재료들을\n어떻게 다 먹지?',
    description: '산 재료를 나눠 쓰는 요리 3~5가지를 알려 드려요.',
    exampleLabel: '가상 예시',
    exampleIngredient: '두부 300g',
    exampleMeals: '두부조림 150g · 두부찌개 100g · 두부전 30g',
    exampleLeftover: '20g 남아요',
    start: '내 재료로 시작하기',
    steps: ['가진 재료와 양을 넣어요.', '재료를 나눠 쓸 요리를 확인해요.', '어디에 얼마나 쓰고 남는지 봐요.'],
    stepLabel: (step: number) => `${step}단계`,
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
    clearSearch: '검색어 지우기'
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
    servings: (servings: number) => `각 요리 ${servings}인분 기준`,
    dishCountLabel: '몇 가지 요리를 만들까요?',
    dishCountTab: (count: number) => `${count}가지`,
    summaryUsedUp: (count: number) => `다 써요 ${count}개`,
    summaryLeftover: (count: number) => `남아요 ${count}개`,
    summaryNoLeftover: '남는 재료 없음',
    openUsage: '재료별 사용량 보기',
    estimateNotice: '양은 일반적인 무게로 계산해서 실제와 조금 다를 수 있어요.',
    editIngredients: '재료 수정'
  },

  mealCard: {
    order: (order: number) => `${order}번째 요리`,
    // urgency가 "빨리 상함"일 때만 보여 준다. 재료가 여럿이면 쉼표로 이은 문자열을 넘긴다
    orderReason: (ingredients: string) => `빨리 상하는 ${ingredients}부터 써요`,
    // 레시피의 cookingTime이 "20분"처럼 오므로 앞에 붙인다
    cookingTime: (time: string) => `조리 ${time}`,
    // 재료와 양을 "청고추 2개 (20g)"처럼 쓰고, 여럿이면 쉼표로 이은 문자열을 넘긴다
    toBuy: (ingredients: string) => `따로 사야 해요: ${ingredients}`,
    optional: (ingredients: string) => `있으면 좋음: ${ingredients}`,
    specialSeasoning: (seasonings: string) => `필요한 양념: ${seasonings}`
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
    originalAmounts: '원문 분량 보기',
    originalServings: (servings: number) => `원문은 ${servings}인분 기준이에요.`,
    stepsTitle: '만드는 법',
    tip: '팁',
    loading: '레시피를 불러오고 있어요',
    error: '레시피를 불러오지 못했어요. 시트를 닫고 다시 열어 주세요.'
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
