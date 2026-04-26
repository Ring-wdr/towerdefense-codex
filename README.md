# Tower Defense

브라우저에서 바로 플레이할 수 있는 경량 타워 디펜스 게임입니다. 데스크톱과 모바일 레이아웃을 함께 지원하며, GitHub Pages로 자동 배포됩니다.

## Features

- 웨이브 기반 적 등장과 보스 웨이브
- 공격, 감속, 마법, 캐논, 헌터 타워 선택 및 업그레이드
- 키보드와 모바일 터치 조작 지원
- PWA 설치와 서비스 워커 기반 오프라인 재방문 지원
- GitHub Actions CI 후 GitHub Pages 자동 배포

## Tech Stack

- Vite
- React
- Vanilla JavaScript
- Phaser 4
- HTML / CSS
- Node.js test runner
- Playwright CLI

## Local Development

```bash
npm install
npm run dev
```

개발 서버가 뜨면 브라우저에서 표시된 로컬 주소로 접속하면 됩니다.

React가 타이틀, 캠페인, 테마, 상점 화면과 바깥 앱 셸, DOM 전투 컨트롤을 소유합니다.
Phaser는 `#game-root` 내부에서 battle과 battle-only overlay 흐름만 담당합니다.

## Scripts

- `npm run dev`: 로컬 개발 서버 실행
- `npm run build`: 프로덕션 빌드 생성
- `npm run preview`: 빌드 결과 미리보기
- `npm test`: 게임 로직 테스트 실행
- `npm run assets:center`: 타워/적 PNG 에셋의 알파 영역을 기준으로 중앙 정렬 드라이런
- `npm run assets:center:write`: 중앙 정렬 결과를 실제 PNG 파일에 반영

## Deployment

`main` 브랜치에 반영된 변경은 GitHub Actions에서 다음 순서로 처리됩니다.

1. `CI` 워크플로가 의존성 설치와 테스트 실행
2. CI 성공 시 `Deploy GitHub Pages` 워크플로가 정적 빌드 생성
3. 생성된 `dist` 산출물을 GitHub Pages에 배포

배포 주소:

- [https://ring-wdr.github.io/towerdefense-codex/](https://ring-wdr.github.io/towerdefense-codex/)

첫 온라인 로드 이후에는 서비스 워커가 핵심 정적 자산을 캐시하므로, 같은 디바이스에서 설치 후 재방문할 때 오프라인 실행이 가능합니다.
