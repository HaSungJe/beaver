---
name: ship
description: 누적한 작업을 커밋한다 — stick worktree면 원래 브랜치로 병합·푸쉬 후 worktree 파기, fast(워크트리 없음) 흐름이면 현재 브랜치에서 일반 커밋·푸쉬. "커밋하고 배포", "작업 마무리", "배포", "ship" 요청에 발동. 모든 단계 승인 후 실행.
---

# ship — 커밋 + 원래 브랜치 병합·푸쉬 + worktree 파기

plan→build(stick worktree) 또는 fast→build(현재 브랜치)로 쌓은 누적분을 대상 브랜치로 한 번에 배포한다.

## 0. 전제 + memory + 모드
진입 시 `.beaver/memory/`를 먼저 읽어 커밋 분리·리뷰에 **최우선** 적용한다(memory > CLAUDE.md > 기본). 완료 작업(report) 또는 변경분이 있어야 함; 없으면 중단.

**모드 판별**:
- **워크트리 모드** — cwd가 `.claude/worktrees/` 하위이고 `.beaver/.auto-branch-state.json`에 현재 브랜치가 키로 존재 → §1 리뷰 → §2 커밋 → §3 병합/복귀/파기.
- **직접 모드 (fast)** — cwd가 메인 체크아웃: `/beaver:fast`→build가 현재 브랜치에 누적한 작업. `git branch --show-current` 비어 있으면 안 됨(detached → 중단). §1 리뷰 → §2 커밋 → **§3-direct**(일반 푸쉬; 병합·worktree·파기 없음).

## 1. 코드 리뷰 (커밋 전)
build는 커밋 없이 누적하므로, 먼저 **stick base 대비 워킹트리 diff**(직접 모드: `git diff HEAD`)를 리뷰해 §2 커밋이 리뷰 통과 상태를 담게 한다 — fix-up 커밋 없음. `.beaver/memory/` 규칙 + `CLAUDE.md` 규약 + plan/spec 의도 대비 자가 리뷰하고 결과를 남긴다:
- 규약 위반 점검 — memory 규칙(최우선) → 네이밍·구조·공통 로직 분리·에러처리·응답·테스트 강도.
- **data-access 스모크 커버리지** — diff가 매핑 민감 쿼리 구문(정의: docs/testing.md "Data-Access 스모크")을 쓰는 data-access 메서드를 추가/수정했으면, 스모크 spec 동반 여부와 새 매핑 민감 필드의 위험 매핑 스냅샷 갱신 여부를 확인한다. 그런 메서드의 mock-only 커버는 지적 사항이다.
- **memory 반영(reconcile)** — `CLAUDE.md 반영: 미반영` 엔트리에 대해 CLAUDE.md/docs 정식 반영을 제안; 승인 시 수정 + `반영됨` 갱신(코드외 순수 선호는 `불필요` 유지). 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **의도 동작 확인** — plan/spec 의도대로 구현됐는지(누락·오구현); 테스트 통과만으로 끝내지 않는다.
- **draft 규약 확정** — plan §4.5의 draft 문서(`<!-- beaver:draft ... -->` 마커)는 실제 코드와 일치해야 한다; 불일치면 문서를 코드에 맞춰 고친다. 그다음 마커 제거·확정 — 병합으로 비로소 정식 규약이 된다.
- `${CLAUDE_PLUGIN_ROOT}/templates/review.md` 기반 **`.beaver/output/review/<stick>-review-<YYMMDD>.md`** 작성. `<stick>` = 브랜치명의 `/`→`-` 치환(직접 모드: 현재 브랜치명); 같은 날 재리뷰면 `-<N>`.
- 발견 항목을 심각도와 함께 보고 → 사용자 판단: 수정은 `/beaver:build` + 재리뷰, 통과면 커밋 진행. **승인 없이 커밋/병합 금지.**

## 2. 커밋 (리뷰 후)
`git status`/`diff` 확인 → 여러 기능이면 논리 단위 커밋 분리 제안(`.beaver/output/plan|report` 경계 근거) → 메시지 자동 생성(`git log` 스타일 확인) → 스테이징 + 메시지 **승인 후** 커밋. §1 리뷰 문서도 함께 커밋된다.

## 3. 병합(worktree서) → 복귀 → fast-forward + push → 파기
**워크트리 모드 전용** — 직접 모드는 §3-direct로. §1 + §2 완료 후 진행. 이 절의 `<stick>` = 하니스가 실제 생성하고 plan이 기록한 **실제 브랜치명**(예: `worktree-stick+user-a1b2c3`) — 워크트리 안에서 `git branch --show-current`로 읽어 `.beaver/.auto-branch-state.json` 키와 대조한다; 도메인명으로 재조립하지 말 것. `origin_branch` = 그 키의 값. ship은 테스트를 돌리지 않는다 — ship 후 `origin_branch`에서 `/beaver:test`로 검증.

**불변식**: `git worktree remove`는 `ExitWorktree`가 세션 cwd를 worktree 밖으로 뺐음을 검증한 뒤에만 — Windows에선 살아있는 프로세스의 cwd 폴더는 삭제되지 않는다.

실질 병합(과 충돌 해결)은 **worktree 안 stick 브랜치에서, 복귀 전에** 일어난다 — 기능 컨텍스트가 거기 있다; 복귀 후 원래 브랜치는 fast-forward만 한다. 승인 후 순서대로:

1. **origin 최신을 stick에 편입(worktree 안)** — stick 브랜치에서: 원격 추적 있으면 `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>`(충돌 시 아래 「충돌 해결」 인라인). 이제 stick은 origin 최신 + 누적 작업 전부를 담은 깨끗한 전진 상태다. 원격 없으면 생략.
2. **복귀 (ExitWorktree — 필수 + 검증)** — `ExitWorktree(action: keep)` 호출. **`cd`/`Set-Location`로 대체 금지** — Windows에선 하니스가 매 명령 후 cwd를 worktree로 재고정한다. cwd가 `.claude/worktrees/<stick>` 하위가 아닌지 검증; 아직 내부면 재시도. 재개/요약된 세션은 "no active session"으로 no-op일 수 있음 — 재시도 후에도 내부면 **4번 진행 금지**, 4번 폴백 참조. 밖으로 나간 뒤 `pre_ff = git rev-parse HEAD` 기록(push 전 로컬 fast-forward를 되돌릴 `git reset --hard` 지점).
3. **fast-forward + push** — `git merge --ff-only <stick>`로 `origin_branch`를 stick으로 전진(1번이 이미 origin을 편입했으므로 fast-forward 보장), 이어 `git push origin <origin_branch>`(첫 발행 `-u`). 그 사이 origin이 전진해 거부되면 `/beaver:ship` 재실행 — 1번이 새 origin을 먼저 편입한다.
4. **파기** — 선행조건: 2번에서 세션이 밖임을 검증. `git worktree remove <git worktree list의 실제 경로>` → `git branch -d <stick>` → state 키 제거 → 디렉터리가 실제로 사라졌는지 확인(잔여 폴더는 `Remove-Item` — 세션이 밖이면 성공). **폴백(하니스 고정 세션)**: 세션을 못 뺐으면 `git worktree remove`는 등록만 해제하고 폴더는 자기잠금으로 남는다 — 외부 터미널이나 세션 종료 후 정리해야 함을 보고한다. *(대안: ff+push 후 파기를 `ExitWorktree(action: "remove", discard_changes: true)`에 위임 — 세션을 먼저 뺀 뒤 제거해 자기잠금을 구조적으로 회피; ff-only가 stick 브랜치를 필요로 하므로 ff+push 이후에만.)*

## 3-direct. 푸쉬 (직접 모드 — worktree 없음)
§1 + §2 완료 후 진행. `branch = git branch --show-current`. ship은 테스트를 돌리지 않는다 — ship 후 `/beaver:test`로 검증(이미 의존성 갖춘 실제 브랜치 위다).

1. **origin 최신 편입** — 원격 추적 있으면 `git fetch origin <branch>` → `git merge origin/<branch>`(충돌 시 「충돌 해결」; 승인 후 머지 커밋). 없으면 생략.
2. **푸쉬** — `git push origin <branch>`(첫 발행 `-u`). 복귀·파기할 것 없음.

이후 §4로.

### 충돌 해결 (병합 충돌 시 인라인 자동)
1. **양쪽 의도 파악** — hunk마다 ours/theirs 의도를 코드·plan/spec 근거로.
2. **규약대로 통합** — memory 규칙(최우선) + CLAUDE.md; 양쪽 의도 보존, 한쪽 버리기 금지.
3. **마커 정리** — `git diff --check`로 잔여 0 확인.
4. **검증** — 해결한 hunk를 읽어 일관성 확인. 테스트 실행은 `/beaver:test`로 미룬다.
5. **승인 후 머지 커밋** — 통합 결과 보고 먼저; 위험하면 `git merge --abort` 제시.

## 4. 보고 + 테스트 제안
커밋·리뷰·병합/푸쉬 결과 보고. cwd는 이제 배포된 브랜치 위 — remote와 의존성을 갖춘, 정확히 `/beaver:test`의 전제조건 — 이므로 **여기서 바로 회귀 테스트 실행 여부를 묻고**, 승인 시 같은 세션에서 즉시 `/beaver:test` 실행:

- **예** → 지금 `/beaver:test`(red 시 자가 치유 → 확인 후 수정 커밋/푸시).
- **아니오** → 안내만: 나중에 `origin_branch`에서 `/beaver:test` 실행.

그다음 다음 기능은 `/beaver:plan`(또는 `/beaver:fast`).

## 주의
승인 없이 실행 금지. `--no-verify`·force push는 명시 요청 시만(영향 고지).
