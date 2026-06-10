# Beaver 설치 · 업데이트 가이드

Claude Code 플러그인 허브를 통해 설치한다. 설치 후 별도 빌드/의존성 설치 없이 바로 동작한다.

---

## 요구사항

| 항목 | 필요 이유 |
|---|---|
| **Claude Code** (플러그인 지원 버전) | skill·hook·agent 로딩 |
| **Node.js** (PATH에 `node`) | 문서 검증 hook 스크립트(`scripts/on-doc-written.js`)·자동승인 hook 실행. 없으면 hook은 조용히 no-op (문서 구조는 skill이 수동 검사) |
| **git** | plan/ship의 브랜치·커밋·병합 동작 |

> 대상 프로젝트의 언어(NestJS/Spring/Python/…)와 무관하게 동작한다. 테스트·빌드 커맨드는 `/beaver:analyze` 가 감지해 `.beaver/config.json` 에 기록한다.

### ⚠️ 동작·보안 고지

beaver의 hook은 **프로젝트 테스트·빌드 명령을 실행하지 않는다.** 유일한 PostToolUse hook(`scripts/on-doc-written.js`)은 저장된 plan/spec/revision 문서의 구조만 검증하며, 셸 명령은 돌리지 않는다. 테스트 실행은 `/beaver:test` skill 안에서만(독립 전체 회귀), 절대 자동승인되지 않고 항상 확인을 거치는 `Bash` 호출로 일어난다. `.beaver/config.json` 의 `commands` 값은 `/beaver:analyze` 가 감지해 채우며 **항상 사용자 확인 후 기록**되고 직접 수정·검토할 수 있다.

**`auto_approve`(기본 on).** PreToolUse hook(`scripts/auto-approve.js`)이 **프로젝트 내 파일 편집**(`Write`/`Edit`/`MultiEdit`/`NotebookEdit`)을 자동 승인해 plan/build/ship 매 단계마다 Claude Code 승인창이 안 뜬다. **셸 명령(`Bash`)은 절대 자동승인 안 함** — 테스트·`git push` 등 모든 명령은 평소대로 확인하고, 프로젝트 밖 파일 편집도 마찬가지. 매 편집 확인으로 돌리려면 `.beaver/config.json` 에 `"auto_approve": false`.

---

## 설치

Claude Code 안에서:

```text
/plugin marketplace add HaSungJe/beaver
/plugin install beaver@beaver
```

1. `marketplace add HaSungJe/beaver` — 이 저장소의 `.claude-plugin/marketplace.json` 을 마켓플레이스로 등록.
2. `install beaver@beaver` — 마켓플레이스 `beaver` 에서 플러그인 `beaver` 설치.

설치 후 Claude Code를 재시작하거나 `/plugin` 으로 활성 상태를 확인한다. 슬래시는 `/beaver:analyze` 처럼 **네임스페이스(`beaver:`)** 가 붙는다.

### 대화형 설치 (UI)

```text
/plugin
```

→ **Discover** 탭에서 `beaver` 선택 → 설치 범위(user/project/local) 지정.

---

## 첫 사용

프로젝트 루트에서 **가장 먼저 한 번** 코드베이스 분석을 돌린다:

```text
/beaver:analyze
```

→ `CLAUDE.md` + `docs/` 규약과 `.beaver/config.json` 이 생성된다. 이후 `/beaver:plan` → `/beaver:build` → `/beaver:ship` 으로 진행. 자세한 흐름은 [README](./README.md#작업-흐름) 참고.

---

## 업데이트

저장소에 새 버전이 올라오면 아래 **3단계**로 갱신한다. 순서가 중요하다 — 마켓플레이스 메타를 먼저 새로고침해야 새 버전이 인식된다.

### 1단계 — 마켓플레이스 메타 새로고침

Claude Code 입력창에 그대로 입력:

```text
/plugin marketplace update beaver
```

→ `✔ Updated 1 marketplace (1 plugin bumped)` 가 뜨면 새 버전 번호를 인식한 것. (`bumped` 가 안 떠도, 버전이 그대로면 갱신할 게 없다는 뜻.)

### 2단계 — 플러그인 갱신 (UI)

`/plugin update beaver` 는 Claude Code 버전에 따라 **그냥 UI만 열릴 수** 있다. 확실한 방법은 `/plugin` UI에서 직접 누르는 것:

1. 입력창에 `/plugin` 입력 → Enter. 플러그인 매니저가 열린다.
2. 상단 탭을 **`Installed`** 로 이동 — `←` `→` 화살표로 탭 전환 (`Plugins  Discover  Installed  Marketplaces  Errors`).
3. `↑` `↓` 로 목록에서 **`beaver`** 선택. 새 버전이 있으면 오른쪽에 `[UPDATE]` 배지가 보인다.
4. `Enter` → 상세 화면에서 **`Update`** 항목 선택 후 `Enter`.
5. `beaver is already at the latest version (x.y.z).` 가 뜨면 갱신 완료.

> `[UPDATE]` 배지가 안 보이고 버전이 그대로면 → `Esc` 로 나가 **1단계를 다시** 한 뒤 2단계 재시도.

### 3단계 — 반영 (필수)

```text
/reload-plugins
```

→ `Reloaded: N plugins …` 가 뜨면 새 skill/hook/template 이 적용된다. (또는 Claude Code 재시작.)

**확인**: `/reload-plugins` 출력 끝에 `0 error` 면 정상. `1 error during load` 가 뜨면 아래 트러블슈팅 참고.

### 갱신이 안 잡힐 때 (stale 캐시)

업데이트 후에도 옛 버전이 동작하거나 hook 에러가 남으면 캐시에 옛 버전이 고정된 것:

- `/plugin` → `Installed` → `beaver` 에서 **Disable → Enable** (비활성화 후 재활성화) → `/reload-plugins`.
- 그래도 남으면 **Claude Code 재시작**. 캐시는 `~/.claude/plugins/cache/beaver/beaver/<version>/` 에 버전별로 쌓이므로, 재시작하면 최신 버전 디렉터리로 로드된다.

### 프로젝트 산출물은 보존된다

업데이트는 플러그인 자체(skill/hook/script/template)만 교체한다. 사용자 프로젝트의 `.beaver/`(config·output)와 루트 `CLAUDE.md`·`docs/` 는 건드리지 않는다.

---

## 제거

```text
/plugin uninstall beaver@beaver
```

또는 `/plugin` UI의 **Manage** 탭에서 제거. 마켓플레이스 등록까지 지우려면:

```text
/plugin marketplace remove beaver
```

> 제거해도 프로젝트의 `.beaver/` 산출물과 생성된 `CLAUDE.md`·`docs/` 는 남는다. 필요 없으면 직접 삭제한다.

---

## 로컬 개발 · 테스트 (메인테이너용)

플러그인을 수정하며 테스트할 때:

```text
# 로컬 경로를 마켓플레이스로 등록
/plugin marketplace add ./
/plugin install beaver@beaver
```

또는 Claude Code 실행 시 플러그인 디렉터리를 직접 지정:

```bash
claude --plugin-dir /path/to/beaver
```

수정 후에는 `/reload-plugins` 로 반영한다.

---

## 트러블슈팅

| 증상 | 확인 |
|---|---|
| 슬래시가 안 보임 | `/plugin` 에서 beaver가 **enabled** 인지 확인. 재시작 또는 `/reload-plugins` |
| 문서 검증 hook이 안 돎 | `node` 가 PATH에 있는지 (`node -v`). 없으면 `on-doc-written.js` 가 no-op — 문서 구조는 skill이 수동 검증 |
| `/beaver:plan` 이 "규약 문서 없음" 으로 중단 | `/beaver:analyze` 를 먼저 1회 실행해 `CLAUDE.md` 생성 |
| 테스트 커맨드가 틀림 | `.beaver/config.json` 의 `commands.test` / `test_one` 을 프로젝트에 맞게 수정 |
| 업데이트가 반영 안 됨 | 1) `/plugin marketplace update beaver` 2) `/plugin` → `Installed` → beaver → `Update` 3) `/reload-plugins` (위 [업데이트](#업데이트) 3단계). 그래도면 Disable→Enable 또는 재시작 |
| `Duplicate hooks file detected` 에러 | 옛 버전(≤0.1.3) 캐시 잔재. 최신으로 업데이트 후 `/reload-plugins`, 안 되면 재시작해 옛 버전 캐시 디렉터리 해제 |
| `1 error during load` | `/doctor` 로 상세 확인. 대개 위 hooks 중복 또는 stale 캐시 — 재시작으로 해소 |
