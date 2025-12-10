import React, { useState, useEffect } from 'react';
import { generateMarketingMessage, searchMarketTrends } from '../services/geminiService';
import { Student, SearchResult, PaymentReceipt } from '../types';
import { Users, Send, Sparkles, Search, CheckCircle, Clock, Calendar, History, Megaphone, FileText, Download, XCircle, Eye, BookOpen, PlusCircle, Bell, UserX } from 'lucide-react';
import { supabase } from '../services/supabase';

const Admin: React.FC = () => {
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Announcement State
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Veliler');
  const [notificationType, setNotificationType] = useState<'general' | 'homework' | 'meeting'>('general');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([
      {id:1, subject: "Veli Toplantısı", audience: "Veliler", date: "2023-10-20", status: "sent"}
  ]);

  // Market Research State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ text: string, sources: SearchResult[] } | null>(null);

  // Activity & Schedule
  const [activityName, setActivityName] = useState('');
  const [activityCost, setActivityCost] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [scheduleClass, setScheduleClass] = useState('5-B');
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);

  useEffect(() => {
      fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
      setLoading(true);
      try {
          // Fetch Students with Financials
          const { data: studentData, error: sError } = await supabase
              .from('students')
              .select(`
                *,
                financial_records(*)
              `);

          if (studentData) {
              const mappedStudents: Student[] = studentData.map((s: any) => ({
                  id: s.id,
                  name: `${s.name} ${s.surname}`,
                  grade: s.full_class || `${s.grade_level}-${s.branch}`,
                  gender: s.gender,
                  parentName: s.parent_name,
                  phone: s.phone,
                  receipts: [],
                  financials: s.financial_records?.[0] ? {
                      tuitionFee: s.financial_records[0].tuition_fee,
                      materialFee: s.financial_records[0].material_fee,
                      paidAmount: s.financial_records[0].paid_amount,
                      totalDebt: s.financial_records[0].tuition_fee + s.financial_records[0].material_fee,
                      remainingDebt: (s.financial_records[0].tuition_fee + s.financial_records[0].material_fee) - s.financial_records[0].paid_amount
                  } : { tuitionFee:0, materialFee:0, totalDebt:0, paidAmount:0, remainingDebt:0 }
              }));
              setStudents(mappedStudents);
          }

          // Fetch Pending Receipts
          const { data: receiptData } = await supabase
             .from('receipts')
             .select('*, students(name, surname)')
             .eq('status', 'pending');
          
          if (receiptData) {
              const mappedReceipts: PaymentReceipt[] = receiptData.map((r: any) => ({
                  id: r.id,
                  date: r.date,
                  amount: r.amount,
                  description: r.description,
                  status: r.status,
                  fileUrl: r.file_url,
                  studentName: `${r.students?.name} ${r.students?.surname}`
              }));
              setPendingReceipts(mappedReceipts);
          }

      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  // Handlers
  const handleReceiptAction = async (id: number, action: 'approve' | 'reject') => {
      try {
        const { error } = await supabase
            .from('receipts')
            .update({ status: action === 'approve' ? 'approved' : 'rejected' })
            .eq('id', id);
        
        if (!error) {
            setPendingReceipts(prev => prev.filter(r => r.id !== id));
            // If approved, update financial record
            if (action === 'approve') {
                // In a real app, you'd fetch the receipt to get amount and student_id, then increment paid_amount
                // For now, reload data
                fetchAdminData();
            }
            alert(`Dekont ${action === 'approve' ? 'onaylandı' : 'reddedildi'}.`);
        }
      } catch (e) {
          console.error(e);
      }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    const contextPrefix = notificationType === 'homework' ? 'Ödev Duyurusu: ' : notificationType === 'meeting' ? 'Veli Toplantısı: ' : '';
    const template = await generateMarketingMessage(contextPrefix + topic, audience);
    setSubject(template.subject);
    setBody(template.body);
    setIsGenerating(false);
  };

  const handleProcessAnnouncement = (type: 'send' | 'schedule') => {
    setIsSending(true);
    setTimeout(() => {
      const newAnn = {
        id: Date.now(),
        subject: subject,
        audience: audience,
        date: type === 'schedule' && scheduledDate ? new Date(scheduledDate).toLocaleString() : new Date().toLocaleString(),
        status: type === 'schedule' ? 'scheduled' : 'sent'
      };
      setAnnouncements([newAnn, ...announcements]);
      
      // Simulating SMS Logic
      if (type === 'send') {
          let smsMessage = "";
          if (notificationType === 'homework') {
              smsMessage = `ÖDEV BİLGİLENDİRME: ${subject} konulu ödev verilmiştir. Detaylar sistemde.`;
          } else if (notificationType === 'meeting') {
              smsMessage = `TOPLANTI HATIRLATMA: ${subject}. Katılımınızı bekleriz.`;
          }
          
          if (smsMessage) {
              alert(`Sistemdeki ${students.length} veliye SMS gönderildi:\n"${smsMessage}"`);
          }
      }

      setIsSending(false);
    }, 1000);
  };

  const handleMarkAbsent = (studentName: string, phone: string) => {
    if (confirm(`${studentName} isimli öğrenci YOK yazılacak ve velisine (${phone}) SMS gönderilecek. Onaylıyor musunuz?`)) {
        // Simulate SMS API Call
        setTimeout(() => {
            alert(`SMS İLETİLDİ:\nSayın Veli, öğrencimiz ${studentName} bugün ilk derse katılmamıştır. Bilginize.`);
        }, 500);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    const result = await searchMarketTrends(searchQuery);
    setSearchResult(result);
    setIsSearching(false);
  };

  const handleAddActivity = () => {
    if(!activityName || !activityCost) return;
    alert(`"${activityName}" faaliyeti için kişi başı ₺${activityCost} tüm ilgili öğrencilerin borcuna eklendi.`);
    setActivityName('');
    setActivityCost('');
    setActivityDate('');
  };

  const handleUploadSchedule = () => {
      if(!scheduleFile) return;
      alert(`${scheduleClass} sınıfı için ders programı başarıyla güncellendi.`);
      setScheduleFile(null);
  };

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Okul Yönetim Paneli</h2>
          <p className="mt-1 text-sm text-gray-500">Müdür ve Muhasebe Yetkilisi Görünümü</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
             <div className="text-right">
                 <p className="text-xs text-gray-500 uppercase">Toplam Tahsilat</p>
                 <p className="text-lg font-bold text-green-600">
                     ₺{students.reduce((acc, s) => acc + (s.financials.paidAmount || 0), 0).toLocaleString()}
                 </p>
             </div>
             <div className="text-right border-l pl-4 border-gray-200">
                 <p className="text-xs text-gray-500 uppercase">Bekleyen Alacak</p>
                 <p className="text-lg font-bold text-orange-600">
                     ₺{students.reduce((acc, s) => acc + (s.financials.remainingDebt || 0), 0).toLocaleString()}
                 </p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Students & Receipts (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Pending Receipts (Priority) */}
          {pendingReceipts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border border-orange-200 overflow-hidden">
                <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">Bekleyen Dekont Onayları ({pendingReceipts.length})</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {pendingReceipts.map(receipt => (
                        <div key={receipt.id} className="p-4 flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-900">{receipt.studentName}</h4>
                                <p className="text-sm text-gray-500">{receipt.description} - {receipt.date}</p>
                                <p className="text-sm font-bold text-gray-900 mt-1">₺{receipt.amount.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-500 hover:text-blue-600 border rounded-full" title="Dekontu Görüntüle">
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleReceiptAction(receipt.id, 'reject')} className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-200">
                                    Reddet
                                </button>
                                <button onClick={() => handleReceiptAction(receipt.id, 'approve')} className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md border border-green-200">
                                    Onayla
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
          )}

          {/* Student List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                Öğrenci & Yoklama Listesi
              </h3>
              <button className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                  <Download className="w-4 h-4" /> Excel İndir
              </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Öğrenci / Veli</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sınıf</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Finansal Durum</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Yoklama (SMS)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                    <div className="text-xs text-gray-500">{student.parentName}</div>
                                    <div className="text-[10px] text-gray-400 mt-1">{student.phone}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{student.grade}</td>
                                <td className="px-6 py-4">
                                    {student.financials.remainingDebt <= 0 ? (
                                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Borçsuz</span>
                                    ) : (
                                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                            Kalan: ₺{student.financials.remainingDebt.toLocaleString()}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleMarkAbsent(student.name, student.phone)}
                                        className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none"
                                        title={`${student.phone} nolu telefona SMS gönderir`}
                                    >
                                        <UserX className="w-4 h-4 mr-1" />
                                        Yok Yaz
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
          
           {/* Announcement Creator */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-indigo-50 flex justify-between items-center">
              <h3 className="text-lg font-medium text-indigo-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                Duyuru, Ödev & SMS Bildirimi
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                        <label className="block text-sm font-medium text-gray-700">Bildirim Tipi</label>
                        <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                            value={notificationType} onChange={e => setNotificationType(e.target.value as any)}>
                            <option value="general">Genel Duyuru</option>
                            <option value="homework">Ödev Bildirimi</option>
                            <option value="meeting">Veli Toplantısı</option>
                        </select>
                   </div>
                   <div>
                        <label className="block text-sm font-medium text-gray-700">Kime</label>
                        <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                            value={audience} onChange={e => setAudience(e.target.value)}>
                            <option>Tüm Veliler</option>
                            <option>5. Sınıf Velileri</option>
                            <option>8. Sınıf Velileri</option>
                            <option>Öğretmenler</option>
                        </select>
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-700">AI Yardım</label>
                       <div className="flex gap-2 mt-1">
                           <input type="text" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                placeholder={notificationType === 'homework' ? "Matematik Çarpanlar" : "Konu başlığı"} 
                                value={topic} onChange={e => setTopic(e.target.value)} />
                           <button onClick={handleGenerate} className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                               {isGenerating ? "..." : <Sparkles className="w-4 h-4"/>}
                           </button>
                       </div>
                   </div>
               </div>
               
               <div className="relative">
                   <textarea rows={3} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                        placeholder="Mesaj içeriği..." value={body} onChange={e => setBody(e.target.value)} />
                   {notificationType !== 'general' && (
                       <span className="absolute bottom-2 right-2 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
                           <Bell className="w-3 h-3" /> SMS olarak iletilecek
                       </span>
                   )}
               </div>

               <div className="flex justify-end">
                   <button onClick={() => handleProcessAnnouncement('send')} disabled={isSending || !body} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2">
                       {isSending ? "Gönderiliyor..." : (
                           <>
                             <Send className="w-4 h-4" />
                             {notificationType === 'general' ? 'Yayınla' : 'SMS ve Bildirim Gönder'}
                           </>
                       )}
                   </button>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tools & History (1/3 width) */}
        <div className="xl:col-span-1 space-y-8">
            
            {/* Academic & Activity Management */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-purple-50">
                    <h3 className="text-md font-semibold text-purple-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        Akademik & Sosyal Yönetim
                    </h3>
                </div>
                
                <div className="p-4 space-y-6">
                    {/* Schedule Upload */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Ders Programı Yükle</h4>
                        <div className="flex gap-2 mb-2">
                            <select 
                                value={scheduleClass}
                                onChange={(e) => setScheduleClass(e.target.value)}
                                className="block w-1/3 border border-gray-300 rounded-md shadow-sm text-sm p-2"
                            >
                                <option>5-B</option>
                                <option>8-A</option>
                                <option>12-C</option>
                            </select>
                            <label className="flex-1 cursor-pointer bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center px-3">
                                <span className="truncate">{scheduleFile ? scheduleFile.name : 'Dosya Seç (PDF)'}</span>
                                <input type="file" className="sr-only" accept=".pdf" onChange={(e) => e.target.files && setScheduleFile(e.target.files[0])} />
                            </label>
                        </div>
                        <button 
                            onClick={handleUploadSchedule}
                            disabled={!scheduleFile}
                            className="w-full bg-purple-600 text-white text-sm py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-300"
                        >
                            Programı Güncelle
                        </button>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* Activity Fee Add */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Faaliyet Ücreti Ekle</h4>
                        <div className="space-y-2">
                             <input 
                                type="text" 
                                placeholder="Faaliyet Adı (Örn: Müze Gezisi)" 
                                value={activityName}
                                onChange={(e) => setActivityName(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm text-sm p-2"
                             />
                             <div className="flex gap-2">
                                <input 
                                    type="date" 
                                    value={activityDate}
                                    onChange={(e) => setActivityDate(e.target.value)}
                                    className="block w-1/2 border border-gray-300 rounded-md shadow-sm text-sm p-2"
                                />
                                <div className="relative w-1/2">
                                    <input 
                                        type="number" 
                                        placeholder="Tutar" 
                                        value={activityCost}
                                        onChange={(e) => setActivityCost(e.target.value)}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm text-sm p-2 pl-6"
                                    />
                                    <span className="absolute left-2 top-2 text-gray-500 text-sm">₺</span>
                                </div>
                             </div>
                             <button 
                                onClick={handleAddActivity}
                                className="w-full bg-orange-600 text-white text-sm py-2 rounded-md hover:bg-orange-700 flex items-center justify-center gap-2"
                             >
                                <PlusCircle className="w-4 h-4" />
                                Öğrenci Borçlarına Yansıt
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Market/Regulation Research */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-blue-50 flex justify-between items-center">
                <h3 className="text-md font-medium text-blue-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Mevzuat & Yönetmelik
                </h3>
            </div>

            <div className="p-6 space-y-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Örn: Servis ücretleri 2024"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                    type="submit"
                    disabled={isSearching}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                    {isSearching ? '...' : <Search className="w-4 h-4" />}
                </button>
                </form>

                {searchResult && (
                <div className="bg-gray-50 rounded-lg p-3 mt-4 border border-gray-100">
                    <div className="text-xs text-gray-800 mb-2 whitespace-pre-wrap">
                    {searchResult.text.substring(0, 300)}...
                    </div>
                </div>
                )}
            </div>
          </div>

          {/* Announcement History */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                        <History className="w-4 h-4 text-gray-500" />
                        Son Duyurular
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {announcements.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                                    item.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                    {item.status === 'sent' ? 'İletildi' : 'Planlandı'}
                                </span>
                                <span className="text-xs text-gray-400">{item.date}</span>
                            </div>
                            <h4 className="text-sm font-medium text-gray-900">{item.subject}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{item.audience}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Admin;