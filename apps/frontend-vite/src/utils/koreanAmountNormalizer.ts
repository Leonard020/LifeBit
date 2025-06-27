export function normalizeKoreanAmount(amount: string): string {
  const synonyms = [
    { from: '뚝배기', to: '그릇' }, { from: '1뚝배기', to: '1그릇' },
    { from: '한 사발', to: '한 그릇' }, { from: '1사발', to: '1그릇' },
    { from: '한토막', to: '한 조각' }, { from: '1토막', to: '1조각' },
    { from: '한덩이', to: '한 개' }, { from: '1덩이', to: '1개' },
    { from: '한줌', to: '한 개' }, { from: '1줌', to: '1개' },
    { from: '한사발', to: '한 그릇' }, { from: '한모', to: '한 개' }, { from: '1모', to: '1개' },
    { from: '한장', to: '한 개' }, { from: '1장', to: '1개' },
    { from: '한조각', to: '한 조각' }, { from: '1조각', to: '1조각' },
    { from: '한입', to: '한 개' }, { from: '1입', to: '1개' },
    { from: '한 알', to: '한 개' }, { from: '1알', to: '1개' },
    { from: '한 봉지', to: '한 개' }, { from: '1봉지', to: '1개' },
    { from: '한 캔', to: '한 개' }, { from: '1캔', to: '1개' },
    { from: '한 병', to: '한 개' }, { from: '1병', to: '1개' },
    { from: '한 컵', to: '한 컵' }, { from: '1컵', to: '1컵' },
    { from: '한 잔', to: '한 컵' }, { from: '1잔', to: '1컵' },
    { from: '한 판', to: '한 개' }, { from: '1판', to: '1개' },
    { from: '한 줄', to: '한 개' }, { from: '1줄', to: '1개' },
    { from: '한 쪽', to: '한 조각' }, { from: '1쪽', to: '1조각' },
    { from: '한 스푼', to: '한 큰술' }, { from: '1스푼', to: '1큰술' },
    { from: '한 숟가락', to: '한 큰술' }, { from: '1숟가락', to: '1큰술' },
    { from: '한 작은술', to: '한 작은술' }, { from: '1작은술', to: '1작은술' },
    { from: '한 그릇', to: '한 그릇' }, { from: '1그릇', to: '1그릇' },
    { from: '한 공기', to: '한 그릇' }, { from: '1공기', to: '1그릇' },
    { from: '한 개', to: '한 개' }, { from: '1개', to: '1개' }
  ];
  let normalized = amount;
  synonyms.forEach(({ from, to }) => {
    normalized = normalized.replace(new RegExp(from, 'g'), to);
  });
  return normalized;
} 