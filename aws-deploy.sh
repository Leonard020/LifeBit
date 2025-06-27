#!/bin/bash

# 이 스크립트는 AWS에 애플리케이션 스택을 배포하거나 파괴합니다.
#
# 사용법: ./aws-deploy.sh [deploy|destroy]
#
# 사전 요구사항:
# 1. AWS CLI 설치 및 설정 (사전에 'aws configure' 실행 필요).
# 2. Terraform 설치.
# 3. Ansible 설치.
# 4. '.env' 파일이 존재하고, 모든 값이 채워져 있어야 합니다.
# 5. 키페어는 자동으로 생성됩니다 (기존 키 파일이 있으면 사용).

set -e # 명령어 실패 시 즉시 스크립트 중단

# --- 설정 ---
# .env 파일에서 환경 변수 불러오기
if [ -f .env ]; then
  # While 반복문을 사용하여 안전하게 환경 변수를 export 합니다.
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" =~ ^\s*# ]] || [[ -z "$line" ]]; then
      continue
    fi
    if [[ "$line" =~ ^[a-zA-Z0-9_]+= ]]; then
      export "$line"
    fi
  done < .env
else
  echo "오류: .env 파일을 찾을 수 없습니다. .env.example을 복사하여 생성해주세요."
  exit 1
fi

# 키페어 설정
KEY_PAIR_NAME="lifebit-key-$(date +%Y%m%d-%H%M%S)"
SSH_PRIVATE_KEY_PATH="${HOME}/.ssh/${KEY_PAIR_NAME}.pem"

ACTION=${1:-deploy} # 인자가 없으면 기본으로 'deploy' 실행

TERRAFORM_DIR="infrastructure/terraform"
ANSIBLE_DIR="infrastructure/ansible"

# --- 함수 ---
check_prereqs() {
  echo "사전 요구사항을 확인합니다..."
  command -v aws >/dev/null 2>&1 || { echo >&2 "AWS CLI가 설치되지 않았습니다. 중단합니다."; exit 1; }
  command -v terraform >/dev/null 2>&1 || { echo >&2 "Terraform이 설치되지 않았습니다. 중단합니다."; exit 1; }
  command -v ansible >/dev/null 2>&1 || { echo >&2 "Ansible이 설치되지 않았습니다. 중단합니다."; exit 1; }
  
  echo "모든 요구사항이 충족되었습니다."
}

# 키페어 자동 생성 함수
create_key_pair() {
  echo "키페어를 생성합니다: $KEY_PAIR_NAME"
  
  # 기존 키페어가 있는지 확인
  if aws ec2 describe-key-pairs --key-names "$KEY_PAIR_NAME" >/dev/null 2>&1; then
    echo "키페어 $KEY_PAIR_NAME이 이미 존재합니다. 삭제 후 재생성합니다."
    aws ec2 delete-key-pair --key-name "$KEY_PAIR_NAME" >/dev/null 2>&1 || true
    sleep 2
  fi
  
  # 새 키페어 생성
  aws ec2 create-key-pair \
    --key-name "$KEY_PAIR_NAME" \
    --query 'KeyMaterial' \
    --output text > "$SSH_PRIVATE_KEY_PATH"
  
  # 키 파일 권한 설정
  chmod 600 "$SSH_PRIVATE_KEY_PATH"
  
  echo "키페어 생성 완료: $SSH_PRIVATE_KEY_PATH"
  echo "키페어 이름: $KEY_PAIR_NAME"
}

# 키페어 정리 함수
cleanup_key_pair() {
  echo "키페어를 정리합니다: $KEY_PAIR_NAME"
  
  # AWS에서 키페어 삭제
  if aws ec2 describe-key-pairs --key-names "$KEY_PAIR_NAME" >/dev/null 2>&1; then
    aws ec2 delete-key-pair --key-name "$KEY_PAIR_NAME" >/dev/null 2>&1 || true
    echo "AWS 키페어 삭제 완료: $KEY_PAIR_NAME"
  fi
  
  # 로컬 키 파일 삭제
  if [ -f "$SSH_PRIVATE_KEY_PATH" ]; then
    rm -f "$SSH_PRIVATE_KEY_PATH"
    echo "로컬 키 파일 삭제 완료: $SSH_PRIVATE_KEY_PATH"
  fi
}

deploy() {
  echo "--- 배포를 시작합니다 ---"
  
  # 0. 키페어 생성
  echo "[0/5] 키페어를 생성합니다..."
  create_key_pair
  
  # 1. Terraform 실행 (키페어 이름 전달)
  echo "[1/5] Terraform을 실행하여 인프라를 프로비저닝합니다..."
  cd "$TERRAFORM_DIR"
  terraform init
  terraform apply -auto-approve -var="key_name=$KEY_PAIR_NAME"
  INSTANCE_IP=$(terraform output -raw instance_public_ip | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}')
  cd - > /dev/null
  echo "인프라 프로비저닝 완료. 인스턴스 IP: $INSTANCE_IP"

  # 2. Ansible 인벤토리 업데이트
  echo "[2/5] Ansible 인벤토리 파일을 업데이트합니다..."
  INVENTORY_FILE="$ANSIBLE_DIR/inventory"
  echo "[servers]" > "$INVENTORY_FILE"
  echo "$INSTANCE_IP ansible_user=ubuntu ansible_ssh_private_key_file=$SSH_PRIVATE_KEY_PATH" >> "$INVENTORY_FILE"
  echo "인벤토리 파일 업데이트 완료: $INVENTORY_FILE"

  # 3. SSH 연결 대기
  echo "[3/5] SSH 연결이 가능해질 때까지 대기합니다..."
  for i in {1..30}; do
    if ssh -o StrictHostKeyChecking=no -i "$SSH_PRIVATE_KEY_PATH" "ubuntu@$INSTANCE_IP" 'echo "SSH is ready"'; then
      echo "SSH 연결 성공."
      break
    fi
    if [ $i -eq 30 ]; then
      echo "오류: 5분 후 SSH 연결 시간 초과."
      echo "키페어 정보: $KEY_PAIR_NAME"
      echo "키 파일 경로: $SSH_PRIVATE_KEY_PATH"
      exit 1
    fi
    echo "SSH 연결 대기 중... (시도 $i/30)"
    sleep 10
  done

  # 4. Ansible 플레이북 실행
  echo "[4/5] Ansible 플레이북을 실행하여 서버를 설정합니다..."
  ansible-playbook -i "$INVENTORY_FILE" "$ANSIBLE_DIR/playbook.yml"
  
  # 5. 배포 정보 저장
  echo "[5/5] 배포 정보를 저장합니다..."
  echo "KEY_PAIR_NAME=$KEY_PAIR_NAME" > .deployment_info
  echo "SSH_PRIVATE_KEY_PATH=$SSH_PRIVATE_KEY_PATH" >> .deployment_info
  echo "INSTANCE_IP=$INSTANCE_IP" >> .deployment_info
  echo "DEPLOYMENT_DATE=$(date)" >> .deployment_info
  
  echo "--- 배포 완료 ---"
  echo "애플리케이션은 http://$INSTANCE_IP 에서 확인할 수 있습니다."
  echo "키페어 정보: $KEY_PAIR_NAME"
  echo "키 파일 경로: $SSH_PRIVATE_KEY_PATH"
}

destroy() {
  echo "--- AWS 리소스 완전 삭제를 시작합니다 ---"
  
  # 배포 정보에서 키페어 정보 읽기
  if [ -f .deployment_info ]; then
    source .deployment_info
    echo "배포 정보에서 키페어 정보를 읽었습니다: $KEY_PAIR_NAME"
  else
    echo "배포 정보 파일이 없습니다. 기존 키페어를 검색합니다..."
    # 기존 lifebit 키페어 검색
    KEY_PAIR_NAME=$(aws ec2 describe-key-pairs --query 'KeyPairs[?contains(KeyName, `lifebit`)].KeyName' --output text 2>/dev/null | head -n1)
    if [ -z "$KEY_PAIR_NAME" ]; then
      echo "삭제할 키페어를 찾을 수 없습니다."
    else
      echo "발견된 키페어: $KEY_PAIR_NAME"
    fi
  fi
  
  # 1. aws-cleanup.sh 실행
  if [ -f ./aws-cleanup.sh ]; then
    echo "[1/2] aws-cleanup.sh를 실행하여 모든 AWS 리소스를 삭제합니다..."
    chmod +x ./aws-cleanup.sh
    ./aws-cleanup.sh --force
  else
    echo "오류: aws-cleanup.sh 스크립트를 찾을 수 없습니다."
    exit 1
  fi
  
  # 2. 키페어 및 배포 정보 정리
  echo "[2/2] 키페어 및 배포 정보를 정리합니다..."
  if [ -n "$KEY_PAIR_NAME" ]; then
    cleanup_key_pair
  fi
  
  # 배포 정보 파일 삭제
  rm -f .deployment_info
  
  echo "--- 모든 리소스 파괴가 완료되었습니다. ---"
}

# --- 메인 로직 ---
check_prereqs

if [ "$ACTION" == "deploy" ]; then
  deploy
elif [ "$ACTION" == "destroy" ]; then
  destroy
else
  echo "오류: 잘못된 인자 '$ACTION'. 'deploy' 또는 'destroy'를 사용하세요."
  exit 1
fi
