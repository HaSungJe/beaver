# 🦫 Beaver

코드베이스를 먼저 분석해 프로젝트 규약 문서(`CLAUDE.md`)를 만들고, 그 규약을 단일 근거로 **분석 → 기획 → 개발 → 배포(원래 브랜치 병합·푸쉬) → 리팩토링**을 일관되게 수행하는 Claude Code 플러그인. 기획·구현은 `.claude/worktrees/`에 격리된 stick 워크트리에서 이뤄져 **여러 세션 병렬 작업**이 가능하다. 언어·프레임워크·포지션 무관 — 백엔드(NestJS · Spring · Python · Go · …), 프런트엔드(Next.js · React), 그리고 모바일 · CLI · 라이브러리 프로젝트까지 동일하게.

<!-- Beaver는 백엔드 스택에 묶이지 않는다. 네 가지 핵심 용어로 포지션을 가로질러 일반화한다 — LAYER/UNIT(책임 단위), ENTRY POINT(외부 도달 표면), DATA/AFFECTED STATE(읽고/바꾸는 상태), OUTCOME/INTERFACE CONTRACT(진입점이 만드는 결과). 각 용어는 이 프로젝트가 실제로 쓰는 것으로 채워진다 — analyze가 코드 근거(경로:라인)로 도출해 프로젝트가 쓰는 이름 그대로 기록하며, 특정 포지션 구문을 가정하지 않고 실재하는 구성요소를 발견한다. -->


## 기대 효과

- **일관성** — 모든 산출물이 실제 코드에서 도출된 `CLAUDE.md` 규약을 따른다.
- **표준 절차** — 기능마다 기획 → 개발 → 배포(ship)가 동일한 흐름으로 반복되고, ship이 원래 작업 브랜치로 직접 병합·푸쉬한다.
- **병렬 작업** — stick을 `.claude/worktrees/`에 격리하므로(세션 cwd 전환), 세션마다 다른 기능을 동시에 진행해도 충돌하지 않는다.
- **회귀 방지** — 문서 구조 검증 + 독립 전체 회귀(`/beaver:test` → `commands.test`, 워크트리가 아닌 실제 체크아웃=ship 후 원래 브랜치에서) + 병합 충돌 인라인 해결. **테스트가 도는 곳**: build는 테스트를 **작성만** 하고 실행하지 않으며, 유일한 테스트 실행은 `/beaver:test`다.
- **규칙 누적(memory)** — 작업 중 사용자 지적을 `.beaver/memory/` 에 누적해 이후 작업서 **최우선**(memory > CLAUDE.md > 기본) 적용. 같은 지적을 반복하지 않는다.
- **다언어 지원** — 스택을 감지해 테스트·빌드 커맨드를 `.beaver/config.json` 에 기록하므로 언어에 비종속.
- **검수 지점 확보** — plan 대화형 결정 게이트, ship의 코드 리뷰, 승인 기반 커밋·병합·푸쉬로 매 단계 사람이 확인한다.

---

## 설치

Claude Code에서:

```
/plugin marketplace add HaSungJe/beaver
/plugin install beaver@beaver
```

설치 후 별도 설정 없이 바로 사용할 수 있다. 프로젝트에서 **가장 먼저 한 번** 코드베이스 분석을 돌리면 된다:

```
/beaver:analyze
```

> 📦 요구사항 · 업데이트 · 제거 · 로컬 개발 · 트러블슈팅 → **[INSTALL.md](./INSTALL.md)**

---

## 명령(skill) 일람

각 단계는 **슬래시 커맨드**와 **자연어** 두 진입점을 가진다 — 완전히 동일하게 동작한다. skill은 자동 발동되므로 자연어로 흘려도 인식된다.

| 묶음 | 단계 | 슬래시 | 자연어 예시 | 하는 일 |
|---|---|---|---|---|
| 분석 (독립·1회) | **분석** | `/beaver:analyze` | "코드베이스 분석해줘" | 코드 실측(없으면 프레임워크 표준)으로 `CLAUDE.md` + `docs/` 규약 + `.beaver/config.json` 생성·갱신, 기존 CLAUDE.md·memory 병합·반영 |
| 기획·구현 | **기획** | `/beaver:plan <기능명>` | "<기능명> 기획해줘" | 신규/변경 자동 판별 → stick 워크트리 격리 생성·진입 → 코드베이스 병렬 심층분석(신규/추가 판별, 신규면 기술검토) → 대화형 1문1답으로 결정 → spec 자동생성 + plan(변경이면 revision) 작성(저장 시 검증 훅). 새 규약 영역이면 draft 문서 |
| 기획·구현 | **개발** | `/beaver:build` | "작업 시작" | 준비 병렬 fan-out → plan의 테스트 케이스를 실제 테스트 파일로 작성 + 규약대로 구현(**테스트 실행 안 함**) → report. 테스트 실행·커밋·전체 회귀 안 함 |
| 배포 | **배포** | `/beaver:ship` | "커밋하고 배포" | stick 누적분 코드 리뷰(memory·규약·의도·draft 확정, review 문서) → 승인 커밋 → origin을 stick에 편입(worktree 안) → 원래 브랜치 복귀·fast-forward·push → worktree 파기. 충돌 시 인라인 해결 |
| 검증 (독립) | **테스트** | `/beaver:test` | "전체 테스트 돌려" | **전체 회귀**(`commands.test`)를 현재 체크아웃에서 1회 실행. 독립 — 원격 있는 브랜치(ship 후 원래 브랜치)에서 돌리고, stick worktree 안에선 금지. 통과/실패 보고, 소스 수정 안 함 |
| 리팩토링 (독립) | **리팩토링** | `/beaver:refactor` | "비슷한 기능 묶어줘" | green baseline 확인 → 대상 식별 → 계획서 작성·승인 → 작은 단위 추출·교체·정리 + 단계별 테스트 → 전체 회귀로 동작 보존 입증. 커밋은 ship |

> 명칭은 안정화 전(0.x)이라 바뀔 수 있다.

---

## 작업 흐름

```
analyze        # 독립 · 프로젝트당 1회 (규약 문서 생성)

plan → build   # 한 세트 · stick 워크트리에서 기능마다 반복 (커밋 안 하고 누적)
               #   plan: 현재 브랜치 HEAD에서 .claude/worktrees/<stick> 격리 생성 + 세션 진입

ship           # 한 세트 · 코드리뷰 → 커밋 → origin을 stick에 편입(worktree 안)
               #   → ExitWorktree 복귀 → 원래 브랜치 fast-forward → push → worktree 파기
 └ 충돌 인라인   #   병합 충돌 시 ship이 worktree 안에서 직접 — 규약대로 통합

test           # 독립 · ship 후 원래 브랜치(원격 있음)에서 /beaver:test → 전체 회귀

refactor       # 독립 · 필요 시 (계획서 → 실행, 동작 보존)
```

> **브랜치 모델**: 작업하던 브랜치(예 `main`/`develop`)의 현재 HEAD에서 작업 브랜치 `stick/<domain>-<rand6>`를 뻗어 `.claude/worktrees/<stick>`에 격리한다(CC `EnterWorktree`, `worktree.baseRef=head`). ship이 stick을 원래 브랜치로 전진병합·푸쉬한 뒤 worktree와 stick을 파기한다. **stick·worktree는 로컬 전용 — push는 ship이 원래 브랜치로만 한다.** stick 접두사는 `.beaver/config.json` 의 `branch.stick_prefix`(기본 `stick`)로 변경 가능. stick→원래 브랜치 매핑은 `.beaver/.auto-branch-state.json`에 기록된다. 세션마다 다른 워크트리라 **병렬 작업**이 가능하다.

---

## 단계별 상세

각 skill이 실제로 하는 일이다. **모든 git/파일 작업·테스트·승인 게이트는 사용자 확인 후에만 실행**된다.

### 🔍 `/beaver:analyze` — 코드베이스 분석 → 규약 생성 (독립·1회)

> 원칙: **코드가 있으면 코드가 규칙, 없으면 프레임워크 표준이 규칙.**

- **memory 우선** — 진입 시 `.beaver/memory/`(MEMORY.md + 토픽)를 먼저 읽어 사용자 규칙을 최우선 반영하고, 미반영 엔트리는 `CLAUDE.md`/`docs/` 정식 반영(reconcile)을 제안한다.
- **기존 CLAUDE.md 병합** — 있으면 덮어쓰기 전 확인, 고유 규칙은 보존하고 구버전이 만든 "Beaver 설정" 블록은 제거(해당 동작은 이제 플러그인 자체가 제공).
- **스택 감지** — 매니페스트(`package.json`/`pom.xml`/`build.gradle`/`pyproject.toml`/`go.mod`/`Cargo.toml`)로 프레임워크·test/build 커맨드 식별(사용자 확인). 코드로 안 정해지는 결정 포인트는 대안이 2개 이상일 때만 권장안과 함께 질문 — 이 프로젝트가 실제로 열어둔 지점을 근거(있으면 경로:라인)로 도출하며, 질문은 고정 카탈로그가 아니라 감지된 프레임워크의 관용 베이스라인을 따른다.
- **분석** — 기존 코드면 대표 파일을 읽어 근거(경로:라인)로 규칙 추출(`agents/`의 architecture-mapper·convention-scout·test-pattern-analyzer를 Workflow 병렬/Task 분산/순차로 활용). 신규·빈 프로젝트면 프레임워크 표준 구조 채택. **날조 방지**: 용례 0건 자산은 시그니처만 직독, 구현됐으나 미적용 인프라는 "미적용/규약"으로 정직 표기.
- **산출물** — 루트 `CLAUDE.md`(`templates/CLAUDE.template.md` 구조) + `docs/<topic>.md`(architecture·conventions·data-layer·error-handling·api·testing 중 쓰는 것만) + `.beaver/config.json`(stack·commands·paths·branch). 모든 규칙에 출처(실측 경로 / "표준: 〈프레임워크〉 권장" / "선택: 사용자") 표기.
- analyze 자체는 **브랜치를 만들거나 테스트를 실행하지 않는다** — 값을 config에 기록만 한다(stick 워크트리 생성·테스트 실행은 plan/build/ship).

### 📝 `/beaver:plan <기능명>` — 기획 (spec → plan / revision)

- **전제** — `CLAUDE.md`가 없으면 중단하고 analyze 안내. `.beaver/config.json`·`.beaver/memory/`를 읽는다.
- **모드 판별** — 같은 기능에 `plan.md`+`report.md`가 이미 있으면 **변경(revision)**, 아니면 **신규(spec→plan)**.
- **stick 워크트리 자동 생성** — 현재 stick 워크트리 안이면 누적, 아니면 `origin_branch = git branch --show-current` 기록 후 `EnterWorktree(name=stick/<domain>-<rand6>)`로 현재 HEAD에서 `.claude/worktrees/<stick>` 격리 생성·진입(`worktree.baseRef=head` 자동 설치). `.beaver/.auto-branch-state.json`에 `{stick: origin_branch}` 기록.
- **신규 — 심층분석·대화·spec** — 작성 전 **코드베이스를 병렬 심층분석**(`agents/`의 architecture-mapper·convention-scout·test-pattern-analyzer + 재사용/인접 스캔을 Workflow fan-out으로). 결과로 "기존 패턴 추가 vs 신규 기능"을 판별하고, 신규 특수기능이면 구현 기술검토·제안을 더한다. 근거(경로:라인) 기반 제안 + 설계 접근 2-3안(권장)을 **대화형 1문1답**으로 확정 → `templates/spec.md`로 `.beaver/output/spec/<domain>/<feature>-spec.md` **자동 생성**(기능·API·비즈니스 규칙·참고 + 제안 + 확정된 결정사항·근거). 미답 결정사항 없어야 plan 진행.
- **신규 — plan** — 미답 있으면 중단. `templates/plan.md`로 `.beaver/output/plan/<domain>/<feature>-plan.md` 작성(파일 목록·레이어별 설계·테스트 케이스·응답 코드 + 사전 구현 필요 항목 `- [ ]`).
- **변경 — revision** — `templates/revision.md`로 `.beaver/output/revision/<domain>/<feature>-revision-<YYMMDD>-<N>.md`. 원본 spec/plan은 참조만.
- **저장 시 검증 훅** — 문서를 저장하면 `on-doc-written.js`가 자동으로 필수 섹션을 검사(누락 시 차단, 미답 결정사항·미완 사전항목은 경고).
- **draft 규약** — 기획이 `docs/`·`CLAUDE.md`에 없는 **새 규약 영역**(websocket·payment 등)을 도입하면 docs 반영을 제안하고, 승인 시 `<!-- beaver:draft -->` 마커를 단 문서를 만든다(코드는 build가 맞추고, ship이 확정).
- plan은 **테스트를 실행하지 않는다** — 테스트 케이스를 문서로 설계만 한다.

### 🔨 `/beaver:build` — 테스트 작성 + 구현 (실행 안 함) · *커밋 안 함*

- **memory 우선** — 진입 시 memory를 읽어 구현 내내 최우선 적용. 구현 중 사용자 지적은 확인 후 `.beaver/memory/`에 저장(정식 CLAUDE.md 반영은 ship으로 미룸).
- **모드·대상** — 인자 있으면 변경(report에 회차 미반영인 `*-revision-*.md`) 우선 → 신규(`*-plan.md` 있고 짝 `*-report.md` 없음). 인자 없으면 `.beaver/output/` 스캔: 후보 0개 중단·1개 진행·2개+ 사용자 선택(여러 건 한 번에 자동 구현 금지).
- **전제 게이트** — 신규는 `plan.md` 존재·결정사항 미답 없음·사전 구현 항목 전부 `[x]`·`validate-plan.js` 통과(필수 섹션·미답·미완 항목 있으면 차단). 변경은 최신 `revision-*.md`·미답 없음·사전항목 `[x]`.
- **① 준비(병렬)** — 구현 전 plan/revision 분석·건드릴 기존코드 매핑·테스트케이스 구체화·재사용 파악을 Workflow fan-out으로 빠르게 끝낸다. 구현 자체(②~)는 순차.
- **② 테스트 작성 + 구현** — plan의 "테스트 케이스"를 CLAUDE.md testing 강도의 실제 테스트 파일로 작성한 뒤, 규약대로 구현해 충족시킨다. **build는 테스트를 실행하지 않는다** — red/green 루프도, self-heal도 없다. 모든 테스트 실행은 `/beaver:test`로 미룬다.
- **build가 테스트를 안 돌리는 이유** — stick 워크트리엔 실제 개발자 의존성 디렉터리(`node_modules`/`.venv`/`vendor` 는 gitignore라 워크트리에 링크되지 않음)가 없어 모듈 해석이 불안정하고, build 도중 실행하면 거짓 실패가 난다. 그래서 build는 테스트 파일+구현 작성만 하고, 검증은 ship 후 원래 브랜치(실제 의존성)에서 `/beaver:test`로 한다.
- **draft 동기화** — draft 규약 문서가 코드와 틀어지면 코드에 맞춰 갱신(마커는 유지, 확정은 ship).
- **막힘 fallback** — 구현하다가 (국소 코드 실수가 아니라) 계획·접근 자체가 틀렸음을 발견하면 억지로 밀어붙이지 않고 → 근본원인 격리 → **plan으로 복귀**해 접근 재검토 → plan/revision 갱신 → build 재진입.
- **리포트** — `templates/report.md`로 신규는 `report/<domain>/<feature>-report.md` 생성, 변경은 끝에 `## 수정 - <YYMMDD>-<N>` 추가.
- **완료 전 검증** — build는 테스트를 돌리지 않으므로, 구현과 작성한 테스트가 plan/spec 의도와 맞는지 읽기로 확인한다(권위 있는 실행은 ship 후 `/beaver:test`). build는 **커밋하지 않고** stick에 누적.

### 🚀 `/beaver:ship` — 커밋 + 원래 브랜치 병합·푸쉬 + worktree 파기

- **전제** — stick 워크트리 안(`.beaver/.auto-branch-state.json`에 현재 stick 키 존재) + 완료 report 또는 변경분.
- **① 코드 리뷰(커밋 전)** — build는 커밋 없이 누적하므로 ship 진입 시 stick 작업이 미커밋 상태다. **stick base 대비 워킹트리 diff**를 먼저(커밋이 리뷰 통과 상태를 담도록) **memory 규칙 → CLAUDE.md 규약 → plan/spec 의도** 순으로 자가 리뷰:
  - 규약 위반 점검(네이밍·구조·공통 로직 분리·에러·응답·테스트 강도)
  - **memory reconcile** — 미반영 memory 규칙을 CLAUDE.md/docs에 정식 반영 제안
  - **의도 동작 확인** — 누락·오구현 점검
  - **draft 규약 확정** — `<!-- beaver:draft -->` 문서가 코드와 일치하는지 검증 후 마커 제거·확정
  - 결과를 `templates/review.md`로 `.beaver/output/review/<stick>-review-<YYMMDD>.md`에 기록 → 발견 항목 보고 → "수정 필요"면 build로(재리뷰), "통과"면 커밋 진행(승인 없이 커밋/병합 금지).
- **② 커밋(리뷰 후)** — 리뷰 통과 결과를 커밋. `git status`/`diff` 확인 → 여러 기능이면 논리 단위 커밋 분리 제안 → 메시지 자동 생성 → **승인 후** 커밋(리뷰 문서도 함께 커밋).
- **③ 병합(worktree 안) → 복귀 → fast-forward + push + 파기** — 실질 병합은 **복귀 전, worktree 안에서** 한다(기능 컨텍스트가 거기 있음): stick 브랜치에서 `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>`로 대상 최신을 stick에 편입(충돌 시 ship 인라인 해결). 이제 stick이 origin 최신 + 누적 작업 전부를 담는다. 이어 `ExitWorktree`로 원래 디렉터리(`origin_branch`) 복귀 → `git merge --ff-only <stick>`로 전진(**fast-forward 보장** — 충돌 불가능) → `git push origin <origin_branch>` → `git worktree remove .claude/worktrees/<stick>` + `git branch -d <stick>` + state 키 제거. **ship은 테스트를 돌리지 않는다** — 이후 `/beaver:test`로 검증.
- **충돌 인라인 해결** — 병합 충돌 시(worktree 안 `merge origin/<origin_branch>` 단계에서만) 별도 스킬 없이 ship이 직접: ours/theirs 의도 파악 → memory·CLAUDE.md 규약대로 통합(임의 폐기 금지) → `git diff --check` 마커 정리 → 통합이 일관되는지 확인 → 승인 후 머지 커밋(위험하면 `git merge --abort`).

### 🧪 `/beaver:test` — 전체 회귀 (독립)

- **역할** — 프로젝트 **전체** 테스트 스위트(`commands.test`)를 1회 실행하고 보고한다. ship에서 분리한 단일 전체회귀. build는 테스트를 작성만 하고 실행하지 않으므로, 누적된 테스트가 실제로 실행되는 곳이 여기다.
- **전제** — `commands.test` 설정 필요(없으면 analyze). **원격 있는 브랜치에서 실행**(브랜치 upstream ref로 확인) — 로컬 전용 stick worktree를 의도적으로 배제. 회귀는 실제 개발자 체크아웃(ship 후 원래 브랜치)에서 돌며 그곳엔 의존성이 설치돼 있다.
- **실행 + 보고** — 현재 체크아웃에서 `commands.test` 실행 → **green**: 통과 보고(러너가 주면 스위트/건수); **red**: 어떤 테스트가 실패했는지 정확히 보고(러너 출력 인용). 수정 경로는 해당 기능의 `/beaver:plan`→`/beaver:build`, 다시 ship 후 `/beaver:test` 재실행. 실행·보고만, 소스 수정 안 함.

### ♻️ `/beaver:refactor` — 계획 기반 구조 정리 (독립)

- **① memory + green baseline** — memory를 읽어 분리·배치에 최우선 적용. `commands.test`를 1회 돌려 시작 통과 상태 확인(깨졌으면 회귀 판별 불가 고지).
- **② 대상 식별** — 지정 범위 또는 Grep/Read 스캔으로 중복/유사 로직·오배치(util/module로 빠져야 할 것)·묶을 기능 군집을 근거(경로:라인)와 함께.
- **③ 계획서** — `templates/refactor-plan.md`로 `.beaver/output/refactor/<name>-refactor-<YYMMDD>.md`(목표·범위·비범위, baseline, 발견 목록, 변경 방안, 작은 단위 실행 순서, 영향 파일, 테스트 전략, 리스크).
- **④ 조정·승인** — 계획서를 제시해 범위 조정. **승인 전 코드 수정 금지.**
- **⑤ 실행** — 작은 단위로 추출 → 호출부 교체 → 죽은 코드 제거, **각 단계 후 테스트**(깨지면 처리/되돌림), 계획서 체크박스 갱신.
- **⑥ 검증·보고** — 전체 `commands.test` 통과로 동작 보존 입증. 큰 건의 커밋 분리는 ship에 위임(refactor 자체는 커밋 안 함). 동작 변경은 리팩토링이 아니므로 plan→build로.

---

## 사용자 규칙 메모리 (`.beaver/memory/`)

작업 중 사용자가 규약을 교정하거나 선호를 표명하면(예: "이런 검증은 다른 데 말고 특정 단위에서만" — 프로젝트가 쓰는 구성요소로 표현된), 모든 단계가 이를 기억하고 우선 적용한다.

- **저장(확인 후)** — 지속 규칙으로 판단되면 "memory에 저장할까?" 확인 → `.beaver/memory/<topic>.md`에 누적(+ `MEMORY.md` 인덱스). 일회성 지시나 코드로 알 수 있는 사실은 저장 안 함.
- **우선순위** — `memory > CLAUDE.md > 프레임워크 기본`. 충돌하면 memory가 이긴다. **모든 단계가 진입 시 먼저 읽고** 적용한다(plan·build·refactor는 구현·통합 판단에, ship은 리뷰·reconcile·충돌 통합에).
- **정식 반영(reconcile)** — ship 코드 리뷰 / analyze 재생성 시, 아직 규약 문서에 없는 memory 규칙을 `CLAUDE.md`/`docs/`에 반영할지 제안한다. 코드외 순수 선호는 memory에만 영속.

> 프로토콜 전문: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md` (저장소 구조 · 엔트리 포맷 · capture/read/reconcile).

---

## 안전장치

- **파일 존재 기반 전제** — 각 단계는 이전 산출물이 있어야 진입한다. 없으면 무엇이 부족한지 안내하고 중단.
- **자동 검증 hook** (`hooks/hooks.json`, PostToolUse `Write|Edit`) —
  - `on-doc-written.js`: plan/spec/revision 문서 저장 시 구조 검증(필수 섹션 누락 차단). **Node가 없으면 훅은 no-op**, 문서 구조는 skill이 수동 검증.
  - **저장 시 테스트 훅 없음** — beaver의 훅은 프로젝트 테스트·빌드 명령을 실행하지 않는다. 테스트 회귀는 `/beaver:test`를 호출할 때만 돈다(저장 트리거 테스트 실행 없음; 이전 self-heal 훅은 이번 개정에서 제거됨).
- **자동승인 훅** (`auto-approve.js`, PreToolUse, **기본 on**) — 프로젝트 내 파일 편집(`Write`/`Edit`/`MultiEdit`/`NotebookEdit`)을 자동 승인해 plan/build/ship 매 단계마다 Claude Code 승인창이 안 뜬다. **셸 명령(`Bash`)은 절대 자동승인 안 함** — 테스트·`git push` 등은 여전히 확인, 프로젝트 밖 편집도 마찬가지. `.beaver/config.json`에 `"auto_approve": false`면 매 편집 확인으로 복귀.
- **승인 게이트** — 커밋·병합·푸쉬·충돌 해결·리뷰 통과는 항상 사용자 확인 후에만 실행.
- **규칙 메모리** — `.beaver/memory/`의 사용자 규칙이 `CLAUDE.md`보다 우선(위 참고).

---

## 다언어 동작 원리

`/beaver:analyze`가 스택을 감지해 `.beaver/config.json`에 **테스트·빌드 커맨드와 경로 규약**을 기록한다. 이후 모든 단계·hook은 이 설정을 읽으므로 언어·프레임워크에 종속되지 않는다.

```jsonc
{
  "project_name": "...",
  "stack": ["..."],                                       // 감지된 스택 id
  "commands": {
    "test": "...",                                        // 전체 회귀 — /beaver:test가 실행
    "test_one": "...",                                    // 단일 기능 — build의 테스트 파일 범위에 사용; build가 자동 실행하지 않음. $NAME 치환
    "build": "...",
    "lint": "..."
  },
  "paths": { "source_root": "...", "test_glob": "..." },
  "branch": { "stick_prefix": "stick" }
}
```

위 값은 모두 이 프로젝트가 실제로 쓰는 것에서 도출된다: analyze가 스택 id, test/build/lint 커맨드, source root, test glob을 코드 근거(경로:라인)와 감지된 프레임워크의 관용 베이스라인에서 도출해 프로젝트가 표현하는 그대로 기록한다. `test_one`의 `$NAME`은 build 시 기능명으로 치환된다. 프로젝트에 근거가 없는 필드는 추측하지 않고 비운다.

---

## 구조

```
beaver/
├── .claude-plugin/
│   ├── plugin.json          # 플러그인 매니페스트 (name·version·메타)
│   └── marketplace.json     # 허브 배포 매니페스트 (/plugin marketplace add 가 읽음)
├── README.md  ·  INSTALL.md  ·  LICENSE
├── hooks/hooks.json         # PreToolUse → auto-approve.js · PostToolUse Write|Edit → on-doc-written.js
├── scripts/                 # Node CommonJS, 의존성 0, 크로스플랫폼
│   ├── _beaver.js           #   공유 헬퍼 (config 로드·경로)
│   ├── validate-lib.js      #   문서 구조 검증 라이브러리
│   ├── validate-plan.js     #   build 진입 게이트 CLI
│   ├── on-doc-written.js    #   훅: plan/spec/revision 문서 구조 검증
│   └── auto-approve.js      #   훅: 프로젝트 내 파일 편집 자동승인(auto_approve, 기본 on; Bash 제외)
├── agents/                  # analyze가 실측 시 fan-out (tools: Glob/Grep/Read)
│   ├── architecture-mapper.md  ·  convention-scout.md  ·  test-pattern-analyzer.md
├── skills/                  # 6개 skill (슬래시 + 자동발동)
│   ├── analyze/  plan/  build/  ship/  test/  refactor/
└── templates/               # 규약·산출물 양식 (skill이 ${CLAUDE_PLUGIN_ROOT}/templates/* 로 참조)
    ├── CLAUDE.template.md    #   CLAUDE.md 규약 템플릿 (섹션 가이드)
    ├── memory-protocol.md    #   사용자 규칙 memory 프로토콜
    ├── docs/                 #   심화 규약 스킬레톤 (architecture/conventions/data-layer/error-handling/api/testing)
    └── spec · plan · revision · report · review · refactor-plan 양식
```

> **런타임 산출물**은 사용자 프로젝트에 생성된다(플러그인 저장소엔 없음): 루트 `CLAUDE.md`·`docs/`, 그리고 `.beaver/` 아래 `config.json` · `output/{spec,plan,revision,report,review,refactor}/` · `memory/`(사용자 규칙) · 상태 dotfile(`.auto-branch-state.json`) · stick 워크트리(`.claude/worktrees/`).

## License

MIT
