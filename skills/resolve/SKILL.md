---
name: resolve
description: 병합/리베이스 충돌을 해결한다. 충돌 양쪽 의도를 파악해 CLAUDE.md 규약대로 통합 후 승인받아 마무리. "충돌 해결", "merge conflict", "conflict" 요청, 또는 머지/리베이스/pull 충돌 시 발동.
---

# resolve — 병합 충돌 해결

발동: ① `/beaver:ship`(dam 병합)·`/beaver:release`(소스 병합)의 충돌 시 해당 skill 안에서 자동. ② 그 밖의 충돌(수동 rebase/pull/cherry-pick)은 직접 호출.

## 절차
0. **memory 먼저 읽기**: `.beaver/memory/`(MEMORY.md + 관련 토픽)를 읽어 통합 판단에 **최우선** 적용(memory > CLAUDE.md). 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
1. `git status`로 충돌 파일·현재 작업(merge/rebase/cherry-pick) 확인. 각 파일 마커 구간에서 ours/theirs 의도 파악(필요시 양쪽 로그).
2. 해결안:
   - 한쪽이 명백히 상위 → 채택.
   - 양쪽 유효 → `CLAUDE.md` 규약(네이밍·구조·에러처리)에 맞게 통합. 임의 폐기 금지.
   - 불확실/비즈니스 판단 필요 → 양쪽 의도 요약 후 사용자 선택.
3. 마커 제거 → `git diff --check` → `git add` → 전체 회귀 `commands.test`(`.beaver/config.json`; build의 기능별 `test_one`이 아니라 누적 전체)로 회귀 확인. 실패(red)면 중단하고 원인 수정 후 재시도(깨진 채 이어가지 않음).
4. 파일별 통합 내용 보고·승인 → 이어가기(merge면 커밋, rebase/cherry-pick이면 `--continue`). 위험하면 `--abort` 제시.

마커 제거가 끝이 아니라 **컴파일·테스트 통과까지가 완료**.
