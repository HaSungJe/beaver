---
name: fast
description: plan과 동일하게 기능을 기획하되 stick worktree 없이 — 문서가 현재 브랜치에 바로 쌓인다. "빠른 기획", "워크트리 없이 기획", "fast plan", "현재 브랜치에서 기획", "fast <기능명>" 요청에 발동. 신규/변경 자동 판별. analyze가 만든 CLAUDE.md 규약이 있어야 동작.
---

# fast — 워크트리 없는 plan (현재 브랜치에서 바로)

기획 절차는 `/beaver:plan`과 전부 동일하고, **stick worktree만 만들지 않는다**: 모든 작업이 현재 체크아웃된 브랜치, 현재 작업 디렉터리에서 일어난다. 이후 `/beaver:build`도 그 자리에서 누적하고, `/beaver:ship`은 **직접 모드** — 현재 브랜치에서 일반 커밋 + 푸쉬(병합·worktree 파기 없음)로 동작한다.

## 실행 방법
`${CLAUDE_PLUGIN_ROOT}/skills/plan/SKILL.md`를 **아래 오버라이드와 함께** 그대로 수행한다. 오버라이드하지 않은 섹션은 전부 원문 그대로 적용 — 모드 판별(§1), 진행 중 타 영역 요청(§1.5), 신규 모드(§3), 변경 모드(§4), 규약 영역 보강(§4.5), 보고(§5).

1. **§0 (전제)** — 그대로 적용하되, **`worktree.baseRef` 시드는 통째로 생략**(워크트리를 안 만드니 불필요; `.claude/settings.json`을 쓰지 않는다).
2. **§2 (워크트리 진입) — 대체**:
   - `EnterWorktree`를 호출하지 **않는다**. 워크트리도, stick 브랜치도, `.beaver/.auto-branch-state.json` 기록도 없다.
   - `git branch --show-current`가 비어 있으면 안 된다 — ship이 커밋 + 푸쉬할 대상 브랜치다. 빈값(detached HEAD)이면 중단하고 브랜치 체크아웃 안내.
   - cwd가 이미 stick worktree 안(`.claude/worktrees/<stick>`)이면 중단 — fast는 메인 체크아웃용이다. 그 stick은 `/beaver:ship`으로 마무리하거나, 거기서는 계속 `/beaver:plan`을 쓴다.
   - 한 줄로 알린다: "fast 모드 — 워크트리 없음; `<브랜치>`에서 바로 작업; ship은 여기서 커밋 + 푸쉬."
   - 이어서 plan §2 말미와 동일하게 **memory 먼저 읽기**: `.beaver/memory/`(MEMORY.md + 관련 토픽)를 최우선 반영(memory > CLAUDE.md).
3. **모든 쓰기**(spec / plan / revision / memory / draft 규약 문서)가 현재 브랜치에 바로 들어간다 — 격리 없음. 같은 체크아웃에서의 병렬 세션은 충돌한다; fast가 감수하는 tradeoff다. 격리·병렬 작업이 중요하면 `/beaver:plan`을 쓴다.

## 이후 단계 (직접 모드)
- `/beaver:build` — 메인 체크아웃의 `.beaver/output/`에서 plan을 찾아 현재 브랜치 **그 자리에서** 작업한다(build §0 직접 모드). 테스트 실행 정책은 동일: build는 여전히 테스트를 작성만 하고 실행하지 않는다 — 실행은 `/beaver:test`.
- `/beaver:ship` — 직접 모드: 코드 리뷰 → 커밋 → 현재 브랜치 푸쉬. 병합 단계도, worktree 파기도 없다(ship §0 / §3-direct).

## 5. 보고
plan §5와 동일하되, fast(워크트리 없음) 흐름임을 덧붙인다: "검토 후 `/beaver:build`" — ship은 현재 브랜치를 바로 커밋 + 푸쉬한다.
