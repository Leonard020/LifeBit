// 등급별 색상/한글명 매핑 (백엔드와 100% 일치)
export const RANKING_TIER_META = {
  UNRANK:      { color: "#bdbdbd", name: "언랭크", desc: "아직 랭킹 기록이 없습니다.", reward: "참여상" },
  BRONZE:      { color: "#cd7f32", name: "브론즈", desc: "기본 활동 등급", reward: "기본 뱃지" },
  SILVER:      { color: "#c0c0c0", name: "실버", desc: "꾸준한 활동 등급", reward: "실버 뱃지" },
  GOLD:        { color: "#ffd700", name: "골드", desc: "상위 30% 등급", reward: "골드 뱃지" },
  PLATINUM:    { color: "#e5e4e2", name: "플래티넘", desc: "상위 15% 등급", reward: "플래티넘 뱃지" },
  DIAMOND:     { color: "#00bfff", name: "다이아", desc: "상위 7% 등급", reward: "다이아 뱃지" },
  MASTER:      { color: "#a020f0", name: "마스터", desc: "상위 3% 등급", reward: "마스터 뱃지" },
  GRANDMASTER: { color: "#ff4500", name: "그랜드마스터", desc: "상위 1% 등급", reward: "그랜드마스터 뱃지" },
  CHALLENGER:  { color: "#ff1493", name: "챌린저", desc: "최상위 0.1% 등급", reward: "챌린저 뱃지" },
} as const;

export function getTierMeta(tier: string) {
  return RANKING_TIER_META[tier as keyof typeof RANKING_TIER_META] || RANKING_TIER_META.UNRANK;
} 