---
name: refactor
description: 코드를 리팩토링한다(비슷한 기능 묶기, 중복 제거, 공통 로직 추출). 계획서를 먼저 쓰고 조정·승인 후 실행, 동작 보존을 테스트로 검증. "리팩토링", "비슷한 기능 묶어줘", "중복 정리", "공통화" 요청에 발동.
---

# refactor — 계획 기반 구조 정리

동작을 바꾸지 않고 구조를 개선한다. 계획서 작성 → 조정·승인 → 실행(단계별 테스트). 분리 기준은 `CLAUDE.md` 규약.

## 0. memory + green baseline
**memory 먼저 읽기**: `.beaver/memory/`(MEMORY.md + 관련 토픽)를 읽어 분리·배치 판단에 **최우선** 적용(memory > CLAUDE.md > 기본). 작업 중 지속 규칙 지적 시 확인 후 저장 — 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
`commands.test` 1회로 통과 상태 확인. 깨져 있으면 회귀 판별 불가임을 알린다.

## 1. 대상 식별
지정 범위가 있으면 그 안에서, 없으면 스캔(Grep/Read): 중복/유사 로직 / CLAUDE.md 기준상 util·module로 빠져야 할 오배치 / 묶을 기능 군집. 각 발견은 근거(경로:라인) 포함.

## 2. 계획서 작성
`${CLAUDE_PLUGIN_ROOT}/templates/refactor-plan.md` 기반 `.beaver/output/refactor/<name>-refactor-<YYMMDD>.md`: 목표/범위, baseline, 발견 목록, 변경 방안, 작은 단위 실행 순서, 영향 파일, 테스트 전략, 리스크.

## 3. 조정·승인
계획서 제시 → 우선순위·범위 조정. 너무 넓게 가지 않는다. **승인 전 코드 수정 금지.**

## 4. 실행
실행 순서대로 작은 단위로: 공통 로직을 CLAUDE.md 규약 위치(전역/도메인 util, 공용 module)로 추출 → 호출부 교체(시그니처·네이밍 규약) → 죽은 코드 제거. **각 단계 후 테스트** — 영향 파일이 단일 모듈 내면 해당 `commands.test_one`, 호출부가 여러 도메인에 걸치면 전체 `commands.test`로 확인하고, 깨지면 즉시 고치거나 직전 단계로 되돌린다(git으로 되돌림 — refactor는 stick 워크트리를 쓰지 않으므로 `git checkout`/`stash`로 단계 단위 롤백). 계획서 체크박스 갱신. (테스트 커맨드가 없는 프로젝트면 동작 보존 입증이 불가함을 고지하고 진행 여부를 사용자에게 확인.)

## 5. 검증·보고
**전체 `commands.test` 통과로 동작 보존 입증**(§4는 단계별 부분 테스트, §5는 마지막 전체 회귀 1회). 무엇을 어디로 묶었는지(규약 근거) 보고. 커밋은 refactor가 하지 않는다 — `/beaver:ship`이 커밋한다. **단 ship은 stick 워크트리(plan으로 진입) 안에서만 동작**하므로, stick 밖(원래 브랜치)에서 단독 리팩토링했다면 사용자가 직접 커밋한다.

## 주의
동작 변경(기능 추가/수정)은 리팩토링 아님 → `/beaver:plan`→`build`. 테스트 없는 영역은 위험 고지(필요시 characterization 테스트 선행).
