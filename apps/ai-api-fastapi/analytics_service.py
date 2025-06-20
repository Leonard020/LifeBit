import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import requests
import json
from typing import Dict, List, Any, Optional
import base64
import io

class HealthAnalyticsService:
    """건강 데이터 분석 서비스"""
    
    def __init__(self):
        self.spring_boot_api_url = "http://localhost:8080/api"
        
    async def fetch_health_data(self, user_id: int, period: str = "month") -> Dict[str, Any]:
        """Spring Boot API에서 건강 데이터를 가져옵니다."""
        try:
            # 건강 기록 조회
            health_records_response = requests.get(
                f"{self.spring_boot_api_url}/health-records",
                params={"userId": user_id, "period": period}
            )
            
            # 운동 세션 조회
            exercise_sessions_response = requests.get(
                f"{self.spring_boot_api_url}/exercise-sessions",
                params={"userId": user_id, "period": period}
            )
            
            # 식단 로그 조회
            meal_logs_response = requests.get(
                f"{self.spring_boot_api_url}/meal-logs",
                params={"userId": user_id, "period": period}
            )
            
            return {
                "health_records": health_records_response.json() if health_records_response.status_code == 200 else [],
                "exercise_sessions": exercise_sessions_response.json() if exercise_sessions_response.status_code == 200 else [],
                "meal_logs": meal_logs_response.json() if meal_logs_response.status_code == 200 else []
            }
            
        except Exception as e:
            print(f"[ERROR] 데이터 조회 실패: {str(e)}")
            return {
                "health_records": [],
                "exercise_sessions": [],
                "meal_logs": []
            }
    
    def analyze_weight_trends(self, health_records: List[Dict]) -> Dict[str, Any]:
        """체중 변화 트렌드 분석"""
        if not health_records:
            return {
                "trend": "stable",
                "change": 0,
                "insights": ["데이터가 부족합니다."]
            }
        
        # 더미 분석 결과
        return {
            "trend": "stable",
            "change": -0.5,
            "insights": [
                "지난 한 달간 체중이 안정적으로 유지되고 있습니다.",
                "꾸준한 운동과 식단 관리가 효과적입니다."
            ]
        }
    
    def analyze_exercise_patterns(self, exercise_sessions: List[Dict], period: str = "month") -> Dict[str, Any]:
        """운동 패턴 분석 - period별 처리"""
        if not exercise_sessions:
            return {
                "total_sessions": 0,
                "avg_duration": 0,
                "total_minutes": 0,
                "calories_burned": 0,
                "period_label": self._get_period_label(period),
                "insights": ["운동 기록이 없습니다."]
            }
        
        # 실제 데이터 분석
        total_sessions = len(exercise_sessions)
        total_minutes = sum(session.get('duration_minutes', 0) for session in exercise_sessions)
        total_calories = sum(session.get('calories_burned', 0) for session in exercise_sessions)
        avg_duration = total_minutes / total_sessions if total_sessions > 0 else 0
        
        # period별 목표와 비교
        period_goals = self._get_period_goals(period)
        achievement_rate = (total_sessions / period_goals['sessions']) * 100 if period_goals['sessions'] > 0 else 0
        
        # 인사이트 생성
        insights = self._generate_exercise_insights(
            total_sessions, avg_duration, achievement_rate, period
        )
        
        return {
            "total_sessions": total_sessions,
            "avg_duration": round(avg_duration, 1),
            "total_minutes": total_minutes,
            "calories_burned": total_calories,
            "achievement_rate": round(achievement_rate, 1),
            "period_label": self._get_period_label(period),
            "insights": insights
        }
    
    def _get_period_label(self, period: str) -> str:
        """기간별 라벨 반환"""
        labels = {
            "day": "오늘",
            "week": "이번 주",
            "month": "이번 달"
        }
        return labels.get(period, "이번 달")
    
    def _get_period_goals(self, period: str) -> Dict[str, int]:
        """기간별 목표 반환"""
        goals = {
            "day": {"sessions": 1, "minutes": 60},
            "week": {"sessions": 3, "minutes": 300},
            "month": {"sessions": 12, "minutes": 1200}
        }
        return goals.get(period, goals["month"])
    
    def _generate_exercise_insights(self, sessions: int, avg_duration: float, achievement_rate: float, period: str) -> List[str]:
        """운동 인사이트 생성"""
        insights = []
        period_label = self._get_period_label(period)
        
        if achievement_rate >= 100:
            insights.append(f"🎉 {period_label} 운동 목표를 달성했습니다!")
        elif achievement_rate >= 80:
            insights.append(f"💪 {period_label} 운동 목표의 {achievement_rate:.0f}%를 달성했습니다.")
        else:
            insights.append(f"📈 {period_label} 운동량을 늘려보세요. 현재 {achievement_rate:.0f}% 달성.")
        
        if avg_duration >= 60:
            insights.append("⏱️ 운동 시간이 충분합니다. 강도를 높여보세요.")
        elif avg_duration >= 30:
            insights.append("⏱️ 적절한 운동 시간입니다. 지속하세요.")
        else:
            insights.append("⏱️ 운동 시간을 늘려보세요.")
        
        return insights
    
    def analyze_bmi_health_status(self, health_records: List[Dict]) -> Dict[str, Any]:
        """BMI 기반 건강 상태 분석"""
        if not health_records:
            return {
                "current_bmi": None,
                "bmi_category": "데이터 없음",
                "health_status": "정보 부족",
                "recommendations": ["체중과 신장 데이터를 입력해주세요."]
            }
        
        # 더미 BMI 분석 결과
        current_bmi = 22.5  # 더미 데이터
        
        if current_bmi < 18.5:
            category = "저체중"
            status = "체중 증가 필요"
            recommendations = ["균형 잡힌 식단으로 건강한 체중 증가를 목표하세요.", "근력 운동을 통해 근육량을 늘려보세요."]
        elif 18.5 <= current_bmi < 25:
            category = "정상"
            status = "건강한 상태"
            recommendations = ["현재 체중을 유지하세요.", "꾸준한 운동과 균형 잡힌 식단을 지속하세요."]
        elif 25 <= current_bmi < 30:
            category = "과체중"
            status = "체중 관리 필요"
            recommendations = ["칼로리 섭취를 줄이고 운동량을 늘려보세요.", "유산소 운동을 중심으로 계획을 세워보세요."]
        else:
            category = "비만"
            status = "적극적인 체중 관리 필요"
            recommendations = ["전문가의 도움을 받아 체계적인 다이어트 계획을 세우세요.", "의료진과 상담을 권장합니다."]
        
        return {
            "current_bmi": current_bmi,
            "bmi_category": category,
            "health_status": status,
            "recommendations": recommendations
        }
    
    def generate_weight_chart(self, health_records: List[Dict], analysis: Dict) -> str:
        """체중 변화 차트 생성"""
        try:
            # 더미 데이터로 차트 생성
            dates = pd.date_range(start='2024-01-01', periods=30, freq='D')
            weights = np.random.normal(70, 2, 30)  # 평균 70kg, 표준편차 2
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=dates,
                y=weights,
                mode='lines+markers',
                name='체중',
                line=dict(color='blue', width=2)
            ))
            
            fig.update_layout(
                title='체중 변화 추이',
                xaxis_title='날짜',
                yaxis_title='체중 (kg)',
                height=400
            )
            
            # HTML로 변환
            chart_html = fig.to_html(include_plotlyjs='cdn')
            return chart_html
            
        except Exception as e:
            print(f"[ERROR] 차트 생성 실패: {str(e)}")
            return "<div>차트를 생성할 수 없습니다.</div>"
    
    def generate_exercise_chart(self, exercise_sessions: List[Dict], analysis: Dict) -> str:
        """운동 패턴 차트 생성"""
        try:
            # 더미 데이터로 차트 생성
            exercise_types = ['유산소', '근력', '스트레칭', '요가']
            counts = [15, 12, 8, 5]
            
            fig = go.Figure(data=[
                go.Bar(x=exercise_types, y=counts, marker_color='lightgreen')
            ])
            
            fig.update_layout(
                title='운동 유형별 횟수',
                xaxis_title='운동 유형',
                yaxis_title='횟수',
                height=400
            )
            
            # HTML로 변환
            chart_html = fig.to_html(include_plotlyjs='cdn')
            return chart_html
            
        except Exception as e:
            print(f"[ERROR] 차트 생성 실패: {str(e)}")
            return "<div>운동 차트를 생성할 수 없습니다.</div>"
    
    def _get_health_grade(self, score: int) -> str:
        """건강 점수를 등급으로 변환"""
        if score >= 90:
            return "매우 좋음"
        elif score >= 80:
            return "좋음"
        elif score >= 70:
            return "보통"
        elif score >= 60:
            return "개선 필요"
        else:
            return "관리 필요"
    
    def generate_ai_insights(self, health_records: List[Dict], exercise_sessions: List[Dict]) -> Dict[str, Any]:
        """AI 기반 건강 인사이트 생성"""
        try:
            # 기본 분석 수행
            weight_analysis = self.analyze_weight_trends(health_records)
            exercise_analysis = self.analyze_exercise_patterns(exercise_sessions)
            bmi_analysis = self.analyze_bmi_health_status(health_records)
            
            insights = {
                "summary": "종합 건강 상태를 분석한 결과입니다.",
                "achievements": [],
                "warnings": [],
                "recommendations": [],
                "goals": []
            }
            
            # 체중 관련 인사이트
            if weight_analysis.get("trend_direction") == "감소":
                insights["achievements"].append("✅ 체중 감량이 순조롭게 진행되고 있습니다!")
                insights["recommendations"].append("현재 페이스를 유지하며 근력 운동을 병행하세요.")
            elif weight_analysis.get("trend_direction") == "증가":
                insights["warnings"].append("⚠️ 체중이 증가 추세입니다.")
                insights["recommendations"].append("유산소 운동량을 늘리고 식단을 점검해보세요.")
            else:
                insights["achievements"].append("✅ 체중이 안정적으로 유지되고 있습니다.")
            
            # 운동 관련 인사이트
            total_sessions = exercise_analysis.get("total_sessions", 0)
            if total_sessions >= 12:  # 월 12회 이상
                insights["achievements"].append("🏃‍♂️ 훌륭한 운동 습관을 가지고 있습니다!")
                insights["goals"].append("현재 운동 강도를 유지하되 다양한 운동을 시도해보세요.")
            elif total_sessions >= 8:  # 월 8-11회
                insights["achievements"].append("💪 꾸준한 운동을 하고 있습니다.")
                insights["goals"].append("주 3-4회 운동을 목표로 횟수를 조금 더 늘려보세요.")
            elif total_sessions >= 4:  # 월 4-7회
                insights["recommendations"].append("운동 빈도를 주 2-3회로 늘려보세요.")
                insights["goals"].append("이번 달 운동 횟수 10회 달성하기")
            else:  # 월 4회 미만
                insights["warnings"].append("⚠️ 운동량이 부족합니다.")
                insights["recommendations"].append("주 2회 이상 규칙적인 운동을 시작하세요.")
                insights["goals"].append("이번 주부터 주 2회 운동하기")
            
            # BMI 관련 인사이트
            bmi_category = bmi_analysis.get("bmi_category", "정상")
            if bmi_category == "정상":
                insights["achievements"].append("📊 BMI가 정상 범위에 있습니다.")
            elif bmi_category in ["과체중", "비만"]:
                insights["warnings"].append(f"⚠️ BMI가 {bmi_category} 범위입니다.")
                insights["recommendations"].extend(bmi_analysis.get("recommendations", []))
                insights["goals"].append("건강한 체중 범위 달성하기")
            elif bmi_category == "저체중":
                insights["warnings"].append("⚠️ 체중이 부족합니다.")
                insights["recommendations"].append("균형 잡힌 식단으로 건강한 체중 증가를 목표하세요.")
            
            # 종합 요약 생성
            if len(insights["achievements"]) > len(insights["warnings"]):
                insights["summary"] = "전반적으로 건강한 상태를 유지하고 있습니다. 현재 습관을 지속하세요!"
            elif len(insights["warnings"]) > 0:
                insights["summary"] = "몇 가지 개선이 필요한 부분이 있습니다. 꾸준한 관리로 건강을 향상시켜보세요."
            else:
                insights["summary"] = "건강 관리를 위해 꾸준한 노력이 필요합니다."
            
            # 기본 권장사항 추가
            if not insights["recommendations"]:
                insights["recommendations"] = [
                    "균형 잡힌 식단을 유지하세요.",
                    "규칙적인 운동 습관을 만들어보세요.",
                    "충분한 수면과 휴식을 취하세요."
                ]
            
            # 기본 목표 추가
            if not insights["goals"]:
                insights["goals"] = [
                    "이번 달 건강한 생활습관 유지하기",
                    "꾸준한 자기관리 실천하기"
                ]
            
            return insights
            
        except Exception as e:
            print(f"[ERROR] AI 인사이트 생성 실패: {str(e)}")
            return {
                "summary": "데이터 분석 중 오류가 발생했습니다.",
                "achievements": ["데이터 수집이 시작되었습니다."],
                "warnings": [],
                "recommendations": ["꾸준한 건강 관리를 시작해보세요."],
                "goals": ["건강한 생활습관 만들기"]
            }
    
    async def generate_comprehensive_report(self, user_id: int, period: str) -> Dict[str, Any]:
        """종합 건강 리포트 생성"""
        try:
            # 데이터 조회
            data = await self.fetch_health_data(user_id, period)
            
            # 각종 분석 수행
            weight_analysis = self.analyze_weight_trends(data['health_records'])
            exercise_analysis = self.analyze_exercise_patterns(data['exercise_sessions'], period)
            
            # 차트 생성
            weight_chart = self.generate_weight_chart(data['health_records'], weight_analysis)
            exercise_chart = self.generate_exercise_chart(data['exercise_sessions'], exercise_analysis)
            
            # AI 인사이트 생성
            ai_insights = self.generate_ai_insights(data['health_records'], data['exercise_sessions'])
            
            return {
                "status": "success",
                "data_summary": {
                    "health_records_count": len(data['health_records']),
                    "exercise_sessions_count": len(data['exercise_sessions']),
                    "meal_logs_count": len(data['meal_logs'])
                },
                "weight_analysis": weight_analysis,
                "exercise_analysis": exercise_analysis,
                "charts": {
                    "weight_trend": weight_chart,
                    "exercise_pattern": exercise_chart
                },
                "ai_insights": ai_insights,
                "recommendations": [
                    "꾸준한 운동 습관을 유지하세요.",
                    "균형 잡힌 식단을 유지하세요.",
                    "충분한 수면을 취하세요."
                ]
            }
            
        except Exception as e:
            print(f"[ERROR] 종합 리포트 생성 실패: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            } 