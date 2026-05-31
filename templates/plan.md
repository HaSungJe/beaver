# Plan — {featureName}

## 기능 요약
- **기능**: {feature_goal}
- **진입점**: `{api_method} {api_path}`
- **도메인**: {domain}

---

## 사전 구현 필요 항목
<!-- 선택 — CLAUDE.md가 요구하는 인프라가 소스에 없을 때만. 모든 [x] 전엔 build 불가. 없으면 섹션 삭제. -->

---

## 파일 목록
<!-- CLAUDE.md "Architecture" 규약을 따른다. 변경 없는 파일도 명시. -->

| 파일 | 작업 |
|------|------|
| `<경로>` | 신규/수정 |

---

## 설계
<!-- 레이어별 설계를 CLAUDE.md 규약대로. spec 결정사항 반영. 핵심 시그니처/구조를 코드 블록으로. -->

### 입력/검증 (DTO·스키마)

### 데이터 접근 (Repository/DAO)

### 비즈니스 로직 (Service)

### 진입점 (Controller/Handler)

---

## 테스트 케이스
<!-- CLAUDE.md "Testing" 규약의 강도로 작성. 상태/메시지만 보는 테스트 금지. -->
```
[SUCCESS]            정상 흐름 (호출된 의존성 횟수·인자까지 검증)
[FAIL:validation]    입력 검증 분기 대표 샘플
[FAIL:duplicate]     {데이터} 중복   ← affected_data 기반, 없으면 생략
[FAIL:service]       service throw 분기마다
[FAIL:repository]    데이터 계층 실패 분기마다
```

---

## 응답 코드
| 코드 | 원인 |
|------|------|
|  | 성공 |
<!-- 발생 가능한 에러 코드 전부 기재 -->
