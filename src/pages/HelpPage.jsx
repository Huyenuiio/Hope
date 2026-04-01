import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Logo from '../components/Logo';

export default function HelpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const faqs = [
    {
      q: "Làm thế nào để thay đổi vai trò người dùng?",
      a: "Bạn có thể vào trang 'Chỉnh sửa hồ sơ' từ menu 'Tôi' và chọn nút 'Chuyển sang vai trò...' ở phía dưới thông tin cá nhân."
    },
    {
      q: "Làm sao để ứng tuyển công việc?",
      a: "Hãy truy cập trang 'Việc làm', tìm kiếm công việc phù hợp và nhấn nút 'Ứng tuyển ngay'. Nếu bạn chưa đăng nhập, hệ thống sẽ yêu cầu bạn đăng nhập bằng Google."
    },
    {
      q: "Làm thế nào để đăng tin tuyển dụng?",
      a: "Bạn cần có vai trò 'Nhà tuyển dụng'. Sau đó, truy cập 'Bảng điều khiển' và nhấn nút 'Đăng bản tin mới'."
    },
    {
      q: "Tôi có thể liên hệ hỗ trợ như thế nào?",
      a: "Gửi email trực tiếp cho chúng tôi tại support@hope.com hoặc sử dụng tính năng nhắn tin để liên hệ với các Quản trị viên."
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Navbar activeNav="none" />

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-16">
          <Logo size="xl" link={false} className="justify-center mb-6" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Chúng tôi có thể giúp gì cho bạn?</h1>
          <p className="text-lg text-gray-600">Tìm kiếm câu trả lời nhanh chóng hoặc liên hệ với đội ngũ hỗ trợ.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <span className="material-icons text-primary text-4xl mb-4">help_outline</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Trung tâm trợ giúp</h2>
            <p className="text-gray-600 mb-4">Tìm hiểu các hướng dẫn sử dụng và mẹo để tối ưu hóa hồ sơ của bạn trên Hope.</p>
            <button className="text-primary font-bold hover:underline">Xem tài liệu →</button>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <span className="material-icons text-primary text-4xl mb-4">security</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">An toàn & Bảo mật</h2>
            <p className="text-gray-600 mb-4">Báo cáo các hành vi vi phạm hoặc tìm hiểu cách chúng tôi bảo vệ dữ liệu của bạn.</p>
            <button className="text-primary font-bold hover:underline">Báo cáo sự cố →</button>
          </div>
        </div>

        <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <span className="material-icons text-primary">quiz</span> Câu hỏi thường gặp
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="pb-6 border-b border-gray-100 last:border-0">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-20 text-center bg-primary/5 rounded-3xl p-10 border border-primary/10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vẫn cần sự giúp đỡ?</h2>
          <p className="text-gray-600 mb-8">Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-3 bg-primary text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all">
              Chat với hỗ trợ
            </button>
            <button className="px-8 py-3 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary/5 transition-all">
              Gửi Email
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
