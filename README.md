# FIGNAL | 피그널

중고 피규어 거래 전, 판매 사진을 정품 참고 이미지와 비교해 가품 의심 포인트를 확인할 수 있는 서비스입니다.

- 서비스: [fignal.me](https://fignal.me)
- 주요 기술: Next.js, React, TypeScript, Cloudflare Workers, D1, Gemini

## 주요 기능

- 넓도로이드 제품 검색 및 버전 선택
- 판매 사진과 정품 참고 이미지 비교
- AI 기반 가품 의심 포인트 시각화
- 분석 결과 수정 및 사용자 피드백
- 검증 기록과 사례 공유

## 판정 원칙

피그널은 제품 정보와 사진이 부족한 상태에서 진품·가품을 단정하지 않습니다. 제품 지원 여부, 필수 사진, 비교 가능한 근거를 확인한 후 다음 경로 중 하나를 안내합니다.

- 사례 비교 완료
- 추가 검토 필요
- 사진 추가 필요
- 지원 범위 밖

AI 분석은 중고 거래 판단을 돕는 참고 정보이며 정품 여부를 보증하지 않습니다.

## 로컬 실행

Node.js 환경에서 의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

AI 분석을 사용하려면 `.env.example`을 참고해 `GEMINI_API_KEY`를 설정해야 합니다.

## 검증

```bash
npm run lint
npm run typecheck
npm run test:data
npm run build
```

## 배포 구조

- Cloudflare Workers: Next.js 앱과 API
- Cloudflare D1: 검증 기록, 커뮤니티, 피드백, 사이트 이벤트
- Gemini API: 이미지 비교 분석
