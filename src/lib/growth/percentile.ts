// UC-04 - Cập Nhật Chỉ Số Và Đánh Giá Tăng Trưởng WHO. Cài đặt phương pháp
// LMS chính thức của WHO Child Growth Standards để quy đổi 1 chỉ số đo được
// (cân nặng/chiều cao/vòng đầu) sang z-score rồi percentile, dựa trên 3 tham
// số L (độ lệch Box-Cox), M (trung vị), S (hệ số biến thiên) tra theo
// giới tính + chỉ số + tháng tuổi trong `who_growth_standards`.

export function lmsZScore(measured: number, l: number, m: number, s: number): number {
  if (Math.abs(l) < 1e-9) {
    return Math.log(measured / m) / s;
  }

  return (Math.pow(measured / m, l) - 1) / (l * s);
}

// Xấp xỉ hàm phân phối chuẩn tắc (Abramowitz & Stegun 26.2.17), sai số ~1e-7 —
// đủ chính xác cho mục đích hiển thị percentile tham khảo, không cần thư viện
// thống kê riêng.
function standardNormalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  if (z > 0) prob = 1 - prob;

  return prob;
}

export function zScoreToPercentile(z: number): number {
  return Math.min(99.9, Math.max(0.1, standardNormalCdf(z) * 100));
}

export type GrowthLevel = "low" | "watch" | "normal" | "watch-high" | "high";

export interface GrowthAssessment {
  level: GrowthLevel;
  label: string;
}

// Ngưỡng tham khảo phổ biến khi diễn giải percentile theo WHO: <3 và >97 là
// hai đầu cần chú ý nhiều nhất; 3–15 và 85–97 là vùng nên theo dõi thêm;
// 15–85 coi là trong ngưỡng bình thường. Đây là gợi ý tham khảo, không thay
// thế chẩn đoán y khoa — luôn hiển thị kèm disclaimer ở frontend.
export function assessPercentile(percentile: number): GrowthAssessment {
  if (percentile < 3) return { level: "low", label: "Thấp hơn ngưỡng tham chiếu" };
  if (percentile < 15) return { level: "watch", label: "Cần theo dõi thêm (hơi thấp)" };
  if (percentile <= 85) return { level: "normal", label: "Bình thường" };
  if (percentile <= 97) return { level: "watch-high", label: "Cần theo dõi thêm (hơi cao)" };

  return { level: "high", label: "Cao hơn ngưỡng tham chiếu" };
}

export interface WhoStandardRow {
  age_months: number;
  l: number | null;
  m: number | null;
  s: number | null;
}

/**
 * Chuẩn WHO chỉ seed theo tháng tuổi nguyên (age_months integer) nhưng bé đo
 * ở bất kỳ ngày nào nên tuổi tính ra luôn có phần thập phân — làm tròn tới
 * tháng gần nhất để tra cứu, thay vì nội suy tuyến tính giữa 2 mốc (đơn giản
 * hơn, sai số không đáng kể ở quy mô "tham khảo" của tính năng này).
 */
export function findClosestStandard<T extends WhoStandardRow>(rows: T[], ageMonths: number): T | null {
  if (rows.length === 0) return null;

  let closest = rows[0];
  let closestDiff = Math.abs(rows[0].age_months - ageMonths);

  for (const row of rows) {
    const diff = Math.abs(row.age_months - ageMonths);

    if (diff < closestDiff) {
      closest = row;
      closestDiff = diff;
    }
  }

  return closest;
}

export function ageInMonths(birthDate: string, atDate: Date = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  const diffDays = (atDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24);

  return Math.max(0, Math.round((diffDays / 30.4375) * 100) / 100);
}
