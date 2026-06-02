---
name: ship
description: 누적된 stick 작업을 커밋하고 로컬 통합 브랜치(dam)에 병합한다. "커밋하고 dam에 병합", "작업 마무리", "배포", "ship" 요청에 발동. 모든 단계 승인 후 실행.
---

# ship — 커밋 + dam 로컬 병합

plan→build로 stick에 쌓은 누적분을 한 번에 배포한다.

## 0. 전제 + memory
진입 시 `.beaver/memory/`(MEMORY.md + 토픽)를 먼저 읽어 커밋 분리·리뷰에 **최우선** 적용한다(memory > CLAUDE.md > 기본). 완료 작업(report) 또는 변경분이 있어야 함. 없으면 중단.

> ship은 **전체 회귀(`commands.test`)를 직접 돌리지 않는다** — 충돌 해결(resolve) 경로에서만 부수적으로 실행되고, 누적 전체 회귀는 원격 발행 직전(release §3)에 1회 수행한다. build는 그 기능 `test_one`만 보므로 ship 시점엔 기능별 통과만 보장된 상태다.

## 1. 커밋
`git status`/`diff` 확인 → 여러 기능이면 논리 단위로 커밋 분리 제안(`.beaver/output/plan|report` 경계 근거) → 메시지 자동 생성(`git log` 스타일 확인) → 스테이징+메시지 **승인 후** 커밋.

## 2. 코드 리뷰 (dam 병합 전)
stick의 누적 변경분(base 대비 diff)을 **`.beaver/memory/` 규칙 + `CLAUDE.md` 규약·plan/spec 의도 대비 자가 리뷰**하고 결과를 문서로 남긴다:
- 규약 위반 점검 — memory 규칙(최우선) → 네이밍·구조·공통 로직 분리·에러처리·응답·테스트 강도.
- **memory 반영(reconcile)** — `.beaver/memory/`에서 `CLAUDE.md 반영: 미반영` 엔트리를 훑어 CLAUDE.md/docs 정식 반영을 제안. 승인 시 해당 섹션 수정 + 엔트리를 `반영됨`으로 갱신(코드외 순수 선호는 `불필요`로 두고 memory 영속). 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **의도 동작 확인** — plan/spec 의도대로 구현됐는지(누락·오구현 없는지). 테스트 통과만으로 끝내지 않는다.
- **draft 규약 확정** — plan §4.5가 만든 draft 규약 문서(`<!-- beaver:draft ... -->` 마커)가 있으면 **실제 코드와 일치하는지 검증** 후 마커 제거·확정한다. 불일치면 문서를 코드에 맞춰 고친 뒤 확정. dam 병합으로 비로소 정식 규약이 된다.
- `${CLAUDE_PLUGIN_ROOT}/templates/review.md` 기반 **`.beaver/output/review/<stick>-review-<YYMMDD>.md`** 작성. `<stick>`은 브랜치명의 `/`→`-`(예: `stick/user-a3f9c2`→`stick-user-a3f9c2`), 도메인 무관·ship 단위 1개. 같은 날 재리뷰면 `-<N>`.
- 발견 항목을 심각도와 함께 보고 → 사용자 판단: 수정 필요하면 `/beaver:build`로 고친 뒤 재시도, 통과면 병합 진행. **승인 없이 병합으로 넘어가지 않는다.**

## 3. 병합
현재 브랜치가 `.beaver/.auto-branch-state.json` 키인지로 모드 판별.

**자동 브랜치 모드** — base = state lookup(= `dam`, 로컬 전용). **base(dam)를 체크아웃하지 않는다** — stick이 dam보다 새 스키마면 dam 체크아웃이 DB 자동싱크를 유발해 컬럼 데이터를 날릴 수 있음(release §3과 동일 이유). stick(최신 스키마) 위에 선 채로 dam을 끌어와 병합 후 dam ref를 전진시킨다. 전체 계획 승인 후 순서대로:
1. stick 커밋(§1) — stick에 선 상태.
2. `git merge dam` — dam을 **stick으로** 병합(보통 dam이 stick 조상이라 no-op/FF). dam이 그새 전진했으면 실병합 — **충돌 시 §충돌 해결 자동 수행**(stick 워킹트리=최신 스키마). 로컬 전용이라 `pull`/`push` 안 함.
3. `git branch -f dam stick` — dam ref를 stick으로 전진(체크아웃 없이) → `git checkout dam`(트리가 stick과 동일 → 워킹트리 무변동 → DB 싱크 안 터짐).
4. `git branch -d <stick>` + state 키 제거. — stick도 로컬 전용이라 원격 push/삭제 없음.

*stick·dam 모두 로컬 전용 — ship은 원격에 push하지 않는다(원격 발행은 `/beaver:release`가 dam→소스에서만 한다).

*dam 보장: dam은 `/beaver:plan`이 소스 브랜치에서 만든다(로컬 전용). ship 진입 시 로컬 dam이 없으면 중단하고 plan 안내 — ship은 dam을 원격에서 받거나 새로 만들지 않는다.

**일반 모드** — 대상이 `dam`이면 로컬 병합만 하고 **push하지 않는다**(dam 로컬 전용). dam 외 원격 브랜치가 대상이면 확인 후 push하되 **대상을 체크아웃하지 않는다**(옛 스키마 체크아웃이 DB 자동싱크를 유발해 컬럼 데이터를 날릴 수 있음 — release §3과 동일 이유):
1. 현재(작업) 브랜치에 선 채로 `git fetch origin <대상>`.
2. `git merge origin/<대상>` — 대상 신규 커밋을 현재 브랜치로 병합. 충돌 시 §충돌 해결 자동 수행(현재 워킹트리=최신 스키마).
3. `git push origin HEAD:<대상>` — FF push, 대상 로컬 체크아웃 0회.
(dam→소스 반영·dam 삭제는 `/beaver:release`.)

### 충돌 해결 (병합 충돌 시 자동)
[resolve](../resolve/SKILL.md) 절차를 ship 안에서 수행: ours/theirs 의도 파악 → `CLAUDE.md` 규약대로 통합 → 마커 정리(`git diff --check`) → 테스트 → 사용자 승인 → 머지 커밋. 위험하면 `git merge --abort` 제시.

## 4. 보고
커밋·리뷰·병합 결과. 다음 작업은 `/beaver:plan`.

## 주의
승인 없이 실행 금지. `--no-verify`·force push는 명시 요청 시만(영향 고지).
