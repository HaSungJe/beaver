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

## 3. 병합(worktree서) → 복귀 → fast-forward + push → 파기
**§1 커밋·§2 코드리뷰가 끝난 뒤** 진행한다. `origin_branch` = `.beaver/.auto-branch-state.json`에서 현재 stick 키에 매핑된 값(= 원래 작업 브랜치명). ship은 **테스트 스위트를 돌리지 않는다** — ship 후 `origin_branch`에서 `/beaver:test`로 배포 결과를 검증한다(원격·실제 의존성 보유).

실질 병합/통합(과 충돌 해결)은 **worktree 안 stick 브랜치에서, 복귀 전에** 일어난다 — 기능 컨텍스트가 거기 있기 때문. 복귀 후 원래 브랜치는 fast-forward만 한다. stick은 항상 최신 스키마이고 원래 브랜치를 **전진**만 시키므로 옛 스키마 체크아웃 위험이 없다. 승인 후 순서대로:

1. **origin 최신을 stick에 편입(worktree 안)** — 아직 stick worktree 안, stick 브랜치에서: 원격 추적 있으면 `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>`로 대상 최신을 stick에 편입(충돌 시 아래 「충돌 해결」 인라인 — 기능 컨텍스트가 여기 있다). 이제 stick은 origin 최신 + 누적 작업 전부를 담은 깨끗한 전진 상태다. (`origin_branch`에 원격이 없으면 fetch/merge 생략 — stick이 이미 그 후손이다.)
2. **복귀** — `ExitWorktree` → 세션 cwd가 원래 repo 디렉터리(`origin_branch`)로 복귀. `pre_ff = git rev-parse HEAD` 기록(push 전에 로컬 fast-forward를 되돌려야 하면 `git reset --hard` 할 지점).
3. **fast-forward + push** — `git merge --ff-only <stick>`로 `origin_branch`를 stick으로 전진시킨다. 1번에서 stick이 이미 origin 최신을 편입했으므로 **fast-forward가 보장**되어 여기선 충돌이 불가능하다. 이어 `git push origin <origin_branch>`(첫 발행이면 `-u`). *그 사이 origin이 또 전진해 `--ff-only`가 거부되면 `/beaver:ship`을 재실행 — 1번이 새 origin을 먼저 편입한다.*
4. **파기** — `git worktree remove .claude/worktrees/<stick>` → `git branch -d <stick>` → state에서 키 제거.

### 충돌 해결 (병합 충돌 시 인라인 자동)
별도 스킬 없이 ship 안에서 직접 수행한다:
1. **양쪽 의도 파악** — 충돌 hunk마다 ours(현재 브랜치)/theirs(stick 또는 origin) 변경 의도를 코드·plan/spec 근거로 파악.
2. **규약대로 통합** — `.beaver/memory/` 규칙(최우선) + `CLAUDE.md` 규약에 맞게 양쪽 의도를 보존하며 통합. 한쪽 버리기 금지(둘 다 의미 있으면 합친다).
3. **마커 정리** — `git diff --check` 로 충돌 마커 잔여 0 확인.
4. **검증** — 해결한 hunk를 읽어 통합이 일관되는지 확인. 테스트 실행은 ship 후 `origin_branch`에서 `/beaver:test`로 미룬다.
5. **승인 후 머지 커밋** — 사용자에게 통합 결과 보고 후 승인받아 커밋. 위험하면 `git merge --abort` 제시.

## 4. 보고
커밋·리뷰·병합 결과. 다음: `origin_branch`에서 `/beaver:test`로 배포 결과 검증, 그다음 다음 기능은 `/beaver:plan`.

## 주의
승인 없이 실행 금지. `--no-verify`·force push는 명시 요청 시만(영향 고지).
