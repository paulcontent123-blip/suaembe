-- UC-20 (Đọc Tin Tức / Học Viện) chưa có nơi nhập liệu thật vì UC-21 (Admin
-- quản lý bài viết) vẫn là placeholder chưa triển khai. Seed 2 chuyên mục gốc
-- + chuyên mục con + bài viết mẫu published, giống cách who_growth_standards
-- được seed làm dữ liệu khởi tạo thật cho dự án (không phải dữ liệu test).
-- Tác giả gán cho tài khoản admin demo (xem 20260819020000_seed_demo_admin.sql).

insert into public.article_categories (id, parent_id, name, slug, description, sort_order, active)
values
  ('a0000000-0000-0000-0000-000000000001', null, 'Tin tức & Cập nhật', 'tin-tuc-cap-nhat', 'Tin tức, kiến thức và cập nhật mới nhất cho mẹ bỉm.', 1, true),
  ('a0000000-0000-0000-0000-000000000002', null, 'Học viện Làm Mẹ', 'hoc-vien-lam-me', 'Kho kiến thức thực chiến từ chuyên gia và mẹ bỉm có kinh nghiệm.', 2, true),

  ('a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Dinh dưỡng', 'dinh-duong', null, 1, true),
  ('a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Sức khoẻ', 'suc-khoe', null, 2, true),
  ('a0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Phát triển', 'phat-trien', null, 3, true),
  ('a0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Mang thai', 'mang-thai', null, 4, true),
  ('a0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'Pháp lý mẹ', 'phap-ly-me', null, 5, true),

  ('a0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'Nuôi con bằng sữa mẹ', 'nuoi-con-bang-sua-me', null, 1, true),
  ('a0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'Ăn dặm', 'an-dam', null, 2, true),
  ('a0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000002', 'Giấc ngủ', 'giac-ngu', null, 3, true),
  ('a0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000002', 'Phát triển trí não', 'phat-trien-tri-nao', null, 4, true),
  ('a0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000002', 'Sức khoẻ mẹ sau sinh', 'suc-khoe-me-sau-sinh', null, 5, true),
  ('a0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000002', 'Tài chính cho mẹ bỉm', 'tai-chinh-me-bim', null, 6, true)
on conflict (id) do nothing;

insert into public.articles (author_id, category_id, title, slug, excerpt, content, status, view_count, published_at)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000011',
    'So sánh Aptamil vs Nan Nestlé 2025 — Loại nào phù hợp bé 6 tháng táo bón?',
    'so-sanh-aptamil-vs-nan-nestle-2025',
    'Phân tích chi tiết thành phần GOS/FOS, tỷ lệ whey:casein và phản hồi thực tế từ hàng trăm mẹ đã dùng thử cả hai loại.',
    E'Táo bón là một trong những vấn đề tiêu hoá phổ biến nhất ở bé từ 4–8 tháng tuổi, đặc biệt khi mẹ chuyển từ sữa mẹ hoàn toàn sang sữa công thức hoặc bắt đầu ăn dặm. Hai cái tên được nhắc tới nhiều nhất trong giai đoạn này là Aptamil và Nan Nestlé — cả hai đều có dòng sản phẩm hỗ trợ tiêu hoá riêng.\n\nAptamil Pronutra Advance sử dụng hệ chất xơ GOS/FOS theo tỷ lệ 9:1, mô phỏng gần với oligosaccharide có trong sữa mẹ, giúp nuôi dưỡng lợi khuẩn đường ruột. Trong khi đó, Nan Nestlé Optipro tập trung vào tỷ lệ đạm whey:casein khoảng 60:40, giúp bé tiêu hoá đạm dễ hơn nhưng ít nhấn mạnh vào chất xơ hoà tan.\n\nVới bé có tiền sử táo bón, các bác sĩ Nhi khuyến nghị ưu tiên dòng có hàm lượng GOS/FOS cao và theo dõi phân bé trong 5–7 ngày đầu chuyển sữa. Nếu sau 1 tuần bé vẫn táo, nên tham khảo ý kiến bác sĩ trước khi đổi tiếp loại khác, tránh đổi sữa liên tục gây rối loạn tiêu hoá.\n\nLưu ý: bài viết mang tính tham khảo, không thay thế chỉ định của bác sĩ Nhi khoa. Mẹ nên đưa bé đi khám nếu táo bón kéo dài trên 2 tuần hoặc kèm theo các dấu hiệu bất thường khác.',
    'published',
    12400,
    '2026-08-12T08:00:00+07:00'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000014',
    'Danh sách 15 thứ cần chuẩn bị trước sinh — Checklist đầy đủ nhất 2026',
    'checklist-15-thu-can-chuan-bi-truoc-sinh',
    'Từ hồ sơ bệnh viện, đồ cho mẹ, đồ cho bé đến các giấy tờ pháp lý cần thiết — tổng hợp đầy đủ để mẹ không bỏ sót gì.',
    E'Càng gần ngày dự sinh, danh sách việc cần chuẩn bị càng dài và dễ khiến mẹ bầu quên trước quên sau. Dưới đây là checklist 15 hạng mục quan trọng nhất, chia theo 3 nhóm để mẹ dễ theo dõi.\n\n**Hồ sơ & giấy tờ:** sổ khám thai đầy đủ các mốc siêu âm, kết quả xét nghiệm gần nhất, thẻ BHYT, CCCD, sổ hộ khẩu/giấy xác nhận cư trú (dùng làm giấy khai sinh sau này).\n\n**Đồ cho mẹ:** áo cho con bú, băng vệ sinh sau sinh cỡ lớn, đai nịt bụng, dép đi trong phòng sinh, đồ dùng vệ sinh cá nhân, một bộ đồ rộng rãi để về nhà.\n\n**Đồ cho bé:** 5–7 bộ quần áo sơ sinh, mũ và bao tay/chân, khăn xô các loại, tã sơ sinh (2 size để dự phòng bé nhẹ/nặng cân hơn dự kiến), chăn ủ và nôi/cũi nếu sinh tại nhà.\n\nMẹo nhỏ: nên đóng gói túi đi sinh từ tuần 34–35, để sẵn ở nơi dễ lấy vì chuyển dạ có thể đến sớm hơn dự kiến.',
    'published',
    8200,
    '2026-08-08T09:00:00+07:00'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000013',
    'Cột mốc phát triển bé 6–12 tháng — Khi nào cần lo lắng?',
    'cot-moc-phat-trien-be-6-12-thang',
    'Bác sĩ Nhi khoa phân tích 12 cột mốc quan trọng và dấu hiệu cần gặp bác sĩ ngay.',
    E'Giai đoạn 6–12 tháng là thời điểm bé phát triển vận động và nhận thức rất nhanh. Dưới đây là các cột mốc điển hình theo từng tháng tuổi, mang tính tham khảo — mỗi bé có tốc độ phát triển riêng.\n\n**6–7 tháng:** biết ngồi khi có điểm tựa, với tay lấy đồ vật, bắt đầu bập bẹ các âm đơn giản như "ba-ba", "ma-ma" (chưa có nghĩa).\n\n**8–9 tháng:** ngồi vững không cần đỡ, biết bò hoặc trườn, cầm nắm đồ vật bằng ngón tay cái và ngón trỏ (pincer grasp), phản ứng khi nghe gọi tên.\n\n**10–12 tháng:** vịn đứng lên, có thể bước đi men theo đồ vật, hiểu một số từ đơn giản như "không", "bye bye", một số bé bắt đầu nói được 1–2 từ có nghĩa.\n\n**Khi nào cần đưa bé đi khám:** nếu đến 9 tháng bé vẫn chưa ngồi được khi có điểm tựa, đến 12 tháng chưa có phản ứng khi gọi tên, hoặc không có bất kỳ hình thức giao tiếp bằng cử chỉ nào (chỉ tay, vẫy tay) — nên tham khảo ý kiến bác sĩ Nhi khoa để được đánh giá sớm.',
    'published',
    15100,
    '2026-08-05T10:00:00+07:00'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000015',
    'Thai sản 2026: Mức hưởng, thời gian và cách tính — Cập nhật mới nhất',
    'thai-san-2026-muc-huong-thoi-gian-cach-tinh',
    'Chế độ thai sản theo Luật BHXH mới nhất, mức lương tính hưởng và các quyền lợi đặc biệt mẹ bỉm cần biết.',
    E'Chế độ thai sản là một trong những quyền lợi quan trọng nhất của mẹ bỉm đi làm. Bài viết tổng hợp các điểm chính mẹ cần nắm để không bỏ lỡ quyền lợi của mình.\n\n**Thời gian nghỉ:** lao động nữ sinh con được nghỉ trước và sau sinh 6 tháng; trường hợp sinh đôi trở lên, từ con thứ hai trở đi mỗi con mẹ được nghỉ thêm 1 tháng.\n\n**Mức hưởng:** tính bằng 100% mức bình quân tiền lương đóng BHXH của 6 tháng liền kề trước khi nghỉ việc, nhân với số tháng nghỉ. Ngoài ra còn có trợ cấp một lần khi sinh con bằng 2 lần mức lương cơ sở tại tháng sinh.\n\n**Điều kiện hưởng:** phải đóng BHXH từ đủ 6 tháng trở lên trong vòng 12 tháng trước khi sinh. Trường hợp phải nghỉ dưỡng thai theo chỉ định của bác sĩ thì chỉ cần đóng đủ 3 tháng trong vòng 12 tháng trước sinh.\n\nMẹ nên chuẩn bị đầy đủ hồ sơ (giấy khai sinh/chứng sinh của con, sổ BHXH) và nộp cho bộ phận nhân sự trong vòng 45 ngày kể từ ngày trở lại làm việc để không ảnh hưởng tới thời gian giải quyết.',
    'published',
    22300,
    '2026-08-01T07:30:00+07:00'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000012',
    'Bé sốt sau tiêm phòng: Khi nào cần đưa đi viện ngay?',
    'be-sot-sau-tiem-phong-khi-nao-can-di-vien',
    'Sốt nhẹ sau tiêm là phản ứng bình thường, nhưng một số dấu hiệu đi kèm mẹ tuyệt đối không nên chủ quan.',
    E'Sốt nhẹ (dưới 38.5°C) trong 1–2 ngày sau tiêm phòng là phản ứng miễn dịch bình thường, thường gặp ở các mũi như 5 trong 1, 6 trong 1, viêm gan B. Mẹ có thể chăm sóc bé tại nhà bằng cách mặc quần áo thoáng, chườm ấm, cho bú/uống nước nhiều hơn.\n\n**Có thể dùng thuốc hạ sốt** (paracetamol theo đúng liều cân nặng) nếu bé sốt trên 38.5°C và quấy khóc nhiều, cách nhau tối thiểu 4–6 tiếng giữa các lần dùng.\n\n**Dấu hiệu cần đưa bé đi viện ngay:** sốt cao trên 39°C không hạ sau khi dùng thuốc, co giật, quấy khóc liên tục không dỗ được, bỏ bú hoàn toàn, phát ban lan rộng, khó thở hoặc tím tái, hoặc sốt kéo dài quá 48 giờ.\n\nMẹ nên theo dõi bé sát trong 48 giờ đầu sau tiêm, đặc biệt là 30 phút đầu tại điểm tiêm (nên ở lại theo dõi phản ứng phản vệ trước khi về nhà).',
    'published',
    9800,
    '2026-07-28T14:00:00+07:00'
  ),

  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000021',
    '5 mẹo tăng tiết sữa trong tuần đầu sau sinh',
    '5-meo-tang-tiet-sua-tuan-dau-sau-sinh',
    'Gồm: cho bú đúng tư thế · kích sữa đúng cách · dinh dưỡng cho mẹ trong những ngày đầu.',
    E'Tuần đầu sau sinh là giai đoạn quan trọng để thiết lập nguồn sữa ổn định. Dưới đây là 5 mẹo thực chiến được nhiều mẹ áp dụng hiệu quả.\n\n**1. Cho bú càng sớm càng tốt:** lý tưởng là trong vòng 1 giờ đầu sau sinh, và cho bú theo nhu cầu của bé (8–12 lần/ngày), không nên chờ đủ giờ mới cho bú.\n\n**2. Đúng tư thế, đúng khớp ngậm:** bé cần ngậm sâu cả quầng vú chứ không chỉ đầu ti, giúp kích thích tuyến sữa hiệu quả và mẹ đỡ đau/nứt đầu ti.\n\n**3. Hút sữa sau cữ bú:** nếu bé bú chưa hết hoặc mẹ muốn kích sữa nhanh hơn, có thể hút thêm 10–15 phút mỗi bên sau cữ bú.\n\n**4. Da kề da thường xuyên:** giúp kích thích hormone oxytocin, hỗ trợ phản xạ xuống sữa tự nhiên.\n\n**5. Dinh dưỡng và nghỉ ngơi đầy đủ:** uống đủ nước (2.5–3 lít/ngày), ăn đa dạng, tránh kiêng khem quá mức, và tranh thủ ngủ khi bé ngủ để cơ thể phục hồi.',
    'published',
    6100,
    '2026-08-14T08:00:00+07:00'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000022',
    'Bắt đầu ăn dặm đúng cách từ 6 tháng — Lịch 30 ngày đầu',
    'bat-dau-an-dam-dung-cach-tu-6-thang',
    'Thực đơn chi tiết · Lượng ăn phù hợp theo tuần · Dấu hiệu dị ứng cần theo dõi.',
    E'Tổ chức Y tế Thế giới (WHO) khuyến nghị bắt đầu ăn dặm khi bé tròn 6 tháng tuổi, song song với duy trì sữa mẹ/sữa công thức là nguồn dinh dưỡng chính.\n\n**Tuần 1–2:** làm quen với 1 loại bột/cháo loãng vị ngọt (bí đỏ, khoai lang, chuối), mỗi lần vài thìa nhỏ, 1 bữa/ngày để bé quen phản xạ nuốt.\n\n**Tuần 3–4:** tăng dần độ đặc, thử thêm rau củ vị nhạt (cà rốt, súp lơ), có thể tăng lên 1–2 bữa/ngày tuỳ khả năng ăn của bé.\n\n**Nguyên tắc giới thiệu thực phẩm mới:** mỗi loại thực phẩm mới nên thử riêng lẻ trong 2–3 ngày trước khi kết hợp, để dễ theo dõi nếu bé có phản ứng dị ứng.\n\n**Dấu hiệu dị ứng cần lưu ý:** nổi mẩn đỏ quanh miệng hoặc toàn thân, nôn trớ bất thường, tiêu chảy, quấy khóc dữ dội sau ăn — nếu có, ngừng ngay thực phẩm đó và tham khảo bác sĩ.',
    'published',
    13700,
    '2026-08-10T09:00:00+07:00'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000023',
    'Luyện bé ngủ xuyên đêm từ 4 tháng — Phương pháp Ferber cho người Việt',
    'luyen-be-ngu-xuyen-dem-tu-4-thang',
    'Không để bé khóc mãi · Điều chỉnh phù hợp với nhịp sinh hoạt của gia đình Việt.',
    E'Từ khoảng 4 tháng tuổi, nhiều bé đã có thể bắt đầu ngủ những giấc dài hơn vào ban đêm nếu được thiết lập thói quen phù hợp. Phương pháp Ferber (kiểm tra và trấn an theo khoảng thời gian tăng dần) là một trong những cách được áp dụng phổ biến, có điều chỉnh cho phù hợp văn hoá nuôi con của gia đình Việt.\n\n**Bước 1 — Thiết lập trình tự trước ngủ:** tắm, đọc sách/hát ru, tắt đèn, đặt bé vào cũi khi còn thức nhưng buồn ngủ (không phải đã ngủ hẳn).\n\n**Bước 2 — Khoảng thời gian chờ tăng dần:** nếu bé khóc, chờ 3 phút rồi vào vỗ về ngắn (không bế lên), sau đó tăng dần lên 5, rồi 10 phút ở các lần sau.\n\n**Bước 3 — Kiên trì và nhất quán:** hầu hết các gia đình thấy hiệu quả rõ rệt sau 3–7 ngày áp dụng nhất quán; nếu bỏ giữa chừng, bé sẽ khó thích nghi hơn ở lần sau.\n\nLưu ý: phương pháp này phù hợp với bé khoẻ mạnh, không có vấn đề y tế. Nếu bé quấy khóc bất thường kéo dài, nên loại trừ nguyên nhân bệnh lý trước khi luyện ngủ.',
    'published',
    9400,
    '2026-08-06T20:00:00+07:00'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000024',
    '10 hoạt động kích thích não bé 0–12 tháng — Đơn giản, không tốn tiền',
    '10-hoat-dong-kich-thich-nao-be-0-12-thang',
    'Đọc sách · Nghe nhạc · Chơi cùng bé — những hoạt động đơn giản giúp bé phát triển trí não tối ưu.',
    E'Những năm đầu đời là giai đoạn não bộ bé phát triển nhanh nhất. Dưới đây là 10 hoạt động đơn giản, không cần đồ chơi đắt tiền, mẹ có thể áp dụng ngay tại nhà.\n\n1. Đọc sách tranh cho bé mỗi ngày, dù bé chưa hiểu lời nói.\n2. Trò chuyện, mô tả mọi hoạt động mẹ đang làm ("mẹ đang mặc áo cho con nè").\n3. Cho bé nghe nhạc nhẹ nhàng, đa dạng thể loại.\n4. Chơi ú oà để phát triển khái niệm "vật thể tồn tại lâu dài" (object permanence).\n5. Cho bé chạm, cầm nắm các vật có kết cấu khác nhau (an toàn, không có chi tiết nhỏ).\n6. Bế bé ra ngoài, quan sát cây cối, con vật, người qua lại.\n7. Chơi trò soi gương cùng bé.\n8. Xếp chồng/đổ khối để phát triển vận động tinh và tư duy nhân quả.\n9. Hát cho bé nghe, kết hợp cử chỉ tay đơn giản.\n10. Dành thời gian chơi tự do, không có cấu trúc, để bé tự khám phá.\n\nĐiều quan trọng nhất không phải là hoạt động cầu kỳ, mà là sự tương tác thường xuyên và nhất quán giữa mẹ/người chăm sóc với bé.',
    'published',
    7200,
    '2026-08-03T08:00:00+07:00'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000025',
    'Phục hồi sau sinh: Ăn gì, làm gì trong 30 ngày đầu?',
    'phuc-hoi-sau-sinh-30-ngay-dau',
    'Kiêng cữ đúng cách · Phục hồi thể hình · Chăm sóc tâm lý sau sinh cho mẹ bỉm.',
    E'30 ngày đầu sau sinh (thời gian ở cữ) là giai đoạn cơ thể mẹ cần được nghỉ ngơi và phục hồi đúng cách, ảnh hưởng trực tiếp đến sức khoẻ lâu dài và nguồn sữa cho con.\n\n**Dinh dưỡng:** ưu tiên món ăn dễ tiêu, giàu đạm và sắt (thịt nạc, cá, trứng, rau xanh đậm), uống đủ nước, hạn chế đồ ăn nhiều dầu mỡ/cay nóng có thể ảnh hưởng chất lượng sữa.\n\n**Kiêng cữ hợp lý (không mê tín):** không cần kiêng tắm gội hoàn toàn — có thể tắm nhanh bằng nước ấm trong phòng kín gió sau 3–5 ngày nếu sinh thường, vệ sinh cá nhân sạch sẽ giúp tránh nhiễm trùng.\n\n**Phục hồi thể hình:** với sinh thường, có thể bắt đầu các bài tập nhẹ (đi bộ, tập cơ sàn chậu) sau 1–2 tuần nếu sức khoẻ ổn định; với sinh mổ nên đợi ý kiến bác sĩ, thường sau 6 tuần.\n\n**Tâm lý sau sinh:** trầm cảm sau sinh (baby blues, postpartum depression) khá phổ biến — nếu mẹ cảm thấy buồn bã, lo âu kéo dài trên 2 tuần, mất hứng thú, nên chia sẻ với người thân và tìm hỗ trợ chuyên môn sớm, không nên tự chịu đựng một mình.',
    'published',
    11800,
    '2026-08-02T08:00:00+07:00'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'a0000000-0000-0000-0000-000000000026',
    'Lập kế hoạch tài chính nuôi con từ 0–3 tuổi — Chi phí thực tế',
    'ke-hoach-tai-chinh-nuoi-con-0-3-tuoi',
    'Sữa · Tã · Học phí · Bảo hiểm · Tiết kiệm giáo dục — dự trù chi phí thực tế cho gia đình có con nhỏ.',
    E'Nuôi con 3 năm đầu đời phát sinh nhiều khoản chi mà nhiều gia đình chưa dự trù kỹ. Bài viết tổng hợp các nhóm chi phí chính để mẹ lên kế hoạch tài chính chủ động hơn.\n\n**Sữa & dinh dưỡng:** nếu dùng sữa công thức hoàn toàn, chi phí trung bình dao động khá lớn tuỳ dòng sản phẩm — nên xác định ngân sách cố định hàng tháng và ưu tiên các đợt khuyến mãi/mua sỉ để tối ưu chi phí dài hạn.\n\n**Tã, đồ dùng tiêu hao:** đây là khoản chi đều đặn mỗi tháng trong 2–3 năm đầu, nên so sánh giá theo đơn vị (đồng/miếng) thay vì chỉ nhìn giá gói để chọn được lựa chọn tối ưu.\n\n**Học phí:** nếu gửi trẻ ở nhóm trẻ/mầm non tư thục từ 18–24 tháng, đây thường là khoản chi lớn nhất, nên tìm hiểu và dự trù trước ít nhất 6 tháng.\n\n**Bảo hiểm & dự phòng:** nên cân nhắc bảo hiểm y tế bổ sung cho bé và duy trì một quỹ dự phòng riêng cho các chi phí y tế phát sinh ngoài kế hoạch.\n\n**Tiết kiệm giáo dục dài hạn:** bắt đầu tiết kiệm/đầu tư sớm dù số tiền nhỏ mỗi tháng cũng tạo khác biệt lớn nhờ lãi kép trong 15–18 năm tới khi con vào đại học.',
    'published',
    5600,
    '2026-07-30T08:00:00+07:00'
  )
on conflict (slug) do nothing;
