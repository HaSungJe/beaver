---
name: ship
description: 누적된 stick 작업을 커밋·푸쉬하고 통합 브랜치(dam)에 병합한다. "커밋하고 푸쉬", "dam에 병합", "작업 마무리", "배포", "ship" 요청에 발동. 모든 단계 승인 후 실행.
---

# ship — 커밋 + 푸쉬 + dam 병합

plan→build로 stick에 쌓은 누적분을 한 번에 배포한다.

## 0. 전제
완료 작업(report) 또는 변경분이 있어야 함. 없으면 중단.

## 1. 커밋
`git status`/`diff` 확인 → 여러 기능이면 논리 단위로 커밋 분리 제안(`.beaver/output/plan|report` 경계 근거) → 메시지 자동 생성(`git log` 스타일 확인) → 스테이징+메시지 **승인 후** 커밋.

## 2. 푸쉬 & 병합
현재 브랜치가 `.beaver/.auto-branch-state.json` 키인지로 모드 판별.

**자동 브랜치 모드** — base = state lookup. 전체 계획 승인 후 순서대로:
1. stick 커밋(§1)
2. `git push -u origin <stick>`
3. base 체크아웃 (없으면 생성*)
4. `git pull`
5. `git merge <stick>` — **충돌 시 §충돌 해결 자동 수행**
6. `git push`
7. `git branch -d <stick>`(원격도 지울지 확인) + state 키 제거

*base 보장: 원격 `origin/<base>` 있으면 `git checkout -b <base> origin/<base>`, 없으면 메인라인에서 `git checkout -b <base>` 후 알림(첫 푸쉬 `-u`).

**일반 모드** — 대상 브랜치(기본 `dam`) 확인 후 `git push`. 통합 병합이 필요하면 위 3~6 동일.

### 충돌 해결 (병합 충돌 시 자동)
[resolve](../resolve/SKILL.md) 절차를 ship 안에서 수행: ours/theirs 의도 파악 → `CLAUDE.md` 규약대로 통합 → 마커 정리(`git diff --check`) → 테스트 → 사용자 승인 → 머지 커밋. 위험하면 `git merge --abort` 제시.

## 3. 보고
커밋·푸쉬·병합 결과. 다음 작업은 `/beaver:plan`.

## 주의
승인 없이 실행 금지. `--no-verify`·force push는 명시 요청 시만(영향 고지).
