---
name: test
description: 현재 체크아웃에서 전체 회귀 스위트(commands.test)를 실행한다. "전체 테스트", "회귀 테스트", "테스트 돌려", "test", "run tests", "regression" 요청에 발동. 독립 스킬 — ship에서 분리됨. 원격 리모트가 있는 실제 브랜치(예: ship 후 원래 브랜치)에서 돌리고, stick worktree 안에서는 돌리지 않는다.
---

# test — 전체 회귀 (독립)

프로젝트 **전체** 테스트 스위트(`commands.test`)를 1회 실행하고 보고한다. ship에서 분리한 단일 전체회귀 — 필요할 때 호출해 돌린다. build는 테스트를 작성만 하고 실행하지 않으므로, 누적된 테스트가 실제로 실행되는 곳이 이 스킬이다.

## 0. 전제 (깨지면 안내 후 중단)
- `.beaver/config.json` 존재 + `commands.test` 정의. 없으면 중단하고 `/beaver:analyze` 안내.
- **원격 리모트가 있는 브랜치에서 실행** — 현재 브랜치에 원격 추적 ref가 있어야 한다(`git rev-parse --abbrev-ref --symbolic-full-name @{u}` 또는 `git ls-remote --exit-code origin <branch>` 확인). 이는 **stick worktree**(로컬 전용 브랜치)를 의도적으로 배제한다: 회귀는 실제 개발자 체크아웃 — ship 후 원래 브랜치 — 에서 돌며, 그 체크아웃은 의존성이 설치돼 있다. 원격이 없으면 중단하고 원래 브랜치(보통 `/beaver:ship` 후)에서 돌리라고 안내, stick 안에서는 금지.
- 체크아웃에 의존성이 설치돼 있다고 가정한다(fresh 워크트리가 아니라 실제 브랜치). `commands.test`가 모듈 해석에서 실패하면 의존성을 설치(`commands.setup`/`npm ci` 등)하고 재시도 — 이 스킬 안에서 즉흥 처리하지 않는다.

## 1. 실행
현재 체크아웃에서 `commands.test` **전체**를 1회 실행한다. 이 프로젝트가 실제로 쓰는 러너를 쓴다. "test"가 꼭 단위 테스트일 필요는 없다(타입체크·빌드·다른 러너일 수 있음) — 설정된 커맨드를 그대로 쓴다.

## 2. 보고
- **green** → 전체 회귀 통과 보고(러너가 주면 스위트/건수 요약).
- **red** → 어떤 테스트가 실패했는지 정확히 보고(러너 출력 인용). 수정 경로는 해당 기능의 `/beaver:plan`→`/beaver:build`, 다시 ship 후 `/beaver:test` 재실행. 이 스킬 안에서 소스를 고치지 않는다 — 실행·보고만 한다.

memory(`.beaver/memory/`)는 실패를 프로젝트 규칙에 비춰 해석할 때만 읽는다. 그 외엔 아무것도 쓰지 않는다.
