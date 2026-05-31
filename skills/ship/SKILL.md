---
name: ship
description: >-
  여러 plan→build 작업을 마무리해 배포하는 큰 사이클의 마감 단계. 누적된 변경분을 커밋하고, 푸쉬하고,
  stick 브랜치를 dam(통합 브랜치)에 병합한다. "커밋하고 푸쉬", "dam에 병합", "작업 마무리", "배포",
  "ship", "commit and push" 같은 요청에 발동. 모든 단계는 사용자 승인 후에만 실행.
---

# Beaver — Ship (커밋 + 푸쉬 + dam 병합)

beaver의 **큰 사이클**을 닫는 단계. plan→build(작은 사이클)를 여러 번 돌려 stick 브랜치에 작업(통나무)을 쌓은 뒤, 그 누적분을 한 번에 **커밋 → 푸쉬 → dam 병합**한다.

> 브랜치 모델: 작업 브랜치 `stick/<domain>-<rand6>`(통나무) → 통합 브랜치 `dam`(댐). stick을 dam에 병합 = "댐에 통나무를 얹는다". 통합 브랜치명은 `.beaver/config.json` 의 `branch.integration` 으로 바꿀 수 있다(기본 `dam`).

> 작은 사이클(plan→build)은 코드를 구현·테스트만 하고 **커밋하지 않는다**. 커밋은 ship에서 일어난다.

## 0. 전제

- 완료된 작업이 하나 이상 있어야 한다(`.beaver/output/report/` 에 report 존재 또는 작업 트리에 변경분 존재).
- 변경분도, 푸쉬할 커밋도 전혀 없으면 진입하지 않고 중단·안내.

## 1. 변경 정리 & 커밋

1. `git status` + `git diff` 로 누적된 변경 전체를 파악한다.
2. 누적된 작업이 여러 기능이면 **논리 단위로 커밋을 나눌지** 제안한다(기능별 1커밋 권장 — `.beaver/output/plan|report` 의 기능 경계를 근거로). 사용자가 한 커밋을 원하면 묶는다.
3. 각 커밋 메시지를 변경 의도 기반으로 자동 생성(프로젝트 기존 스타일은 `git log` 로 확인 — Conventional Commits 여부·언어).
4. **스테이징 구성 + 커밋 메시지(들)를 사용자에게 확인**받는다. 승인 전엔 `git commit` 하지 않는다.
5. 승인되면 커밋. pre-commit 훅(있으면) 실패는 원인 보고하고 중단.

## 2. 푸쉬 & dam 병합

현재 브랜치가 `.beaver/.auto-branch-state.json` 의 키로 등록돼 있는지로 모드를 판별한다.

### 2-a. 자동 브랜치 모드 (등록돼 있음 — 일반적인 경우)

state에서 base 브랜치를 lookup(`{"stick/...": "dam"}` — plan 단계에서 보통 `dam`(=`branch.integration`)을 base로 기록). 아래 **전체 계획을 먼저 사용자에게 확인**받은 뒤 순서대로 진행한다:

1. **stick 커밋** — §1에서 정리한 대로 누적 변경을 논리 단위로 커밋(메시지 자동 생성 + 승인). stick 브랜치 위에서.
2. **stick 푸쉬** — `git push -u origin <stick>` (작업 백업 / PR 가능 상태로).
3. **base(dam) 체크아웃** — `git checkout <base>`. **로컬에 base 브랜치가 없으면 생성한다**(아래 [base 브랜치 보장] 참고).
4. **base 최신화** — `git pull` (원격의 다른 작업을 받아온다. 병합 충돌은 보통 여기서 갈린 변경 때문에 생긴다). 원격에 base가 없으면(방금 새로 만든 경우) 생략.
5. **stick 병합** — `git merge <stick>` (dam ← stick).
   - **충돌이 나면 [resolve](../resolve/SKILL.md) 절차를 곧바로(자동) 수행한다** — 별도 호출 없이 ship 안에서 이어서 해결한다. 충돌 파일의 ours/theirs 의도를 파악해 규약(`CLAUDE.md`)에 맞게 통합 → 마커 정리(`git diff --check`) → 테스트 확인 → 사용자에게 통합 내용 보고·승인 → `git commit`(머지 커밋 완료).
6. **base 푸쉬** — `git push` (병합 결과를 원격 dam에 반영).
7. **stick 삭제** — `git branch -d <stick>` (원격 stick도 지울지 사용자에게 확인: `git push origin --delete <stick>`) → state JSON에서 해당 키 제거.

위험하거나 충돌 범위가 크면 `git merge --abort` 로 되돌리는 선택지도 제시한다.

### 2-b. 일반 모드 (등록 안 됨)

base를 알 수 없으므로 대상 브랜치(기본 `dam`)와 절차를 먼저 확인받는다.

1. **현재 브랜치 푸쉬** — `git push`.
2. 별도 통합 브랜치(`dam`)로 병합이 필요하면 위 2-a의 2~5(체크아웃 → 최신화 → 병합 → 푸쉬)와 동일하게 진행 — **병합 중 충돌 시 resolve 절차 자동 수행**. 현재 브랜치가 이미 `dam`이면 1번으로 끝.

### base 브랜치 보장 (없으면 생성)

체크아웃 시 로컬에 base(`dam`) 브랜치가 없으면 다음 우선순위로 확보한다:

1. **원격에 있으면** — `git checkout -b <base> origin/<base>` (원격 추적 브랜치로 생성).
2. **원격에도 없으면(최초)** — 현재 stick의 분기점(또는 `main`/`master` 등 메인라인)에서 새로 만든다: `git checkout -b <base>`. 사용자에게 "`<base>` 통합 브랜치를 새로 생성했습니다"라고 알린다. 이 경우 4번(최신화)·이후 push는 첫 푸쉬이므로 `git push -u origin <base>` 로 원격에 올린다.

> 어느 커밋에서 base를 만들지 애매하면(분기점이 불분명) 사용자에게 확인한다.

## 3. 완료 보고

커밋·푸쉬·병합 결과를 사실대로 보고. 큰 사이클이 닫혔으면 다음 작업은 다시 `/beaver:plan` 부터.

## 주의

- 어떤 단계도 사용자 승인 없이 실행하지 않는다.
- `--no-verify`(훅 스킵)·force push는 사용자가 명시 요청할 때만, 영향(리모트 히스토리 덮어쓰기 등)을 먼저 알린다.

## 관련

- 이전: [build](../build/SKILL.md) · 충돌 시: [resolve](../resolve/SKILL.md) · 브랜치 생성: [plan](../plan/SKILL.md)
