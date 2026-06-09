---
name: ship
description: stick worktree에 누적한 작업을 커밋하고 원래 작업 브랜치로 병합·푸쉬한 뒤 worktree를 파기한다. "커밋하고 배포", "작업 마무리", "배포", "ship" 요청에 발동. 모든 단계 승인 후 실행.
---

# ship — 커밋 + 원래 브랜치 병합·푸쉬 + worktree 파기

plan→build로 stick worktree에 쌓은 누적분을 원래 작업 브랜치(plan 시점의 main/develop 등)로 한 번에 배포한다.

## 0. 전제 + memory
진입 시 `.beaver/memory/`(MEMORY.md + 토픽)를 먼저 읽어 커밋 분리·리뷰에 **최우선** 적용한다(memory > CLAUDE.md > 기본). 완료 작업(report) 또는 변경분이 있어야 함. 없으면 중단. stick worktree 안에서 동작한다(`.beaver/.auto-branch-state.json`에 현재 stick 키가 있어야 함).

## 1. 커밋
`git status`/`diff` 확인 → 여러 기능이면 논리 단위로 커밋 분리 제안(`.beaver/output/plan|report` 경계 근거) → 메시지 자동 생성(`git log` 스타일 확인) → 스테이징+메시지 **승인 후** 커밋.

## 2. 코드 리뷰 (병합 전)
stick의 누적 변경분(base 대비 diff)을 **`.beaver/memory/` 규칙 + `CLAUDE.md` 규약·plan/spec 의도 대비 자가 리뷰**하고 결과를 문서로 남긴다:
- 규약 위반 점검 — memory 규칙(최우선) → 네이밍·구조·공통 로직 분리·에러처리·응답·테스트 강도.
- **memory 반영(reconcile)** — `.beaver/memory/`에서 `CLAUDE.md 반영: 미반영` 엔트리를 훑어 CLAUDE.md/docs 정식 반영을 제안. 승인 시 해당 섹션 수정 + 엔트리를 `반영됨`으로 갱신(코드외 순수 선호는 `불필요`로 두고 memory 영속). 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **의도 동작 확인** — plan/spec 의도대로 구현됐는지(누락·오구현 없는지). 테스트 통과만으로 끝내지 않는다.
- **draft 규약 확정** — plan §4.5가 만든 draft 규약 문서(`<!-- beaver:draft ... -->` 마커)가 있으면 **실제 코드와 일치하는지 검증** 후 마커 제거·확정한다. 불일치면 문서를 코드에 맞춰 고친 뒤 확정. 병합으로 비로소 정식 규약이 된다.
- `${CLAUDE_PLUGIN_ROOT}/templates/review.md` 기반 **`.beaver/output/review/<stick>-review-<YYMMDD>.md`** 작성. `<stick>`은 브랜치명의 `/`→`-`(예: `stick/user-a3f9c2`→`stick-user-a3f9c2`), 도메인 무관·ship 단위 1개. 같은 날 재리뷰면 `-<N>`.
- 발견 항목을 심각도와 함께 보고 → 사용자 판단: 수정 필요하면 `/beaver:build`로 고친 뒤 재시도, 통과면 병합 진행. **승인 없이 병합으로 넘어가지 않는다.**

## 2.5 전체 회귀 (병합 전, release에서 흡수)
원래 브랜치로 병합하기 전 stick worktree에서 `commands.test` **전체**를 1회 실행한다. build는 기능별 `test_one`만 보므로, 누적 기능 전체의 회귀를 여기서 처음 검증한다. **green이어야 §3 진행.** 실패 시 중단하고 원인 수정(`/beaver:build`) 후 재시도 — 깨진 채로 병합·push하지 않는다.

## 3. 복귀 + 전진 병합 + push + 파기
`.beaver/.auto-branch-state.json`에서 현재 stick의 `origin_branch`를 읽는다. 키가 없으면 중단(plan으로 만든 stick worktree에서만 동작).

stick worktree는 항상 최신 스키마이고 원래 브랜치로 **전진** 병합만 하므로, 옛 스키마 체크아웃에 의한 DB 자동싱크 위험이 없다. 전체 계획 승인 후 순서대로:

1. **커밋**(§1) — stick worktree 안에서.
2. **전체 회귀** — `commands.test` 전체 실행(§2.5). green이어야 진행.
3. **`ExitWorktree`** — 세션 cwd가 원래 repo 디렉터리(`origin_branch`)로 복귀. worktree·stick 브랜치 ref는 남는다.
4. **전진 병합** — 복귀한 디렉터리에서:
   - 원격 추적 있으면 `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>` 로 대상 최신을 현재 브랜치에 편입(충돌 시 §충돌 해결 인라인 수행).
   - `git merge <stick>` 으로 stick을 현재 브랜치에 전진 병합(충돌 시 §충돌 해결 인라인 수행).
5. **push** — `git push origin <origin_branch>`. 원격 추적 첫 발행이면 `-u`.
6. **파기** — `git worktree remove .claude/worktrees/<stick>` → `git branch -d <stick>` → state에서 키 제거.

### 충돌 해결 (병합 충돌 시 자동)
[resolve](../resolve/SKILL.md) 절차를 ship 안에서 수행: ours/theirs 의도 파악 → `CLAUDE.md` 규약대로 통합 → 마커 정리(`git diff --check`) → 테스트 → 사용자 승인 → 머지 커밋. 위험하면 `git merge --abort` 제시.

## 4. 보고
커밋·리뷰·병합 결과. 다음 작업은 `/beaver:plan`.

## 주의
승인 없이 실행 금지. `--no-verify`·force push는 명시 요청 시만(영향 고지).
