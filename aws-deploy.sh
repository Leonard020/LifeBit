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
# 5. .env에 지정된 EC2 비공개 키 파일이 로컬 머신에 존재해야 합니다.

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

# SSH 키 경로의 ~를 실제 홈 디렉토리로 확장합니다.
# 이렇게 하면 [ -f ~/path ] 와 같은 검사에서 발생하는 문제를 방지할 수 있습니다.
SSH_PRIVATE_KEY_PATH="${SSH_PRIVATE_KEY_PATH/#\~/$HOME}"


ACTION=${1:-deploy} # 인자가 없으면 기본으로 'deploy' 실행

TERRAFORM_DIR="infrastructure/terraform"
ANSIBLE_DIR="infrastructure/ansible"

# --- 함수 ---
check_prereqs() {
  echo "사전 요구사항을 확인합니다..."
  command -v aws >/dev/null 2>&1 || { echo >&2 "AWS CLI가 설치되지 않았습니다. 중단합니다."; exit 1; }
  command -v terraform >/dev/null 2>&1 || { echo >&2 "Terraform이 설치되지 않았습니다. 중단합니다."; exit 1; }
  command -v ansible >/dev/null 2>&1 || { echo >&2 "Ansible이 설치되지 않았습니다. 중단합니다."; exit 1; }
  
  if [ -z "$SSH_PRIVATE_KEY_PATH" ] || [ ! -f "$SSH_PRIVATE_KEY_PATH" ]; then
    echo "오류: .env 파일에 설정된 SSH_PRIVATE_KEY_PATH를 찾을 수 없습니다: $SSH_PRIVATE_KEY_PATH"
    exit 1
  fi

  # SSH 키 파일 권한을 확인하고 안전하게 설정합니다.
  if [[ $(stat -c %a "$SSH_PRIVATE_KEY_PATH") != "600" && $(stat -c %a "$SSH_PRIVATE_KEY_PATH") != "400" ]]; then
    echo "경고: SSH 키 파일($SSH_PRIVATE_KEY_PATH)의 권한이 너무 개방적이므로 자동으로 600으로 변경합니다."
    chmod 600 "$SSH_PRIVATE_KEY_PATH"
  fi

  echo "모든 요구사항이 충족되었습니다."
}

deploy() {
  echo "--- 배포를 시작합니다 ---"
  
  # 1. Terraform 실행
  echo "[1/4] Terraform을 실행하여 인프라를 프로비저닝합니다..."
  cd "$TERRAFORM_DIR"
  terraform init
  terraform apply -auto-approve
  INSTANCE_IP=$(terraform output -raw instance_public_ip | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}')
  cd - > /dev/null
  echo "인프라 프로비저닝 완료. 인스턴스 IP: $INSTANCE_IP"

  # 2. Ansible 인벤토리 업데이트
  echo "[2/4] Ansible 인벤토리 파일을 업데이트합니다..."
  INVENTORY_FILE="$ANSIBLE_DIR/inventory"
  echo "[servers]" > "$INVENTORY_FILE"
  echo "$INSTANCE_IP ansible_user=ubuntu ansible_ssh_private_key_file=$SSH_PRIVATE_KEY_PATH" >> "$INVENTORY_FILE"
  echo "인벤토리 파일 업데이트 완료: $INVENTORY_FILE"

  # 3. SSH 연결 대기
  echo "[3/4] SSH 연결이 가능해질 때까지 대기합니다..."
  for i in {1..30}; do
    if ssh -o StrictHostKeyChecking=no -i "$SSH_PRIVATE_KEY_PATH" "ubuntu@$INSTANCE_IP" 'echo "SSH is ready"'; then
      echo "SSH 연결 성공."
      break
    fi
    if [ $i -eq 30 ]; then
      echo "오류: 5분 후 SSH 연결 시간 초과."
      exit 1
    fi
    echo "SSH 연결 대기 중... (시도 $i/30)"
    sleep 10
  done

  # 4. Ansible 플레이북 실행
  echo "[4/4] Ansible 플레이북을 실행하여 서버를 설정합니다..."
  ansible-playbook -i "$INVENTORY_FILE" "$ANSIBLE_DIR/playbook.yml"
  
  echo "--- 배포 완료 ---"
  echo "애플리케이션은 http://$INSTANCE_IP 에서 확인할 수 있습니다."
}

destroy() {
  echo "--- AWS 리소스 완전 삭제를 시작합니다 (aws-cleanup.sh 사용) ---"
  
  if [ -f ./aws-cleanup.sh ]; then
    # 실행 권한 부여
    chmod +x ./aws-cleanup.sh
    # 스크립트 실행 (확인 프롬프트를 건너뛰기 위해 --force 플래그 사용)
    ./aws-cleanup.sh --force
    echo "--- 모든 리소스 파괴가 완료되었습니다. ---"
  else
    echo "오류: aws-cleanup.sh 스크립트를 찾을 수 없습니다."
    exit 1
  fi
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
