---
# 기능 한 줄 요약 (예: "관리자용 회원가입")
feature_goal: ""

# 도메인/모듈명 (프로젝트 디렉터리 구조는 CLAUDE.md 참고)
domain: ""

# 진입점 메서드/엔드포인트 (HTTP면 GET|POST|PATCH|PUT|DELETE, 아니면 함수/명령)
api_method: ""

# 경로/시그니처 (예: "/api/v1/user/admin/sign")
api_path: ""

# 영향받는 데이터(테이블/컬렉션/모델) — 쓰기 작업 대상. 테스트 케이스 수 산정 근거
affected_data: []
---

## 기능 설명
<!-- 이 기능이 왜 필요하고 무엇을 하는지 -->

## API Spec
<!-- 입력(Body/Params/Args), 출력(Response/Return), 형태 -->
- Method:
- Path:
- Request:
- Response:

## 비즈니스 규칙
<!-- 권한, 중복 체크, 조건 분기 등 -->

## 참고사항
<!-- 관련 도메인, 참고할 기존 코드, 특이사항 -->

## 확정 설계 결정사항
<!--
  CLAUDE.md 규약만으로 판단할 수 없는 항목을 Claude가 - [ ] 체크리스트로 나열한다.
  사용자가 답을 채운 뒤에야 plan을 작성한다. 미답 항목이 있으면 plan 작성 중단.
  어떤 걸 물을지는 CLAUDE.md에서 "Y/N 선택"·"값 선택"이 필요한 규칙을 스스로 식별.
  예:
  - [ ] 인증 필요 여부 — 근거: CLAUDE.md 인증 섹션
  - [ ] 성공 응답 형식 — 근거: CLAUDE.md 응답 규칙
-->
