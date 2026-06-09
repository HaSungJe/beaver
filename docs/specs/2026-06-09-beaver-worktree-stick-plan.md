# beaver worktree-stick 모델 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** beaver를 dam/release/resolve 없는 worktree-stick 모델로 전환 — stick을 `.claude/worktrees/`에 격리해 병렬 세션 작업을 가능케 하고, ship이 원래 브랜치로 직접 병합·푸쉬한다.

**Architecture:** CC 네이티브 `EnterWorktree`/`ExitWorktree`(세션 cwd 전환)에 위임. plan이 현재 HEAD에서 stick worktree를 만들고(baseRef=head) 원래 브랜치명을 state에 기록 → build는 worktree 안에서 TDD → ship이 전체회귀·복귀·전진병합·push·파기. release/resolve는 ship에 흡수·삭제.

**Tech Stack:** Claude Code 플러그인(마크다운 SKILL.md 지시문), Node 스크립트(hooks), git worktree. "테스트"는 코드 단위테스트가 아니라 **참조 일관성 검증**(grep으로 stale 참조 0 확인) + `node scripts/validate-plan.js` 통과로 대신한다.

**근거 spec:** `docs/specs/2026-06-09-beaver-worktree-stick-design.md`

---

## 파일 구조 (생성/수정/삭제)

| 파일 | 책임 | 조치 |
|------|------|------|
| `skills/plan/SKILL.md` | 기획: worktree 진입 + 병렬분석 + 대화형 + spec/plan | 수정 |
| `skills/build/SKILL.md` | 구현: 준비 병렬 + TDD 순차 | 수정 |
| `skills/ship/SKILL.md` | 배포: 회귀+복귀+전진병합+push+파기+충돌 인라인 | 재작성 |
| `skills/release/SKILL.md` | (제거) | **삭제** |
| `skills/resolve/SKILL.md` | (ship 인라인으로 흡수) | **삭제** |
| `skills/analyze/SKILL.md` | config 스키마(dam 제거) | 수정 |
| `templates/CLAUDE.template.md` | 사용자 CLAUDE.md 골격의 흐름/명령표 | 수정 |
| `templates/review.md` | 리뷰 산출물 골격 | 수정 |
| `templates/memory-protocol.md` | 스킬 목록·reconcile 지점 | 수정 |
| `scripts/self-heal.js` | 단위통과 메시지 텍스트 | 수정 |
| `.gitignore` | dam-state 제거 + worktrees 무시 | 수정 |
| `README.md` | 모델 설명·흐름·스킬 목록 | 수정 |
| `.claude-plugin/plugin.json` | description 문구 | 수정 |
| `.claude-plugin/marketplace.json` | description 문구 | 수정 |

검증 명령(반복 사용):
- 참조 일관성: `git grep -niE 'dam|integration|/beaver:(release|resolve)' -- ':!docs/specs/'` → 의도된 잔여 외 0건이어야 함.
- 플랜 validator: `node scripts/validate-plan.js <plan.md 경로>` (analyze/plan 변경 후 회귀 확인용 — 임의 샘플 플랜으로).

---

## Stage 1 — 워크트리 기반 골격

### Task 1: settings.json `worktree.baseRef=head` 자동 설치를 plan에 추가

**Files:**
- Modify: `skills/plan/SKILL.md` (§2 상단)

- [ ] **Step 1: plan §0 전제에 settings 보장 항목 추가**

`skills/plan/SKILL.md` 의 `## 0. 전제` 블록 끝에 다음 줄 추가:

```markdown
- **워크트리 설정 보장**: `.claude/settings.json`에 `worktree.baseRef`가 `"head"`인지 확인하고, 없거나 다르면 `"head"`로 설정(merge-patch, 다른 키 보존). 이래야 EnterWorktree가 현재 체크아웃 HEAD에서 stick을 분기한다(기본값 `fresh`는 origin/기본브랜치라 develop 등 누락).
```

- [ ] **Step 2: 검증**

Run: `git grep -n 'worktree.baseRef' -- skills/plan/SKILL.md`
Expected: 1건 매치 (위 추가 줄).

- [ ] **Step 3: 커밋**

```bash
git add skills/plan/SKILL.md
git commit -m "$(printf '2026-06-09\n\n- plan 전제에 worktree.baseRef=head 자동 설치 추가')"
```

---

### Task 2: plan §2 브랜치 로직을 worktree 진입으로 교체

**Files:**
- Modify: `skills/plan/SKILL.md` (§2 전체)

- [ ] **Step 1: 기존 §2 "브랜치" 섹션 전체를 아래로 교체**

`skills/plan/SKILL.md` 의 `## 2. 브랜치` 섹션(현재 dam/stick 로직 전부)을 다음으로 **통째 교체**:

```markdown
## 2. 워크트리 진입 (stick 격리)
plan 시작 시 stick을 `.claude/worktrees/`에 격리하고 세션을 그리로 옮긴다 — 현재 작업 디렉터리는 그대로 둔다(병렬 세션 가능).

- **이미 stick worktree 안이면**(현재 cwd가 `.claude/worktrees/<stick>` 이고 state에 키 존재) → 그대로 누적(새로 안 만듦).
- 아니면:
  1. `origin_branch = git branch --show-current` — ship이 되돌릴 대상. 빈값(detached)이면 중단하고 브랜치 체크아웃 안내.
  2. stick 이름 = `<stick_prefix>/<domain>-<rand6>` (기본 `stick/...`). 도메인은 기능명/요청에서 추출.
  3. `EnterWorktree(name=<stick>)` 호출 → CC가 `.claude/worktrees/<stick>` 생성 + 세션 cwd 전환(base=현재 HEAD, §0의 baseRef=head).
  4. `.beaver/.auto-branch-state.json`에 `{ "<stick>": "<origin_branch>" }` 기록.

생성한 worktree·stick·origin_branch를 한 줄로 알린다. stick·worktree 모두 로컬 전용 — 원격 push는 ship에서만.
```

- [ ] **Step 2: §2를 참조하던 §4.5 문구 정합 확인·수정**

`skills/plan/SKILL.md` §4.5 의 마지막 줄 "편집은 현재 **stick 브랜치**에서 일어나…" 는 여전히 유효(stick worktree 안). 변경 불필요 — 읽어서 확인만.

- [ ] **Step 3: 검증 — dam 참조 제거 확인**

Run: `git grep -niE 'dam|integration' -- skills/plan/SKILL.md`
Expected: 0건.

- [ ] **Step 4: 커밋**

```bash
git add skills/plan/SKILL.md
git commit -m "$(printf '2026-06-09\n\n- plan 2장 dam 로직 제거, EnterWorktree 진입+origin_branch 기록으로 교체')"
```

---

### Task 3: ship을 worktree 복귀·전진병합·push·파기로 재작성

**Files:**
- Modify: `skills/ship/SKILL.md` (§3 병합 + §0/§2 dam 전제)

- [ ] **Step 1: ship §3 "병합" 섹션 전체를 아래로 교체**

`skills/ship/SKILL.md` 의 `## 3. 병합` 섹션(자동/일반 모드 2분기 전부)을 다음으로 **통째 교체**:

```markdown
## 3. 복귀 + 전진 병합 + push + 파기
`.beaver/.auto-branch-state.json`에서 현재 stick의 `origin_branch`를 읽는다. 키가 없으면 중단(plan으로 만든 stick worktree에서만 동작).

stick worktree는 항상 최신 스키마이고 원래 브랜치로 **전진** 병합만 하므로, 옛 스키마 체크아웃에 의한 DB 자동싱크 위험이 없다. 전체 계획 승인 후 순서대로:

1. **커밋**(§1) — stick worktree 안에서.
2. **전체 회귀** — `commands.test` 전체 실행(§3 회귀, 아래 「## 2.5」). green이어야 진행.
3. **`ExitWorktree`** — 세션 cwd가 원래 repo 디렉터리(`origin_branch`)로 복귀. worktree·stick 브랜치 ref는 남는다.
4. **전진 병합** — 복귀한 디렉터리에서:
   - 원격 추적 있으면 `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>` 로 대상 최신을 현재 브랜치에 편입(충돌 시 §충돌 해결 인라인 수행).
   - `git merge <stick>` 으로 stick을 현재 브랜치에 전진 병합(충돌 시 §충돌 해결 인라인 수행).
5. **push** — `git push origin <origin_branch>`. 원격 추적 첫 발행이면 `-u`.
6. **파기** — `git worktree remove .claude/worktrees/<stick>` → `git branch -d <stick>` → state에서 키 제거.
```

- [ ] **Step 2: ship §0/머리말에서 dam 전제 제거**

`skills/ship/SKILL.md` 머리말(2-8행)과 §0의 dam 관련 문구(13행 회귀 주석, dam 보장 각주 등)를 정리:
- 머리말 "dam 로컬 병합" → "원래 브랜치 병합".
- "회귀를 직접 돌리지 않는다 … release 직전에 1회" 주석(13행)을 **삭제**(이제 ship이 전체회귀 수행 — Task 4에서 §2.5 신설).
- "*dam 보장: …" 각주(38행) **삭제**.

- [ ] **Step 3: 검증**

Run: `git grep -niE 'dam' -- skills/ship/SKILL.md`
Expected: 0건. (충돌 해결 섹션은 Task 5에서 인라인 — 이 시점엔 아직 resolve 참조 남아있어도 OK.)

- [ ] **Step 4: 커밋**

```bash
git add skills/ship/SKILL.md
git commit -m "$(printf '2026-06-09\n\n- ship 재작성: ExitWorktree 복귀+전진병합+push+worktree 파기, dam 제거')"
```

---

### Task 4: ship에 전체회귀(§2.5) 신설 + analyze config 스키마 + .gitignore

**Files:**
- Modify: `skills/ship/SKILL.md` (§2.5 신설)
- Modify: `skills/analyze/SKILL.md` (§4 config)
- Modify: `.gitignore`

- [ ] **Step 1: ship §2 코드리뷰 뒤에 §2.5 전체회귀 추가**

`skills/ship/SKILL.md` 의 `## 2. 코드 리뷰` 섹션 끝과 `## 3.` 사이에 추가:

```markdown
## 2.5 전체 회귀 (병합 전, release에서 흡수)
원래 브랜치로 병합하기 전 stick worktree에서 `commands.test` **전체**를 1회 실행한다. build는 기능별 `test_one`만 보므로, 누적 기능 전체의 회귀를 여기서 처음 검증한다. **green이어야 §3 진행.** 실패 시 중단하고 원인 수정(`/beaver:build`) 후 재시도 — 깨진 채로 병합·push하지 않는다.
```

- [ ] **Step 2: analyze §4 config에서 dam 제거**

`skills/analyze/SKILL.md` §4:
- 코드 블록(66행) `"branch": { "integration": "dam", "stick_prefix": "stick" }` → `"branch": { "stick_prefix": "stick" }` 로 교체.
- `branch.integration` 설명 문단(72행 전체)을 다음으로 교체:

```markdown
**`branch.stick_prefix`는 stick 브랜치/워크트리 접두(기본 `stick`)다.** plan이 `<stick_prefix>/<domain>-<rand6>` 으로 `.claude/worktrees/`에 stick을 격리 생성한다. 통합 브랜치(dam) 개념은 없다 — ship이 stick을 plan 시점의 원래 브랜치로 직접 병합·push한다.
```

- [ ] **Step 3: .gitignore 갱신**

`.gitignore` 13행 `.beaver/.dam-state.json` 을 삭제하고, 다음 줄 추가:

```
.claude/worktrees/
```

- [ ] **Step 4: 검증**

Run: `git grep -niE 'dam|integration' -- skills/analyze/SKILL.md skills/ship/SKILL.md .gitignore`
Expected: 0건.

- [ ] **Step 5: 커밋**

```bash
git add skills/ship/SKILL.md skills/analyze/SKILL.md .gitignore
git commit -m "$(printf '2026-06-09\n\n- ship 전체회귀(2.5) 신설, analyze config dam 제거, gitignore worktrees 추가')"
```

---

## Stage 2 — release/resolve 제거 + ship 인라인 흡수

### Task 5: resolve 절차를 ship 충돌해결 섹션에 인라인

**Files:**
- Modify: `skills/ship/SKILL.md` (§충돌 해결)

- [ ] **Step 1: ship의 충돌 해결 섹션을 자기완결로 교체**

`skills/ship/SKILL.md` 의 `### 충돌 해결 (병합 충돌 시 자동)` 섹션(현재 resolve 링크 참조)을 다음으로 **통째 교체**:

```markdown
### 충돌 해결 (병합 충돌 시 인라인 자동)
별도 스킬 없이 ship 안에서 직접 수행한다:
1. **양쪽 의도 파악** — 충돌 hunk마다 ours(현재 브랜치)/theirs(stick 또는 origin) 변경 의도를 코드·plan/spec 근거로 파악.
2. **규약대로 통합** — `.beaver/memory/` 규칙(최우선) + `CLAUDE.md` 규약에 맞게 양쪽 의도를 보존하며 통합. 한쪽 버리기 금지(둘 다 의미 있으면 합친다).
3. **마커 정리** — `git diff --check` 로 충돌 마커 잔여 0 확인.
4. **테스트** — 해당 기능 `commands.test_one`(가능하면 관련 회귀) 실행해 통합 결과 검증.
5. **승인 후 머지 커밋** — 사용자에게 통합 결과 보고 후 승인받아 커밋. 위험하면 `git merge --abort` 제시.
```

- [ ] **Step 2: 검증 — resolve 참조 제거 확인**

Run: `git grep -niE 'resolve' -- skills/ship/SKILL.md`
Expected: 0건.

- [ ] **Step 3: 커밋**

```bash
git add skills/ship/SKILL.md
git commit -m "$(printf '2026-06-09\n\n- ship 충돌해결 인라인화(resolve 흡수)')"
```

---

### Task 6: release·resolve 스킬 삭제

**Files:**
- Delete: `skills/release/SKILL.md`
- Delete: `skills/resolve/SKILL.md`

- [ ] **Step 1: 두 스킬 디렉터리 삭제**

```bash
git rm -r skills/release skills/resolve
```

- [ ] **Step 2: 검증 — 어떤 파일도 두 스킬을 트리거/참조 안 함**

Run: `git grep -niE '/beaver:(release|resolve)|skills/(release|resolve)' -- ':!docs/specs/'`
Expected: 0건. (남으면 Task 7에서 처리할 템플릿/README 참조 — 이 단계 후 0이어야 정상.)

- [ ] **Step 3: 커밋**

```bash
git commit -m "$(printf '2026-06-09\n\n- release/resolve 스킬 삭제 (역할 ship 흡수)')"
```

---

### Task 7: 템플릿·README·manifest의 dam/release/resolve 참조 제거

**Files:**
- Modify: `templates/CLAUDE.template.md` (23-25, 28, 29, 32)
- Modify: `templates/review.md` (3-4, 7)
- Modify: `templates/memory-protocol.md` (3, 58)
- Modify: `scripts/self-heal.js` (7, 73)
- Modify: `README.md`
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`

- [ ] **Step 1: CLAUDE.template.md 명령표·흐름 교체**

23-25행 명령표를:
```markdown
| 배포 | `/beaver:ship` | "커밋하고 배포", "작업 마무리" |
```
(충돌해결·방류 두 행 삭제.)

28행 흐름 문장을 교체:
```markdown
**흐름**: 작업하던 브랜치(main/develop 등)에서 `plan`이 `.claude/worktrees/`에 `stick`을 격리 생성하고 세션을 그리로 옮긴다 → `build`(TDD 구현, 커밋 안 함) 누적 → `ship`이 커밋·코드리뷰·전체회귀 후 원래 브랜치로 복귀·전진병합·push하고 worktree를 파기한다(병합 충돌은 ship이 인라인 해결). **stick·worktree는 로컬 전용** — push는 ship에서 원래 브랜치로만.
```

29행 산출물 경로 문장의 `review는 stick 단위 flat` 유지(변경 없음). 32행 dam 주석(HTML 주석) **삭제**.

- [ ] **Step 2: review.md 골격 교체**

3-4행을:
```markdown
> 병합 전 코드 리뷰. 누적 변경분을 memory 규칙·CLAUDE.md 규약·plan/spec 의도 대비 점검.
> 위치: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md`(stick = 브랜치명 `/`→`-`, ship 단위 1개). 같은 날 재리뷰면 `-<N>`.
```
7행 `- stick: {stick} → base: {base}` → `- stick: {stick} → origin: {origin_branch}`.

- [ ] **Step 3: memory-protocol.md 스킬 목록·지점 교체**

3행 `모든 skill(analyze/plan/build/refactor/resolve/ship/release)이` → `모든 skill(analyze/plan/build/refactor/ship)이`.
58행 `**ship**·**release** 코드리뷰 단계, **analyze** 재생성 시:` → `**ship** 코드리뷰 단계, **analyze** 재생성 시:`.

- [ ] **Step 4: self-heal.js 메시지 텍스트 교체**

7행 주석 `full regression is deferred to release.` → `full regression is deferred to ship.`
73행 `(전체 회귀는 release에서)` → `(전체 회귀는 ship에서)`.

- [ ] **Step 5: README.md 갱신**

README의 모델/흐름/스킬 설명에서 dam·release·resolve를 제거하고 worktree-stick 모델로 갱신한다. 최소:
- 스킬 목록에서 release/resolve 행 삭제.
- 흐름 다이어그램/문장을 CLAUDE.template.md Step 1과 동일 모델로.
- "automatic merge-conflict resolution"은 "ship 인라인 충돌 해결"로 표현.

수정 후 검증으로 잔여 확인(Step 7).

- [ ] **Step 6: manifest description 문구 교체**

`.claude-plugin/marketplace.json` 의 plugin description 중 `…ship, and release — with automatic merge-conflict resolution and convention-guided refactoring…` →
`…build with TDD, and ship to your working branch via isolated worktrees — with inline merge-conflict resolution and convention-guided refactoring…`

`.claude-plugin/plugin.json` 의 description 중 `…ship, and release, with automatic merge-conflict resolution and refactoring.` → `…and ship to your working branch via isolated worktrees, with inline merge-conflict resolution and refactoring.`

- [ ] **Step 7: 전체 잔여 검증**

Run: `git grep -niE 'dam|/beaver:(release|resolve)|integration' -- ':!docs/specs/'`
Expected: 0건.

- [ ] **Step 8: 커밋**

```bash
git add templates README.md scripts/self-heal.js .claude-plugin
git commit -m "$(printf '2026-06-09\n\n- 템플릿/README/manifest의 dam/release/resolve 참조 제거, worktree 모델로 갱신')"
```

---

## Stage 3 — plan 심층분석 병렬화 + 대화형

### Task 8: plan §3에 Workflow 병렬 심층분석 + 신규/추가 판별 + 기술검토

**Files:**
- Modify: `skills/plan/SKILL.md` (§3 신규 모드 앞부분)

- [ ] **Step 1: §3 코드 스캔 문단을 병렬분석+판별로 교체**

`skills/plan/SKILL.md` §3(신규 모드)의 "작성 전 **기능명·도메인과 연관된 기존 코드를 스캔**…" 문단을 다음으로 교체:

```markdown
작성 전 **코드베이스를 병렬 심층분석**한다 — 속도 위해 fan-out(오케스트레이션: `Workflow→병렬 / Task→분산 / 순차`, 병렬 우선). 에이전트 `${CLAUDE_PLUGIN_ROOT}/agents/`:
- architecture-mapper — 인접 서브시스템 구조
- convention-scout — 해당 도메인 규약
- test-pattern-analyzer — 테스트 규약
- (재사용/인접 스캔) — 유사 기능·재사용 util/서비스·DB 스키마/엔티티

분석 결과로 **판별**: 이 기능이 ① **기존 패턴에 추가**(또 다른 CRUD 등)인지 ② **신규(net-new) 기능**(현 코드/규약에 없는 특수 영역)인지. 신규 특수기능이면 **구현 기술검토 + 제안**(필요 라이브러리/접근/대안)을 분석에 포함한다.

이를 근거로 **제안** 생성 — "기존 `X` 연계 필요 / 기존 `Y` 패턴 재사용 / 설계 접근 2-3안(tradeoff·권장)"을 근거(경로:라인)와 함께.
```

- [ ] **Step 2: 검증**

Run: `git grep -n 'architecture-mapper' -- skills/plan/SKILL.md`
Expected: 1건.

- [ ] **Step 3: 커밋**

```bash
git add skills/plan/SKILL.md
git commit -m "$(printf '2026-06-09\n\n- plan 3장 코드 스캔을 Workflow 병렬분석+신규판별+기술검토로 강화')"
```

---

### Task 9: plan 대화형 1문1답 + spec 자동생성

**Files:**
- Modify: `skills/plan/SKILL.md` (§3 spec 구성 + 신설 §3.5)

- [ ] **Step 1: §3 spec 구성 문단을 대화형+자동생성으로 교체**

`skills/plan/SKILL.md` §3의 "spec 구성: … plan 지시." 문단을 다음으로 교체:

```markdown
**대화형 확정(1문1답)** — spec을 빈칸 채우기로 던지지 않고, 분석 근거로 **한 번에 하나씩** 묻는다: 설계 접근안(2-3 + 권장) 선택, CLAUDE.md만으로 못 정하는 결정사항. 사용자 답을 수집한다.

**spec 자동생성** — 대화로 확정되면 `${CLAUDE_PLUGIN_ROOT}/templates/spec.md` 기반 `.beaver/output/spec/<domain>/<feature>-spec.md`를 **자동 작성**(기능 설명 / API / 비즈규칙 / 참고 + 코드근거 제안 + **확정된 결정사항과 그 근거**). 미답 결정사항이 없어야 plan 단계로 진행.
```

- [ ] **Step 2: 검증**

Run: `git grep -n '1문1답\|자동생성' -- skills/plan/SKILL.md`
Expected: 매치 존재.

- [ ] **Step 3: 커밋**

```bash
git add skills/plan/SKILL.md
git commit -m "$(printf '2026-06-09\n\n- plan 대화형 1문1답 + spec 자동생성 도입')"
```

---

## Stage 4 — build 준비 병렬화

### Task 10: build에 준비단계 병렬 fan-out 추가

**Files:**
- Modify: `skills/build/SKILL.md` (§2 앞에 §1.5 신설)

- [ ] **Step 1: build §1(전제검증)과 §2(테스트 먼저) 사이에 §1.5 준비 추가**

`skills/build/SKILL.md` 에 추가:

```markdown
## 1.5 준비 (병렬 fan-out, 속도)
구현 전 준비 작업을 병렬로 빠르게 끝낸다(오케스트레이션: `Workflow→병렬 / Task→분산`, 병렬 우선) — 구현 자체는 §2~3에서 **순차 TDD**로 한다(병렬화하지 않는다):
- plan/revision 분석(파일목록·레이어·테스트케이스 정독)
- 건드릴 기존 코드 매핑(경로:라인)
- 테스트 케이스 구체화(CLAUDE.md testing 강도)
- 재사용 가능한 util/서비스 파악

산출은 §2(red)·§3(green)의 입력으로 쓴다. 준비는 병렬, 구현은 순차 — TDD red→green 규율 보존.
```

- [ ] **Step 2: 검증**

Run: `git grep -n '1.5 준비' -- skills/build/SKILL.md`
Expected: 1건.

- [ ] **Step 3: 커밋**

```bash
git add skills/build/SKILL.md
git commit -m "$(printf '2026-06-09\n\n- build 준비단계 병렬 fan-out 추가 (구현은 순차 유지)')"
```

---

## 최종 일관성 스윕

### Task 11: 전체 참조 일관성 + validator 회귀

- [ ] **Step 1: stale 참조 0 확인**

Run: `git grep -niE 'dam|integration|/beaver:(release|resolve)|deferred to release|release에서' -- ':!docs/specs/'`
Expected: 0건.

- [ ] **Step 2: 스킬 자동발견 확인 (삭제 반영)**

Run: `ls skills`
Expected: `analyze build plan refactor ship` (release·resolve 없음).

- [ ] **Step 3: plan validator 회귀**

기존 샘플 플랜이 있으면 `node scripts/validate-plan.js <샘플 plan.md>` 실행해 스키마 회귀 없음 확인. 없으면 생략(이번 변경은 plan validator 스키마 미변경).

- [ ] **Step 4: 최종 커밋(잔여 있으면)**

```bash
git add -A
git commit -m "$(printf '2026-06-09\n\n- worktree-stick 모델 전환 마무리: 참조 일관성 스윕')"
```

---

## Self-Review 결과 (작성자 점검)

- **Spec 커버리지**: spec §4.1 plan→Task 1·2·8·9 / §4.2 build→Task 10 / §4.3 ship→Task 3·4·5 / §4.4 release·resolve 삭제→Task 6 / §4.5 analyze→Task 4 / §5 state·settings·gitignore→Task 1·4·6 / 템플릿·README·manifest→Task 7. 빈틈 없음.
- **Placeholder**: 각 Task에 교체할 실제 마크다운 본문 명시. "적절히/나중에" 류 없음. README(Task 7 Step 5)는 분량상 방침+검증으로 처리 — 실행자가 모델대로 갱신하고 Step 7 grep으로 잔여 0 확인.
- **타입/명칭 일관성**: `origin_branch`(state 값·ship 병합 대상), `<stick>`=`<stick_prefix>/<domain>-<rand6>`, `.auto-branch-state.json` 키=stick·값=origin_branch — 전 Task 일관.
- **한계**: 공유 DB·단독 충돌·`.beaver/` 상태 위치는 spec §7에 명시된 알려진 한계로, 이번 구현 범위 밖.
