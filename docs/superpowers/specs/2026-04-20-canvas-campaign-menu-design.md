# Phaser 기반 캠페인 메뉴/모바일 UI 디자인 문서

## 목표
현재 캠페인 UI는 HTML 카드와 DOM 버튼 중심으로 구성되어 있어 모바일에서 한 화면에 들어오지 않고, 게임 화면과 메뉴 화면이 하나의 게임처럼 느껴지지 않는다.  
이번 변경의 목표는 `메인 메뉴 -> 캠페인 메뉴 -> 테마/디테일 -> 게임 화면` 전환 전체를 Phaser 기반 장면 구조로 재구성해, 모바일에서도 스크롤 없이 한 화면 안에서 동작하는 게임다운 UI를 만드는 것이다.

## 현재 문제
- 메인 메뉴, 캠페인 메뉴, 테마, 디테일이 HTML 카드 섹션으로 쪼개져 있어 모바일에서 세로 길이가 길어진다.
- 현재 구조는 CSS 반응형 카드 레이아웃에 의존하고 있어, 한 화면 고정형 게임 UI 느낌이 약하다.
- 메뉴 조작이 DOM 버튼 중심이라 전투 장면과 메뉴 장면의 시각 언어와 입력 방식이 다르다.
- 모바일에서 `sidebar`와 `control-dock` 같은 전투 전용 UI와 메뉴 UI의 경계가 일관되지 않았다.
- 사용자는 게임 컨트롤을 제외한 나머지 화면 구성에 HTML 태그가 거의 개입하지 않기를 원한다.
- 현재 `main.js`는 수동 캔버스 렌더, DOM 메뉴 제어, 전투 입력이 한 파일에 섞여 있어 장면 상태가 복잡해질수록 유지보수가 급격히 나빠진다.

## 확정 범위
- 메인 메뉴, 캠페인 메뉴, 테마, 스테이지 디테일을 전부 Phaser Scene 기반으로 구현한다.
- 모바일 기준으로 스크롤 없이 한 화면 안에 모든 메뉴 흐름이 들어오도록 설계한다.
- 테마와 디테일은 모바일에서 별도 화면으로 나누지 않고 한 Scene 안에 통합한다.
- 메뉴 입력은 DOM 버튼이 아니라 Phaser 입력 시스템으로 처리한다.
- HTML에는 Phaser 게임 컨테이너와 전투용 컨트롤만 남긴다.
- 전투 자체의 핵심 규칙이나 스테이지 진행 규칙은 변경하지 않는다.
- 기존 전투 규칙 로직은 가능하면 재사용하고, Phaser는 렌더링/입력/장면 관리 계층으로 도입한다.

## 비목표
- 타워/적 전투 규칙 변경
- 스테이지 수나 테마 구조 변경
- 신규 전투 HUD 기능 추가
- 복잡한 연출용 애니메이션 시스템 대규모 추가
- 데스크탑 전용 별도 메뉴 디자인 분기

## 기술 방향
이번 작업은 순수 canvas 직접 렌더 구조가 아니라 Phaser 3를 중심으로 재구성한다.

### Phaser를 선택한 이유
- Scene 개념으로 `title`, `campaign`, `theme`, `battle`, `pause`, `game-over`를 자연스럽게 분리할 수 있다.
- 입력 시스템이 마우스와 터치를 통합 처리한다.
- 모바일 한 화면 고정형 레이아웃을 Scale Manager 기준으로 계산할 수 있다.
- UI도 게임 오브젝트로 다뤄 전투 장면과 같은 시각 언어로 통일하기 쉽다.

### 역할 분리
- Phaser: 장면 전환, 입력, 렌더링, 모바일 레이아웃 기준
- 기존 로직 계층: 스테이지 데이터, 캠페인 진행 데이터, 전투 규칙
- HTML: Phaser 마운트 컨테이너 + 전투용 보조 컨트롤 최소 영역

## 정보 구조
앱은 하나의 Phaser Game 인스턴스를 중심으로 동작한다.

### Scene 상태
- `TitleScene`
- `CampaignScene`
- `ThemeScene`
- `BattleScene`
- `OverlayScene`

`OverlayScene`는 `paused`, `game-over` 같은 전투 위 패널을 담당한다.  
전투와 메뉴를 같은 Scene에서 억지로 섞지 않고, 장면 단위로 명확히 분리한다.

### 진행 상태
- `selectedTheme`
- `selectedStage`
- `activeStage`
- `clearedStages`

핵심 원칙은 `selectedStage`는 메뉴에서 보고 있는 스테이지, `activeStage`는 실제로 전투 중인 스테이지라는 점을 유지하는 것이다.

### 상태 저장 위치
- 전역 게임 상태를 Phaser registry 또는 별도 상태 컨트롤러 객체로 관리한다.
- 전투 로직 state와 캠페인 진행 state는 분리한다.
- Scene은 상태를 직접 소유하기보다 읽고 갱신하는 consumer 역할에 가깝게 둔다.

## 모바일 레이아웃 문법
모든 메뉴 화면은 모바일 세로 화면 기준으로 스크롤 없이 한 화면에 맞아야 한다.  
레이아웃은 CSS 카드 쌓기가 아니라 Phaser Scale 기준 비율 계산으로 배치한다.

### 1. 메인 메뉴 (`TitleScene`)
- 상단: 로고/타이틀
- 중앙: 짧은 소개 문구
- 하단: 큰 `Start` 버튼
- 버튼은 손가락 탭 기준으로 충분히 커야 하며, 화면 폭의 큰 비중을 차지한다.

### 2. 캠페인 메뉴 (`CampaignScene`)
- 상단: `Campaign` 제목, 전체 진행도
- 중앙: 현재 선택된 테마 하나를 크게 보여 주는 메인 패널
- 좌우: 이전/다음 테마 전환 버튼
- 하단: `Enter Theme`, `Back`
- 여러 테마 카드를 길게 나열하지 않는다.

### 3. 테마 + 디테일 통합 화면 (`ThemeScene`)
- 상단: 테마 이름, 진행도, 뒤로 가기
- 중앙: 현재 테마의 스테이지 슬롯 목록
- 하단: 현재 선택된 스테이지 상세 정보와 `Enter`
- 스테이지 목록과 디테일은 하나의 Scene 안에서 동시에 보여 준다.
- 잠긴 스테이지도 보이되, 시각적으로 구분한다.
- 클리어한 스테이지는 언제든 다시 선택 가능해야 한다.

### 4. 게임 화면 (`BattleScene`)
- 현재 전투 보드와 게임 규칙을 유지한다.
- 전투 HUD는 Phaser 또는 최소 HTML로 표현할 수 있지만, 메뉴형 DOM은 개입하지 않는다.
- 전투에 필요한 컨트롤만 별도 계층으로 남긴다.

### 5. 결과/일시정지 (`OverlayScene`)
- 전투 Scene 위에 겹쳐지는 중앙 패널 Scene으로 표현한다.
- `Resume`, `Retry`, `Back` 같은 액션 버튼을 Phaser 입력으로 처리한다.

## 입력 처리
메뉴 입력은 Phaser 입력 시스템으로 처리한다.

### 원칙
- DOM 버튼 클릭으로 화면 전환하지 않는다.
- 버튼, 화살표, 스테이지 슬롯은 Phaser Game Object 또는 hit area를 가진 UI 객체로 만든다.
- 포인터 입력은 Scene 안에서 직접 처리한다.

### 예시
- `TitleScene`에서 `Start` 클릭 -> `CampaignScene`
- `CampaignScene`에서 화살표 클릭 -> `selectedTheme` 변경
- `CampaignScene`에서 `Enter Theme` 클릭 -> `ThemeScene`
- `ThemeScene`에서 스테이지 슬롯 클릭 -> `selectedStage` 변경
- `ThemeScene`에서 `Enter` 클릭 -> `activeStage = selectedStage`, `BattleScene` 시작
- `OverlayScene`에서 `Back` 클릭 -> `ThemeScene` 복귀

## HTML 경계
HTML에는 메뉴용 구조를 남기지 않는다.

### HTML에 남기는 것
- Phaser 게임 컨테이너
- 전투용 컨트롤
  - 예: 모바일 `control-dock`
  - 필요한 경우 최소 HUD 보조 요소

### HTML에서 제거 또는 비활성화할 것
- 메인 메뉴 섹션
- 캠페인 메뉴 섹션
- 테마 섹션
- 디테일 카드 섹션
- 메뉴용 버튼 DOM

즉, 게임 컨트롤을 제외한 나머지 UI는 시각적으로도 구조적으로도 Phaser Scene 안에서 해결한다.

## 아키텍처 구조
권장 구조는 `Phaser shell + existing gameplay logic` 방식이다.

### 재사용할 계층
- `src/game/logic.js`
- `src/game/stages.js`
- `src/game/campaign-progress.js`

이 계층은 가능하면 규칙/데이터 계층으로 유지하고, Phaser Scene은 이를 읽어 렌더링하고 입력 결과를 반영한다.

### 새로 분리할 계층
- Phaser game bootstrap
- Scene 클래스들
- Scene 공통 UI 렌더 유틸
- Phaser와 기존 logic state를 연결하는 adapter 계층

## 권장 파일 구조
- `src/phaser/game.js`
- `src/phaser/scenes/TitleScene.js`
- `src/phaser/scenes/CampaignScene.js`
- `src/phaser/scenes/ThemeScene.js`
- `src/phaser/scenes/BattleScene.js`
- `src/phaser/scenes/OverlayScene.js`
- `src/phaser/ui/layout.js`
- `src/phaser/ui/components.js`
- `src/phaser/state/game-session.js`

실제 파일명은 구현 단계에서 조정할 수 있지만, 메뉴 장면, 전투 장면, 공통 UI, 상태 연결 계층은 분리하는 것이 원칙이다.

## 시각 원칙
- 모바일에서 카드가 여러 장 쌓이는 DOM 레이아웃을 피한다.
- 장면마다 하나의 주된 포커스 영역만 둔다.
- 선택 상태, 잠금 상태, 클리어 상태는 색/테두리/아이콘으로 바로 구분 가능해야 한다.
- 텍스트 양은 짧게 유지한다.
- 전투 장면과 메뉴 장면이 같은 게임의 일부처럼 보여야 한다.

## 상태 전환 원칙
- `TitleScene`에서만 게임 시작 가능
- `CampaignScene`는 테마 선택 전용
- `ThemeScene`는 스테이지 선택과 디테일 확인 전용
- 실제 전투 진입은 `ThemeScene`의 `Enter`에서만 가능
- 전투 종료 후 자동으로 다른 스테이지 전투를 시작하지 않는다
- 클리어 후에는 메뉴 흐름으로 되돌아가 다음 선택을 하게 한다

## 구현 단위
1. Phaser 의존성 추가 및 게임 bootstrap 구성
2. 메뉴 DOM 제거와 Phaser Scene 진입 구조 정리
3. `TitleScene`, `CampaignScene`, `ThemeScene` 구현
4. 기존 전투 렌더를 `BattleScene` 구조로 이전
5. `OverlayScene`로 일시정지/게임오버 패널 분리
6. 기존 로직 계층과 Phaser state adapter 연결
7. 모바일 한 화면 고정형 레이아웃 튜닝

## 검증 기준
- 모바일에서 메인 메뉴가 스크롤 없이 한 화면에 들어온다.
- 캠페인 메뉴가 여러 카드 나열 없이 한 화면에서 조작된다.
- 테마와 디테일이 하나의 화면 안에서 함께 보인다.
- 메뉴 조작은 Phaser 입력으로만 가능하다.
- HTML 메뉴 섹션 없이도 `title -> campaign -> theme -> battle` 흐름이 유지된다.
- 잠긴 스테이지는 보이지만 진입 불가 상태로 표시된다.
- 클리어한 스테이지는 언제든 다시 선택 가능하다.
- 게임 컨트롤 외 HTML UI는 사용자에게 노출되지 않는다.
- Scene 전환이 모바일 터치 입력과 데스크탑 포인터 입력 모두에서 일관되게 동작한다.
