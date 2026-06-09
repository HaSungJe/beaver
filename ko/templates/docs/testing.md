<!-- Beaver docs 스킬레톤 — analyze 가 채운다. 근거 경로 표기. -->

# Testing

## 테스트 방식

<!-- 단위/통합 방침: mock 범위(repository·외부 I/O 대체 여부), 실DB·외부 API 접근 금지 여부, 내장 프레임워크 컴포넌트 실주입 여부. -->

## 위치 · 구성

<!-- 파일 위치/명명 규칙. 케이스 구성: SUCCESS × N / FAIL 분기(validation/service/repository/duplicate)별 개수와 샘플링 기준. -->

## 강도 규칙

<!-- 상태코드만 검사 금지. 각 케이스가 만족할 단언: 호출 횟수·호출 인자·실패 이후 미호출 단언. write 는 전달 값 검증. -->

### [SUCCESS]
<!-- 호출된 mock 의 횟수+인자, write entity 컬럼 값 검증 -->

### [FAIL:*]
<!-- 실패 지점까지 호출 검증, 이후 .not.toHaveBeenCalled() -->

## 실행

<!-- 전체 / 단일 도메인 실행 커맨드. -->

## 회귀 테스트 실패 처리

<!-- 본 기능 외 spec 실패 시 떠넘기지 말고: 원인 분석 → 규칙 위반이면 수정 → 모호하면 사용자 질의. -->
