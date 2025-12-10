import React, { useState } from 'react';
import { FinancialRecord, PaymentReceipt, WeeklySchedule, SchoolActivity } from '../types';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Calendar, BookOpen, Wallet, Activity } from 'lucide-react';

// Mock Data
const MOCK_FINANCIALS: FinancialRecord = {
  tuitionFee: 150000,
  materialFee: 35000,
  totalDebt: 185000,
  paidAmount: 90000,
  remainingDebt: 95000
};

const MOCK_RECEIPTS: PaymentReceipt[] = [
  { id: 1, date: "2023-09-15", amount: 45000, description: "Eylül Taksiti", status: "approved", fileUrl: "#" },
  { id: 2, date: "2023-10-15", amount: 45000, description: "Ekim Taksiti", status: "approved", fileUrl: "#" },
  { id: 3, date: "2023-11-15", amount: 0, description: "Dekont İnceleniyor...", status: "pending", fileUrl: "#" }
];

const MOCK_SCHEDULE: WeeklySchedule[] = [
  { day: "Pazartesi", lessons: ["Matematik", "Matematik", "Türkçe", "Fen Bilimleri", "İngilizce", "Beden Eğitimi"] },
  { day: "Salı", lessons: ["Sosyal Bilgiler", "Türkçe", "Türkçe", "Matematik", "Görsel Sanatlar", "Müzik"] },
  { day: "Çarşamba", lessons: ["Fen Bilimleri", "Fen Bilimleri", "İngilizce", "İngilizce", "Matematik", "Rehberlik"] },
  { day: "Perşembe", lessons: ["Türkçe", "Türkçe", "Sosyal Bilgiler", "Din Kültürü", "Bilişim Tek.", "Bilişim Tek."] },
  { day: "Cuma", lessons: ["Matematik", "Fen Bilimleri", "İngilizce", "Beden Eğitimi", "Beden Eğitimi", "Kulüp Saati"] },
];

const MOCK_ACTIVITIES: SchoolActivity[] = [
  { id: 1, title: "Uzay Müzesi Gezisi", date: "2023-11-20", cost: 350, description: "Ulaşım ve giriş ücreti dahildir." },
  { id: 2, title: "Dönem Sonu Tiyatro Gösterisi", date: "2023-12-15", cost: 150, description: "Okul konferans salonunda özel tiyatro grubu." },
  { id: 3, title: "Kodlama Atölyesi Materyalleri", date: "2023-10-05", cost: 750, description: "Arduino seti ve elektronik bileşenler." }
];

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'finance' | 'schedule' | 'activities'>('finance');
  const [financials] = useState<FinancialRecord>(MOCK_FINANCIALS);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(MOCK_RECEIPTS);
  
  // Upload Form State
  const [uploadAmount, setUploadAmount] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadAmount) return;

    setIsUploading(true);
    
    // Simulate API upload
    setTimeout(() => {
      const newReceipt: PaymentReceipt = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(uploadAmount),
        description: uploadDesc || "Yeni Ödeme",
        status: "pending",
        fileUrl: "#"
      };

      setReceipts([newReceipt, ...receipts]);
      setIsUploading(false);
      setUploadSuccess(true);
      
      // Reset
      setUploadAmount('');
      setUploadDesc('');
      setUploadFile(null);
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1500);
  };

  const paymentPercentage = Math.round((financials.paidAmount / financials.totalDebt) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Merhaba, Sayın Veli</h1>
          <p className="text-blue-100 opacity-90">
            Öğrenciniz <strong>Ali Yılmaz (5-B)</strong> için yönetim paneli.
          </p>
        </div>
        <div className="flex bg-indigo-950/30 p-1 rounded-lg">
          <button onClick={() => setActiveTab('finance')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'finance' ? 'bg-white text-indigo-900 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}>
            <Wallet className="w-4 h-4" /> Finans
          </button>
          <button onClick={() => setActiveTab('schedule')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-white text-indigo-900 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}>
            <Calendar className="w-4 h-4" /> Ders Programı
          </button>
          <button onClick={() => setActiveTab('activities')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'activities' ? 'bg-white text-indigo-900 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}>
            <Activity className="w-4 h-4" /> Faaliyetler
          </button>
        </div>
      </div>

      {/* FINANCE TAB */}
      {activeTab === 'finance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Toplam Yıllık Borç</h3>
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">₺{financials.totalDebt.toLocaleString()}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Eğitim: ₺{financials.tuitionFee.toLocaleString()} <br/>
                  Araç-Gereç: ₺{financials.materialFee.toLocaleString()}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Ödenen Tutar</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">₺{financials.paidAmount.toLocaleString()}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${paymentPercentage}%` }}></div>
                </div>
                <p className="text-xs text-green-600 mt-1">%{paymentPercentage} Tamamlandı</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Kalan Bakiye</h3>
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-orange-600">₺{financials.remainingDebt.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-2">Son ödeme tarihi: 15.11.2023</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                 <h3 className="text-lg font-semibold text-gray-900">Ödeme Geçmişi ve Dekontlar</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {receipts.map((receipt) => (
                       <tr key={receipt.id}>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{receipt.date}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.description}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                           ₺{receipt.amount > 0 ? receipt.amount.toLocaleString() : '-'}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           {receipt.status === 'approved' && (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                               <CheckCircle className="w-3 h-3 mr-1" /> Onaylandı
                             </span>
                           )}
                           {receipt.status === 'pending' && (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                               <Clock className="w-3 h-3 mr-1" /> İnceleniyor
                             </span>
                           )}
                           {receipt.status === 'rejected' && (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                               <AlertCircle className="w-3 h-3 mr-1" /> Reddedildi
                             </span>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden sticky top-24">
              <div className="bg-indigo-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Ödeme Bildirimi Yap
                </h3>
              </div>
              
              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                  <p className="text-xs text-blue-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    Lütfen ödemeyi banka üzerinden yaptıktan sonra dekontunuzu buraya yükleyiniz. Dekontunuz muhasebe tarafından onaylandığında borcunuz güncellenecektir.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ödenen Tutar (TL)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₺</span>
                    </div>
                    <input
                      type="number"
                      required
                      value={uploadAmount}
                      onChange={(e) => setUploadAmount(e.target.value)}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <input
                    type="text"
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                    placeholder="Örn: Kasım Taksiti - Öğrenci TC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dekont Dosyası (PDF/JPG)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                          <span>Dosya Seç</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.jpg,.png" required />
                        </label>
                        <p className="pl-1">veya sürükleyin</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF (Max 5MB)</p>
                      {uploadFile && (
                          <p className="text-sm text-green-600 font-semibold mt-2">{uploadFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${uploadSuccess ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 transition-all`}
                >
                  {isUploading ? 'Yükleniyor...' : uploadSuccess ? 'Gönderildi!' : 'Dekontu Gönder'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-100 bg-indigo-50 flex justify-between items-center">
             <div>
                <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Haftalık Ders Programı (5-B)
                </h3>
                <p className="text-sm text-indigo-700">2023-2024 Eğitim Öğretim Yılı 1. Dönem</p>
             </div>
             <button className="text-sm text-indigo-600 hover:underline">PDF İndir</button>
          </div>
          <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gün</th>
                   {[1, 2, 3, 4, 5, 6].map(i => (
                     <th key={i} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{i}. Ders</th>
                   ))}
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {MOCK_SCHEDULE.map((day, idx) => (
                   <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 bg-gray-100">{day.day}</td>
                     {day.lessons.map((lesson, lessonIdx) => (
                       <td key={lessonIdx} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 hover:bg-indigo-50 transition-colors">
                         {lesson}
                       </td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* ACTIVITIES TAB */}
      {activeTab === 'activities' && (
        <div className="space-y-6 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {MOCK_ACTIVITIES.map((activity) => (
               <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group">
                 <div className="h-32 bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <Activity className="w-12 h-12 text-indigo-400" />
                 </div>
                 <div className="p-6">
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 line-clamp-2">{activity.title}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" /> {new Date(activity.date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-800">
                        ₺{activity.cost}
                      </span>
                   </div>
                   <p className="mt-4 text-sm text-gray-600">
                     {activity.description}
                   </p>
                   <div className="mt-6 pt-4 border-t border-gray-100">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-gray-500">Durum:</span>
                       <span className="text-indigo-600 font-medium">Finans Tablosuna Eklendi</span>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
           
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
             <div>
               <h4 className="text-sm font-bold text-blue-900">Bilgilendirme</h4>
               <p className="text-sm text-blue-800 mt-1">
                 Listelenen faaliyet ücretleri, etkinlik tarihinden önce "Finans" sekmesindeki toplam borcunuza "Araç-Gereç ve Sosyal Giderler" kalemi altında otomatik olarak yansıtılmaktadır. Ekstra bir ödeme bildirimi yapmanıza gerek yoktur, normal taksit ödemelerinizden düşülür.
               </p>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Home;