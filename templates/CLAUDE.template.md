<!-- Beaver 규약 템플릿. /beaver:analyze 가 코드 분석으로 채운다.
     규칙은 분석 근거 필수(추측 금지) · 안 쓰는 섹션 삭제 · 깊은 규칙은 docs/<topic>.md 링크
     · "## Beaver 설정" 블록은 문구 그대로 유지. -->

# CLAUDE.md

## Beaver 설정

이 프로젝트는 [Beaver](https://github.com/HaSungJe/beaver)로 관리된다. 각 단계는 슬래시/자연어로 발동(동일 동작):

| 단계 | 슬래시 | 자연어 |
|---|---|---|
| 분석(1회) | `/beaver:analyze` | "코드베이스 분석" |
| 기획 | `/beaver:plan <기능명>` | "<기능명> 기획", "기능 생성/수정" |
| 구현 | `/beaver:build` | "작업 시작", "구현" |
| 배포 | `/beaver:ship` | "커밋하고 푸쉬", "dam 병합" |
| 충돌 해결 | `/beaver:resolve` | "충돌 해결" (ship 병합 충돌 시 자동) |
| 리팩토링 | `/beaver:refactor` | "비슷한 기능 묶기", "중복 정리" |

**사이클**: `plan→build`(작은 사이클)를 한 stick 브랜치에 누적(build는 커밋 안 함) → `ship`(큰 사이클)이 커밋·푸쉬·`dam` 병합(충돌 시 resolve 자동).
**위치**: 설정 `.beaver/config.json` · 산출물 `.beaver/output/{spec,plan,revision,report,refactor}/` · 메모리 `.beaver/memory/`(인덱스 MEMORY.md, 코드로 알 수 있는 내용은 저장 안 함).

---

<!-- 아래는 analyze가 채우는 규약. 안 쓰는 섹션 삭제, 깊은 건 docs/ 분리. -->

## Architecture
<!-- 스택 + 디렉터리 + 레이어. → docs/architecture.md -->
## Conventions
<!-- 네이밍·스타일·라우팅. → docs/conventions.md -->
## 공통 로직 분리
<!-- util vs module/service 기준 (리팩토링 근거). -->
## Data Layer
<!-- 엔티티/모델·repository·쿼리·트랜잭션. → docs/data-layer.md. ORM 없으면 삭제. -->
## Validation
<!-- 검증 방식·메시지·error-key. -->
## Error & Response
<!-- 예외·throw/catch·통일 메시지·응답·상태코드. → docs/error-handling.md -->
## API & Docs
<!-- 라우팅·OpenAPI·인증. → docs/api.md. 없으면 삭제. -->
## Testing
<!-- 프레임워크·위치·강도·mock. → docs/testing.md -->
## Checklist
<!-- 구현 점검 규칙 - [ ]. -->
