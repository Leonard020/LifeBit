// 🛠️ 로컬 개발 환경용 env.js
// Docker 환경과 동일한 형태로 window 객체에 환경변수 설정

// 로컬 개발 환경 기본값
window.__VITE_CORE_API_URL__ = "http://localhost:8080";
window.__VITE_AI_API_URL__ = "http://localhost:8001";
window.__VITE_GOOGLE_CLIENT_ID__ = "";
window.__VITE_KAKAO_CLIENT_ID__ = "";

console.log("🛠️ [로컬 개발] env.js 로드됨 - API URLs:", {
  CORE_API: window.__VITE_CORE_API_URL__,
  AI_API: window.__VITE_AI_API_URL__
}); 