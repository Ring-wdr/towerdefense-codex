# Tower Defense

브라우저에서 바로 플레이할 수 있는 경량 타워 디펜스 게임입니다. 데스크톱과 모바일 레이아웃을 함께 지원하며, GitHub Pages로 자동 배포됩니다.

## Features

- 웨이브 기반 적 등장과 보스 웨이브
- 공격, 감속, 마법, 캐논, 헌터 타워 선택 및 업그레이드
- 키보드와 모바일 터치 조작 지원
- GitHub Actions CI 후 GitHub Pages 자동 배포

## Tech Stack

- Vite
- Vanilla JavaScript
- HTML / CSS
- Node.js test runner

## Local Development

```bash
npm install
npm run dev
```

개발 서버가 뜨면 브라우저에서 표시된 로컬 주소로 접속하면 됩니다.

## Scripts

- `npm run dev`: 로컬 개발 서버 실행
- `npm run build`: 프로덕션 빌드 생성
- `npm run preview`: 빌드 결과 미리보기
- `npm test`: 게임 로직 테스트 실행

## Deployment

`main` 브랜치에 반영된 변경은 GitHub Actions에서 다음 순서로 처리됩니다.

1. `CI` 워크플로가 의존성 설치와 테스트 실행
2. CI 성공 시 `Deploy GitHub Pages` 워크플로가 정적 빌드 생성
3. 생성된 `dist` 산출물을 GitHub Pages에 배포

배포 주소:

- [https://ring-wdr.github.io/towerdefense-codex/](https://ring-wdr.github.io/towerdefense-codex/)

## GitHub Score Submission Setup

게임 오버 시 GitHub 이슈 댓글로 점수를 기록하려면 브라우저용 GitHub App과 아래 환경 변수를 설정해야 합니다.

- `VITE_GITHUB_APP_CLIENT_ID`
- `VITE_GITHUB_LEADERBOARD_ISSUE_NUMBER`
- `VITE_GITHUB_REPO_OWNER`
- `VITE_GITHUB_REPO_NAME`
- `VITE_GITHUB_REDIRECT_URI`
- `VITE_APP_BUILD` (선택)

로컬 개발에서는 GitHub App에 등록한 로컬 주소를 `VITE_GITHUB_REDIRECT_URI`로 사용하세요. GitHub Pages 배포에서는 배포 주소와 정확히 일치하는 URL을 사용해야 합니다.

## Manual Check

1. 게임을 시작해 `Game Over` 화면까지 진행합니다.
2. `GitHub에 점수 기록` 버튼을 누릅니다.
3. GitHub App 권한 승인을 완료합니다.
4. 페이지가 게임으로 돌아온 뒤 성공 또는 실패 상태 메시지가 보이는지 확인합니다.
5. 고정된 `Leaderboard` 이슈에 점수, 웨이브, 남은 목숨, 시간, 빌드 정보가 댓글로 남았는지 확인합니다.
