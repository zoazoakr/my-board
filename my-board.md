게시판 프로젝트 개발 지시서 (Cloudflare 기반)
1. 프로젝트 개요
- 회원가입, 로그인, 파일 첨부 기능이 포함된 풀스택 게시판 애플리케이션을 개발합니다.
Cloudflare의 생태계(Pages, Functions, D1)를 최대한 활용하여 서버리스(Serverless) 형태로 동작하도록 구성해야 합니다. 

- 게시판에는 글 목록이 있어서, 읽고, 수정, 삭제가 가능하게 해야 합니다.
- 게시글에는 댓글 기능이 있어서 버튼을 클릭하여 댓글을 달 수 있게 합니다. 
2. 기술 스택 (Tech Stack)
Frontend: HTML, CSS(Tailwind CSS), Vanilla JavaScript (또는 React)
Backend: Cloudflare Pages Functions (API 라우트)
Database: Cloudflare D1 (SQLite 기반 관계형 데이터베이스)
Storage: Cloudflare D1 (이미지/파일 첨부용 오브젝트 스토리지)
Deployment: Cloudflare Pages (GitHub 자동 연동)
Language :  한글 버전


3. 데이터베이스(D1) 스키마 설계
터미널 명령어(Wrangler)를 사용하여 다음 스키마를 초기화할 수 있는 schema.sql 파일을 생성하세요.
Users 테이블:
id: INTEGER PRIMARY KEY AUTOINCREMENT
username: TEXT UNIQUE NOT NULL
password_hash: TEXT NOT NULL
created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
Posts 테이블:
id: INTEGER PRIMARY KEY AUTOINCREMENT
user_id: INTEGER (Users 테이블 참조)
title: TEXT NOT NULL
content: TEXT NOT NULL
file_url: TEXT (D1에 업로드된 파일의 접속 URL, nullable)
created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
4. 에이전트 실행 단계 (Agent Instructions)
이 문서를 읽은 Antigravity 에이전트는 다음 순서대로 작업을 수행하고, 각 단계가 끝날 때마다 보고해 주세요.
Step 1: 프로젝트 초기화
Cloudflare Pages 프로젝트 구조를 생성하세요. (public 폴더, functions 폴더 등)
wrangler.toml 파일을 생성하고 오늘 날짜로 D1 데이터베이스 바인딩 설정을 미리 작성하세요.
Step 2: API 백엔드 개발 (Functions)
/api/auth/register (회원가입, 비밀번호 해싱 포함)
/api/auth/login (로그인, JWT 또는 세션 쿠키 발급)
/api/posts (게시글 목록 조회 및 작성)
/api/upload (D1에 파일을 업로드하고 URL을 반환하는 API)
Step 3: 프론트엔드 UI 개발 (Public 폴더)
회원가입/로그인 페이지 UI (index.html 또는 별도 페이지)
게시판 목록 페이지 UI (글쓰기 버튼 포함)
글 작성 페이지 UI (제목, 내용, 파일 첨부 <input type="file"> 폼 포함)
Tailwind CSS를 CDN으로 불러와 깔끔하고 모던한 UI로 디자인하세요.
Step 4: 프론트와 백엔드 연동
Fetch API를 사용하여 프론트엔드에서 백엔드 API로 데이터를 보내고, 화면을 동적으로 업데이트하는 로직을 작성하세요.
Step 5: 로컬 테스트 환경 설정
개발자가 npx wrangler pages dev 명령어로 로컬에서 테스트할 수 있도록 필요한 npm 패키지(예: wrangler)를 설치하고 package.json 스크립트를 세팅해 주세요.
5. 중요 주의사항
파일 업로드 시 Cloudflare D1 API를 정확히 사용하도록 코드를 작성하세요.
인증 토큰(JWT)이나 쿠키는 HttpOnly를 사용하여 안전하게 처리되도록 구성하세요.
모든 코드는 주석을 달아 초보자가 이해하기 쉽게 작성하세요.

