# Beaver 설치 · 업데이트 가이드

Claude Code 플러그인 허브를 통해 설치한다. 설치 후 별도 빌드/의존성 설치 없이 바로 동작한다.

---

## 요구사항

| 항목 | 필요 이유 |
|---|---|
| **Claude Code** (플러그인 지원 버전) | skill·hook·agent 로딩 |
| **Node.js** (PATH에 `node`) | 검증·자가수복 hook 스크립트 실행 (`scripts/*.js`). 없으면 hook은 조용히 no-op 되고 skill의 in-loop 테스트로 대체된다 |
| **git** | plan/ship의 브랜치·커밋·병합 동작 |

> 대상 프로젝트의 언어(NestJS/Spring/Python/…)와 무관하게 동작한다. 테스트·빌드 커맨드는 `/beaver:analyze` 가 감지해 `.beaver/config.json` 에 기록한다.

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

→ `CLAUDE.md` + `docs/` 규약과 `.beaver/config.json` 이 생성된다. 이후 `/beaver:plan` → `/beaver:build` → `/beaver:ship` 으로 진행. 자세한 흐름은 [README](./README.md#작업-흐름--두-겹의-사이클) 참고.

---

## 업데이트

저장소에 새 버전이 올라오면:

```text
/plugin marketplace update beaver
/plugin update beaver
```

1. `marketplace update beaver` — 마켓플레이스 메타데이터를 다시 가져온다.
2. `update beaver` — 플러그인을 최신 버전으로 갱신.

또는 `/plugin` UI의 **Manage** 탭에서 업데이트 알림이 뜨면 거기서 갱신한다.

> hook 경로는 플러그인 캐시에 고정되므로, 업데이트 후 hook이 옛 버전을 가리키면 `/reload-plugins` (또는 Claude Code 재시작) 로 새로고침한다.

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
| hook이 안 도는데 검증/자가수복이 안 됨 | `node` 가 PATH에 있는지 (`node -v`). 없으면 hook은 no-op — skill의 수동 테스트 흐름으로 대체 |
| `/beaver:plan` 이 "규약 문서 없음" 으로 중단 | `/beaver:analyze` 를 먼저 1회 실행해 `CLAUDE.md` 생성 |
| 테스트 커맨드가 틀림 | `.beaver/config.json` 의 `commands.test` / `test_one` 을 프로젝트에 맞게 수정 |
| 업데이트가 반영 안 됨 | `/plugin marketplace update beaver` 후 `/reload-plugins` |
