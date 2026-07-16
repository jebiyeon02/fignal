# 피그시그널

피규어 중고거래 전에 사진을 올려 정품·가품 가능성을 확인하는 프로토타입입니다. 제품을 선택하면 공식 제품 이미지와 제조사가 공개한 가품 비교 사례를 AI 분석 자료로 함께 사용하고, 결과 화면에서 사용자가 근거 사진과 원문을 직접 다시 확인할 수 있습니다.

## 실행

```bash
npm install
npm run dev
npm run lint
npm run test:data
npm run build
```

Gemini 분석에는 배포 환경의 `GEMINI_API_KEY`가 필요합니다. 선택 설정은 `.env.example`을 참고하세요.

## 주요 데이터 파일

- `app/catalog.ts`: 자동완성에 쓰이는 제품명, 제품 번호, 제조사, 공식 이미지와 제품 페이지
- `app/counterfeit-cases.ts`: 제품별 공식·커뮤니티 가품 사례, 비교 이미지, 판별 특징과 출처
- `app/data/counterfeit-evidence.generated.json`: 자동 등록된 증빙과 외부 이미지 참조
- `app/data/counterfeit-review-queue.generated.json`: 제품 매핑 또는 관리자 검수가 필요한 자료
- `app/data/community-mentions.generated.json`: 제품 번호·전체 제품명이 정확히 연결된 검증 전 커뮤니티 언급. 판정에는 사용하지 않음
- `app/data/counterfeit-import-report.json`: 마지막 dry-run·등록 결과 집계
- `app/page.tsx`: 제품 검색, 사진 입력, 결과와 가품 사례 UI
- `app/api/analyze/route.ts`: 사용자 사진·공식 제품 이미지·가품 사례 이미지를 Gemini에 전달하는 서버 API
- `scripts/import-counterfeit-dataset.mjs`: CSV 검증, 중복 제거, 등록·보류 분류 스크립트

## 정품·가품 확인 사례 보유 제품

2026-07-16 기준으로 제품 번호와 버전을 정확히 식별할 수 있는 33개 제품에 36개 공개 비교 사례를 연결했습니다. 33개는 제조사 공식 사례이며, 추가 3개는 데이터셋 검수 규칙을 통과한 공식·실물 비교 사례입니다. 아래 표의 `productId`는 `app/catalog.ts`와 `app/counterfeit-cases.ts`에서 동일해야 합니다.

| No. | 제품 | productId | 대표 확인 특징 | 근거 |
| --- | --- | --- | --- | --- |
| 9 | 아사히나 미쿠루 | `nendoroid-9` | 빔 투명도, 홍조·눈썹, JAN 글꼴, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2031/) |
| 17 | L | `nendoroid-17` | 박스 색, 눈 인쇄·피부 광택, 의자 조형 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2030/) |
| 33 | 하츠네 미쿠 | `nendoroid-33` | 패키지 인쇄, 조형사명·저작권, 얼굴 광택, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2289/) |
| 40 | 카가미네 렌 | `nendoroid-40` | 마이크 방향, 넥타이 결합, 소품 도색, 홀로그램 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3565/) |
| 77 | 세이버 릴리 | `nendoroid-77` | 승인 스티커, 얼굴 광택, 관절 색, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2842/) |
| 97 | 스노우 미쿠 | `nendoroid-97` | 눈꽃 반사 인쇄, 입·넥타이 도색, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2899/) |
| 97 확장판 | 스노우 미쿠 즐거운 눈놀이 에디션 | `nendoroid-97-playtime` | 홀로그램, 얼음틀, 눈 그라데이션, 트윈테일 결합 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3452/) |
| 106 | 블랙 록 슈터 | `nendoroid-106` | DVD 스티커, 지퍼 구멍, 목 도색, 얼굴 내부 구조 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3064/) |
| 128 | 데드 마스터 | `nendoroid-128` | 얼굴 연결부, 머리 그라데이션, 눈 인쇄, 소품 분리 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3249/) |
| 129 | 하츠네 미쿠 앱솔루트 HMO 에디션 | `nendoroid-129` | 얼굴 연결부, 어깨 번호, 의상·드럼 도색 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3251/) |
| 143 | 블랙 골드 소 | `nendoroid-143` | 자석, 머리 구멍, 무기 디테일, 관절 색 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3241/) |
| 144 | 코우사카 키리노 | `nendoroid-144` | 받침대 표기, 얼굴 연결부, 관절·눈 도색 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3561/) |
| 163 | 쿠로네코 | `nendoroid-163` | 홍조, 프릴 색, 관절 색, 머리 안쪽 도색 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3453/) |
| 174 | 카나메 마도카 | `nendoroid-174` | 얼굴 연결부, 활 투명도, 눈 도색, 내부 포장 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3250/) |
| 204 | 멘마 | `nendoroid-204` | 관절 색, 얼굴 번호, 자석 스탠드, 머리 마감 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3516/) |
| 207 | 스노우 미쿠 푹신푹신 코트 Ver. | `nendoroid-207` | 박스 크기·설명, 결합 마감, 누락 구성품 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3438/) |
| 283 | 아스나 | `nendoroid-283` | 박스 번호·문구, 검 연결부, 목 도색·구조 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3710/) |
| 284 | 아이언맨 마크 7 히어로즈 에디션 | `nendoroid-284` | 마스크·베이스 저작권, 자석, 패키지 광택 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3711/) |
| 303 | 스노우 미쿠 딸기 백무구 Ver. | `nendoroid-303` | 후드 안쪽, 얼굴 연결부, 패키지 띠, 저작권 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3666/) |
| 380 | 스노우 미쿠 매지컬 스노우 Ver. | `nendoroid-380` | 눈꽃 조형, 유키네 관절, 머리 자석, 스탠드 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/4133-1/) |
| 425 | 레드 | `nendoroid-425` | 로고, 관절 색, 목 관절, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/4413/) |
| 511 | 미카즈키 무네치카 | `nendoroid-511` | 입술·칼집 도색, 스탠드 연결부 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/) |
| 518 | 카슈 키요미츠 | `nendoroid-518` | 입술 외곽선, 스탠드 연결부 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/) |
| 524 | 우마루 | `nendoroid-524` | 로고, 후드 속 머리카락, 목 관절, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/5013/) |
| 525 | 코기츠네마루 | `nendoroid-525` | 로고, 칼집 도색, 목 관절 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/) |
| 544 | 커비 | `nendoroid-544` | 입 외곽선, 나사 구멍, 자석·내부 도색 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/5207/) |
| 676 | 나카하라 츄야 | `nendoroid-676` | 로고·저작권, 얼굴 구조, 받침대 표기 | [GSC 고객지원](https://support.goodsmile.com/hc/en-us/articles/39729124039449-Bootleg-Information-Nendoroid-series) |
| 682 | 우즈마키 나루토 | `nendoroid-682` | 박스 디자인, 목 관절 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/5981-6106/) |
| 707 | 우치하 사스케 | `nendoroid-707` | 패키지 로고, 목 관절 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/5981-6106/) |
| 730 | 트레이서 클래식 스킨 에디션 | `nendoroid-730` | 패키지, 목 관절, 펄스 폭탄 결합 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/6214/) |
| 803 | 에도가와 코난 | `nendoroid-803` | 패키지 표기, 단추 도색, 목 관절, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/6607/) |
| 1279 | 헌터 | `nendoroid-1279` | 머리 구조, 권총·램프 도색, 받침대 표기 | [GSC 고객지원](https://support.goodsmile.com/hc/en-us/articles/39729124039449-Bootleg-Information-Nendoroid-series) |
| 1538 | 하츠네 미쿠 심포니 5주년 Ver. | `nendoroid-1538` | 패키지 크기, 로고·창 인쇄·저작권 누락 | [GSC 고객지원](https://support.goodsmile.com/hc/en-us/articles/39729124039449-Bootleg-Information-Nendoroid-series) |

## 출처 신뢰도 원칙

제품별 판정 근거의 우선순위는 다음과 같습니다.

1. 제조사·유통사의 공식 가품 안내와 정품 비교 사진
2. 공식 제품 페이지, 공식 교환·리콜·패키지 변경 안내
3. 원본 사진과 구매 경위가 남은 커뮤니티 실물 비교 글
4. 출처가 재확인되지 않는 재게시물이나 판매자 홍보 글은 등록하지 않음

기존 제품별 33개 사례는 모두 굿스마일 공식 고객지원 또는 공식 가품 아카이브에서 확인했습니다. 추가 자료는 `official_confirmed` 또는 `side_by_side_author_asserted`만 자동 등록하며 UI에서 `공식 제조사 자료`와 `실물 비교 사례`를 구분합니다.

## 외부 데이터셋 가져오기

먼저 dry-run으로 분류 결과를 확인하고, 같은 입력으로 실제 생성합니다.

```bash
node scripts/import-counterfeit-dataset.mjs \
  --dataset /absolute/path/to/nendoroid_counterfeit_dataset \
  --check-links \
  --dry-run

npm run data:import -- \
  --dataset /absolute/path/to/nendoroid_counterfeit_dataset
```

마지막 실행에서는 후보 109건 중 정확한 제품 매핑이 가능한 증빙 32건을 등록했습니다. 29건은 기존 사례에 출처 메타데이터를 보강했고, 3건은 신규 공개 사례로 연결했습니다. 약한 라벨과 제품 번호 미확정 자료 80건은 검수 대기로 분리했습니다.

전체 원본 1,008건에서 커뮤니티 분류·작성자 주장·정품 여부 질문·일반 참고자료 959건도 별도로 확인했습니다. 제품 번호 또는 전체 제품명이 현재 카탈로그와 정확히 일치하는 25건을 21개 제품에 연결했고, 이 중 10건은 커뮤니티 분류, 15건은 결론이 검증되지 않은 정품 여부 질문입니다. 나머지 934건은 제품을 특정할 수 없어 공개 화면에 연결하지 않았습니다.

이 자료는 결과 화면의 접힌 `관련 커뮤니티 언급`에서만 보입니다. `검증 전·판정 미반영`으로 표시하며 AI 요청, 신뢰도 점수, 정품·가품 가능성 계산에는 전달하지 않습니다. 게시물 제목·작성자·판매자·프로필과 외부 이미지는 복제하지 않고, 일반화한 설명과 원문 링크만 저장합니다.

이미지 참조 451건은 URL 기준 389건으로 중복 정리했습니다. 모든 이미지의 권한 상태가 `unknown_link_only`이므로 파일은 다운로드하지 않았고 원본 URL만 저장했습니다. 이 때문에 콘텐츠 SHA-256과 perceptual hash는 의도적으로 비워 두며, 저장 허가가 확인된 이미지에만 추후 계산합니다. 깨진 링크·비이미지·접근 제한 8건은 공개 화면에서 사용하지 않습니다.

### 일반 커뮤니티 참고자료

아래 글은 사진 촬영 항목과 일반 판별 기준을 정리할 때 참고했지만, 특정 제품·버전의 실제 가품 사례로 단정해 데이터베이스에 연결하지 않았습니다.

- [피규어 마이너 갤러리 판별 가이드](https://gall.dcinside.com/mgallery/board/view/?id=figuregall&no=3344)
- [세이부타 마이너 갤러리 가품 판별 글](https://gall.dcinside.com/mgallery/board/view/?id=seibuta&no=36597)
- [토이 갤러리 정품·가품 확인 글](https://gall.dcinside.com/board/view/?id=toy&no=334719)

커뮤니티 사례를 제품에 연결하려면 제품 번호와 버전, 촬영 대상이 명확하고 원본 비교 사진이 남아 있어야 합니다. `판매자가 가품이라고 말했다` 같은 텍스트만 있는 글은 근거로 쓰지 않습니다.

## 사례 추가 규칙

1. `app/catalog.ts`에 정확한 제품 번호·버전과 영문명을 등록합니다.
2. `app/counterfeit-cases.ts`의 `productId`를 카탈로그 ID와 일치시킵니다.
3. `sourceType`은 `official` 또는 `community`, `sourceName`과 `sourceUrl`은 원문 기준으로 기록합니다.
4. `summary`와 `signals`에는 출처에서 직접 확인되는 차이만 한국어로 요약합니다. 추측이나 범용 상식을 제품 고유 사례처럼 넣지 않습니다.
5. 비교 이미지는 한 사례당 최대 4장으로 제한하고, 정품과 가품의 어느 부분을 비교하는지 알 수 있는 사진을 우선합니다.
6. `checkedAt`에 마지막 링크·내용 확인일을 기록합니다.
7. README 표에도 같은 제품을 추가합니다.

공식 사례가 있다는 사실은 해당 특징이 보이면 가품 가능성을 높이는 근거이지만, 그 특징이 보이지 않는다고 정품이 보장되지는 않습니다. 제조 시기·재판·유통 지역에 따른 정식 패키지 차이도 있으므로 최종 판정 문구는 항상 가능성으로 표현합니다.

## 배포 구조

이 프로젝트는 OpenAI Sites용 vinext 앱입니다. `.openai/hosting.json`에 사이트 설정이 있고, Cloudflare Worker가 서버 API와 Gemini 비밀키를 처리합니다. API 키를 브라우저 코드나 커밋에 넣지 마세요.
