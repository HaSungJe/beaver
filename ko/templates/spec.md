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

## 제안 (코드베이스 기반)
<!-- plan이 연관된 기존 요소(DB/모델, 인접 기능, 재사용 util, 기존 패턴)를 스캔해
     "이런 것도 있으면 좋다 / 기존 X 연계 / Y 패턴 재사용"을 근거(경로:라인)와 함께 제안.
     사용자가 수락/거부. 없으면 섹션 생략.
     예: - [ ] 기존 t_user_log와 연계해 가입 이력 적재 (src/.../user-log.entity.ts:12) -->

## 확정 설계 결정사항
<!-- CLAUDE.md만으로 못 정하는 항목을 - [ ]로 나열(답 비움). 미답 있으면 plan 작성 중단.
     예: "- [ ] 인증 필요 여부 — 근거: CLAUDE.md 인증 섹션" -->
