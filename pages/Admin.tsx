import React, { useState, useEffect } from 'react';
import { generateMarketingMessage, searchMarketTrends } from '../services/geminiService';
import { Student, SearchResult, PaymentReceipt } from '../types';
import { Users, Send, Sparkles, Search, CheckCircle, Clock, Calendar, History, Megaphone, FileText, Download, XCircle, Eye, BookOpen, PlusCircle, Bell, UserX, Filter, Target, MessageSquare, User, Smartphone, Database, Printer } from 'lucide-react';
import { supabase } from '../services/supabase';

const Admin: React.FC = () => {
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filterClass, setFilterClass] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterFinancial, setFilterFinancial] = useState('all');

  // Announcement / SMS State
  const [senderTitle, setSenderTitle] = useState('OKUL_YONETIM'); // Registered Sender ID
  const [smsMode, setSmsMode] = useState<'class' | 'student'>('class'); // Target Mode
  const [smsTargetClass, setSmsTargetClass] = useState('all');
  const [smsStudentSearch, setSmsStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [topic, setTopic] = useState('');
  const [notificationType, setNotificationType] = useState<'general' | 'homework' | 'meeting'>('general');
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
  const [activityTarget, setActivityTarget] = useState('all');
  const [activityDate, setActivityDate] = useState('');
  const [scheduleClass, setScheduleClass] = useState('11-D');
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
              const mappedStudents: Student[] = studentData.map((s: any) => {
                  let financials = s.financial_records?.[0] ? {
                      tuitionFee: s.financial_records[0].tuition_fee,
                      materialFee: s.financial_records[0].material_fee,
                      paidAmount: s.financial_records[0].paid_amount,
                      totalDebt: s.financial_records[0].tuition_fee + s.financial_records[0].material_fee,
                      remainingDebt: (s.financial_records[0].tuition_fee + s.financial_records[0].material_fee) - s.financial_records[0].paid_amount
                  } : { tuitionFee:0, materialFee:0, totalDebt:0, paidAmount:0, remainingDebt:0 };
                  
                  // Manual override for Student 123 as requested
                  if (s.id === 123) {
                      financials = {
                          tuitionFee: 12000,
                          materialFee: 3000,
                          totalDebt: 15000,
                          paidAmount: 5000,
                          remainingDebt: 10000 // Total 15000 - Paid 5000
                      };
                  }

                  return {
                    id: s.id,
                    schoolNo: s.school_no || '---', // Map School No
                    name: `${s.name} ${s.surname}`,
                    grade: s.full_class || `${s.grade_level}-${s.branch}`,
                    gender: s.gender,
                    parentName: s.parent_name,
                    phone: s.phone,
                    receipts: [],
                    financials: financials
                  };
              });
              
              // Sort by School No
              mappedStudents.sort((a, b) => parseInt(a.schoolNo) - parseInt(b.schoolNo));
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

  // --- NEW: Seed Data for 9-A ---
  const handleSeedData = async () => {
      // Data extracted from the image provided
      const CLASS_9A_DATA = [
          { no: '1108', name: 'KEREM', surname: 'ÜSTÜN', gender: 'male' },
          { no: '1143', name: 'HASAN REİS', surname: 'BAYTAR', gender: 'male' },
          { no: '1181', name: 'AHMET EFE', surname: 'BELLİ', gender: 'male' },
          { no: '1219', name: 'EFLİN', surname: 'DÜZENLİ', gender: 'female' },
          { no: '1258', name: 'İREM', surname: 'GÜNEŞ', gender: 'female' },
          { no: '1279', name: 'BERİVAN', surname: 'SEVİPTEKİN', gender: 'female' },
          { no: '1292', name: 'SAMET', surname: 'ÇETİZ', gender: 'male' },
          { no: '1313', name: 'BERAT', surname: 'PİŞGİN', gender: 'male' },
          { no: '1344', name: 'SEHER', surname: 'ÇAPOĞLU', gender: 'female' },
          { no: '1363', name: 'MUHAMMED EMİN', surname: 'ALMAS', gender: 'male' },
          { no: '1386', name: 'ENES', surname: 'KODAK', gender: 'male' },
          { no: '1390', name: 'YASİN', surname: 'KÖROĞLU', gender: 'male' },
          { no: '1402', name: 'MİKAİL', surname: 'VURAL', gender: 'male' },
          { no: '1441', name: 'YUSUF EMİN', surname: 'KOÇYİĞİT', gender: 'male' },
          { no: '1478', name: 'RİFAT', surname: 'ATASAYAR', gender: 'male' },
      ];

      const parentNamesM = ['Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hüseyin', 'İbrahim', 'Murat', 'Osman', 'Yusuf', 'Halil'];
      const parentNamesF = ['Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Sultan', 'Meryem', 'Esra', 'Zehra'];

      if (!confirm(`Özel 9-A Sınıf Listesinden ${CLASS_9A_DATA.length} öğrenci sisteme eklenecek.\n\nT.C. numaraları ve Veli isimleri otomatik oluşturulacaktır.\nOnaylıyor musunuz?`)) return;
      
      setLoading(true);
      try {
          let addedCount = 0;
          for (const s of CLASS_9A_DATA) {
              // Check duplicate by School No
              const { data: existing } = await supabase.from('students').select('id').eq('school_no', s.no).single();
              if (existing) continue;

              // Randomize Parent Gender (~35% chance for female parent)
              const isParentFemale = Math.random() > 0.65; 
              const pName = isParentFemale 
                  ? parentNamesF[Math.floor(Math.random() * parentNamesF.length)] 
                  : parentNamesM[Math.floor(Math.random() * parentNamesM.length)];
              
              // Generate Random TC (11 digits)
              const tc = Math.floor(10000000000 + Math.random() * 89999999999).toString();
              // Generate Random Phone
              const phone = '05' + Math.floor(300000000 + Math.random() * 299999999).toString();

              const { data: student } = await supabase.from('students').insert({
                  school_no: s.no,
                  name: s.name,
                  surname: s.surname,
                  gender: s.gender,
                  grade_level: '9',
                  branch: 'A',
                  full_class: '9-A',
                  parent_name: `${pName} ${s.surname}`,
                  phone: phone,
                  tc_no: tc
              }).select().single();

              if (student) {
                   // Initial Financials for 9th Grade
                   await supabase.from('financial_records').insert({
                        student_id: student.id,
                        tuition_fee: 140000, 
                        material_fee: 35000,
                        paid_amount: 0
                   });
                   addedCount++;
              }
          }
          alert(`İşlem Tamamlandı: ${addedCount} yeni öğrenci 9-A sınıfına eklendi.`);
          fetchAdminData();
      } catch (e) {
          console.error(e);
          alert("Veri yüklenirken hata oluştu.");
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
            if (action === 'approve') {
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
    // Audience description based on selection
    const audienceDesc = smsMode === 'student' && selectedStudent 
        ? `${selectedStudent.name} isimli öğrencinin velisi` 
        : smsTargetClass === 'all' ? 'Tüm Veliler' : `${smsTargetClass} sınıfı velileri`;

    const template = await generateMarketingMessage(contextPrefix + topic, audienceDesc);
    // setSubject(template.subject); // Subject usually fixed for SMS, mostly Body matters
    setBody(template.body);
    setIsGenerating(false);
  };

  const handleProcessAnnouncement = (type: 'send' | 'schedule') => {
    setIsSending(true);
    
    // Determine recipient count and description
    let recipientCount = 0;
    let recipientDesc = "";

    if (smsMode === 'class') {
        if (smsTargetClass === 'all') {
            recipientCount = students.length;
            recipientDesc = "Tüm Okul";
        } else {
            recipientCount = students.filter(s => s.grade === smsTargetClass).length;
            recipientDesc = `${smsTargetClass} Sınıfı`;
        }
    } else {
        if (selectedStudent) {
            recipientCount = 1;
            recipientDesc = `${selectedStudent.name} ${selectedStudent.grade}`;
        }
    }

    if (recipientCount === 0) {
        alert("Gönderilecek alıcı bulunamadı.");
        setIsSending(false);
        return;
    }

    setTimeout(() => {
      const newAnn = {
        id: Date.now(),
        subject: senderTitle,
        audience: recipientDesc,
        date: type === 'schedule' && scheduledDate ? new Date(scheduledDate).toLocaleString() : new Date().toLocaleString(),
        status: type === 'schedule' ? 'scheduled' : 'sent'
      };
      setAnnouncements([newAnn, ...announcements]);
      
      if (type === 'send') {
          alert(`SMS BAŞARIYLA GÖNDERİLDİ\n\nGönderici: ${senderTitle}\nAlıcı: ${recipientDesc} (${recipientCount} Kişi)\nMesaj: ${body}`);
      } else {
          alert(`SMS PLANLANDI\n\nTarih: ${newAnn.date}\nAlıcı: ${recipientDesc}`);
      }

      setIsSending(false);
      // Reset after send
      setBody('');
      setTopic('');
    }, 1000);
  };

  const handleMarkAbsent = (studentName: string, phone: string) => {
    if (confirm(`${studentName} isimli öğrenci YOK yazılacak ve velisine (${phone}) SMS gönderilecek. Onaylıyor musunuz?`)) {
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
    let targetCount = 0;
    if (activityTarget === 'all') {
        targetCount = students.length;
    } else {
        targetCount = students.filter(s => s.grade === activityTarget).length;
    }
    if (targetCount === 0) {
        alert("Seçilen kriterlere uygun öğrenci bulunamadı.");
        return;
    }
    const message = activityTarget === 'all' 
        ? `Tüm okula (${targetCount} öğrenci) "${activityName}" faaliyeti eklenecek.` 
        : `Sadece ${activityTarget} sınıfına (${targetCount} öğrenci) "${activityName}" faaliyeti eklenecek.`;
    if (confirm(`${message} Borçlarına kişi başı ₺${activityCost} yansıtılacaktır. Onaylıyor musunuz?`)) {
        alert(`Faaliyet başarıyla eklendi ve borçlar güncellendi.`);
        setActivityName('');
        setActivityCost('');
        setActivityDate('');
        setActivityTarget('all');
    }
  };

  const handleUploadSchedule = () => {
      if(!scheduleFile) return;
      alert(`${scheduleClass} sınıfı için ders programı başarıyla güncellendi.`);
      setScheduleFile(null);
  };

  // Student Search Logic for SMS
  const studentSearchResults = smsStudentSearch.length > 1
      ? students.filter(s => s.name.toLowerCase().includes(smsStudentSearch.toLowerCase()))
      : [];

  // Filter Logic
  const uniqueClasses = Array.from(new Set(students.map(s => s.grade))).sort();
  
  const filteredStudents = students.filter(student => {
      const matchClass = filterClass === 'all' || student.grade === filterClass;
      const matchGender = filterGender === 'all' || student.gender === filterGender;
      const matchFinancial = filterFinancial === 'all' || 
          (filterFinancial === 'debt' && student.financials.remainingDebt > 0) ||
          (filterFinancial === 'paid' && student.financials.remainingDebt <= 0);
      return matchClass && matchGender && matchFinancial;
  });

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lise Yönetim Paneli</h2>
          <p className="mt-1 text-sm text-gray-500">Müdür ve Muhasebe Yetkilisi Görünümü</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4 items-center">
             <button 
                 onClick={handleSeedData}
                 className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-sm font-medium flex items-center gap-2 transition-colors"
                 title="Özel 9-A sınıf listesini veritabanına yükler"
             >
                 <Database className="w-4 h-4" /> 
                 9-A Listesini Yükle
             </button>
             <div className="text-right pl-4 border-l border-gray-200">
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
          
          {/* Announcement / SMS Creator */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-indigo-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                SMS ve Duyuru Paneli
              </h3>
              <span className="bg-indigo-800 px-3 py-1 rounded-full text-xs font-mono tracking-wider border border-indigo-700">
                  BAŞLIK: {senderTitle}
              </span>
            </div>
            
            <div className="p-6 space-y-6">
               {/* Targeting Tabs */}
               <div className="flex space-x-4 border-b border-gray-200 pb-4">
                   <button 
                       onClick={() => { setSmsMode('class'); setSelectedStudent(null); }}
                       className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${smsMode === 'class' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-500 hover:bg-gray-50'}`}
                   >
                       <Users className="w-4 h-4" /> Toplu Gönderim (Sınıf)
                   </button>
                   <button 
                       onClick={() => { setSmsMode('student'); setSmsTargetClass('all'); }}
                       className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${smsMode === 'student' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-500 hover:bg-gray-50'}`}
                   >
                       <User className="w-4 h-4" /> Tekil Gönderim (Öğrenci)
                   </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Left Side: Target Selection */}
                   <div className="space-y-4">
                       <label className="block text-sm font-medium text-gray-700">Alıcı Seçimi</label>
                       
                       {smsMode === 'class' ? (
                           <select 
                               className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
                               value={smsTargetClass} 
                               onChange={e => setSmsTargetClass(e.target.value)}
                           >
                               <option value="all">Tüm Okul ({students.length} Öğrenci)</option>
                               {uniqueClasses.map(c => (
                                   <option key={c} value={c}>{c} Sınıfı ({students.filter(s => s.grade === c).length} Öğrenci)</option>
                               ))}
                           </select>
                       ) : (
                           <div className="relative">
                               <input 
                                   type="text"
                                   className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                   placeholder="Öğrenci adı ile ara..."
                                   value={smsStudentSearch}
                                   onChange={e => { setSmsStudentSearch(e.target.value); setSelectedStudent(null); }}
                               />
                               {selectedStudent && (
                                   <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex justify-between items-center">
                                       <span className="text-sm text-green-800 font-medium">
                                           Seçildi: {selectedStudent.name} ({selectedStudent.grade})
                                       </span>
                                       <button onClick={() => { setSelectedStudent(null); setSmsStudentSearch(''); }} className="text-green-600 hover:text-green-800">
                                           <XCircle className="w-4 h-4" />
                                       </button>
                                   </div>
                               )}
                               {smsStudentSearch.length > 1 && !selectedStudent && (
                                   <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                       {studentSearchResults.length > 0 ? studentSearchResults.map(s => (
                                           <button 
                                               key={s.id}
                                               onClick={() => { setSelectedStudent(s); setSmsStudentSearch(''); }}
                                               className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex justify-between"
                                           >
                                               <span>{s.name}</span>
                                               <span className="text-gray-500">{s.grade}</span>
                                           </button>
                                       )) : (
                                           <div className="px-4 py-2 text-sm text-gray-500">Öğrenci bulunamadı.</div>
                                       )}
                                   </div>
                               )}
                           </div>
                       )}

                       <div className="pt-2">
                           <label className="block text-sm font-medium text-gray-700 mb-1">Gönderici Başlığı</label>
                           <input 
                               type="text" 
                               value={senderTitle}
                               onChange={(e) => setSenderTitle(e.target.value.toUpperCase())}
                               className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm bg-gray-50 font-mono"
                               placeholder="OKUL_ADI"
                           />
                           <p className="text-xs text-gray-500 mt-1">Operatörde kayıtlı başlığınızı giriniz.</p>
                       </div>
                   </div>

                   {/* Right Side: Message & AI */}
                   <div className="space-y-4">
                       <div>
                           <div className="flex justify-between items-center mb-1">
                               <label className="block text-sm font-medium text-gray-700">Mesaj İçeriği</label>
                               <div className="flex gap-2">
                                   <select className="text-xs border-gray-300 rounded shadow-sm"
                                        value={notificationType} onChange={e => setNotificationType(e.target.value as any)}>
                                        <option value="general">Genel</option>
                                        <option value="homework">Ödev</option>
                                        <option value="meeting">Toplantı</option>
                                   </select>
                                   <button onClick={handleGenerate} disabled={isGenerating} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                                       <Sparkles className="w-3 h-3" /> AI Yazsın
                                   </button>
                               </div>
                           </div>
                           <input type="text" className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm"
                                placeholder="Konu (AI için ipucu)..." 
                                value={topic} onChange={e => setTopic(e.target.value)} />
                           
                           <div className="relative">
                               <textarea rows={4} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                    placeholder="Sayın Veli..." value={body} onChange={e => setBody(e.target.value)} />
                               <span className="absolute bottom-2 right-2 text-[10px] text-gray-400">
                                   {body.length} karakter
                               </span>
                           </div>
                       </div>
                   </div>
               </div>

               <div className="flex justify-end pt-2 border-t border-gray-100">
                   <button onClick={() => handleProcessAnnouncement('schedule')} disabled={isSending || !body || !scheduledDate} className="mr-3 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 flex items-center gap-2">
                       <Clock className="w-4 h-4" /> İleri Tarihli Planla
                   </button>
                   <button 
                       onClick={() => handleProcessAnnouncement('send')} 
                       disabled={isSending || !body || (smsMode === 'student' && !selectedStudent)} 
                       className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm"
                   >
                       {isSending ? "Gönderiliyor..." : (
                           <>
                             <Send className="w-4 h-4" />
                             Gönder
                           </>
                       )}
                   </button>
               </div>
            </div>
          </div>

          {/* Pending Receipts */}
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
              <div className="flex gap-2">
                {filterClass !== 'all' && (
                    <button className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md font-medium hover:bg-indigo-100 flex items-center gap-1">
                        <Printer className="w-4 h-4" /> 
                        {filterClass} Sınıf Listesi Yazdır
                    </button>
                )}
                <button className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" /> Excel İndir
                </button>
              </div>
            </div>
            
            {/* Filter Bar */}
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <Filter className="w-4 h-4" />
                    Filtrele:
                </div>
                
                <select 
                    value={filterClass} 
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="block w-32 pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="all">Tüm Sınıflar</option>
                    {uniqueClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select 
                    value={filterGender} 
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="block w-32 pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="all">Tüm Cinsiyetler</option>
                    <option value="female">Kız</option>
                    <option value="male">Erkek</option>
                </select>

                <select 
                    value={filterFinancial} 
                    onChange={(e) => setFilterFinancial(e.target.value)}
                    className="block w-40 pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="all">Tüm Durumlar</option>
                    <option value="debt">Borçlu Olanlar</option>
                    <option value="paid">Borcu Olmayanlar</option>
                </select>
                
                <div className="ml-auto text-sm text-gray-500">
                    Toplam: <strong>{filteredStudents.length}</strong> öğrenci
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Okul No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci / Veli</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sınıf (Alan)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finansal Durum</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Yoklama (SMS)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-bold text-indigo-900 bg-indigo-50 px-2 py-1 rounded">
                                        {student.schoolNo}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                        {student.name}
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${student.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {student.gender === 'female' ? 'K' : 'E'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">{student.parentName}</div>
                                    <div className="text-[10px] text-gray-400 mt-1">{student.phone}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="font-medium text-gray-900">{student.grade}</div>
                                    {/* Simple heuristic for stream display in table */}
                                    {student.grade.includes('A') || student.grade.includes('B') ? 
                                        <span className="text-[10px] text-orange-600 bg-orange-50 px-1 rounded">Sözel</span> :
                                     student.grade.includes('D') ? 
                                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">Sayısal</span> :
                                     student.grade.includes('C') ?
                                        <span className="text-[10px] text-purple-600 bg-purple-50 px-1 rounded">EA</span> :
                                     student.grade.includes('E') ?
                                        <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1 rounded">Dil</span> : null
                                    }
                                </td>
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
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Aradığınız kriterlere uygun öğrenci bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>

        </div>

        {/* Right Column: Market Research & Other (1/3 width) */}
        <div className="space-y-8">
            {/* Market Trends AI */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-purple-50 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-medium text-purple-900">Eğitim Trendleri (AI)</h3>
                </div>
                <div className="p-6 space-y-4">
                    <form onSubmit={handleSearch} className="relative">
                        <input 
                            type="text" 
                            className="w-full border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-purple-500 focus:border-purple-500 border"
                            placeholder="YKS sistemi, sınav takvimi..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    </form>
                    
                    {isSearching ? (
                        <div className="text-center text-purple-600 text-sm py-4">Araştırılıyor...</div>
                    ) : searchResult ? (
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
                            <p>{searchResult.text}</p>
                            {searchResult.sources.length > 0 && (
                                <div className="pt-2 border-t border-gray-200">
                                    <p className="text-xs font-bold text-gray-500 mb-1">Kaynaklar:</p>
                                    <ul className="list-disc list-inside">
                                        {searchResult.sources.map((s, i) => (
                                            <li key={i}><a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">{s.title}</a></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Eğitim dünyasındaki gelişmeleri yapay zeka ile araştırın.</p>
                    )}
                </div>
            </div>

            {/* Quick Actions / Activity Add */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-green-50 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-medium text-green-900">Hızlı Faaliyet Ekle</h3>
                </div>
                <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Etkinlik Adı</label>
                        <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                            value={activityName} onChange={e => setActivityName(e.target.value)} placeholder="Üniversite Gezisi" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Ücret (TL)</label>
                        <input type="number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                            value={activityCost} onChange={e => setActivityCost(e.target.value)} placeholder="200" />
                     </div>
                     
                     {/* TARGET CLASS SELECTION */}
                     <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Target className="w-4 h-4 text-gray-500" />
                            Hedef Kitle (Sınıf)
                        </label>
                        <select 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                            value={activityTarget} 
                            onChange={e => setActivityTarget(e.target.value)}
                        >
                            <option value="all">Tüm Okul</option>
                            {uniqueClasses.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Sadece seçilen sınıfın borcuna yansıtılır.</p>
                     </div>

                     <button onClick={handleAddActivity} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-medium text-sm">
                         Listeye Ekle ve Borçlandır
                     </button>
                </div>
            </div>

             {/* Schedule Update */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-blue-50 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-blue-900">Ders Programı Yükle</h3>
                </div>
                <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Sınıf</label>
                        <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                             value={scheduleClass} onChange={e => setScheduleClass(e.target.value)}>
                             <option>9-A</option>
                             <option>9-B</option>
                             <option>10-A</option>
                             <option>11-D</option>
                             <option>12-D</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">PDF Dosyası</label>
                        <input type="file" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                             onChange={e => setScheduleFile(e.target.files?.[0] || null)} />
                     </div>
                     <button onClick={handleUploadSchedule} disabled={!scheduleFile} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium text-sm disabled:bg-gray-300">
                         Güncelle
                     </button>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default Admin;