export const myHeroVerificationNotes = [
  "발매판·유통사에 따라 박스 우측 상단의 굿스마일 로고가 없을 수 있어, 로고 부재만으로 가품을 판단하지 않습니다.",
  "제품 번호와 히어로·교복·스텔스·결전 코스튬 버전을 정확히 고른 뒤 표정, 이펙트, 텍스트 플레이트 구성을 공식 페이지와 대조합니다.",
  "박스 뒷면의 작품 저작권과 TOMY·TOHO·Good Smile 유통 표기, 받침대 저작권 각인은 같은 발매판 기준으로 확인합니다.",
  "과도한 광택, 굵거나 번진 눈·입 인쇄, 머리 파츠 단차, 지나치게 투명한 받침대, 결합 불량이 함께 나타나는지 확인합니다.",
];

export function getProductVerificationNotes(product: { series?: string }) {
  return product.series === "my-hero-academia" ? myHeroVerificationNotes : [];
}
