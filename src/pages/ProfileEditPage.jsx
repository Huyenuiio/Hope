import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { usersAPI, authAPI } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

// ── DATA CONSTANTS ────────────────────────────────────────────────────────────
const MAIN_NICHES = [
  { id: 'writing', label: 'Viết lách / Nội dung', icon: 'edit_note' },
  { id: 'design', label: 'Thiết kế / Sáng tạo', icon: 'brush' },
  { id: 'video', label: 'Video Editor / Media', icon: 'movie' },
  { id: 'dev', label: 'Lập trình / IT', icon: 'code' },
  { id: 'marketing', label: 'Digital Marketing', icon: 'campaign' },
  { id: 'esports', label: 'Thể thao điện tử', icon: 'sports_esports' },
  { id: 'finance', label: 'Tài chính / Kế toán', icon: 'account_balance' },
  { id: 'education', label: 'Giáo dục / Gia sư', icon: 'school' },
  { id: 'sales', label: 'Bán hàng / Kinh doanh', icon: 'trending_up' },
  { id: 'health', label: 'Y tế / Sức khỏe', icon: 'medical_services' },
  { id: 'beauty', label: 'Làm đẹp / Thời trang', icon: 'face' },
  { id: 'photography', label: 'Nhiếp ảnh / Film', icon: 'photo_camera' },
  { id: 'translation', label: 'Biên phiên dịch', icon: 'translate' },
  { id: 'event', label: 'Sự kiện / Ẩm thực', icon: 'celebration' },
  { id: 'va', label: 'Trợ lý ảo / Admin', icon: 'support_agent' },
  { id: 'legal', label: 'Pháp lý / Tư vấn', icon: 'gavel' },
];

const NICHE_DETAILS = {
  writing: {
    portfolioTitle: "Hồ sơ Năng lực Nội dung (Content Portfolio)",
    portfolioDesc: "Chữ nghĩa là vũ khí. Hãy show ra các bài viết, kịch bản hoặc chiến dịch content bạn đã thực hiện.",
    projectLabel: "Tên bài viết / Chiến dịch",
    projectPlaceholder: "Vd: Chuỗi bài blog SEO cho ngành Bất động sản",
    problemLabel: "Mục tiêu nội tâm / Insight khách hàng?",
    problemPlaceholder: "Vd: Khách hàng cần tăng traffic tự nhiên, hoặc định vị lại thương hiệu...",
    solutionLabel: "Cách bạn triển khai nội dung (Tone of Voice/Góc nhìn)",
    solutionPlaceholder: "Vd: Sử dụng tone giọng hài hước, tập trung vào giải quyết nỗi đau của user...",
    resultLabel: "Hiệu quả nội dung (View/Convert/SEO)",
    resultPlaceholder: "Vd: Bài viết đạt Top 1 Google trong 1 tháng, 5000 lượt share...",
    valueLabel: "Tại sao nên thuê bạn viết thay vì dùng AI?",
    valuePlaceholder: "Vd: Mình có trải nghiệm thực tế, hiểu tâm lý con người và biết cách lồng ghép cảm xúc vào chữ viết.",
    processLabel: "Quy trình sáng tạo & Cam kết",
    processPlaceholder: "- Luôn nghiên cứu kỹ insight khách hàng.\n- Sẵn sàng sửa chữa 3 lần miễn phí.\n- Cam kết nội dung độc bản 100%.",
    careerGoalLabel: "Định hướng sự nghiệp (Writer Path)",
    careerGoalPlaceholder: "Vd: Trở thành tác giả sách chuyên sâu về tâm lý khách hàng...",
    mindsetLabel: "Triết lý câu chữ (Writing Mindset)",
    mindsetPlaceholder: "Vd: Viết không phải để khoe chữ, mà để giải quyết vấn đề của độc giả.",
    hourlyRateLabel: "Giá viết theo Giờ / Chữ (VND)",
    projectRateLabel: "Giá trọn gói dự án (VND)",
    skillHint: "Vd: Copywriting, Storytelling, SEO Writing, Content Strategy...",
  },
  design: {
    portfolioTitle: "Concept & Portfolio Sáng tạo",
    portfolioDesc: "Hình ảnh thay ngàn lời nói. Hãy để các thiết kế của bạn kể câu chuyện thương hiệu.",
    projectLabel: "Tên dự án / Thương hiệu",
    projectPlaceholder: "Vd: Bộ nhận diện thương hiệu cho Coffe Shop High-end",
    problemLabel: "Yêu cầu thẩm mỹ / Bài toán thương hiệu?",
    problemPlaceholder: "Vd: Thương hiệu trông quá trẻ con, cần sự sang trọng và tối giản...",
    solutionLabel: "Giải pháp thiết kế (Moodboard / Visual)",
    solutionPlaceholder: "Vd: Sử dụng hệ màu Pastel, Typography hiện đại...",
    resultLabel: "Tác động hình ảnh / Feedback khách",
    resultPlaceholder: "Vd: Khách hàng chốt ngay bản đầu tiên, bộ nhận diện được phủ sóng...",
    valueLabel: "Triết lý Thiết kế của bạn",
    valuePlaceholder: "Vd: Thiết kế không chỉ để đẹp, mà để giải quyết bài toán giao diện người dùng.",
    processLabel: "Quy trình Design & Chỉnh sửa",
    processPlaceholder: "- Gửi phác thảo sau 48h.\n- Tặng kèm bộ Brand Guideline cơ bản.\n- Support file nguồn trọn đời.",
    careerGoalLabel: "Mục tiêu sự nghiệp (Design Vision)",
    careerGoalPlaceholder: "Vd: Trở thành Art Director cho một Agency quốc tế...",
    mindsetLabel: "Tư duy sáng tạo (Visual Mindset)",
    mindsetPlaceholder: "Vd: Mọi chi tiết đều phải có ý nghĩa, không làm theo cảm hứng nhất thời.",
    hourlyRateLabel: "Giá thiết kế theo Giờ (VND)",
    projectRateLabel: "Giá theo Gói thiết kế (VND)",
    skillHint: "Vd: Logo Design, UI/UX, Typography, Color Theory, Brand Identity...",
  },
  video: {
    portfolioTitle: "Showreel & Sản phẩm Media",
    portfolioDesc: "Sự chuyển động tạo nên cảm xúc. Hãy show ra những thước phim ấn tượng nhất của bạn.",
    projectLabel: "Tên Video / Phim / Campaign",
    projectPlaceholder: "Vd: Video Trailer cho App công nghệ mới",
    problemLabel: "Nỗi đau về Footage / Storyline?",
    problemPlaceholder: "Vd: Footage gốc bị rung, thiếu sáng, hoặc kịch bản quá rời rạc...",
    solutionLabel: "Kỹ thuật dựng / Phù phép Media",
    solutionPlaceholder: "Vd: Kỹ thuật Color Grading, Sound Design kịch tính...",
    resultLabel: "Tương tác Video (View/Watch time)",
    resultPlaceholder: "Vd: Đạt 1 triệu view trên Tiktok, giữ chân người xem 80%...",
    valueLabel: "Phong cách Video của bạn",
    valuePlaceholder: "Vd: Mình mạnh về kể chuyện (Storytelling) và những chuyển cảnh mượt mà.",
    processLabel: "Dịch vụ Hậu kỳ & Quay dựng",
    processPlaceholder: "- Bao gồm SFX & Music bản quyền.\n- Review và edit nhanh trong 24h.\n- Xuất file chất lượng cao 4K/DCI.",
    careerGoalLabel: "Tham vọng Media (Video Creator)",
    careerGoalPlaceholder: "Vd: Sản xuất một bộ phim tài liệu đoạt giải thưởng...",
    mindsetLabel: "Tư duy khung hình (Motion Mindset)",
    mindsetPlaceholder: "Vd: Video hiệu quả là video truyền đạt được cảm xúc chứ không phải kỹ xảo.",
    hourlyRateLabel: "Giá dựng phim theo Giờ (VND)",
    projectRateLabel: "Giá theo Phút/Video (VND)",
    skillHint: "Vd: Color Grading, Sound Design, Motion Graphics, Storytelling...",
  },
  dev: {
    portfolioTitle: "Hệ thống & Sản phẩm Công nghệ",
    portfolioDesc: "Code sạch tạo nên sản phẩm bền vững. Hãy nói về kiến trúc hệ thống và cách bạn xử lý logic.",
    projectLabel: "Tên dự án / Sản phẩm / GitHub",
    projectPlaceholder: "Vd: Hệ thống E-commerce đa nền tảng",
    problemLabel: "Bài toán Tech / Performance cần giải?",
    problemPlaceholder: "Vd: Hệ thống bị chậm khi có 1000 user truy cập cùng lúc...",
    solutionLabel: "Kiến trúc / Tech Stack áp dụng",
    solutionPlaceholder: "Vd: Sử dụng Microservices, Optimize Database Index...",
    resultLabel: "Chỉ số Tech (Uptime/Latency/User)",
    resultPlaceholder: "Vd: Giảm 50% thời gian load, chịu tải 10k CCU...",
    valueLabel: "Triết lý Lập trình của bạn",
    valuePlaceholder: "Vd: Clean Code is not just a style, it's a maintenance strategy.",
    processLabel: "Quy trình Dev & Bảo trì",
    processPlaceholder: "- Tài liệu hóa kỹ thuật đầy đủ.\n- Cam kết fix bug miễn phí 3 tháng.\n- Deploy chuẩn CI/CD.",
    careerGoalLabel: "Lộ trình Full-stack/Architect",
    careerGoalPlaceholder: "Vd: Xây dựng một framework mã nguồn mở được cộng đồng đón nhận...",
    mindsetLabel: "Tư duy Logic (Debugger Mindset)",
    mindsetPlaceholder: "Vd: Hiểu bản chất vấn đề trước khi viết dòng code đầu tiên.",
    hourlyRateLabel: "Giá Dev theo Giờ (VND)",
    projectRateLabel: "Giá theo Milestone dự án (VND)",
    skillHint: "Vd: ReactJS, Node.js, System Design, SQL, CI/CD, Cloud...",
  },
  marketing: {
    portfolioTitle: "Chiến dịch Tăng trưởng (Growth Portfolio)",
    portfolioDesc: "Mọi nỗ lực phải hướng tới kết quả. Hãy show ra các phễu marketing và hiệu quả chuyển đổi.",
    projectLabel: "Tên chiến dịch / Kênh triển khai",
    projectPlaceholder: "Vd: Chiến dịch Facebook Ads chạy Tết 2024",
    problemLabel: "Bài toán ROI / Chi phí chuyển đổi?",
    problemPlaceholder: "Vd: CPC quá cao, khách hàng tiềm năng không đúng chân dung...",
    solutionLabel: "Chiến thuật phễu / Target khách hàng",
    solutionPlaceholder: "Vd: Sử dụng Lookalike Audience, A/B Testing liên tục...",
    resultLabel: "ROI / CPL / Doanh số mang về",
    resultPlaceholder: "Vd: ROI đạt 300%, giảm 40% chi phí tìm khách hàng...",
    hourlyRateLabel: "Giá tư vấn Marketing theo Giờ (VND)",
    projectRateLabel: "Giá quản trị theo Tháng (VND)",
    skillHint: "Vd: Facebook Ads, Google Ads, Funnel Building, Data Analysis...",
  },
  esports: {
    portfolioTitle: "Lịch sử thi đấu & Thành tích (Gamer Portfolio)",
    portfolioDesc: "Thắng bại tại kỹ năng. Hãy show ra các giải đấu, bậc rank và những pha xử lý đỉnh cao của bạn.",
    projectLabel: "Tên Giải đấu / Hợp đồng",
    projectPlaceholder: "Vd: VCS Mùa Xuân 2024 - Team Secret",
    problemLabel: "Thách thức của trận đấu / team?",
    problemPlaceholder: "Vd: Team đang trong chuỗi thua, tinh thần xuống thấp...",
    solutionLabel: "Bạn đã vượt qua thế nào? (Kỹ năng/Chiến thuật)",
    solutionPlaceholder: "Vd: Cầm tướng thuận tay gánh team, call team ăn Baron...",
    resultLabel: "Thành tích thực tế (KDA / Thứ hạng)",
    resultPlaceholder: "Vd: Top 1 MVP toàn giải, KDA 5.0, Vô địch giải...",
    valueLabel: "Tại sao các Team/Tổ chức nên chiêu mộ bạn?",
    valuePlaceholder: "Vd: Mình có khả năng call team cực tốt, chịu được áp lực cao và sẵn sàng train 12h/ngày.",
    processLabel: "Kỷ luật & Lịch trình tập luyện",
    processPlaceholder: "- Luôn đúng giờ train/scrim.\n- Không toxic, hòa đồng với team.\n- Sẵn sàng di chuyển on-site/Gaming House.",
    careerGoalLabel: "Ước mơ Thể thao điện tử",
    careerGoalPlaceholder: "Vd: Tham dự CKTG và trở thành tuyển thủ hàng đầu khu vực...",
    mindsetLabel: "Tinh thần thi đấu (Competitive Mindset)",
    mindsetPlaceholder: "Vd: Đối thủ mạnh nhất chính là sự tự mãn của bản thân.",
    hourlyRateLabel: "Thù lao mỗi trận / Giờ Stream (VND)",
    projectRateLabel: "Giá trị hợp đồng ngắn hạn (VND)",
    skillHint: "Vd: Micro-management, Macro, Last-hit, Call-team...",
  },
  finance: {
    portfolioTitle: "Hồ sơ năng lực Tài chính & Kiểm soát",
    portfolioDesc: "Sự minh bạch và chính xác là tài sản lớn nhất. Hãy kể về các hệ thống tài chính bạn đã tối ưu.",
    projectLabel: "Tên dự án / Kỳ quyết toán",
    projectPlaceholder: "Vd: Quyết toán thuế 2023 cho Tập đoàn X",
    problemLabel: "Rủi ro / Sai sót tài chính gặp phải?",
    problemPlaceholder: "Vd: Dòng tiền bị tắc nghẽn, số liệu lệch 200 triệu không rõ nguyên nhân...",
    solutionLabel: "Giải pháp xử lý & Đối soát",
    solutionPlaceholder: "Vd: Rà soát lại chứng từ 3 năm, áp dụng phần mền MISA mới...",
    resultLabel: "Kết quả (Tiền tiết kiệm / Chỉ số an toàn)",
    resultPlaceholder: "Vd: Tiết kiệm 15% thuế phải nộp, hoàn thành báo cáo trước 10 ngày...",
    valueLabel: "Cam kết về tính minh bạch & Bảo mật",
    valuePlaceholder: "Vd: Mình chịu trách nhiệm 100% về số liệu và cam kết bảo mật tuyệt đối thông tin tài chính công ty.",
    processLabel: "Quy trình Kiểm soát & Đạo đức nghề nghiệp",
    processPlaceholder: "- Cam kết tuyệt mật thông tin khách hàng.\n- Sẵn sàng giải trình số liệu với cơ quan thuế.\n- Update báo cáo dòng tiền hàng tuần.",
    careerGoalLabel: "Lộ trình Tài chính (Finance Path)",
    careerGoalPlaceholder: "Vd: Trở thành Giám đốc Tài chính (CFO) hoặc Chuyên gia Phân tích Đầu tư...",
    mindsetLabel: "Tư duy số liệu (Data-Driven Mindset)",
    mindsetPlaceholder: "Vd: Con số không biết nói dối, nhưng người làm tài chính phải biết đọc được câu chuyện đằng sau chúng.",
    hourlyRateLabel: "Phí tư vấn tài chính theo Giờ (VND)",
    projectRateLabel: "Giá gói kế toán/quyết toán (VND)",
    skillHint: "Vd: Kế toán thuế, Phân tích tài chính, Kiểm toán, MISA, Excel...",
  },
  education: {
    portfolioTitle: "Hồ sơ Giảng dạy & Đào tạo",
    portfolioDesc: "Học trò thành đạt là thước đo của giáo viên. Hãy chia sẻ về phương pháp và kết quả của học viên.",
    projectLabel: "Khóa học / Lớp học tiêu biểu",
    projectPlaceholder: "Vd: Luyện thi IELTS 7.5 Cấp tốc cho SV Ngoại Thương",
    problemLabel: "Khó khăn của học viên là gì?",
    problemPlaceholder: "Vd: Học viên mất gốc tiếng Anh, sợ nói, phát âm sai hoàn toàn...",
    solutionLabel: "Phương pháp giảng dạy độc quyền",
    solutionPlaceholder: "Vd: Áp dụng phương pháp Shadowing, sơ đồ tư duy Mindmap...",
    resultLabel: "Kết quả học viên đạt được",
    resultPlaceholder: "Vd: 80% học viên đạt target sau 3 tháng, nâng band từ 4.0 lên 6.5...",
    valueLabel: "Triết lý giáo dục của bạn",
    valuePlaceholder: "Vd: Lấy người học làm trung tâm, giáo dục không chỉ là truyền đạt kiến thức mà là khơi dậy cảm hứng.",
    processLabel: "Quy trình giảng dạy & Hỗ trợ học viên",
    processPlaceholder: "- Theo sát lộ trình học tập cá nhân hóa.\n- Support giải đáp thắc mắc 24/7.\n- Tổ chức thi thử định kỳ hàng tháng.",
    careerGoalLabel: "Định hướng Sư phạm (Educator Path)",
    careerGoalPlaceholder: "Vd: Xây dựng trung tâm đào tạo kỹ năng số cho trẻ em...",
    mindsetLabel: "Tâm thế người dạy (Growth Mindset)",
    mindsetPlaceholder: "Vd: Không có học trò dốt, chỉ có phương pháp giảng dạy chưa phù hợp.",
    hourlyRateLabel: "Học phí theo Giờ (VND)",
    projectRateLabel: "Học phí trọn khóa / Lộ trình (VND)",
    skillHint: "Vd: IELTS, Soft Skills, Public Speaking, Academic Writing...",
  },
  sales: {
    portfolioTitle: "Bảng vàng Thành tích Bán hàng (Sales Record)",
    portfolioDesc: "Con số không biết nói dối. Hãy khoe ra những hợp đồng triệu đô hoặc tỷ lệ chốt sale ấn tượng của bạn.",
    projectLabel: "Thương vụ / Chiến dịch Branding",
    projectPlaceholder: "Vd: Ký kết hợp đồng phân phối độc quyền với Đối tác Nhật",
    problemLabel: "Rào cản/Khó khăn từ phía khách hàng?",
    problemPlaceholder: "Vd: Khách hàng chê giá cao, đối thủ cạnh tranh gay gắt...",
    solutionLabel: "Kỹ thuật đàm phán / Thuyết phục",
    solutionPlaceholder: "Vd: Áp dụng kỹ thuật chốt sale đường thẳng, tạo ra sự khan hiếm...",
    resultLabel: "Doanh số mang về (Con số cụ thể)",
    resultPlaceholder: "Vd: Doanh thu 2 tỷ/tháng, tỷ lệ chốt deal tăng từ 10% lên 25%...",
    valueLabel: "Tại sao bạn là 'Chiến thần chốt deal'?",
    valuePlaceholder: "Vd: Mình hiểu sâu tâm lý khách hàng và biết cách xây dựng niềm tin vững chắc để chốt sale bền vững.",
    processLabel: "Quy trình Sales & Chăm sóc khách hàng",
    processPlaceholder: "- Theo dõi lead sát sao trong CRM.\n- Cam kết KPI về doanh số/đơn hàng.\n- Support khách hàng sau khi mua (After-sales).",
    careerGoalLabel: "Mục tiêu Sales & Business",
    careerGoalPlaceholder: "Vd: Trở thành Giám đốc Kinh doanh cấp cao (Head of Sales)...",
    mindsetLabel: "Tư duy Bán hàng (Sales Mindset)",
    mindsetPlaceholder: "Vd: Bán hàng là giúp đỡ khách hàng giải quyết vấn đề của họ.",
    hourlyRateLabel: "Giá tư vấn/Gặp mặt (VND)",
    projectRateLabel: "Target doanh số / Commisson (VND)",
    skillHint: "Vd: Cold Calling, Negotiation, B2B Sales, CRM Management...",
  },
  health: {
    portfolioTitle: "Hồ sơ Chăm sóc Sức khỏe (Health Portfolio)",
    portfolioDesc: "Sức khỏe là vàng. Hãy kể về những hành trình thay đổi vóc dáng hoặc tâm lý của khách hàng.",
    projectLabel: "Lộ trình / Ca tư vấn tiêu biểu",
    projectPlaceholder: "Vd: Giảm 10kg mỡ thừa trong 12 tuần cho khách hàng văn phòng",
    problemLabel: "Tình trạng ban đầu của khách hàng?",
    problemPlaceholder: "Vd: Khách hàng bị béo phì độ 2, hay đau lưng, stress nặng...",
    solutionLabel: "Phác đồ / Chế độ luyện tập áp dụng",
    solutionPlaceholder: "Vd: Kết hợp ăn Eat Clean và tập kháng lực 3 buổi/tuần...",
    resultLabel: "Chỉ số thay đổi (Cân nặng/Tâm lý)",
    resultPlaceholder: "Vd: Giảm 8kg, vòng eo giảm 12cm, chỉ số mỡ máu về bình thường...",
    valueLabel: "Phương pháp chăm sóc của bạn",
    valuePlaceholder: "Vd: Mình tập trung vào lối sống bền vững, không ép buộc hay dùng thực phẩm chức năng độc hại.",
    processLabel: "Quy trình Huấn luyện & Đồng hành",
    processPlaceholder: "- Theo dõi chỉ số cơ thể hàng tuần.\n- Thiết kế thực đơn cá nhân hóa.\n- Động viên, nhắc nhở lịch tập mỗi ngày.",
    careerGoalLabel: "Tầm nhìn ngành Sức khỏe",
    careerGoalPlaceholder: "Vd: Trở thành chuyên gia dinh dưỡng hàng đầu trong cộng đồng chạy bộ...",
    mindsetLabel: "Triết lý Sức khỏe (Wellness Mindset)",
    mindsetPlaceholder: "Vd: Sức khỏe là một hành trình, không phải là đích đến.",
    hourlyRateLabel: "Giá tư vấn PT/Sức khỏe theo Giờ (VND)",
    projectRateLabel: "Giá trọn gói liệu trình / Khoá tập (VND)",
    skillHint: "Vd: Nutrition Planning, Strength Training, Mental Health...",
  },
  photography: {
    portfolioTitle: "Tác phẩm & Phim ảnh (Creative Gallery)",
    portfolioDesc: "Mỗi khung hình là một câu chuyện. Đừng kể, hãy cho họ thấy góc nhìn và phong cách của bạn.",
    projectLabel: "Bộ ảnh / Phim ngắn / Chiến dịch",
    projectPlaceholder: "Vd: Lookbook BST Mùa Thu 2024 - Brand XYZ",
    problemLabel: "Concept / Yêu cầu khó khăn của khách?",
    problemPlaceholder: "Vd: Phải chụp buổi tối nhưng muốn cảm giác nắng ban mai...",
    solutionLabel: "Kỹ thuật ánh sáng / Hậu kỳ",
    solutionPlaceholder: "Vd: Sử dụng đèn studio giả lập nắng, hậu kỳ màu film retro...",
    resultLabel: "Sản phẩm bàn giao & Phản hồi",
    resultPlaceholder: "Vd: 100 ảnh retouch, clip highlight triệu view trên Tiktok...",
    valueLabel: "Màu sắc & Góc máy cá nhân",
    valuePlaceholder: "Vd: Mình mạnh về ánh sáng tự nhiên và những góc máy điện ảnh (Cinematic).",
    processLabel: "Quy trình Studio & Hậu kỳ",
    processPlaceholder: "- Gửi toàn bộ file gốc trong ngày.\n- Chỉnh sửa chi tiết (Retouch) theo yêu cầu.\n- Hỗ trợ in ấn và album.",
    careerGoalLabel: "Định hướng Nghệ thuật (Photography Path)",
    careerGoalPlaceholder: "Vd: Sở hữu một studio nhiếp ảnh thời trang hàng đầu...",
    mindsetLabel: "Tư duy khung hình (Visual Mindset)",
    mindsetPlaceholder: "Vd: Một bức ảnh đẹp là bức ảnh khiến người xem phải dừng lại suy ngẫm.",
    hourlyRateLabel: "Giá chụp/quay theo Giờ (VND)",
    projectRateLabel: "Giá gói sản phẩm/album (VND)",
    skillHint: "Vd: Retouching, Lighting, Cinematic Composition, Lightroom...",
  },
  beauty: {
    portfolioTitle: "Hồ sơ Nghệ thuật & Làm đẹp (Beauty Portfolio)",
    portfolioDesc: "Khơi dậy vẻ đẹp tiềm ẩn. Hãy show ra các tác phẩm makeup, tạo mẫu hoặc tư vấn phong cách của bạn.",
    projectLabel: "Concept / Show diễn / Khách hàng",
    projectPlaceholder: "Vd: Makeup Tone Thái cho Cô dâu tháng 10",
    problemLabel: "Yêu cầu / Khuyết điểm cần xử lý?",
    problemPlaceholder: "Vd: Da khách hàng nhiều mụn ẩn, tone da không đều màu...",
    solutionLabel: "Kỹ thuật / Sản phẩm sử dụng",
    solutionPlaceholder: "Vd: Kỹ thuật đánh nền mỏng nhẹ, sử dụng bảng màu nóng...",
    resultLabel: "Sự kiện / Kết quả hình ảnh",
    resultPlaceholder: "Vd: Khách hàng hài lòng 100%, ảnh chụp studio cực lung linh...",
    valueLabel: "Tại sao khách hàng nên tin tưởng tay nghề của bạn?",
    valuePlaceholder: "Vd: Mình có 5 năm kinh nghiệm làm việc cho các show diễn thời trang lớn và luôn cập nhật xu hướng mới nhất.",
    processLabel: "Quy trình Dịch vụ & Chăm sóc khách",
    processPlaceholder: "- Test layout trước ngày sự kiện.\n- Sử dụng mỹ phẩm cao cấp chính hãng.\n- Support dặm phấn/thay layout tại tiệc.",
    careerGoalLabel: "Ước mơ ngành Làm đẹp (Beauty Vision)",
    careerGoalPlaceholder: "Vd: Xây dựng học viện đào tạo Makeup Artists chuyên nghiệp...",
    mindsetLabel: "Triết lý về cái đẹp (Aesthetic Mindset)",
    mindsetPlaceholder: "Vd: Trang điểm đẹp nhất là khi vẫn giữ được nét riêng vốn có của mỗi người.",
    hourlyRateLabel: "Giá dịch vụ theo Giờ/Khách (VND)",
    projectRateLabel: "Giá trọn gói sự kiện (VND)",
    skillHint: "Vd: Bridal Makeup, Hairstyling, Personal Stylist, Skincare Advisor...",
  },
  translation: {
    portfolioTitle: "Hồ sơ Biên phiên dịch & Ngôn ngữ",
    portfolioDesc: "Xóa tan rào cản ngôn ngữ. Hãy kể về những tài liệu khó hoặc các buổi phiên dịch cabin căng thẳng.",
    projectLabel: "Tài liệu / Sự kiện phiên dịch",
    projectPlaceholder: "Vd: Dịch thuật hợp đồng kinh tế 100 trang Anh-Việt",
    problemLabel: "Thuật ngữ chuyên ngành / Độ khó?",
    problemPlaceholder: "Vd: Thuật ngữ kỹ thuật cơ khí cổ điển cực kỳ hiếm gặp...",
    solutionLabel: "Quy trình đối soát & Hiệu đính",
    solutionPlaceholder: "Vd: Tra cứu từ điển chuyên ngành, sử dụng công cụ CAT Tool...",
    resultLabel: "Độ chính xác / Phản hồi đối tác",
    resultPlaceholder: "Vd: Bản dịch được duyệt ngay lần đầu, không sai lệch thuật ngữ...",
    valueLabel: "Sự nhạy cảm về ngôn ngữ của bạn",
    valuePlaceholder: "Vd: Mình không chỉ dịch chữ, mà dịch cả văn hóa và sắc thái biểu cảm của ngôn ngữ.",
    processLabel: "Quy trình Dịch thuật & Chất lượng",
    processPlaceholder: "- Kiểm tra đạo văn & Thuật ngữ.\n- Hiệu đính bởi người bản xứ (nếu cần).\n- Bàn giao đúng hạn, format chuẩn.",
    careerGoalLabel: "Tầm nhìn ngành Ngôn ngữ",
    careerGoalPlaceholder: "Vd: Trở thành chuyên gia bản địa hóa cho các tập đoàn đa quốc gia...",
    mindsetLabel: "Triết lý dịch thuật (Linguist Mindset)",
    mindsetPlaceholder: "Vd: Dịch thuật là nghệ thuật phản chiếu tâm trí từ ngôn ngữ này sang ngôn ngữ khác.",
    hourlyRateLabel: "Giá dịch thuật theo Giờ / Trang (VND)",
    projectRateLabel: "Giá trọn gói dự án dịch (VND)",
    skillHint: "Vd: Translator, Interpreter, Localization, CAT Tools, Subtitling...",
  },
  event: {
    portfolioTitle: "Hồ sơ Tổ chức Sự kiện & Ẩm thực",
    portfolioDesc: "Tạo nên những khoảnh khắc đáng nhớ. Hãy chia sẻ về những sự kiện quy mô bạn đã điều phối.",
    projectLabel: "Sự kiện / Tiệc / Chiến dịch",
    projectPlaceholder: "Vd: Gala Dinner 500 khách cho tập đoàn VinGroup",
    problemLabel: "Sự cố / Áp lực về thời gian/ngân sách?",
    problemPlaceholder: "Vd: Mưa bất chợt khi tổ chức ngoài trời, hụt nhân sự chạy bàn...",
    solutionLabel: "Phương án dự phòng & Điều phối",
    solutionPlaceholder: "Vd: Chuyển vào sảnh phụ trong 15 phút, huy động team backup...",
    resultLabel: "Quy mô sự kiện / Độ hài lòng",
    resultPlaceholder: "Vd: Sự kiện diễn ra suôn sẻ, khách hàng ký tiếp hợp đồng năm sau...",
    valueLabel: "Kỹ năng quản trị rủi ro của bạn",
    valuePlaceholder: "Vd: Mình luôn có ít nhất 3 phương án dự phòng cho mọi tình huống xấu nhất có thể xảy ra tại sự kiện.",
    processLabel: "Quy trình Vận hành & Coordination",
    processPlaceholder: "- Lập checklist chi tiết từng phút.\n- Quản lý nhà cung cấp (Vendors).\n- Report ngân sách minh bạch hàng ngày.",
    careerGoalLabel: "Ước mơ ngành Sự kiện (Event Manager Vision)",
    careerGoalPlaceholder: "Vd: Tổ chức các giải đấu eSports quy mô quốc tế tại Việt Nam...",
    mindsetLabel: "Tư duy tổ chức (Execution Mindset)",
    mindsetPlaceholder: "Vd: Thành công của sự kiện nằm ở những chi tiết nhỏ nhất.",
    hourlyRateLabel: "Giá điều phối sự kiện theo Giờ (VND)",
    projectRateLabel: "Giá thầu/ngân sách sự kiện (VND)",
    skillHint: "Vd: Event Planning, Budgeting, Vendor Management, Catering...",
  },
  va: {
    portfolioTitle: "Hồ sơ Hỗ trợ & Trợ lý ảo (VA Portfolio)",
    portfolioDesc: "Cánh tay phải đắc lực. Hãy kể về cách bạn giúp chủ doanh nghiệp tối ưu hóa thời gian và năng suất.",
    projectLabel: "Hợp đồng / Phạm vi công việc",
    projectPlaceholder: "Vd: Quản lý vận hành cho E-commerce Store (US Market)",
    problemLabel: "Sự lộn xộn / Khối lượng việc quá tải?",
    problemPlaceholder: "Vd: Chủ shop bị ngập trong 200 email và 50 đơn hàng lỗi mỗi ngày...",
    solutionLabel: "Hệ thống hóa & Tự động hóa",
    solutionPlaceholder: "Vd: Thiết lập quy trình trên Notion/Trello, dùng Zapier tự động hóa...",
    resultLabel: "Thời gian tiết kiệm / Hiệu suất tăng",
    resultPlaceholder: "Vd: Tiết kiệm 4h/ngày cho chủ shop, 100% email được rep trong 2h...",
    valueLabel: "Khả năng tổ chức & Đa nhiệm",
    valuePlaceholder: "Vd: Mình có khả năng quản lý nhiều dự án cùng lúc mà vẫn đảm bảo tính chính xác và đúng hạn tuyệt đối.",
    processLabel: "Quy trình làm việc & Tooling",
    processPlaceholder: "- Update công việc qua Slack/Notion.\n- Sẵn sàng training thêm công cụ mới.\n- Tính giờ làm việc minh bạch (Clockify/Toggl).",
    careerGoalLabel: "Lộ trình Trợ lý chuyên nghiệp",
    careerGoalPlaceholder: "Vd: Trở thành Online Business Manager (OBM) cho các Founders...",
    mindsetLabel: "Tư duy hỗ trợ (Support Mindset)",
    mindsetPlaceholder: "Vd: Sự thành công của khách hàng chính là thước đo năng lực của mình.",
    hourlyRateLabel: "Giá thuê VA theo Giờ (VND)",
    projectRateLabel: "Giá trị hợp đồng theo Tháng (VND)",
    skillHint: "Vd: Data Entry, Customer Support, Calendar Management, Zapier...",
  },
  legal: {
    portfolioTitle: "Hồ sơ Tư vấn Pháp lý & Giải quyết tranh chấp",
    portfolioDesc: "Thượng tôn pháp luật. Hãy show ra các vụ việc bạn đã gỡ rối thành công cho khách hàng.",
    projectLabel: "Vụ việc / Dự án pháp lý",
    projectPlaceholder: "Vd: Tư vấn sáp nhập doanh nghiệp A và B (M&A)",
    problemLabel: "Rủi ro pháp lý / Tranh chấp hiện có?",
    problemPlaceholder: "Vd: Tranh chấp quyền sở hữu trí tuệ giữa 2 thương hiệu lớn...",
    solutionLabel: "Cơ sở pháp lý & Phương án xử lý",
    solutionPlaceholder: "Vd: Áp dụng luật SHTT 2022, tổ chức hòa giải ngoài tòa án...",
    resultLabel: "Kết quả cuối cùng / Phán quyết",
    resultPlaceholder: "Vd: Thắng kiện, giữ được thương hiệu, tiết kiệm 1 tỷ đồng bồi thường...",
    valueLabel: "Uy tín & Đạo đức nghề luật",
    valuePlaceholder: "Vd: Mình cam kết bảo vệ quyền lợi hợp pháp của khách hàng dựa trên sự thượng tôn pháp luật và tính chính trực.",
    processLabel: "Quy trình Tư vấn & Hồ sơ",
    processPlaceholder: "- Nghiên cứu hồ sơ kỹ lưỡng.\n- Cập nhật tiến độ tố tụng liên tục.\n- Bảo mật thông tin tuyệt đối.",
    careerGoalLabel: "Định hướng sự nghiệp Pháp lý",
    careerGoalPlaceholder: "Vd: Trở thành luật sư tranh tụng hàng đầu trong lĩnh vực Kinh tế...",
    mindsetLabel: "Tư duy Pháp lý (Legal Mindset)",
    mindsetPlaceholder: "Vd: Phòng bệnh hơn chữa bệnh - Tư vấn pháp trị để tránh rủi ro bền vững.",
    hourlyRateLabel: "Phí tư vấn Luật theo Giờ (VND)",
    projectRateLabel: "Phí đại diện vụ việc (VND)",
    skillHint: "Vd: Legal Research, Litigation, Corporate Law, Intellectual Property...",
  }
};
const SUB_NICHES = {
  writing: ['SEO Blog', 'Viết Quảng Cáo (Ads)', 'Kịch bản Video', 'Sách / Ebook', 'PR / Báo chí'],
  video: ['Talking Head', 'Vlog', 'Reels/Shorts', 'Documentary', 'Corporate / Ads', 'Music Video'],
  design: ['Logo / Branding', 'UI/UX Design', 'Social Media Graphics', 'Illustration', 'Bao bì'],
  dev: ['Front-end', 'Back-end', 'Full-stack', 'Mobile App', 'Game Dev', 'AI / Data Science'],
  marketing: ['Facebook Ads', 'Google Ads', 'SEO', 'Email Marketing', 'KOL / Influencer Manager'],
  esports: ['Streamer', 'Pro Player', 'Caster / Analyst', 'Coach (Huấn luyện viên)', 'Manager / Scout'],
  finance: ['Kế toán thuế', 'Kiểm toán', 'Phân tích tài chính', 'Tư vấn đầu tư', 'Quản lý dòng tiền'],
  education: ['Gia sư ngoại ngữ', 'Dạy kỹ năng mềm', 'Luyện thi (IELTS/TOEIC)', 'Đào tạo doanh nghiệp', 'E-learning Content'],
  sales: ['Telesale', 'Bán hàng B2B', 'Tư vấn bảo hiểm', 'Bất động sản', 'Phát triển thị trường'],
  health: ['Tư vấn dinh dưỡng', 'PT (Huấn luyện viên cá nhân)', 'Yoga / Yoga bay', 'Tham vấn tâm lý'],
  beauty: ['Trang điểm (Makeup)', 'Làm tóc / Nails', 'Stylist thời trang', 'Skincare Consultant'],
  photography: ['Ảnh cưới', 'Ảnh sản phẩm', 'Flycam / Cinematic', 'Chỉnh sửa ảnh chuyên nghiệp'],
  translation: ['Biên dịch tài liệu', 'Phiên dịch cabin', 'Bản địa hóa (Localization)', 'Phụ đề / Lồng tiếng'],
  event: ['Wedding Planner', 'MC / Hoạt náo', 'Trang trí sự kiện', 'Chef / Catering'],
  va: ['Data Entry', 'Chăm sóc Khách hàng', 'Quản lý Lịch trình', 'Nghiên cứu thị trường', 'Telesale'],
  legal: ['Tư vấn luật', 'Hồ sơ pháp lý', 'Tranh tụng', 'Tư vấn doanh nghiệp'],
};

const SUPPORTED_LANGUAGES = [
  { id: 'en', label: 'Tiếng Anh', levels: ['Basic', 'Conversational', 'Fluent', 'Native', 'IELTS', 'TOEIC', 'TOEFL'] },
  { id: 'jp', label: 'Tiếng Nhật', levels: ['N5', 'N4', 'N3', 'N2', 'N1', 'Conversational', 'Fluent', 'Native'] },
  { id: 'cn', label: 'Tiếng Trung', levels: ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'Conversational', 'Fluent', 'Native'] },
  { id: 'kr', label: 'Tiếng Hàn', levels: ['TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6', 'Conversational', 'Fluent', 'Native'] },
  { id: 'fr', label: 'Tiếng Pháp', levels: ['DELF/DALF A1', 'DELF A2', 'DELF B1', 'DELF B2', 'DALF C1', 'DALF C2', 'Conversational', 'Fluent'] },
  { id: 'other', label: 'Khác', levels: ['Basic', 'Conversational', 'Fluent', 'Native'] },
];

const COMMON_TOOLS = ['Canva', 'ChatGPT', 'Notion', 'Google Workspace', 'Trello', 'Slack'];
const NICHE_TOOLS = {
  video: ['DaVinci Resolve', 'Adobe Premiere', 'Final Cut Pro', 'After Effects', 'CapCut'],
  design: ['Photoshop', 'Illustrator', 'Figma', 'Indesign', 'Lightroom'],
  dev: ['VS Code', 'Git/GitHub', 'Docker', 'Postman', 'AWS', 'Cursor AI'],
  writing: ['Grammarly', 'Hemingway', 'SurferSEO', 'Word', 'Google Docs'],
  esports: ['OBS Studio', 'Streamlabs', 'Discord', 'Discord API'],
  finance: ['MISA', 'Bravo', 'Excel (Advance)', 'QuickBooks'],
  education: ['Zoom', 'Google Classroom', 'Quizizz', 'Kahoot', 'Moodle'],
  sales: ['Salesforce', 'HubSpot CRM', 'Zalo OA', 'Pipedrive'],
  translation: ['SDL Trados', 'MemoQ', 'Aegisub', 'SubTitle Edit'],
  marketing: ['Meta Business Suite', 'Google Analytics', 'TikTok Creative Center', 'Canva'],
};

// ── REUSABLE COMPONENTS ───────────────────────────────────────────────────────
function TagChip({ label, selected, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all flex items-center gap-2 ${selected ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
        }`}
    >
      {icon && <span className="material-icons text-base">{icon}</span>}
      {label}
    </button>
  );
}

function TextInput({ label, hint, as = 'input', ...props }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-800 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2 leading-relaxed">{hint}</p>}
      {as === 'textarea' ? (
        <textarea className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none bg-gray-50/50 hover:bg-white focus:bg-white" {...props} />
      ) : (
        <input className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50/50 hover:bg-white focus:bg-white" {...props} />
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ProfileEditPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const avatarRef = useRef();

  // Role State
  const [internalRole, setInternalRole] = useState(user?.role || 'freelancer');

  // Tab State
  const [activeTab, setActiveTab] = useState(1);
  const TOTAL_TABS = user?.role === 'client' ? 2 : 6;

  // Form State
  const [form, setForm] = useState({
    name: '', headline: '', bio: '', avatar: '',
    niche: [], subNiche: [], skills: [], tools: [],
    problemsSolved: '', workAttitude: '',
    yearsOfExperience: 0, expertiseLevel: 'junior',
    hourlyRate: '', projectRate: '', availability: '',
    languages: [], englishLevel: '', equipment: { software: '', hardware: '' },
    careerGoals: '', coreBeliefs: '', nicheSpecificData: {},
    caseStudies: [{ title: '', problem: '', solution: '', result: '', mediaUrl: '' }],
    company: '', industry: '', website: '', location: '', companySize: '',
    clientInfo: { problem: '', expectedResult: '', paymentType: 'fixed', budgetRange: '', projectType: 'one-time', duration: '', updateFrequency: 'weekly', meetingWillingness: false },
  });

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    if (user) {
      setInternalRole(user.role || 'freelancer');
      setForm({
        name: user.name || '', headline: user.headline || '', bio: user.bio || '', avatar: user.avatar || '',
        niche: user.niche || [], subNiche: user.subNiche || [],
        skills: user.skills || [], tools: user.tools || [],
        problemsSolved: user.problemsSolved || '', workAttitude: user.workAttitude || '',
        yearsOfExperience: user.yearsOfExperience || 0,
        expertiseLevel: user.expertiseLevel || 'junior',
        hourlyRate: user.hourlyRate || '', projectRate: user.projectRate || '', availability: user.availability || '',
        languages: user.languages || [],
        englishLevel: user.englishLevel || '', equipment: user.equipment || { software: '', hardware: '' },
        careerGoals: user.careerGoals || '', coreBeliefs: user.coreBeliefs || '',
        nicheSpecificData: user.nicheSpecificData || {},
        caseStudies: user.caseStudies?.length > 0 ? user.caseStudies : [{ title: '', problem: '', solution: '', result: '', mediaUrl: '' }],
        company: user.company || '', industry: user.industry || '', website: user.website || '',
        location: user.location || '', companySize: user.companySize || '',
        clientInfo: user.clientInfo || { problem: '', expectedResult: '', paymentType: 'fixed', budgetRange: '', projectType: 'one-time', duration: '', updateFrequency: 'weekly', meetingWillingness: false },
      });
    }
  }, [user]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (k, item) => setF(k, form[k].includes(item) ? form[k].filter(x => x !== item) : [...form[k], item]);

  const handleRoleChange = async (newRole) => {
    if (newRole === internalRole) return;
    try {
      await authAPI.setRole(newRole);
      setInternalRole(newRole);
      if (setUser) setUser(prev => ({ ...prev, role: newRole }));
      setActiveTab(1);
    } catch (err) {
      setError('Lỗi khi chuyển đổi vai trò.');
    }
  };

  // Handlers
  const setNicheData = (k, v) => setF('nicheSpecificData', { ...form.nicheSpecificData, [k]: v });
  const setClientData = (k, v) => setF('clientInfo', { ...form.clientInfo, [k]: v });

  // Avatar handler
  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.post(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_KEY}`, formData);
      if (res.data?.data?.url) {
        setF('avatar', res.data.data.url);
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      setError('Lỗi tải ảnh lên. Vui lòng thử lại sau.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const mainNiche = form.niche[0];

      // Filter out subNiches that don't belong to the selected main niche
      const validSubNiches = mainNiche && SUB_NICHES[mainNiche]
        ? form.subNiche.filter(sn => SUB_NICHES[mainNiche].includes(sn))
        : [];

      // Filter out tools that don't belong to the selected main niche or COMMON_TOOLS
      const validTools = form.tools.filter(t =>
        COMMON_TOOLS.includes(t) ||
        (mainNiche && NICHE_TOOLS[mainNiche] && NICHE_TOOLS[mainNiche].includes(t))
      );

      const payload = {
        name: form.name, headline: form.headline, bio: form.bio, avatar: form.avatar,
        niche: form.niche, subNiche: validSubNiches,
        skills: form.skills, tools: validTools,
        problemsSolved: form.problemsSolved, workAttitude: form.workAttitude,
        yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
        expertiseLevel: form.expertiseLevel || undefined,
        hourlyRate: parseFloat(form.hourlyRate) || undefined, projectRate: parseFloat(form.projectRate) || undefined,
        availability: form.availability || undefined,
        languages: form.languages.filter(l => l.name && l.level),
        equipment: form.equipment,
        careerGoals: form.careerGoals, coreBeliefs: form.coreBeliefs,
        nicheSpecificData: form.nicheSpecificData,
        clientInfo: form.clientInfo,
        caseStudies: form.caseStudies.filter(cs => cs.title.trim()),
        company: form.company, industry: form.industry, website: form.website,
        location: form.location, companySize: form.companySize || undefined,
      };
      const { data } = await usersAPI.updateProfile(payload);
      if (setUser) setUser(data.user);
      setShowStatusModal('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi khi lưu hồ sơ, vui lòng thử lại.');
      setShowStatusModal('error');
    } finally {
      setSaving(false);
    }
  };

  // ── RENDER HELPERS ────────────────────────────────────────────────────────────
  const isFreelancer = internalRole === 'freelancer';
  const selectedMainNiche = form.niche[0]; // Assume 1 main niche for dynamic rendering

  const tabsFreelancer = [
    { id: 1, name: 'Định danh & Ngách', icon: 'badge' },
    { id: 2, name: 'Hồ sơ năng lực', icon: 'folder_special' },
    { id: 3, name: 'Giải pháp & Giá trị', icon: 'psychology' },
    { id: 4, name: 'Định giá & Công cụ', icon: 'payments' },
    { id: 5, name: 'Khám phá nội tâm', icon: 'self_improvement' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20">
      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to={user?.role === 'client' ? '/employer' : (user?.role === 'freelancer' ? '/dashboard' : '/')}
            className="flex items-center gap-1"
          >
            <span className="text-primary font-bold text-2xl tracking-tight">Ho</span>
            <span className="bg-primary text-white rounded px-1.5 font-bold text-lg">pe</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher variant="compact" />
            <button onClick={() => navigate(-1)} className="text-xs md:text-sm font-semibold text-gray-500 hover:text-gray-800 px-2 md:px-4 py-2">Hủy</button>
            <button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-dark text-white text-[11px] md:text-sm font-bold px-4 md:px-6 py-2 rounded-full transition-colors flex items-center gap-1 md:gap-2 shadow-md shadow-primary/20">
              {saving ? <span className="material-icons animate-spin text-sm">refresh</span> : <span className="material-icons text-sm">check_circle</span>}
              <span className="hidden sm:inline">Hoàn tất</span>
              <span className="sm:hidden">Lưu</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* ── SIDEBAR NAVIGATION ── */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 md:p-4 sticky top-20 md:top-24">
            <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 md:mb-4 px-2">Tiến trình hồ sơ</h3>
            <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
              {(isFreelancer ? tabsFreelancer : [{ id: 1, name: 'Thông tin & Vấn đề', icon: 'info' }, { id: 2, name: 'Dự án & Ngân sách', icon: 'business' }]).map(tab => (
                <li key={tab.id} className="flex-shrink-0">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className="material-icons text-base md:text-lg">{tab.icon}</span>
                    {tab.name}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 md:mt-8 px-2 hidden md:block">
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(activeTab / (isFreelancer ? 5 : 2)) * 100}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 font-medium text-center">Bước {activeTab} / {isFreelancer ? 5 : 2}</p>
            </div>
          </div>
        </aside>

        {/* ── FORM CONTENT ── */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Role Toggle */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 px-8 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">Chế độ hiển thị Form:</h3>
            </div>
            <div className="flex bg-gray-200 p-1 rounded-xl">
              <button onClick={() => handleRoleChange('freelancer')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isFreelancer ? 'bg-white text-primary shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-700'}`}>Freelancer</button>
              <button onClick={() => handleRoleChange('client')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!isFreelancer ? 'bg-white text-primary shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-700'}`}>Khách hàng (Client)</button>
            </div>
          </div>

          {error && <div className="m-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium flex items-center gap-2"><span className="material-icons">error</span>{error}</div>}

          <div className="p-4 md:p-8">
            {/* ── TAB 1: DANH TÍNH & NGÁCH ── */}
            {activeTab === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Định hình Danh tính</h2>
                  <p className="text-gray-500 text-sm mt-1">Khách hàng cần biết bạn là ai và bạn làm được gì chỉ trong 3 giây đầu tiên.</p>
                </div>

                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="relative group cursor-pointer" onClick={() => !uploadingAvatar && avatarRef.current?.click()}>
                    {uploadingAvatar ? (
                      <div className="w-24 h-24 rounded-full bg-white border-4 border-gray-200 shadow-sm flex items-center justify-center">
                        <span className="material-icons animate-spin text-primary text-4xl">refresh</span>
                      </div>
                    ) : form.avatar ? (
                      <img src={form.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md group-hover:brightness-90 transition-all" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-white border-4 border-gray-200 shadow-sm flex items-center justify-center group-hover:bg-gray-100 transition-all">
                        <span className="material-icons text-gray-400 text-4xl">add_a_photo</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-lg">
                      <span className="material-icons text-sm">edit</span>
                    </div>
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Ảnh đại diện chuyên nghiệp</h3>
                    <p className="text-xs text-gray-500 mt-1">Nên sử dụng ảnh rõ mặt, cười tươi hoặc Logo cá nhân.<br />Định dạng JPG, PNG &lt; 5MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextInput label="Họ và tên hoặc Nghệ danh" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Vd: Nguyễn Quang Hải / HaiNguyen Design" />
                  <TextInput label="Slogan / Hook thu hút (Headline) *" hint="Câu nói một dòng để chốt sale ngay trên banner." value={form.headline} onChange={e => setF('headline', e.target.value)} placeholder="Vd: Biến Video PodCast thành Reels triệu view" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                  <div>
                    <label className="block text-sm font-semibold text-primary-dark mb-1">Cấp độ chuyên môn</label>
                    <select value={form.expertiseLevel} onChange={e => setF('expertiseLevel', e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white">
                      <option value="intern">Intern / Fresher</option>
                      <option value="junior">Junior (1-2 năm)</option>
                      <option value="middle">Middle (3-5 năm)</option>
                      <option value="senior">Senior (5-8 năm)</option>
                      <option value="expert">Expert / Manager (8+ năm)</option>
                    </select>
                  </div>
                  <TextInput label="Số năm kinh nghiệm" type="number" min="0" value={form.yearsOfExperience} onChange={e => setF('yearsOfExperience', e.target.value)} />
                </div>

                {isFreelancer && (
                  <>
                    <hr className="border-gray-100" />
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">Ngành nghề chính của bạn là gì? <span className="text-xs text-gray-500 font-normal">(Chọn 1 để hệ thống tối ưu form)</span></label>
                      <div className="flex flex-wrap gap-3">
                        {MAIN_NICHES.map(n => (
                          <TagChip key={n.id} icon={n.icon} label={n.label} selected={form.niche.includes(n.id)} onClick={() => setF('niche', [n.id])} />
                        ))}
                      </div>
                    </div>

                    {selectedMainNiche && SUB_NICHES[selectedMainNiche] && (
                      <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                        <label className="block text-sm font-semibold text-primary-dark mb-3">Ngách chuyên sâu <span className="text-xs font-normal">(Chọn nhiều)</span></label>
                        <div className="flex flex-wrap gap-2">
                          {SUB_NICHES[selectedMainNiche].map(sub => (
                            <TagChip key={sub} label={sub} selected={form.subNiche.includes(sub)} onClick={() => toggleArr('subNiche', sub)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── TAB 2: PORTFOLIO & CASE STUDIES ── */}
            {activeTab === 2 && isFreelancer && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{NICHE_DETAILS[selectedMainNiche]?.portfolioTitle || "Hồ sơ năng lực (Universal Portfolio)"}</h2>
                  <p className="text-gray-500 text-sm mt-1">{NICHE_DETAILS[selectedMainNiche]?.portfolioDesc || "Đừng nói, hãy chứng minh bằng kết quả. Hãy kể lại câu chuyện đằng sau dự án của bạn."}</p>
                </div>

                {/* Dynamic fields based on Niche */}
                {selectedMainNiche === 'writing' && (
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <TextInput label="Tốc độ viết trung bình của bạn?" hint="Giúp khách hàng ước lượng deadline (Vd: 2000 chữ/ngày)" value={form.nicheSpecificData.writingSpeed || ''} onChange={e => setNicheData('writingSpeed', e.target.value)} />
                  </div>
                )}
                {selectedMainNiche === 'dev' && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <TextInput label="Tech Stack / Ngôn ngữ lập trình chính?" hint="Vd: ReactJS, Node.js, MERN Stack, Python" value={form.nicheSpecificData.techStack || ''} onChange={e => setNicheData('techStack', e.target.value)} />
                  </div>
                )}
                {selectedMainNiche === 'video' && (
                  <div className="bg-rose-50 p-5 rounded-xl border border-rose-100">
                    <TextInput label="Bạn có cung cấp nhạc bản quyền/Footage không?" hint="Vd: Có tk Envato Elements / Artlist" value={form.nicheSpecificData.assets || ''} onChange={e => setNicheData('assets', e.target.value)} />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">Case Studies tiêu biểu</h3>
                  </div>

                  <div className="space-y-6">
                    {form.caseStudies.map((cs, idx) => (
                      <div key={idx} className="bg-white border-2 border-gray-100 rounded-2xl p-6 relative shadow-sm hover:shadow-md transition-shadow group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {form.caseStudies.length > 1 && (
                            <button onClick={() => setF('caseStudies', form.caseStudies.filter((_, i) => i !== idx))} className="bg-red-50 text-red-500 rounded-lg p-1.5 hover:bg-red-100 transition-colors"><span className="material-icons text-sm">delete</span></button>
                          )}
                        </div>

                        <div className="mb-4">
                          <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded-md uppercase">Dự án #{idx + 1}</span>
                        </div>

                        <div className="space-y-4">
                          <TextInput label={NICHE_DETAILS[selectedMainNiche]?.projectLabel || "Tên dự án"} placeholder={NICHE_DETAILS[selectedMainNiche]?.projectPlaceholder || "Chiến dịch Re-branding cho ABC Corp"} value={cs.title} onChange={e => { const c = [...form.caseStudies]; c[idx].title = e.target.value; setF('caseStudies', c); }} />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput as="textarea" rows={3} label={NICHE_DETAILS[selectedMainNiche]?.problemLabel || "Khách bị 'đau' ở đâu?"} placeholder={NICHE_DETAILS[selectedMainNiche]?.problemPlaceholder || "- Traffic lẹt đẹt 100 view/ngày\n- Hình ảnh thương hiệu cũ kỹ..."} value={cs.problem} onChange={e => { const c = [...form.caseStudies]; c[idx].problem = e.target.value; setF('caseStudies', c); }} />
                            <TextInput as="textarea" rows={3} label={NICHE_DETAILS[selectedMainNiche]?.solutionLabel || "Bạn đã trị như thế nào?"} placeholder={NICHE_DETAILS[selectedMainNiche]?.solutionPlaceholder || "- Đập đi xây lại toàn bộ UI/UX\n- Đổi tone giọng Content..."} value={cs.solution} onChange={e => { const c = [...form.caseStudies]; c[idx].solution = e.target.value; setF('caseStudies', c); }} />
                          </div>
                          <TextInput as="textarea" rows={2} label={NICHE_DETAILS[selectedMainNiche]?.resultLabel || "Kết quả chói lọi (Con số)"} placeholder={NICHE_DETAILS[selectedMainNiche]?.resultPlaceholder || "- Chốt 500 đơn trong tuần đầu\n- Giảm 20% bounce rate..."} value={cs.result} onChange={e => { const c = [...form.caseStudies]; c[idx].result = e.target.value; setF('caseStudies', c); }} />
                          <TextInput label="Link xem / Link Drive" placeholder="https://..." value={cs.mediaUrl} onChange={e => { const c = [...form.caseStudies]; c[idx].mediaUrl = e.target.value; setF('caseStudies', c); }} />
                        </div>
                      </div>
                    ))}

                    <button onClick={() => setF('caseStudies', [...form.caseStudies, { title: '', problem: '', solution: '', result: '', mediaUrl: '' }])} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 font-semibold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 bg-gray-50/50 hover:bg-primary/5">
                      <span className="material-icons">add_circle_outline</span> Thêm Case Study nữa
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: VALUE PROPOSITION ── */}
            {activeTab === 3 && isFreelancer && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Giải pháp & Thương hiệu</h2>
                  <p className="text-gray-500 text-sm mt-1">Điều gì khiến khách hàng phải chọn bạn thay vì hàng ngàn Freelancer ngoài kia?</p>
                </div>

                <div className="space-y-6">
                  <TextInput as="textarea" rows={4} label={NICHE_DETAILS[selectedMainNiche]?.valueLabel || "Vấn đề lớn nhất bạn giải quyết cho Doanh nghiệp là gì?"} hint="Giúp họ kiếm tiền? Tiết kiệm thời gian? Hay làm họ trông cực ngầu?" placeholder={NICHE_DETAILS[selectedMainNiche]?.valuePlaceholder || "Mình giúp các chủ doanh nghiệp bận rộn không cần đụng tay vào quản trị Fanpage mà vẫn có leads đều đặn mỗi tháng."} value={form.problemsSolved} onChange={e => setF('problemsSolved', e.target.value)} />

                  <TextInput as="textarea" rows={4} label={NICHE_DETAILS[selectedMainNiche]?.processLabel || "Thái độ & Quy trình làm việc"} hint="Khách hàng rất sợ Freelancer mất tích. Bạn cam kết điều gì?" placeholder={NICHE_DETAILS[selectedMainNiche]?.processPlaceholder || "- Luôn update tiến độ mỗi cuối ngày.\n- Không ngại sửa đến khi nào ưng ý.\n- Rep tin nhắn trong vòng 15 phút."} value={form.workAttitude} onChange={e => setF('workAttitude', e.target.value)} />

                  <TextInput as="textarea" rows={4} label="Tiểu sử bản thân (Bio)" hint="Chia sẻ một chút về hành trình của bạn để tạo kết nối cảm xúc." placeholder="Bắt đầu từ một sinh viên trái ngành, mình đã tự học code trong 2 năm và..." value={form.bio} onChange={e => setF('bio', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── TAB 4: PRICING & TOOLS ── */}
            {activeTab === 4 && isFreelancer && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Định giá & Công Cụ</h2>
                  <p className="text-gray-500 text-sm mt-1">Minh bạch rõ ràng về khả năng và chi phí của bạn.</p>
                </div>

                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2"><span className="material-icons">payments</span> Khung giá dịch vụ cơ bản</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput label={NICHE_DETAILS[selectedMainNiche]?.hourlyRateLabel || "Giá tính theo Giờ (VND)"} placeholder="VD: 150000" type="number" value={form.hourlyRate} onChange={e => setF('hourlyRate', e.target.value)} />
                    <TextInput label={NICHE_DETAILS[selectedMainNiche]?.projectRateLabel || "Giá khoán dự án nhỏ (VND)"} hint="Giúp khách dễ hình dung ngân sách" placeholder="VD: 2000000" type="number" value={form.projectRate} onChange={e => setF('projectRate', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Công cụ sử dụng <span className="text-xs font-normal text-gray-500">(Bấm để chọn)</span></label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {COMMON_TOOLS.map(t => <TagChip key={t} label={t} selected={form.tools.includes(t)} onClick={() => toggleArr('tools', t)} />)}
                      {selectedMainNiche && NICHE_TOOLS[selectedMainNiche]?.map(t => <TagChip key={t} label={t} selected={form.tools.includes(t)} onClick={() => toggleArr('tools', t)} />)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Dynamic Foreign Languages */}
                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                      <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2"><span className="material-icons">translate</span> Ngoại ngữ & Chứng chỉ</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {form.languages.map((lang, idx) => (
                          <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-white p-4 rounded-xl shadow-sm border border-blue-100 relative">
                            <div className="flex-1 min-w-[150px]">
                              <label className="block text-xs font-bold text-gray-500 mb-1">Ngôn ngữ</label>
                              <select className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" value={lang.name} onChange={e => {
                                const newLangs = [...form.languages];
                                newLangs[idx].name = e.target.value;
                                setF('languages', newLangs);
                              }}>
                                <option value="">Chọn ngôn ngữ</option>
                                {SUPPORTED_LANGUAGES.map(l => <option key={l.id} value={l.label}>{l.label}</option>)}
                              </select>
                            </div>
                            <div className="flex-1 min-w-[150px]">
                              <label className="block text-xs font-bold text-gray-500 mb-1">Trình độ</label>
                              <select className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" value={lang.level} onChange={e => {
                                const newLangs = [...form.languages];
                                newLangs[idx].level = e.target.value;
                                setF('languages', newLangs);
                              }}>
                                <option value="">Chọn trình độ</option>
                                {SUPPORTED_LANGUAGES.find(l => l.label === lang.name)?.levels.map(lv => <option key={lv} value={lv}>{lv}</option>) || (
                                  <>
                                    <option value="Basic">Cơ bản</option>
                                    <option value="Conversational">Giao tiếp</option>
                                    <option value="Fluent">Trôi chảy</option>
                                    <option value="Native">Bản xứ</option>
                                  </>
                                )}
                              </select>
                            </div>
                            <div className="w-full md:w-1/3 min-w-[150px]">
                              <label className="block text-xs font-bold text-gray-500 mb-1">Chứng chỉ / Điểm số</label>
                              <input
                                type="text"
                                className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                placeholder="Vd: 8.5 / N1 / HSK 6"
                                value={lang.certificate || ''}
                                onChange={e => {
                                  const newLangs = [...form.languages];
                                  newLangs[idx].certificate = e.target.value;
                                  setF('languages', newLangs);
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newLangs = form.languages.filter((_, i) => i !== idx);
                                setF('languages', newLangs);
                              }}
                              className="absolute top-2 right-2 bg-red-50 text-red-500 p-1.5 rounded-full hover:bg-red-100 transition-colors shadow-sm z-10"
                              title="Xóa ngôn ngữ"
                            >
                              <span className="material-icons text-base">close</span>
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setF('languages', [...form.languages, { name: '', level: '', certificate: '' }])} className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold text-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2 mt-2">
                          <span className="material-icons">add</span> Thêm ngôn ngữ khác
                        </button>
                        <p className="text-[10px] text-gray-400 mt-2 italic">* Bạn có thể thêm không giới hạn các chứng chỉ và ngôn ngữ khác nhau.</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Kỹ năng chuyên môn</label>
                      <p className="text-xs text-gray-500 mb-2">{NICHE_DETAILS[selectedMainNiche]?.skillHint || "Nhập kỹ năng và nhấn Enter để thêm (Vd: ReactJS, SEO, Python...)"}</p>
                      <div className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 min-h-[50px] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all bg-gray-50/50 flex flex-wrap gap-2">
                        {form.skills.map(s => (
                          <span key={s} className="bg-primary text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            {s}
                            <button onClick={() => toggleArr('skills', s)} className="hover:text-red-200">
                              <span className="material-icons text-xs">close</span>
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder="Thêm kỹ năng..."
                          className="bg-transparent outline-none text-sm flex-1 min-w-[100px]"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              if (!form.skills.includes(val)) {
                                toggleArr('skills', val);
                              }
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 5: SELF-DISCOVERY ── */}
            {activeTab === 5 && isFreelancer && (
              <div className="space-y-8 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-5">
                  <span className="material-icons" style={{ fontSize: '200px' }}>psychology_alt</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Khám Phá Nội Tâm (Self-Discovery)</h2>
                  <p className="text-gray-500 text-sm mt-1">Các doanh nghiệp hiện đại tìm kiếm người có tư duy phát triển chứ không chỉ mướn thợ.</p>
                </div>

                <div className="space-y-6 relative z-10">
                  <TextInput as="textarea" rows={4} label={NICHE_DETAILS[selectedMainNiche]?.careerGoalLabel || "Bạn muốn trở thành ai trong 3-5 năm tới?"} hint="Tầm nhìn của bạn giúp nhà tuyển dụng đánh giá năng lực đi đường dài." placeholder={NICHE_DETAILS[selectedMainNiche]?.careerGoalPlaceholder || "VD: Trở thành Art Director độc lập, sở hữu một studio cá nhân quy mô nhỏ."} value={form.careerGoals} onChange={e => setF('careerGoals', e.target.value)} />

                  <TextInput as="textarea" rows={4} label={NICHE_DETAILS[selectedMainNiche]?.mindsetLabel || "Niềm tin cốt lõi / Tư duy làm việc (Growth Mindset)"} hint="Ví dụ về đạo đức nghề nghiệp, cách bạn đối mặt với feedback chê bai." placeholder={NICHE_DETAILS[selectedMainNiche]?.mindsetPlaceholder || "VD: Sự hoàn hảo là kẻ thù của sự hoàn thành. Mình tin vào việc ship sản phẩm nhanh, nếm mùi feedback sớm để sửa cho chuẩn nhất."} value={form.coreBeliefs} onChange={e => setF('coreBeliefs', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── CLIENT TABS ── */}
            {!isFreelancer && (
              <div className="space-y-8 animate-fade-in">
                {activeTab === 1 ? (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Hồ sơ Của Bạn</h2>
                    </div>
                    <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="relative group cursor-pointer" onClick={() => !uploadingAvatar && avatarRef.current?.click()}>
                        {uploadingAvatar ? (
                          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <span className="material-icons animate-spin text-primary text-3xl">refresh</span>
                          </div>
                        ) : form.avatar ? (
                          <img src={form.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors">
                            <span className="material-icons text-gray-400 text-3xl">add_a_photo</span>
                          </div>
                        )}
                      </div>
                      <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Ảnh đại diện</h3>
                        <p className="text-xs text-gray-500">Logo công ty hoặc ảnh cá nhân</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <TextInput label="Họ tên người đại diện" value={form.name} onChange={e => setF('name', e.target.value)} />
                      <TextInput label="Chức vụ" placeholder="Vd: CEO, HR Manager" value={form.headline} onChange={e => setF('headline', e.target.value)} />
                    </div>
                    <hr className="border-gray-100 mt-6" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Vấn đề & Nỗi đau hiện tại</h3>
                      <div className="space-y-4">
                        <TextInput as="textarea" rows={3} label="Vấn đề bạn đang gặp phải là gì?" hint="Ví dụ: Website tải chậm ảnh hưởng chạy Ads, cần thiết kế lại UI/UX, hoặc thiếu nhân sự viết bài SEO." placeholder="Lợi ích rõ ràng giúp Freelancer dễ dàng hình dung công việc..." value={form.clientInfo?.problem || ''} onChange={e => setClientData('problem', e.target.value)} />
                        <TextInput as="textarea" rows={3} label="Kết quả mong đợi (Expected Result)" hint="Bạn muốn đạt được điều gì sau khi thuê Freelancer? (VD: Tăng 20% doanh thu, có 10 video Tiktok mượt mà)" value={form.clientInfo?.expectedResult || ''} onChange={e => setClientData('expectedResult', e.target.value)} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900">Chi tiết Dự án & Doanh nghiệp</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <TextInput label="Tên công ty / Tổ chức" value={form.company} onChange={e => setF('company', e.target.value)} />
                      <TextInput label="Lĩnh vực cốt lõi" placeholder="VD: Bất động sản, E-commerce..." value={form.industry} onChange={e => setF('industry', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <TextInput label="Vị trí trụ sở" placeholder="VD: TP. Hồ Chí Minh" value={form.location} onChange={e => setF('location', e.target.value)} />
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Quy mô nhân sự</label>
                        <select value={form.companySize} onChange={e => setF('companySize', e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50/50 hover:bg-white focus:bg-white outline-none">
                          <option value="">Chọn quy mô</option>
                          <option value="1-10">1-10 nhân viên</option>
                          <option value="11-50">11-50 nhân viên</option>
                          <option value="51-200">51-200 nhân viên</option>
                          <option value="201-500">201-500 nhân viên</option>
                          <option value="500+">Trên 500 nhân viên</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 mt-4 pt-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Hình thức thanh toán</label>
                        <select value={form.clientInfo?.paymentType || 'fixed'} onChange={e => setClientData('paymentType', e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50/50 hover:bg-white focus:bg-white outline-none">
                          <option value="fixed">Trả trọn gói (Fixed)</option>
                          <option value="hourly">Trả theo giờ (Hourly)</option>
                        </select>
                      </div>
                      <TextInput label="Ngân sách dự kiến" placeholder="VD: 5-10 triệu VNĐ, hoặc 200,000đ/giờ" value={form.clientInfo?.budgetRange || ''} onChange={e => setClientData('budgetRange', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Mức độ cập nhật báo cáo</label>
                        <select value={form.clientInfo?.updateFrequency || 'weekly'} onChange={e => setClientData('updateFrequency', e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50/50 hover:bg-white focus:bg-white outline-none">
                          <option value="daily">Hàng ngày (Daily)</option>
                          <option value="weekly">Hàng tuần (Weekly)</option>
                          <option value="monthly">Hàng tháng (Monthly)</option>
                        </select>
                      </div>
                      <TextInput label="Thời lượng dự án" placeholder="VD: 1 tháng, Dài hạn..." value={form.clientInfo?.duration || ''} onChange={e => setClientData('duration', e.target.value)} />
                    </div>

                    <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <input type="checkbox" id="reqMeet" checked={form.clientInfo?.meetingWillingness || false} onChange={e => setClientData('meetingWillingness', e.target.checked)} className="w-5 h-5 mt-0.5 accent-primary cursor-pointer rounded" />
                      <div>
                        <label htmlFor="reqMeet" className="text-sm text-gray-800 font-semibold cursor-pointer block">Tôi sẵn sàng tham gia họp Video (Google Meet) để trao đổi chi tiết.</label>
                        <p className="text-xs text-gray-500 mt-1">Hành động này giúp tăng 80% độ tin cậy và thu hút các Freelancer chất lượng cao.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── NAVIGATION BUTTONS ── */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setActiveTab(p => Math.max(1, p - 1))}
                disabled={activeTab === 1}
                className="px-6 py-2.5 rounded-full font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-0 transition-opacity"
              >
                Quay lại
              </button>

              {activeTab < (isFreelancer ? 5 : 2) ? (
                <button
                  onClick={() => setActiveTab(p => p + 1)}
                  className="px-6 py-2.5 rounded-full font-semibold text-white bg-gray-900 hover:bg-black transition-colors flex items-center gap-2"
                >
                  Tiếp tục bước {activeTab + 1} <span className="material-icons text-sm">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-2.5 rounded-full font-bold text-white bg-primary hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30 flex items-center gap-2 animate-pulse"
                >
                  <span className="material-icons text-sm">rocket_launch</span> XUẤT BẢN HỒ SƠ
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── STATUS MODAL ── */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 shadow-sm ${showStatusModal === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
              <span className="material-icons text-5xl">
                {showStatusModal === 'success' ? 'check_circle' : 'error'}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
              {showStatusModal === 'success' ? 'Thành công!' : 'Thất bại'}
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm">
              {showStatusModal === 'success'
                ? 'Hồ sơ của bạn đã được cập nhật thành công và sẵn sàng để xuất bản.'
                : error || 'Đã có lỗi xảy ra trong quá trình lưu hồ sơ. Vui lòng thử lại.'
              }
            </p>

            <div className="flex flex-col gap-3">
              {showStatusModal === 'success' ? (
                <>
                  <button
                    onClick={() => navigate(`/profile/${user?._id}`)}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-icons text-lg">visibility</span> Xem hồ sơ
                  </button>
                  <button
                    onClick={() => setShowStatusModal(null)}
                    className="w-full py-4 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                  >
                    Tiếp tục chỉnh sửa
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowStatusModal(null)}
                  className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg"
                >
                  Thử lại
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
