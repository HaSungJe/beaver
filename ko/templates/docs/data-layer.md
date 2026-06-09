<!-- Beaver docs 스킬레톤 — analyze 가 채운다. ORM/DB 없으면 이 파일과 본문 링크 삭제.
     엔티티/repository 가 무거우면 entity.md / repository.md 로 더 쪼개도 됨(샘플 참고). -->

# Data Layer

## Entity / Model 규칙

<!-- 제약 명명 표준(PK/UK/IDX/FK), 컬럼 옵션 규칙, 타임스탬프 처리, 관계(FK) 선언 방식. -->

### 제약 이름 표준
| Type | Pattern | Example |
|---|---|---|
| PK |  |  |
| UK |  |  |
| FK |  |  |

### Entity 템플릿
```
// 대표 엔티티 1개를 규약대로 작성한 템플릿
```

## Repository / DAO 규칙

<!-- 범용 메서드 우선(CRUD 통일), where 조건 조립 위치(서비스 vs repository), 타입 규칙, try/catch 의무. -->

### 메서드 템플릿
```
```

## Pagination / 목록 조회 패턴

<!-- 목록 조회 표준 패턴(단일 메서드로 total/count/list 처리 등). 단계별로. -->

## 조회 DTO 생성자 규칙

<!-- query 파라미터 타입 변환·기본값 처리 위치, 생성자 시그니처 규칙. -->

## Transaction

<!-- 트랜잭션 경계와 적용 방식 (Architecture 와 중복되면 한쪽만). -->
