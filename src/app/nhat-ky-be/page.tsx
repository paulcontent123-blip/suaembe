import { redirect } from "next/navigation";

// UC-04/05/06 - Nhật ký Dinh dưỡng Bé chuyển thành tab thứ 3 của /tin-tuc
// (khớp đúng bố cục demo suaembe.html #pg-tintuc: 3 tab Tin tức/Nhật ký/Học
// viện trong cùng 1 trang) thay vì trang riêng như trước — giữ route này lại
// dưới dạng redirect để không phá các đường dẫn cũ đã lưu (bookmark, link
// trong footer/nav trước khi đổi).
export default function NhatKyBeRedirectPage() {
  redirect("/tin-tuc?tab=nhatky");
}
