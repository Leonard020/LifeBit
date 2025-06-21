"""
LifeBit 건강 데이터 분석 파이프라인 DAG

이 DAG는 다음 작업을 수행합니다:
1. 건강 데이터 추출 (Extract)
2. 데이터 변환 및 정제 (Transform)
3. 분석 결과 저장 (Load)
4. AI 추천 생성
5. 알림 발송

비용 최적화를 위해 최소한의 리소스로 실행되도록 설계되었습니다.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.dummy import DummyOperator
from airflow.utils.dates import days_ago

# 기본 DAG 설정
default_args = {
    'owner': 'lifebit-team',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
    'max_active_runs': 1,  # 리소스 절약을 위해 동시 실행 제한
}

# DAG 정의
dag = DAG(
    'lifebit_health_analytics_pipeline',
    default_args=default_args,
    description='LifeBit 건강 데이터 분석 파이프라인 (MVP)',
    schedule_interval='@daily',  # 매일 실행
    catchup=False,  # 과거 데이터 백필 비활성화
    max_active_tasks=2,  # 동시 실행 태스크 수 제한
    tags=['lifebit', 'health', 'analytics', 'mvp']
)

# Python 함수들
def extract_health_data(**context):
    """
    LifeBit 데이터베이스에서 건강 관련 데이터를 추출합니다.
    """
    import psycopg2
    import pandas as pd
    import os
    from datetime import datetime, timedelta
    
    logging.info("🔍 건강 데이터 추출 시작")
    
    # PostgreSQL 연결 정보
    db_config = {
        'host': os.getenv('LIFEBIT_DB_HOST', 'host.docker.internal'),
        'port': int(os.getenv('LIFEBIT_DB_PORT', 5432)),
        'user': os.getenv('LIFEBIT_DB_USER', 'lifebit_user'),
        'password': os.getenv('LIFEBIT_DB_PASSWORD', 'lifebit_password'),
        'database': os.getenv('LIFEBIT_DB_NAME', 'lifebit_db')
    }
    
    try:
        # 어제 날짜 계산
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        
        # PostgreSQL 연결
        connection = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database=db_config['database']
        )
        
        # 건강 기록 데이터 추출
        health_query = f"""
        SELECT user_id, record_date, weight, height, bmi, created_at
        FROM health_records 
        WHERE record_date >= '{yesterday}'
        ORDER BY record_date DESC, created_at DESC
        """
        
        health_data = pd.read_sql(health_query, connection)
        logging.info(f"✅ 건강 기록 {len(health_data)}건 추출 완료")
        
        # 운동 세션 데이터 추출
        exercise_query = f"""
        SELECT es.user_id, es.exercise_date, ec.name as exercise_name, 
               es.duration_minutes, es.calories_burned, es.notes, es.created_at
        FROM exercise_sessions es
        LEFT JOIN exercise_catalog ec ON es.exercise_catalog_id = ec.exercise_catalog_id
        WHERE es.exercise_date >= '{yesterday}'
        ORDER BY es.exercise_date DESC, es.created_at DESC
        """
        
        exercise_data = pd.read_sql(exercise_query, connection)
        logging.info(f"✅ 운동 기록 {len(exercise_data)}건 추출 완료")
        
        # 식단 로그 데이터 추출
        meal_query = f"""
        SELECT ml.user_id, ml.log_date, fi.name as food_name, 
               ml.quantity, fi.calories, fi.carbs, fi.protein, fi.fat, 
               ml.meal_time, ml.created_at
        FROM meal_logs ml
        LEFT JOIN food_items fi ON ml.food_item_id = fi.food_item_id
        WHERE ml.log_date >= '{yesterday}'
        ORDER BY ml.log_date DESC, ml.created_at DESC
        """
        
        meal_data = pd.read_sql(meal_query, connection)
        logging.info(f"✅ 식단 기록 {len(meal_data)}건 추출 완료")
        
        connection.close()
        
        # Timestamp 객체를 문자열로 변환 (JSON 직렬화를 위해)
        def convert_timestamps(df):
            """DataFrame의 Timestamp 컬럼을 문자열로 변환"""
            df_copy = df.copy()
            for col in df_copy.columns:
                if df_copy[col].dtype == 'datetime64[ns]' or 'datetime' in str(df_copy[col].dtype):
                    df_copy[col] = df_copy[col].astype(str)
            return df_copy
        
        health_data_clean = convert_timestamps(health_data)
        exercise_data_clean = convert_timestamps(exercise_data)
        meal_data_clean = convert_timestamps(meal_data)
        
        # XCom을 통해 다음 태스크로 데이터 전달
        return {
            'health_records': health_data_clean.to_dict('records'),
            'exercise_sessions': exercise_data_clean.to_dict('records'),
            'meal_logs': meal_data_clean.to_dict('records'),
            'extraction_date': yesterday,
            'total_records': len(health_data) + len(exercise_data) + len(meal_data)
        }
        
    except Exception as e:
        logging.error(f"❌ 데이터 추출 실패: {str(e)}")
        raise


def transform_and_analyze_data(**context):
    """
    추출된 데이터를 변환하고 분석합니다.
    """
    import pandas as pd
    import numpy as np
    from datetime import datetime
    
    logging.info("🔄 데이터 변환 및 분석 시작")
    
    # 이전 태스크에서 데이터 가져오기
    ti = context['ti']
    extracted_data = ti.xcom_pull(task_ids='extract_health_data')
    
    if not extracted_data:
        logging.warning("⚠️ 추출된 데이터가 없습니다")
        return {"status": "no_data", "analysis_results": {}}
    
    try:
        # 데이터프레임 변환
        health_df = pd.DataFrame(extracted_data['health_records'])
        exercise_df = pd.DataFrame(extracted_data['exercise_sessions'])
        meal_df = pd.DataFrame(extracted_data['meal_logs'])
        
        analysis_results = {}
        
        # 건강 지표 분석
        if not health_df.empty:
            analysis_results['health_analysis'] = {
                'average_weight': float(health_df['weight'].mean()) if 'weight' in health_df.columns else 0,
                'average_bmi': float(health_df['bmi'].mean()) if 'bmi' in health_df.columns else 0,
                'users_count': int(health_df['user_id'].nunique()),
                'records_count': len(health_df)
            }
        
        # 운동 분석
        if not exercise_df.empty:
            analysis_results['exercise_analysis'] = {
                'total_exercise_time': int(exercise_df['duration_minutes'].sum()) if 'duration_minutes' in exercise_df.columns else 0,
                'total_calories_burned': int(exercise_df['calories_burned'].sum()) if 'calories_burned' in exercise_df.columns else 0,
                'active_users': int(exercise_df['user_id'].nunique()),
                'exercise_sessions': len(exercise_df)
            }
        
        # 식단 분석
        if not meal_df.empty:
            analysis_results['nutrition_analysis'] = {
                'total_calories_consumed': int(meal_df['calories'].sum()) if 'calories' in meal_df.columns else 0,
                'average_protein': float(meal_df['protein'].mean()) if 'protein' in meal_df.columns else 0,
                'average_carbs': float(meal_df['carbs'].mean()) if 'carbs' in meal_df.columns else 0,
                'meal_logs_count': len(meal_df)
            }
        
        # 종합 분석
        analysis_results['summary'] = {
            'analysis_date': extracted_data['extraction_date'],
            'total_records_processed': extracted_data['total_records'],
            'processing_timestamp': datetime.now().isoformat()
        }
        
        logging.info(f"✅ 데이터 분석 완료: {analysis_results}")
        
        return {
            'status': 'success',
            'analysis_results': analysis_results
        }
        
    except Exception as e:
        logging.error(f"❌ 데이터 변환 실패: {str(e)}")
        raise


def generate_ai_recommendations(**context):
    """
    분석 결과를 바탕으로 AI 추천을 생성합니다.
    """
    import requests
    import os
    
    logging.info("🤖 AI 추천 생성 시작")
    
    # 이전 태스크에서 분석 결과 가져오기
    ti = context['ti']
    transform_result = ti.xcom_pull(task_ids='transform_and_analyze_data')
    
    if not transform_result or transform_result['status'] != 'success':
        logging.warning("⚠️ 분석 결과가 없어 AI 추천을 생성할 수 없습니다")
        return {"status": "no_analysis_data"}
    
    try:
        analysis = transform_result['analysis_results']
        
        # 간단한 규칙 기반 추천 생성 (MVP용)
        recommendations = []
        
        # 운동 추천
        if 'exercise_analysis' in analysis:
            exercise_data = analysis['exercise_analysis']
            avg_exercise_time = exercise_data.get('total_exercise_time', 0) / max(exercise_data.get('active_users', 1), 1)
            
            if avg_exercise_time < 30:
                recommendations.append({
                    'type': 'exercise',
                    'priority': 'high',
                    'message': '일일 운동 시간이 부족합니다. 최소 30분 이상의 운동을 권장합니다.',
                    'suggestion': '가벼운 산책이나 홈트레이닝부터 시작해보세요.'
                })
        
        # 영양 추천
        if 'nutrition_analysis' in analysis:
            nutrition_data = analysis['nutrition_analysis']
            avg_protein = nutrition_data.get('average_protein', 0)
            
            if avg_protein < 50:
                recommendations.append({
                    'type': 'nutrition',
                    'priority': 'medium',
                    'message': '단백질 섭취량이 부족할 수 있습니다.',
                    'suggestion': '닭가슴살, 계란, 두부 등 단백질이 풍부한 음식을 드세요.'
                })
        
        # 일반 건강 추천
        recommendations.append({
            'type': 'general',
            'priority': 'low',
            'message': '꾸준한 건강 관리가 중요합니다.',
            'suggestion': '규칙적인 생활 패턴을 유지하고 충분한 수면을 취하세요.'
        })
        
        logging.info(f"✅ AI 추천 {len(recommendations)}개 생성 완료")
        
        return {
            'status': 'success',
            'recommendations': recommendations,
            'recommendation_count': len(recommendations)
        }
        
    except Exception as e:
        logging.error(f"❌ AI 추천 생성 실패: {str(e)}")
        raise


def send_summary_notification(**context):
    """
    분석 결과 요약을 로그로 출력합니다. (MVP용 간단 알림)
    """
    logging.info("📢 분석 결과 요약 알림")
    
    # 이전 태스크들에서 결과 가져오기
    ti = context['ti']
    analysis_result = ti.xcom_pull(task_ids='transform_and_analyze_data')
    ai_result = ti.xcom_pull(task_ids='generate_ai_recommendations')
    
    try:
        summary = {
            'pipeline_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'data_analysis': analysis_result.get('analysis_results', {}) if analysis_result else {},
            'ai_recommendations': ai_result.get('recommendations', []) if ai_result else [],
            'status': 'completed'
        }
        
        logging.info("=" * 50)
        logging.info("📊 LifeBit 건강 데이터 파이프라인 실행 완료")
        logging.info("=" * 50)
        
        if analysis_result and analysis_result.get('status') == 'success':
            analysis = analysis_result['analysis_results']
            
            if 'health_analysis' in analysis:
                health = analysis['health_analysis']
                logging.info(f"👥 건강 기록: {health.get('users_count', 0)}명, {health.get('records_count', 0)}건")
                logging.info(f"⚖️ 평균 체중: {health.get('average_weight', 0):.1f}kg")
                logging.info(f"📏 평균 BMI: {health.get('average_bmi', 0):.1f}")
            
            if 'exercise_analysis' in analysis:
                exercise = analysis['exercise_analysis']
                logging.info(f"💪 운동 세션: {exercise.get('exercise_sessions', 0)}건")
                logging.info(f"⏰ 총 운동 시간: {exercise.get('total_exercise_time', 0)}분")
                logging.info(f"🔥 총 소모 칼로리: {exercise.get('total_calories_burned', 0)}kcal")
            
            if 'nutrition_analysis' in analysis:
                nutrition = analysis['nutrition_analysis']
                logging.info(f"🍽️ 식단 기록: {nutrition.get('meal_logs_count', 0)}건")
                logging.info(f"🥗 총 섭취 칼로리: {nutrition.get('total_calories_consumed', 0)}kcal")
        
        if ai_result and ai_result.get('status') == 'success':
            recommendations = ai_result['recommendations']
            logging.info(f"🤖 AI 추천: {len(recommendations)}개 생성")
            
            for i, rec in enumerate(recommendations, 1):
                logging.info(f"   {i}. [{rec['priority'].upper()}] {rec['message']}")
        
        logging.info("=" * 50)
        
        return summary
        
    except Exception as e:
        logging.error(f"❌ 알림 발송 실패: {str(e)}")
        raise


# 태스크 정의
start_task = DummyOperator(
    task_id='start_pipeline',
    dag=dag
)

# 데이터 추출 태스크
extract_task = PythonOperator(
    task_id='extract_health_data',
    python_callable=extract_health_data,
    dag=dag
)

# 데이터 변환 및 분석 태스크
transform_task = PythonOperator(
    task_id='transform_and_analyze_data',
    python_callable=transform_and_analyze_data,
    dag=dag
)

# AI 추천 생성 태스크
ai_task = PythonOperator(
    task_id='generate_ai_recommendations',
    python_callable=generate_ai_recommendations,
    dag=dag
)

# 알림 발송 태스크
notification_task = PythonOperator(
    task_id='send_summary_notification',
    python_callable=send_summary_notification,
    dag=dag
)

# 완료 태스크
end_task = DummyOperator(
    task_id='end_pipeline',
    dag=dag
)

# 태스크 의존성 설정
start_task >> extract_task >> transform_task >> ai_task >> notification_task >> end_task
