# 피그시그널

피규어 중고거래 전에 사진을 올려 정품·가품 가능성을 확인하는 프로토타입입니다. 제품을 선택하면 공식 제품 이미지와 제조사가 공개한 가품 비교 사례를 AI 분석 자료로 함께 사용하고, 결과 화면에서 사용자가 근거 사진과 원문을 직접 다시 확인할 수 있습니다.

## 서비스 판정 흐름

피그시그널은 사례가 없거나 사진이 부족한 상태에서 억지로 진품·가품 결론을 만들지 않습니다. `지원 여부 → 필수 사진 충족 → 제품별 비교 사례 존재` 순서로 확인하고 다음 네 가지 경로 중 하나를 안내합니다.

```text
지원하는 제품인가?
├─ 아니요 → 지원 범위 밖
└─ 예
   └─ 필수 정보가 충분한가?
      ├─ 아니요 → 사진 추가 필요
      └─ 예
         └─ 판정에 반영할 제품별 사례가 있는가?
            ├─ 예 → 사례 비교 완료
            └─ 아니요 → 추가 검토 필요
```

| 경로 | 조건 | 사용자에게 제공하는 기능 |
| --- | --- | --- |
| 사례 비교 완료 | 공식 카탈로그 제품이고 필수 사진과 판정 반영 사례가 있음 | AI 위험 신호 분석, 사례별 공통점·차이점, 출처 원문과 비교 사진 |
| 추가 검토 필요 | 필수 사진은 충분하지만 제품별 판정 사례가 없음 | 범용 기준 1차 분석, 커뮤니티·전문가에게 보낼 추가 검토 요청서 공유 |
| 사진 추가 필요 | 필수 사진이 4장 미만이거나 AI가 글자·각인을 판독하지 못함 | 부족한 촬영 부위와 촬영 방법, 같은 요청에서 사진을 보완하는 동선 |
| 지원 범위 밖 | 사용자가 직접 입력해 공식 제품·버전 정보를 확인하지 못함 | 추측성 판정 대신 공식 제조사·유통사·전문가 확인 방법 안내 |

비교 사례는 `verdictImpact !== "none"`인 검수 자료만 계산합니다. 제품 번호가 연결된 일반 커뮤니티 언급은 결과 화면에 참고용으로 표시하지만, 사례 존재 여부나 AI 판정에는 반영하지 않습니다.

현재 프로토타입의 추가 검토 기능은 제품 정보, 확인한 사진 수와 확인이 필요한 항목을 텍스트 요청서로 만들어 사용자가 커뮤니티 또는 전문가에게 공유하는 방식입니다. 서버 검토 큐와 메인테이너 답변 저장은 아직 구현하지 않았으므로, 요청서를 공유해도 서비스 안에서 자동으로 답변이 돌아오지는 않습니다.

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

- `app/catalog.ts`: 수기 검수 제품과 공식 생성 카탈로그를 합쳐 자동완성에 제공
- `app/data/nendoroids-1-500.generated.json`: 굿스마일 공식 목록·제품 상세에서 동기화한 No.1–500 제품
- `app/data/nendoroids-catalog.generated.json`: 전체 제품 검색 범위를 유지하는 고정 카탈로그 스냅샷. 대표 이미지는 공식 주소만 포함
- `app/counterfeit-cases.ts`: 제품별 공식·커뮤니티 가품 사례, 비교 이미지, 판별 특징과 출처
- `app/data/counterfeit-evidence.generated.json`: 자동 등록된 증빙과 외부 이미지 참조
- `app/data/counterfeit-review-queue.generated.json`: 제품 매핑 또는 관리자 검수가 필요한 자료
- `app/data/community-mentions.generated.json`: 제품 번호·전체 제품명이 정확히 연결된 검증 전 커뮤니티 언급. 판정에는 사용하지 않음
- `app/data/counterfeit-import-report.json`: 마지막 dry-run·등록 결과 집계
- `app/page.tsx`: 제품 검색, 사진 입력, 결과와 가품 사례 UI
- `app/api/analyze/route.ts`: 사용자 사진·공식 제품 이미지·가품 사례 이미지를 Gemini에 전달하는 서버 API
- `scripts/import-counterfeit-dataset.mjs`: CSV 검증, 중복 제거, 등록·보류 분류 스크립트
- `research/domain/`: 사람과 AI가 함께 사용하는 넨도로이드 기본 도메인 지식
- `research/authenticity/`: 진품·가품 출처 사례, 이미지 참조, 라벨링 가이드와 학습 후보
- `research/service/`: 사진 접수, 위험 보고서, 분쟁 대응 등 서비스 설계와 워크플로 사례

## 정품·가품 확인 사례 보유 제품

2026-07-16 기준으로 제품 번호와 버전을 정확히 식별할 수 있는 46개 제품에 49개 공개 사례를 연결했습니다. 기존 33개 제품은 제조사 공식 자료와 검수된 데이터셋을 사용하며, 신규 13개 제품은 커뮤니티 비교·실물·언급 자료로 분리해 표시합니다. 신규 커뮤니티 사례는 사용자 화면에만 참고용으로 노출하며 AI 요청, 점수와 최종 판정에는 전달하지 않습니다. 아래 표의 `productId`는 `app/catalog.ts`와 `app/counterfeit-cases.ts`에서 동일해야 합니다.

| No. | 제품 | productId | 대표 확인 특징 | 근거 |
| --- | --- | --- | --- | --- |
| 16 | 아사히나 미쿠루 | `nendoroid-16` | 빔 투명도, 홍조·눈썹, JAN 글꼴, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2031/) |
| 17 | L | `nendoroid-17` | 박스 색, 눈 인쇄·피부 광택, 의자 조형 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2030/) |
| 33 | 하츠네 미쿠 | `nendoroid-33` | 패키지 인쇄, 조형사명·저작권, 얼굴 광택, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2289/) |
| 40 | 카가미네 렌 | `nendoroid-40` | 마이크 방향, 넥타이 결합, 소품 도색, 홀로그램 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3565/) |
| 77 | 세이버 릴리 | `nendoroid-77` | 승인 스티커, 얼굴 광택, 관절 색, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2842/) |
| 97 | 스노우 미쿠 | `nendoroid-97` | 눈꽃 반사 인쇄, 입·넥타이 도색, 받침대 표기 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/2899/) |
| 150 | 스노우 미쿠 즐거운 눈놀이 에디션 | `nendoroid-150` | 홀로그램, 얼음틀, 눈 그라데이션, 트윈테일 결합 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3452/) |
| 106 | 블랙 록 슈터 | `nendoroid-106` | DVD 스티커, 지퍼 구멍, 목 도색, 얼굴 내부 구조 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3064/) |
| 128 | 데드 마스터 | `nendoroid-128` | 얼굴 연결부, 머리 그라데이션, 눈 인쇄, 소품 분리 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3249/) |
| 129 | 하츠네 미쿠 앱솔루트 HMO 에디션 | `nendoroid-129` | 얼굴 연결부, 어깨 번호, 의상·드럼 도색 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3251/) |
| 142 | 코우사카 키리노 | `nendoroid-142` | 받침대 표기, 얼굴 연결부, 관절·눈 도색 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3561/) |
| 144 | 쿠로네코 | `nendoroid-144` | 홍조, 프릴 색, 관절 색, 머리 안쪽 도색 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3453/) |
| 145 | 블랙 골드 소 | `nendoroid-145` | 자석, 머리 구멍, 무기 디테일, 관절 색 | [GSC 공식 가품 사례](https://partner.goodsmile.info/support/eng/fake/en/3241/) |
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

### 커뮤니티 사례 확장 제품 13개

아래 자료는 제조사 공식 판정이 아닙니다. `정품·가품 비교`, `가품 실물 확인`, `커뮤니티 언급`으로 신뢰 범위를 구분하고 모든 레코드에 `verdictImpact: "none"`을 설정합니다. 외부 이미지는 `unknown_link_only`로 연결하며 프로젝트 저장소나 이미지 저장소에 복제하지 않습니다.

| No. | 제품 | productId | 노출 등급 | 확인 내용 | 근거 |
| --- | --- | --- | --- | --- | --- |
| 705 | 바쿠고 카츠키 히어로즈 에디션 | `nendoroid-705` | 커뮤니티 언급 | 알려진 가품 존재와 가품 사진 3건 등록 | [MyFigureCollection](https://myfigurecollection.net/item/455088) |
| 724 | 하타케 카카시 | `nendoroid-724` | 정품·가품 비교 | 패키지·본체·부속품 비교 사진 | [TOYS KING 비교 자료](https://note.com/yuusukeblog/n/n8ad8d643c0e9) |
| 1112 | 토도로키 쇼토 히어로즈 에디션 | `nendoroid-1112` | 정품·가품 비교 | 얼굴 인쇄·광택·머리 단차·받침대·파츠 결합 비교 | [Reddit 정품·가품 비교](https://www.reddit.com/r/Nendoroid/comments/n4k6bt/bootleg_vs_official_todoroki_so_glad_i_was_able/), [MFC 가품 등록](https://myfigurecollection.net/item/802593) |
| 1193 | 카마도 탄지로 | `nendoroid-1193` | 가품 실물 확인 | No.1193 박스, 작품 로고 누락 | [Reddit 실물 게시물](https://www.reddit.com/r/Nendoroid/comments/14etezk/just_got_my_first_bootleg_figure_from_ebay_kinda/) |
| 1194 | 카마도 네즈코 | `nendoroid-1194` | 가품 실물 확인 | 대나무 결합, 크기·이마 비율, 재질 설명 | [가품 실물](https://www.reddit.com/r/Nendoroid/comments/mfvzk4/my_fake_amazon_nezuko_nendoroid_came_in_the_mail/), [관련 특징 언급](https://www.reddit.com/r/Nendoroid/comments/n4k6bt/bootleg_vs_official_todoroki_so_glad_i_was_able/) |
| 1334 | 아가츠마 젠이츠 | `nendoroid-1334` | 가품 실물 확인 | 제품 번호가 명시된 가품 리뷰 영상 | [YouTube 리뷰](https://www.youtube.com/watch?v=-5UHg4BIzag) |
| 1361 | 하시비라 이노스케 | `nendoroid-1361` | 가품 실물 확인 | 제품 번호가 명시된 가품 언박싱 | [YouTube 언박싱](https://www.youtube.com/watch?v=bR_gqZKmOPc) |
| 1528 | 고죠 사토루 | `nendoroid-1528` | 커뮤니티 언급 | 판매점이 No.1528을 가품으로 분류 | [해외 판매점 게시물](https://www.facebook.com/FMSHOPVNHK/posts/pfbid02usSQoSrkdzE1NMzVRfuxJTrCxsshohpjEWDmyuQ8DwtHim9zAHoW6vP4b2nz1tJ5l) |
| 1560 | 덴지 | `nendoroid-1560` | 정품·가품 비교 | 크기·눈·머리 몰드·포치타 마감 비교 | [Reddit 정품·가품 비교](https://www.reddit.com/r/Nendoroid/comments/18w75br/spot_the_difference/) |
| 1580 | 파워 | `nendoroid-1580` | 커뮤니티 언급 | 작성자가 마지막 사진의 파워도 가품이라고 명시 | [Reddit 작성자 언급](https://www.reddit.com/r/Nendoroid/comments/18w75br/spot_the_difference/) |
| 1834 | 료멘 스쿠나 | `nendoroid-1834` | 가품 실물 확인 | No.1834 박스·실물, 비교 대상은 고죠 No.1528 | [Instagram 비교 영상](https://www.instagram.com/reel/DUwgeflk1WR/) |
| 2069 | 고토 히토리 | `nendoroid-2069` | 가품 실물 확인 | 가품 리뷰 영상과 판매점 번호 등록 교차 확인 | [YouTube 리뷰](https://www.youtube.com/watch?v=hvYwExim_og), [판매점 등록](https://www.facebook.com/FMSHOPVNHK/posts/pfbid02usSQoSrkdzE1NMzVRfuxJTrCxsshohpjEWDmyuQ8DwtHim9zAHoW6vP4b2nz1tJ5l) |
| 2367 | 프리렌 | `nendoroid-2367` | 커뮤니티 언급 | 두 제품 비교 사진, 가품 방향은 검수 필요 | [Reddit 비교 게시물](https://www.reddit.com/r/Frieren/comments/1q1q3nz/real_vs_fake_nendroid_frieren_2367/) |

## 출처 신뢰도 원칙

제품별 판정 근거의 우선순위는 다음과 같습니다.

1. 제조사·유통사의 공식 가품 안내와 정품 비교 사진
2. 공식 제품 페이지, 공식 교환·리콜·패키지 변경 안내
3. 원본 사진과 구매 경위가 남은 커뮤니티 실물 비교 글
4. 출처가 재확인되지 않는 재게시물이나 판매자 홍보 글은 등록하지 않음

기존 제품별 33개 제품 자료는 굿스마일 공식 고객지원·공식 가품 아카이브와 기존 검수 데이터셋에서 확인했습니다. 신규 13개 커뮤니티 자료는 자동 판정 근거로 승격하지 않고 UI에서 `정품·가품 비교 사례`, `가품 실물 확인 사례`, `커뮤니티 언급 사례`로 구분합니다.

## 나의 히어로 아카데미아 지원 제품

공식 굿스마일 제품 페이지에서 제품 번호·버전·대표 이미지를 확인한 26종을 자동완성 카탈로그에 추가했습니다.

| No. | 제품 | 버전 |
| --- | --- | --- |
| 686 | 미도리야 이즈쿠 | 히어로즈 에디션 |
| 705 | 바쿠고 카츠키 | 히어로즈 에디션 |
| 1112 | 토도로키 쇼토 | 히어로즈 에디션 |
| 1157 | 우라라카 오챠코 | 히어로즈 에디션 |
| 1163 | 토무라 시가라키 | 빌런즈 에디션 |
| 1234 | 올마이트 | 기본판 |
| 1272 | 아스이 츠유 | 기본판 |
| 1313 | 키리시마 에이지로 | 기본판 |
| 1332 | 미도리야 이즈쿠 | 코스튬 γ |
| 1333 | 토가 히미코 | 기본판·재판 |
| 1428 | 이이다 텐야 | 기본판 |
| 1430 | 다비 | 기본판·재판 |
| 1595 | 바쿠고 카츠키 | 윈터 코스튬 Ver. |
| 1691 | 미도리야 이즈쿠 | 스텔스 슈트 Ver. |
| 1692 | 바쿠고 카츠키 | 스텔스 슈트 Ver. |
| 1693 | 토도로키 쇼토 | 스텔스 슈트 Ver. |
| 1942 | 로디 소울 | 월드 히어로즈 미션 |
| 2065 | 호크스 | 기본판 |
| 2312 | 미도리야 이즈쿠 | 유에이 교복 Ver. |
| 2313 | 바쿠고 카츠키 | 유에이 교복 Ver. |
| 2342 | 엔데버 | 기본판 |
| 2401 | 아이자와 쇼타 | 기본판 |
| 2402 | 레이디 나강 | 기본판 |
| 2558 | 카미나리 덴키 | 기본판 |
| 2562 | 미도리야 이즈쿠 | 결전 코스튬 Ver. |
| 2563 | 바쿠고 카츠키 | 결전 코스튬 Ver. |

### 히로아카 판별 기준

- 히로아카 정식 패키지는 발매판과 유통사에 따라 우측 상단 굿스마일 로고가 없을 수 있으므로 로고 부재만으로 가품을 판정하지 않습니다. [커뮤니티 패키지 토론](https://www.reddit.com/r/Nendoroid/comments/14jl781/very_new_to_nendoroid_question/)
- 동일 캐릭터에도 히어로즈·교복·스텔스·결전 코스튬이 있으므로 제품 번호와 버전을 먼저 확정하고, 표정·이펙트·텍스트 플레이트를 해당 [굿스마일 공식 제품 페이지](https://www.goodsmile.com/en/product/55717)와 대조합니다.
- 박스 저작권·TOMY/TOHO/Good Smile 유통 표기와 받침대 각인은 같은 발매판 기준으로 확인합니다. 재판 박스의 디자인 차이 하나만으로는 가품을 판정하지 않습니다.
- 토도로키 No.1112 비교 사례에서 확인된 굵거나 번진 얼굴 인쇄, 과도한 광택, 머리 파츠 단차, 지나치게 투명한 받침대, 파츠 결합 불량은 여러 항목이 함께 나타날 때 가품 가능성 근거로 봅니다.

## 외부 데이터셋 가져오기

먼저 dry-run으로 분류 결과를 확인하고, 같은 입력으로 실제 생성합니다.

```bash
node scripts/import-counterfeit-dataset.mjs \
  --dataset /absolute/path/to/figsignal/research/authenticity \
  --check-links \
  --dry-run

npm run data:import -- \
  --dataset /absolute/path/to/figsignal/research/authenticity
```

마지막 실행에서는 후보 109건 중 정확한 제품 매핑이 가능한 증빙 32건을 등록했습니다. 29건은 기존 사례에 출처 메타데이터를 보강했고, 3건은 신규 공개 사례로 연결했습니다. 약한 라벨과 제품 번호 미확정 자료 80건은 검수 대기로 분리했습니다.

전체 원본 1,008건에서 커뮤니티 분류·작성자 주장·정품 여부 질문·일반 참고자료 959건도 별도로 확인했습니다. 제품 번호 또는 전체 제품명이 현재 카탈로그와 정확히 일치하는 24건을 20개 제품에 연결했고, 이 중 9건은 커뮤니티 분류, 15건은 결론이 검증되지 않은 정품 여부 질문입니다. 나머지 935건은 제품을 특정할 수 없어 공개 화면에 연결하지 않았습니다.

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

## 전체 넨도로이드 카탈로그

굿스마일의 번호 구간별 공식 목록에서 숫자부가 1–500인 기본판과 `a`·`b` 파생 번호를 수집하고, 각 공식 제품 상세 페이지의 제조사·발매월·작품명·대표 이미지를 연결했습니다. 웹 목록에서 내려간 초기 한정판과 라이선스 제품은 굿스마일의 공식 스탠드 호환표와 NendoGuide 번호 목록으로 교차 보완했습니다.

전체 제품 검색 범위는 2026-07-20에 확보한 고정 카탈로그 스냅샷으로 유지합니다. GSInfo에 새 요청을 보내는 크롤러·동기화 코드는 없으며, 실행 중에도 GSInfo API나 이미지 서버를 사용하지 않습니다. No.1–500 공식 자료와 수기 검수 제품은 스냅샷보다 우선합니다.

대표 이미지는 굿스마일 공식 도메인에서 확인한 원본 주소만 사용합니다. 공식 이미지를 확인하지 못했거나 이미지 로드에 실패하면 다른 사이트의 이미지로 대체하지 않고 자리표시자를 표시합니다. 저장소에는 이미지 파일 자체가 아니라 공식 출처 URL만 보관합니다.

```bash
npm run catalog:sync
npm run catalog:check
```

No.1–500 공식 동기화 결과는 기본 번호 1–500을 모두 포함하는 535개 제품입니다. `a`·`b` 등 파생판은 57개이며, 고정 스냅샷과 수기 검수 제품을 합친 검색 카탈로그는 중복 제거 후 3,207개입니다. 정확히 대응하는 공식 이미지가 없는 제품은 추측성 이미지를 붙이지 않고 자리표시자로 표시합니다.

## 배포 구조

이 프로젝트는 OpenAI Sites용 vinext 앱입니다. `.openai/hosting.json`에 사이트 설정이 있고, Cloudflare Worker가 서버 API와 Gemini 비밀키를 처리합니다. API 키를 브라우저 코드나 커밋에 넣지 마세요.
