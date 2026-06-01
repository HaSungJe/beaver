# 🦫 Beaver

코드베이스를 먼저 분석해 프로젝트 규약 문서(`CLAUDE.md`)를 만들고, 그 규약을 단일 근거로 **분석 → 기획 → 개발 → 배포(커밋·푸쉬·병합) → 충돌 해결 → 리팩토링**을 일관되게 수행하는 Claude Code 플러그인. 언어 무관 (NestJS · Spring · Python · …).

## 기대 효과

- **일관성** — 모든 산출물이 실제 코드에서 도출된 `CLAUDE.md` 규약을 따른다.
- **표준 절차** — 기능마다 분석 → 기획 → 개발 → 배포가 동일한 흐름으로 반복된다.
- **회귀 방지** — 문서 구조 검증 + 테스트 자가수복(기본 5회, 막히면 plan으로 되먹임) + 병합 충돌 자동 해결.
- **다언어 지원** — 스택을 감지해 테스트·빌드 커맨드를 설정에 기록하므로 언어에 비종속.
- **검수 지점 확보** — spec→plan 게이트와 승인 기반 커밋·푸쉬로 매 단계 사람이 확인한다.
- **규칙 누적(memory)** — 작업 중 사용자 지적을 `.beaver/memory/` 에 누적해 이후 작업서 **최우선** 적용. 같은 지적을 반복하지 않는다.

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
| 분석 (독립·1회) | **분석** | `/beaver:analyze` | "코드베이스 분석해줘" | 코드 분석(없으면 프레임워크 표준) → `CLAUDE.md` + `docs/` 규약 + `.beaver/config.json` 생성 |
| 기획·구현 | **기획** | `/beaver:plan <기능명>` | "<기능명> 기획해줘" | 신규/변경 자동 판별 → spec(코드베이스 기반 제안 포함) → plan (또는 revision) 작성 |
| 기획·구현 | **개발** | `/beaver:build` | "작업 시작" | 테스트 먼저(TDD) → 구현 → 자가수복(5회, 막히면 plan 복귀) → 리포트 (커밋 안 함) |
| 배포 | **배포** | `/beaver:ship` | "커밋하고 푸쉬", "dam에 병합" | 누적 작업 커밋 → 코드 리뷰(규약 대비) → 푸쉬 → dam 병합 (승인 기반) |
| 배포 | **충돌 해결** | `/beaver:resolve` | "충돌 해결해줘" | dam 병합 중 충돌 시 ship이 자동 발동. ship 밖 충돌은 직접 호출 |
| 배포 | **방류** | `/beaver:release` | "dam 방류", "메인에 반영" | dam 누적분을 코드 리뷰 후 선택 소스 브랜치로 병합·푸쉬 → 로컬 dam 삭제 (승인 기반) |
| 리팩토링 (독립) | **리팩토링** | `/beaver:refactor` | "비슷한 기능 묶어줘" | 계획서 작성→조정→실행으로 중복 제거·공통 로직 추출·구조 정리 (동작 보존) |

> 명칭은 안정화 전(0.x)이라 바뀔 수 있다.

---

## 작업 흐름

```
analyze        # 독립 · 프로젝트당 1회 (규약 문서 생성)

plan → build   # 한 세트 · stick 브랜치에서 기능마다 반복 (커밋 안 하고 누적)
               #   plan: dam 없으면 소스 브랜치 묻고 dam 복제 → dam에서 stick 분기

ship           # 한 세트 · 커밋 → 코드리뷰 → stick 푸쉬 → dam 로컬 병합
 └ resolve      #   병합 충돌 시 ship 안에서 자동 발동

release        # dam → 선택 소스 브랜치 병합·푸쉬 → 로컬 dam 삭제
 └ resolve      #   병합 충돌 시 release 안에서 자동 발동

refactor       # 독립 · 필요 시 (계획서 → 실행, 동작 보존)
```

> **브랜치 모델**: 선택한 원격 브랜치(예 `main`)에서 통합 브랜치 `dam`(로컬 전용)을 복제하고, 그 dam에서 작업 브랜치 `stick/<domain>-<rand6>`를 뻗는다. ship이 stick을 dam에 병합(로컬), release가 dam을 다시 소스 브랜치로 병합·푸쉬한 뒤 로컬 dam을 삭제한다. **dam은 원격에 push하지 않는다.** 이름·접두사는 `.beaver/config.json` 의 `branch.integration`(기본 `dam`)·`branch.stick_prefix`(기본 `stick`)로 변경 가능. dam 소스는 `.beaver/.dam-state.json`에 기록된다.

- **`analyze`** (독립) — 프로젝트당 한 번. 기존 코드가 있으면 그 코드에서 규약을 추출하고, 신규/빈 프로젝트면 감지한 프레임워크(Nest/Spring 등)의 표준·권장 구조를 채택해 규약 문서를 만든다. 섹션별 "담을 것/깊이" 가이드 템플릿 + `docs/` 스킬레톤으로 채우며, **용례 0건 자산은 시그니처만 직독(호출 예시 날조 금지)·미적용 인프라는 정직 표기**한다.
- **`plan` → `build`** (세트) — 한 stick 브랜치에서 기능마다 반복. plan은 명세(spec→plan)를 정리한다 — spec 단계에서 기능명만 줘도 **기존 DB·연관 기능·재사용 패턴을 스캔해 "이런 것도 있으면 좋다"를 제안**하고 사용자가 검증한다. build는 **테스트를 먼저 쓰고(TDD, plan의 테스트 케이스 → red) 구현으로 green**을 만든 뒤 자가수복까지 하되, **커밋하지 않고** 변경을 쌓아둔다.
- **`ship` ↔ `resolve`** (세트) — 누적분을 커밋 → **코드 리뷰**(CLAUDE.md 규약 대비 + 의도 동작 확인) → stick 푸쉬 → `dam` 로컬 병합(모든 단계 승인 기반). 병합 충돌 시 `resolve` 가 ship 안에서 자동으로 통합한다.
- **`release`** — dam 누적분을 다시 코드 리뷰한 뒤 선택한 소스 브랜치로 병합·푸쉬하고 로컬 dam을 삭제한다(승인 기반, 충돌 시 resolve 자동). 다음 plan이 소스에서 dam을 새로 만든다.
- **`refactor`** (독립) — 필요할 때. 계획서를 쓰고 승인 후 실행하며 테스트로 동작을 보존한다.

### 사용자 규칙 메모리 (`.beaver/memory/`)

작업 중 사용자가 규약을 교정하거나 선호를 표명하면("service 말고 repository에서만 UK/FK 핸들링" 등), 모든 단계가 이를 기억하고 우선 적용한다.

- **저장(확인 후)** — 지속 규칙으로 판단되면 "memory에 저장할까?" 확인 → `.beaver/memory/<topic>.md` 에 누적. 일회성 지시나 코드로 알 수 있는 사실은 저장 안 함.
- **우선순위** — `memory > CLAUDE.md > 프레임워크 기본`. 충돌하면 memory가 이긴다. plan·build·refactor·resolve 진입 시 먼저 읽는다.
- **정식 반영(reconcile)** — ship 코드 리뷰 / analyze 재생성 시, 아직 규약 문서에 없는 memory 규칙을 `CLAUDE.md`/`docs/` 에 반영할지 제안한다. 코드외 순수 선호는 memory에만 영속.

> 규칙: `${plugin}/templates/memory-protocol.md` (저장소 구조 · 엔트리 포맷 · capture/read/reconcile).

### 안전장치

- **파일 존재 기반 전제** — 각 단계는 이전 산출물이 있어야 진입한다. 없으면 무엇이 부족한지 안내하고 중단.
- **자동 검증 hook** — plan/spec 문서 저장 시 구조 검증, 구현/테스트 파일 저장 시 테스트 자동 실행·자가수복(Node 필요, `.beaver/config.json` 의 커맨드 사용).
- **승인 게이트** — 커밋·푸쉬·충돌 해결은 항상 사용자 확인 후에만 실행.
- **규칙 메모리** — `.beaver/memory/` 의 사용자 규칙이 `CLAUDE.md` 보다 우선(위 참고).

---

## 다언어 동작 원리

`/beaver:analyze` 가 스택을 감지해 `.beaver/config.json` 에 **테스트·빌드 커맨드와 경로 규약**을 기록한다. 이후 모든 단계와 hook은 이 설정을 읽으므로 언어에 종속되지 않는다.

```jsonc
{
  "stack": ["nestjs"],
  "commands": {
    "test": "npm test",
    "test_one": "npm test -- --testPathPatterns=$NAME"   // pytest면 "pytest -k $NAME" 등
  },
  "paths": { "source_root": "src", "test_glob": "**/*.spec.ts" }
}
```

---

## 구조

```
beaver/
├── .claude-plugin/
│   ├── plugin.json          # 플러그인 매니페스트
│   └── marketplace.json     # 허브 배포 매니페스트
├── skills/                  # 6개 skill (슬래시 + 자동발동)
│   ├── analyze/  plan/  build/  ship/  resolve/  refactor/
├── agents/                  # 분석 전문 서브에이전트 (analyze가 fan-out)
│   ├── architecture-mapper.md  convention-scout.md  test-pattern-analyzer.md
├── hooks/hooks.json         # PostToolUse — 검증 + 자가수복
├── scripts/                 # Node 스크립트 (검증기·self-heal)
└── templates/               # 규약·산출물 양식
    ├── CLAUDE.template.md    #   섹션별 가이드 규약 템플릿
    ├── docs/                 #   규약 분리 문서 스킬레톤 (architecture/conventions/data-layer/error-handling/api/testing)
    ├── memory-protocol.md    #   사용자 규칙 memory 프로토콜
    └── spec / plan / revision / report / review / refactor-plan 양식
```

> 런타임 산출물은 사용자 프로젝트의 `.beaver/` 아래 생성된다: `config.json` · `output/{spec,plan,revision,report,review,refactor}/` · `memory/`(사용자 규칙).

## License

MIT
