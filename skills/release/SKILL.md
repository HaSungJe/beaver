---
name: release
description: 로컬 통합 브랜치(dam)에 모인 누적분을 선택한 소스 브랜치로 병합·푸쉬하고 로컬 dam을 삭제한다. "dam 방류", "릴리즈", "메인에 반영", "dam 내보내기", "release" 요청에 발동. 모든 단계 승인 후 실행.
---

# release — dam 방류 (소스 병합 + dam 삭제)

ship으로 `dam`에 모은 통합분을 선택한 브랜치(기본 = dam을 복제한 소스)로 흘려보내고 로컬 `dam`을 없앤다. 브랜치 모델: 소스 원격 브랜치 → `dam`(로컬 복제, plan이 생성) → `stick/*`(dam 분기) → ship(stick→dam) → release(dam→소스 + dam 삭제).

> 이 문서의 `dam`은 모두 `.beaver/config.json`의 `branch.integration` 값(기본 `dam`)을 가리킨다 — 커스텀명이면 그 이름으로 치환해 읽는다(`git merge <integration>`, `git branch -d <integration>`).

## 0. 전제 + memory
- 진입 시 `.beaver/memory/`(MEMORY.md + 토픽)를 먼저 읽어 리뷰·reconcile에 최우선 적용(memory > CLAUDE.md > 기본).
- 로컬 `dam`(= `branch.integration`) 존재해야 함. 없으면 중단(먼저 `/beaver:plan`→`build`→`ship`).
- dam에 대상 브랜치 대비 변경분 있어야 함. 없으면 중단.

## 1. 전체 코드 리뷰 (병합 전)
dam 누적분(대상 브랜치 대비 diff)을 **`.beaver/memory/` 규칙 + `CLAUDE.md` 규약·plan/spec 의도 대비 자가 리뷰**하고 결과를 문서로 남긴다(ship 코드 리뷰와 동일 강도):
- 규약 위반 점검 — memory 규칙(최우선) → 네이밍·구조·공통 로직 분리·에러처리·응답·테스트 강도.
- **memory 반영(reconcile)** — `.beaver/memory/`에서 `CLAUDE.md 반영: 미반영` 엔트리를 훑어 CLAUDE.md/docs 정식 반영을 제안. 승인 시 해당 섹션 수정 + 엔트리를 `반영됨`으로 갱신(코드외 순수 선호는 `불필요`로 두고 memory 영속). 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **의도 동작 확인** — plan/spec 의도대로 구현됐는지(누락·오구현 없는지).
- **draft 규약 잔여 확정** — dam에 `<!-- beaver:draft -->` 마커가 남은 규약 문서가 있으면(ship에서 미확정됐거나 stick 없이 dam에 들어간 경우) 코드와 일치 검증 후 마커 제거·확정한다.
- `${CLAUDE_PLUGIN_ROOT}/templates/review.md` 기반 **`.beaver/output/review/dam-release-<YYMMDD>.md`** 작성. 같은 날 재리뷰면 `-<N>`.
- 발견 항목을 심각도와 함께 보고 → 사용자 판단: 수정 필요하면 `/beaver:build`로 고친 뒤 재시도, 통과면 병합 진행. **승인 없이 병합으로 넘어가지 않는다.**

## 2. 대상 브랜치 선택
- `.beaver/.dam-state.json`의 `source`를 **기본값**으로 제시. 파일이 없으면 감지된 mainline(`main`/`master` 등)을 후보로.
- 로컬/원격 브랜치 목록(`git branch -a`)도 함께 보여주고 런타임에 변경 가능.
- **검증**: 선택 브랜치가 `dam`(= `branch.integration`)이면 거부(자기 자신에 병합 불가). 원격 추적 가능한 브랜치를 권장.

## 3. 병합 + 전체 회귀
**대상 브랜치를 체크아웃하지 않는다 — dam 위에 선 채로 대상을 dam으로 끌어와 병합한다.** 대상 체크아웃은 워킹트리를 옛 스키마로 되돌려 DB 자동싱크(예: ORM `synchronize`·migration watcher)를 유발하고 컬럼 데이터를 날릴 수 있으므로 금지. 충돌 해결·회귀 모두 최신 스키마인 dam 워킹트리에서 수행한다.
1. **dam에 선 상태 확인** — `git checkout dam`(이미 dam이면 no-op). 대상 브랜치는 끝까지 체크아웃하지 않는다.
2. `git fetch origin <대상>` — 원격 추적 있을 때 대상 최신 ref 갱신.
3. `git merge origin/<대상>` — 대상 신규 커밋을 **dam으로** 병합. **충돌 시 §충돌 해결 자동 수행**(dam 워킹트리에서). 원격 추적 없으면 생략.
4. **전체 회귀 테스트** — dam에서 `commands.test` 실행. **green이어야 §4(푸쉬) 진행.** 실패하면 중단하고 원인 수정(`/beaver:build`) 후 재시도 — 깨진 채로 원격에 발행하지 않는다. (build는 기능별 `test_one`만 보므로, 누적된 전체 기능의 회귀를 여기서 처음 한 번에 검증한다.)

## 4. 푸쉬
- **`git push origin dam:<대상>`** — dam이 §3에서 `origin/<대상>`을 병합했으므로 FF push. 대상 로컬 체크아웃 0회. 원격 추적 첫 발행이면 `git push -u origin dam:<대상>`.
- **`dam`은 자기 이름으로는 절대 push 하지 않는다**(로컬 전용). `dam:<대상>` refspec으로 대상 브랜치에만 반영.
- 로컬 `<대상>` 브랜치가 있다면(체크아웃 없이) `git fetch . dam:<대상>`로 ref만 FF 갱신 가능 — 선택. (release가 §5에서 dam을 지우므로 필수는 아님.)

## 5. dam 삭제
- **먼저 dam에서 벗어나야 함**(현재 브랜치는 삭제 불가). 대상으로 옮기되 **트리가 dam과 동일하도록** 옮겨 스키마 변동을 0으로 만든다: `git checkout -B <대상> dam`(로컬 `<대상>`을 dam 커밋으로 두고 체크아웃 — 워킹트리 무변동 → DB 싱크 안 터짐). dam 외 다른 브랜치로 옮기면 옛 스키마라 싱크 위험.
- `git branch -d dam`(로컬만). 병합됐으므로 `-d`로 안전. merge 안 된 변경 경고 시 사용자 확인.
- 원격 dam 미조작(애초에 없음).
- `.beaver/.dam-state.json` 제거(다음 plan이 소스를 다시 묻도록).

## 6. 보고
리뷰·대상·병합·푸쉬·삭제 결과. 다음 작업은 `/beaver:plan`(소스 브랜치에서 dam 새로 생성).

### 충돌 해결 (병합 충돌 시 자동)
[resolve](../resolve/SKILL.md) 절차를 release 안에서 수행: ours/theirs 의도 파악 → `CLAUDE.md` 규약대로 통합 → 마커 정리(`git diff --check`) → 테스트 → 사용자 승인 → 머지 커밋. 위험하면 `git merge --abort` 제시.

## 주의
승인 없이 실행 금지. `--no-verify`·force push는 명시 요청 시만(영향 고지).
