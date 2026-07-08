---
name: ship
description: 누적한 작업을 커밋한다 — stick worktree면 원래 브랜치로 병합·푸쉬 후 worktree 파기, fast(워크트리 없음) 흐름이면 현재 브랜치에서 일반 커밋·푸쉬. "커밋하고 배포", "작업 마무리", "배포", "ship" 요청에 발동. 모든 단계 승인 후 실행.
---

# ship — 커밋 + 원래 브랜치 병합·푸쉬 + worktree 파기

plan→build(stick worktree) 또는 fast→build(현재 브랜치)로 쌓은 누적분을 대상 브랜치로 한 번에 배포한다.

## 0. 전제 + memory + 모드
진입 시 `.beaver/memory/`(MEMORY.md + 토픽)를 먼저 읽어 커밋 분리·리뷰에 **최우선** 적용한다(memory > CLAUDE.md > 기본). 완료 작업(report) 또는 변경분이 있어야 함. 없으면 중단.

**모드 판별**:
- **워크트리 모드** — cwd가 `.claude/worktrees/<stick>` 안이고 `.beaver/.auto-branch-state.json`에 현재 stick 키 존재 → 전체 흐름: §1 리뷰 → §2 커밋 → §3 병합/복귀/파기.
- **직접 모드 (fast)** — cwd가 메인 체크아웃(`.claude/worktrees/` 하위 아님): `/beaver:fast`→build가 현재 브랜치에 누적한 작업. `git branch --show-current` 비어 있으면 안 됨(detached HEAD → 중단). 흐름: §1 리뷰 → §2 커밋 → **§3-direct**(일반 푸쉬; 병합·worktree·파기 없음).

## 1. 코드 리뷰 (커밋 전)
build는 커밋 없이 누적하므로 ship 진입 시 stick 작업이 전부 미커밋 상태다 — 먼저 **stick base 대비 워킹트리 diff**를 리뷰해, §2 커밋이 리뷰 통과 상태를 담게 한다(fix-up 커밋 없음). **`.beaver/memory/` 규칙 + `CLAUDE.md` 규약·plan/spec 의도 대비 자가 리뷰**하고 결과를 문서로 남긴다:
- 규약 위반 점검 — memory 규칙(최우선) → 네이밍·구조·공통 로직 분리·에러처리·응답·테스트 강도.
- **data-access 스모크 커버리지 점검** — diff 가 매핑 민감 쿼리 구문(정의는 docs/testing.md "Data-Access 스모크")을 쓰는 data-access 메서드를 추가/수정했으면, 스모크 spec 이 동반됐는지와 새 매핑 민감 필드 도입 시 위험 매핑 스냅샷이 갱신됐는지 확인한다. 그런 메서드의 mock-only 커버는 지적 사항이다.
- **memory 반영(reconcile)** — `.beaver/memory/`에서 `CLAUDE.md 반영: 미반영` 엔트리를 훑어 CLAUDE.md/docs 정식 반영을 제안. 승인 시 해당 섹션 수정 + 엔트리를 `반영됨`으로 갱신(코드외 순수 선호는 `불필요`로 두고 memory 영속). 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **의도 동작 확인** — plan/spec 의도대로 구현됐는지(누락·오구현 없는지). 테스트 통과만으로 끝내지 않는다.
- **draft 규약 확정** — plan §4.5가 만든 draft 규약 문서(`<!-- beaver:draft ... -->` 마커)가 있으면 **실제 코드와 일치하는지 검증** 후 마커 제거·확정한다. 불일치면 문서를 코드에 맞춰 고친 뒤 확정. 병합으로 비로소 정식 규약이 된다.
- `${CLAUDE_PLUGIN_ROOT}/templates/review.md` 기반 **`.beaver/output/review/<stick>-review-<YYMMDD>.md`** 작성. `<stick>`은 브랜치명의 `/`→`-`(예: `stick/user-a3f9c2`→`stick-user-a3f9c2`), 도메인 무관·ship 단위 1개. 같은 날 재리뷰면 `-<N>`. 직접 모드에선 `<stick>` 자리에 현재 브랜치명을 같은 `/`→`-` 치환으로 쓴다.

§1 첫머리의 "stick base 대비"는 직접 모드에선 현재 브랜치 HEAD 대비로 읽는다 — build가 미커밋 누적했으므로 리뷰 대상은 그냥 워킹트리 diff(`git diff HEAD`)다.
- 발견 항목을 심각도와 함께 보고 → 사용자 판단: 수정 필요하면 `/beaver:build`로 고친 뒤 재리뷰, 통과면 커밋 진행. **승인 없이 커밋/병합으로 넘어가지 않는다.**

## 2. 커밋 (리뷰 후)
리뷰 통과한 결과를 커밋한다. `git status`/`diff` 확인 → 여러 기능이면 논리 단위로 커밋 분리 제안(`.beaver/output/plan|report` 경계 근거) → 메시지 자동 생성(`git log` 스타일 확인) → 스테이징+메시지 **승인 후** 커밋. §1에서 작성한 리뷰 문서도 함께 커밋된다.

## 3. 병합(worktree서) → 복귀 → fast-forward + push → 파기
**워크트리 모드 전용** — 직접 모드는 이 섹션을 건너뛰고 아래 §3-direct를 쓴다. **§1 코드리뷰·§2 커밋이 끝난 뒤** 진행한다. `origin_branch` = `.beaver/.auto-branch-state.json`에서 현재 stick 키에 매핑된 값(= 원래 작업 브랜치명). ship은 **테스트 스위트를 돌리지 않는다** — ship 후 `origin_branch`에서 `/beaver:test`로 배포 결과를 검증한다(원격·실제 의존성 보유).

**불변식**: `git worktree remove`는 `ExitWorktree`로 세션 cwd를 worktree 밖(`origin_branch` 디렉터리)으로 빼고 **검증한 뒤에만** 실행한다. Windows에선 살아있는 프로세스의 cwd 폴더는 삭제되지 않는다.

실질 병합/통합(과 충돌 해결)은 **worktree 안 stick 브랜치에서, 복귀 전에** 일어난다 — 기능 컨텍스트가 거기 있기 때문. 복귀 후 원래 브랜치는 fast-forward만 한다. stick은 항상 최신 스키마이고 원래 브랜치를 **전진**만 시키므로 옛 스키마 체크아웃 위험이 없다. 승인 후 순서대로:

1. **origin 최신을 stick에 편입(worktree 안)** — 아직 stick worktree 안, stick 브랜치에서: 원격 추적 있으면 `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>`로 대상 최신을 stick에 편입(충돌 시 아래 「충돌 해결」 인라인 — 기능 컨텍스트가 여기 있다). 이제 stick은 origin 최신 + 누적 작업 전부를 담은 깨끗한 전진 상태다. (`origin_branch`에 원격이 없으면 fetch/merge 생략 — stick이 이미 그 후손이다.)
2. **복귀 (ExitWorktree — 필수 + 검증)** — `ExitWorktree(action: keep)` 호출로 세션을 worktree 밖으로 뺀다. **`cd`/`Set-Location`로 대체 금지** — 세션을 밖으로 빼는 건 오직 `ExitWorktree`뿐. Windows에선 하니스가 매 명령 후 cwd를 worktree로 재고정하므로(`Shell cwd was reset to ...`) `cd main` 해도 소용없다. **호출 직후 검증**: cwd가 `.claude/worktrees/<stick>` 하위가 아닌지 확인. 아직 내부면 **4번 진행 금지** — `ExitWorktree(action: keep)` 재시도(추적 세션이면 성공). 재개/요약된 세션은 "no active session"으로 no-op일 수 있음; 재시도 후에도 내부면 하니스가 세션을 그 폴더에 고정한 것(4번 폴백 참조). 밖으로 나간 뒤(cwd가 `origin_branch`) `pre_ff = git rev-parse HEAD` 기록(push 전에 로컬 fast-forward를 되돌려야 하면 `git reset --hard` 할 지점).
3. **fast-forward + push** — `git merge --ff-only <stick>`로 `origin_branch`를 stick으로 전진시킨다. 1번에서 stick이 이미 origin 최신을 편입했으므로 **fast-forward가 보장**되어 여기선 충돌이 불가능하다. 이어 `git push origin <origin_branch>`(첫 발행이면 `-u`). *그 사이 origin이 또 전진해 `--ff-only`가 거부되면 `/beaver:ship`을 재실행 — 1번이 새 origin을 먼저 편입한다.*
4. **파기** — **선행조건: 2번 ExitWorktree 성공 + cwd가 `.claude/worktrees/<stick>` 밖임을 검증.** `git worktree remove`는 어떤 세션 셸도 worktree를 cwd로 갖지 않을 때만 실행한다. Windows에선 살아있는 프로세스의 cwd 디렉터리를 OS가 삭제 거부하므로(`The process cannot access the file ... being used by another process`) 제거 *전에* 세션이 밖에 있어야 한다 — 아니면 git 등록만 풀리고 폴더는 자기잠금으로 남는다. 순서: `git worktree remove .claude/worktrees/<stick>` → `git branch -d <stick>` → state에서 키 제거 → 디렉터리가 실제로 사라졌는지 확인(git 등록은 풀렸는데 폴더가 남으면 `Remove-Item`으로 정리 — 세션이 밖에 있으면 성공). **폴백(하니스 고정 세션)**: `ExitWorktree`가 세션을 못 빼고(no-op) cwd가 여전히 내부면, `git worktree remove`는 등록만 해제하고 디렉터리는 이 세션에서 삭제 불가 — 외부 터미널/세션 종료 후 정리해야 함을 사용자에게 보고한다. *(대안: ff+push 후 파기를 `ExitWorktree(action: "remove", discard_changes: true)`에 위임 — 세션을 먼저 밖으로 뺀 뒤 제거하므로 자기잠금을 구조적으로 회피. 단 ff-only가 stick 브랜치를 필요로 하므로 ff+push 이후여야 함.)*

## 3-direct. 푸쉬 (직접 모드 — worktree 없음)
**§1 코드리뷰·§2 커밋이 끝난 뒤에만** 진행한다. `branch = git branch --show-current`. ship은 **테스트 스위트를 돌리지 않는다** — ship 후 `/beaver:test`로 검증한다(이미 의존성 갖춘 실제 브랜치 위다).

1. **origin 최신 편입** — 원격 추적이 있으면 `git fetch origin <branch>` → `git merge origin/<branch>`(충돌 시 아래 「충돌 해결」 인라인; 승인 후 머지 커밋). 원격 추적 없으면 생략.
2. **푸쉬** — `git push origin <branch>`(첫 발행이면 `-u`). worktree가 없으니 복귀·파기할 것도 없다.

이후 §4로 이어진다.

### 충돌 해결 (병합 충돌 시 인라인 자동)
별도 스킬 없이 ship 안에서 직접 수행한다:
1. **양쪽 의도 파악** — 충돌 hunk마다 ours(현재 브랜치)/theirs(stick 또는 origin) 변경 의도를 코드·plan/spec 근거로 파악.
2. **규약대로 통합** — `.beaver/memory/` 규칙(최우선) + `CLAUDE.md` 규약에 맞게 양쪽 의도를 보존하며 통합. 한쪽 버리기 금지(둘 다 의미 있으면 합친다).
3. **마커 정리** — `git diff --check` 로 충돌 마커 잔여 0 확인.
4. **검증** — 해결한 hunk를 읽어 통합이 일관되는지 확인. 테스트 실행은 ship 후 `origin_branch`에서 `/beaver:test`로 미룬다.
5. **승인 후 머지 커밋** — 사용자에게 통합 결과 보고 후 승인받아 커밋. 위험하면 `git merge --abort` 제시.

## 4. 보고 + 테스트 제안
커밋·리뷰·병합/푸쉬 결과 보고. cwd는 이제 배포된 브랜치 위다 — 워크트리 모드는 파기 후 `origin_branch`, 직접 모드는 처음부터 현재 브랜치 — remote가 있고 의존성이 설치된 상태, 즉 `/beaver:test`의 전제조건(test §0)과 정확히 일치. 따라서 **여기서 바로 사용자에게 회귀 테스트를 지금 실행할지 묻고**, 승인 시 같은 세션에서 즉시 `/beaver:test` 실행(브랜치 전환 불필요):

- **예** → 지금 `/beaver:test` 실행(red 시 자가 치유 → 확인 후 수정 커밋/푸시).
- **아니오** → 안내만 남김: 나중에 `origin_branch`에서 `/beaver:test`로 배포 결과 검증.

그다음 다음 기능은 `/beaver:plan`(또는 `/beaver:fast`).

## 주의
승인 없이 실행 금지. `--no-verify`·force push는 명시 요청 시만(영향 고지).
