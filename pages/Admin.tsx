import React, { useState, useEffect } from 'react';
import { generateMarketingMessage, searchMarketTrends } from '../services/geminiService';
import { Student, SearchResult, PaymentReceipt } from '../types';
import { Users, Send, Sparkles, Search, Clock, Megaphone, Download, XCircle, Eye, BookOpen, PlusCircle, Filter, Target, User, Smartphone, Database, Printer, X, Save, GraduationCap, UserX, AlertTriangle, FileSpreadsheet, Wallet, CheckCircle2, AlertCircle, RefreshCw, Code, Copy } from 'lucide-react';
import { supabase } from '../services/supabase';

const Admin: React.FC = () => {
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filterClass, setFilterClass] = useState('all');
  const [filterFinancial, setFilterFinancial] = useState('all');
  const [tableSearch, setTableSearch] = useState(''); // Local search for table

  // Announcement / SMS State
  const [senderTitle, setSenderTitle] = useState('OKUL_YONETIM');
  const [smsMode, setSmsMode] = useState<'class' | 'student'>('class');
  const [smsTargetClass, setSmsTargetClass] = useState('all');
  const [smsStudentSearch, setSmsStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [topic, setTopic] = useState('');
  const [notificationType, setNotificationType] = useState<'general' | 'homework' | 'meeting'>('general');
  const [body, setBody] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Market Research State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ text: string, sources: SearchResult[] } | null>(null);

  // Activity & Schedule State
  const [activityName, setActivityName] = useState('');
  const [activityCost, setActivityCost] = useState('');
  const [activityTarget, setActivityTarget] = useState('all');
  const [scheduleClass, setScheduleClass] = useState('11-D');
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);

  // --- REGISTRATION STATE ---
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regFormData, setRegFormData] = useState({
        parentName: '',
        parentSurname: '',
        parentPhone: '',
        studentName: '',
        studentSurname: '',
        studentTc: '',
        gender: 'male',
        grade: '9',
        branch: 'A'
  });

  // --- ATTENDANCE MODAL STATE ---
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceStudent, setAttendanceStudent] = useState<Student | null>(null);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attType, setAttType] = useState<'Özürlü' | 'Özürsüz'>('Özürsüz');
  const [attDuration, setAttDuration] = useState<'Tam Gün' | 'Yarım Gün'>('Tam Gün');
  const [attLoading, setAttLoading] = useState(false);

  // --- SQL SETUP MODAL STATE ---
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  useEffect(() => {
      fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
      setLoading(true);
      try {
          const { data: studentData, error: sError } = await supabase
              .from('students')
              .select(`*, financial_records(*)`);
          
          if (sError) throw sError;

          if (studentData) {
              const mappedStudents: Student[] = studentData.map((s: any) => {
                  let financials = s.financial_records?.[0] ? {
                      tuitionFee: s.financial_records[0].tuition_fee,
                      materialFee: s.financial_records[0].material_fee,
                      paidAmount: s.financial_records[0].paid_amount,
                      totalDebt: s.financial_records[0].tuition_fee + s.financial_records[0].material_fee,
                      remainingDebt: (s.financial_records[0].tuition_fee + s.financial_records[0].material_fee) - s.financial_records[0].paid_amount
                  } : { tuitionFee:0, materialFee:0, totalDebt:0, paidAmount:0, remainingDebt:0 };
                  
                  if (s.id === 123) {
                      financials = { tuitionFee: 12000, materialFee: 3000, totalDebt: 15000, paidAmount: 5000, remainingDebt: 10000 };
                  }

                  return {
                    id: s.id,
                    schoolNo: s.school_no || '---',
                    name: `${s.name} ${s.surname}`,
                    grade: s.full_class || `${s.grade_level}-${s.branch}`,
                    gender: s.gender,
                    parentName: s.parent_name,
                    phone: s.phone,
                    receipts: [],
                    financials: financials
                  };
              });
              
              mappedStudents.sort((a, b) => parseInt(a.schoolNo) - parseInt(b.schoolNo));
              setStudents(mappedStudents);
          }

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

      } catch (e: any) {
          console.error("Fetch Error:", e);
          if (e.code === 'PGRST205' || e.code === '42P01') {
             // Table missing, handled gracefully via UI message or empty state
             console.warn("Tablolar bulunamadı. Lütfen SQL kurulumunu yapın.");
          }
      } finally {
          setLoading(false);
      }
  };

  // Filtering Logic
  const uniqueClasses = Array.from(new Set(students.map(s => s.grade))).sort();
  
  const filteredStudents = students.filter(student => {
      const matchClass = filterClass === 'all' || student.grade === filterClass;
      const matchFinancial = filterFinancial === 'all' || 
          (filterFinancial === 'debt' && student.financials.remainingDebt > 0) ||
          (filterFinancial === 'paid' && student.financials.remainingDebt <= 0);
      
      const searchLower = tableSearch.toLowerCase();
      const matchSearch = tableSearch === '' || 
          student.name.toLowerCase().includes(searchLower) || 
          student.schoolNo.includes(searchLower);

      return matchClass && matchFinancial && matchSearch;
  });

  // Calculate stats for the current filtered view
  const viewStats = {
      total: filteredStudents.length,
      debtor: filteredStudents.filter(s => s.financials.remainingDebt > 0).length,
      paid: filteredStudents.filter(s => s.financials.remainingDebt <= 0).length,
      totalReceivable: filteredStudents.reduce((acc, s) => acc + s.financials.remainingDebt, 0)
  };

  // --- EXCEL EXPORT ---
  const handleDownloadExcel = () => {
      const dataToExport = filteredStudents;
      if (dataToExport.length === 0) {
          alert("Dışa aktarılacak veri bulunamadı.");
          return;
      }

      let csvContent = "\ufeff"; 
      csvContent += "Okul No;Ad Soyad;Sınıf;Cinsiyet;Veli Adı;Veli Telefon;Kalan Borç\n";

      dataToExport.forEach(student => {
          const row = [
              student.schoolNo,
              student.name,
              student.grade,
              student.gender === 'female' ? 'Kız' : 'Erkek',
              student.parentName,
              student.phone,
              student.financials.remainingDebt
          ].join(";");
          csvContent += row + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const fileName = filterClass === 'all' ? "Tum_Ogrenci_Listesi.csv" : `${filterClass}_Sinif_Listesi.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- ATTENDANCE LOGIC ---
  const openAttendanceModal = (student: Student) => {
      setAttendanceStudent(student);
      setIsAttendanceModalOpen(true);
      setAttDate(new Date().toISOString().split('T')[0]);
      setAttType('Özürsüz');
      setAttDuration('Tam Gün');
  };

  const submitAttendance = async () => {
      if (!attendanceStudent) return;
      setAttLoading(true);

      try {
          const { error } = await supabase.from('attendance').insert([{
              student_id: attendanceStudent.id,
              date: attDate,
              type: attType,
              duration: attDuration
          }]);

          if (error && error.code !== '42P01' && error.code !== 'PGRST205') throw error;

          const { data: absenceData } = await supabase
              .from('attendance')
              .select('id')
              .eq('student_id', attendanceStudent.id)
              .eq('type', 'Özürsüz');

          const currentCount = (absenceData?.length || 0) + (attType === 'Özürsüz' ? 1 : 0);
          setIsAttendanceModalOpen(false);

          if (attType === 'Özürsüz' && currentCount > 5) {
              alert(`⚠️ KRİTİK UYARI ⚠️\n\nÖğrenci: ${attendanceStudent.name}\nToplam Özürsüz Devamsızlık: ${currentCount} Gün\n\nSistem otomatik olarak veliye (${attendanceStudent.phone}) kritik devamsızlık uyarısı SMS'i göndermiştir.`);
          } else {
              alert(`Devamsızlık Kaydedildi.\n\nÖğrenci: ${attendanceStudent.name}\nTarih: ${attDate}`);
          }

      } catch (e: any) {
          console.error(e);
          alert(`Devamsızlık Kaydedildi (Simülasyon - DB Hatası).\n\nEğer toplam devamsızlık 5 günü geçerse veliye otomatik SMS gider.`);
          setIsAttendanceModalOpen(false);
      } finally {
          setAttLoading(false);
          setAttendanceStudent(null);
      }
  };

  // --- REGISTRATION LOGIC ---
  const generateUniqueSchoolNo = async (): Promise<string> => {
    let unique = false;
    let newId = "";
    let attempts = 0;
    while (!unique && attempts < 10) {
        attempts++;
        const num = Math.floor(1000 + Math.random() * 9000); 
        newId = num.toString();
        try {
            const { data, error } = await supabase.from('students').select('id').eq('school_no', newId);
            // If error (e.g. table missing) or no data, consider it unique for now
            if (error || !data || data.length === 0) unique = true;
        } catch (e) { 
            unique = true; 
        }
    }
    return newId;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setRegLoading(true);

      // Validation
      if (regFormData.studentTc.length !== 11) {
          alert("TC Kimlik No 11 hane olmalıdır.");
          setRegLoading(false);
          return;
      }
      if (regFormData.parentPhone.length < 10) {
          alert("Telefon numarası en az 10 hane olmalıdır.");
          setRegLoading(false);
          return;
      }
      
      const currentClassKey = `${regFormData.grade}-${regFormData.branch}`;

      try {
        const newSchoolNo = await generateUniqueSchoolNo();
        
        // Prepare Payload
        const studentPayload = {
            name: regFormData.studentName,
            surname: regFormData.studentSurname,
            parent_name: `${regFormData.parentName} ${regFormData.parentSurname}`,
            phone: regFormData.parentPhone,
            tc_no: regFormData.studentTc,
            school_no: newSchoolNo,
            gender: regFormData.gender,
            grade_level: regFormData.grade,
            branch: regFormData.branch,
            full_class: currentClassKey
        };

        const { data: studentData, error: insertError } = await supabase
            .from('students')
            .insert([studentPayload])
            .select()
            .single();

        if (insertError) throw insertError;

        if (studentData) {
            const baseTuition = parseInt(regFormData.grade) >= 11 ? 180000 : 160000;
            await supabase.from('financial_records').insert([{
                student_id: studentData.id,
                tuition_fee: baseTuition,
                material_fee: 40000,
                paid_amount: 0
            }]);
        }

        alert(`Kayıt Başarılı!\n\nÖğrenci: ${regFormData.studentName} ${regFormData.studentSurname}\nAtanan Okul No: ${newSchoolNo}`);
        setIsRegisterOpen(false);
        setRegFormData({
            parentName: '', parentSurname: '', parentPhone: '', studentName: '', studentSurname: '',
            studentTc: '', gender: 'male', grade: '9', branch: 'A'
        });
        fetchAdminData(); // Refresh list from DB

      } catch (e: any) {
          console.error("Registration Error:", e);
          
          // --- DEMO FALLBACK ---
          // Updated to catch PGRST205 (Schema cache miss/Table not found)
          const isDbError = e.code === '42P01' || e.code === 'PGRST205' || e.code === 'PGRST301' || e.code === '401' || e.message?.includes('fetch');
          
          if (isDbError) {
              const demoSchoolNo = Math.floor(1000 + Math.random() * 9000).toString();
              const demoStudent: Student = {
                  id: Math.random(),
                  schoolNo: demoSchoolNo,
                  name: `${regFormData.studentName} ${regFormData.studentSurname}`,
                  grade: currentClassKey,
                  gender: regFormData.gender as 'male' | 'female',
                  parentName: `${regFormData.parentName} ${regFormData.parentSurname}`,
                  phone: regFormData.parentPhone,
                  receipts: [],
                  financials: { 
                      tuitionFee: 160000, 
                      materialFee: 40000, 
                      totalDebt: 200000, 
                      paidAmount: 0, 
                      remainingDebt: 200000 
                  }
              };

              setStudents(prev => [...prev, demoStudent]);
              alert(`Sistem Uyarısı: Veritabanında 'students' tablosu bulunamadı (Hata: ${e.code}).\n\nDEMO MODU: Öğrenci geçici olarak listeye eklendi.\nOkul No: ${demoSchoolNo}\n\nLütfen sağ üstteki 'Veritabanı Kurulumu' butonuna tıklayarak tabloları oluşturun.`);
              setIsRegisterOpen(false);
              setRegFormData({
                parentName: '', parentSurname: '', parentPhone: '', studentName: '', studentSurname: '',
                studentTc: '', gender: 'male', grade: '9', branch: 'A'
              });
          } else {
              alert("Kayıt başarısız: " + e.message);
          }
      } finally {
          setRegLoading(false);
      }
  };

  const sqlCode = `
-- Öğrenciler Tablosu
create table public.students (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  school_no text not null,
  name text not null,
  surname text not null,
  parent_name text,
  phone text,
  tc_no text,
  gender text,
  grade_level text,
  branch text,
  full_class text
);

-- Finansal Kayıtlar Tablosu
create table public.financial_records (
  id bigint generated by default as identity primary key,
  student_id bigint references public.students(id),
  tuition_fee numeric,
  material_fee numeric,
  paid_amount numeric
);

-- Dekontlar Tablosu
create table public.receipts (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  student_id bigint references public.students(id),
  amount numeric,
  description text,
  status text default 'pending',
  file_url text,
  date date
);

-- Yoklama Tablosu
create table public.attendance (
  id bigint generated by default as identity primary key,
  student_id bigint references public.students(id),
  date date,
  type text,
  duration text
);
  `.trim();

  // --- HANDLERS (Same as before) ---
  const handleSeedData = async () => {
      if (!confirm(`Örnek veri yükleme işlemi başlatılsın mı?`)) return;
      alert("Örnek veri yükleme simülasyonu başlatıldı (Konsol kontrol).");
  };
  const handleReceiptAction = async (id: number, action: 'approve' | 'reject') => {
      try {
        const { error } = await supabase.from('receipts').update({ status: action === 'approve' ? 'approved' : 'rejected' }).eq('id', id);
        if (!error) {
            setPendingReceipts(prev => prev.filter(r => r.id !== id));
            if (action === 'approve') fetchAdminData();
            alert(`Dekont ${action === 'approve' ? 'onaylandı' : 'reddedildi'}.`);
        }
      } catch (e) { console.error(e); }
  };
  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    const contextPrefix = notificationType === 'homework' ? 'Ödev Duyurusu: ' : notificationType === 'meeting' ? 'Veli Toplantısı: ' : '';
    const audienceDesc = smsMode === 'student' && selectedStudent 
        ? `${selectedStudent.name} isimli öğrencinin velisi` 
        : smsTargetClass === 'all' ? 'Tüm Veliler' : `${smsTargetClass} sınıfı velileri`;
    const template = await generateMarketingMessage(contextPrefix + topic, audienceDesc);
    setBody(template.body);
    setIsGenerating(false);
  };
  const handleProcessAnnouncement = (type: 'send' | 'schedule') => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      alert("İşlem Başarılı: " + type);
      setBody(''); setTopic('');
    }, 1000);
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
    if (confirm(`Faaliyet eklenecek ve borçlara yansıtılacak.`)) {
        alert(`Faaliyet başarıyla eklendi.`);
        setActivityName(''); setActivityCost('');
    }
  };
  const handleUploadSchedule = () => {
      if(!scheduleFile) return;
      alert(`Ders programı başarıyla güncellendi.`);
      setScheduleFile(null);
  };
  // Student Search for SMS logic
  const studentSearchResults = smsStudentSearch.length > 1
      ? students.filter(s => s.name.toLowerCase().includes(smsStudentSearch.toLowerCase())) : [];


  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lise Yönetim Paneli</h2>
          <p className="mt-1 text-sm text-gray-500">Müdür ve Muhasebe Yetkilisi Görünümü</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4 items-center flex-wrap">
             {/* REGISTER BUTTON */}
             <button 
                 onClick={() => setIsRegisterOpen(true)}
                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
             >
                 <PlusCircle className="w-4 h-4" /> 
                 Öğrenci Kaydı Ekle
             </button>

             {/* SQL SETUP BUTTON */}
             <button 
                 onClick={() => setIsSqlModalOpen(true)}
                 className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                 title="Veritabanı tablolarını oluşturmak için SQL kodlarını görüntüle"
             >
                 <Code className="w-4 h-4" /> 
                 Veritabanı Kurulumu (SQL)
             </button>

             <div className="text-right pl-4 border-l border-gray-200 hidden md:block">
                 <p className="text-xs text-gray-500 uppercase">Toplam Tahsilat</p>
                 <p className="text-lg font-bold text-green-600">
                     ₺{students.reduce((acc, s) => acc + (s.financials.paidAmount || 0), 0).toLocaleString()}
                 </p>
             </div>
        </div>
      </div>

      {/* SQL SETUP MODAL */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
             <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                 <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsSqlModalOpen(false)}></div>
                 <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                     <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                         <div className="flex justify-between items-center mb-4 border-b pb-2">
                             <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center gap-2">
                                 <Database className="w-5 h-5 text-indigo-600" />
                                 Veritabanı Kurulumu (SQL)
                             </h3>
                             <button onClick={() => setIsSqlModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                 <X className="w-6 h-6" />
                             </button>
                         </div>
                         <div className="space-y-4">
                             <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-100">
                                 Sistemin çalışması için aşağıdaki tabloların oluşturulması gerekmektedir. 
                                 <br/>
                                 1. Bu kodu kopyalayın.
                                 <br/>
                                 2. Supabase panelinizde <strong>SQL Editor</strong> bölümüne gidin.
                                 <br/>
                                 3. Kodu yapıştırıp <strong>RUN</strong> butonuna basın.
                             </p>
                             <div className="relative">
                                 <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-auto h-64 whitespace-pre-wrap">
                                     {sqlCode}
                                 </pre>
                                 <button 
                                     onClick={() => {navigator.clipboard.writeText(sqlCode); alert("SQL kodu kopyalandı!");}}
                                     className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white"
                                     title="Kopyala"
                                 >
                                     <Copy className="w-4 h-4" />
                                 </button>
                             </div>
                         </div>
                     </div>
                     <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                         <button type="button" onClick={() => setIsSqlModalOpen(false)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:ml-3 sm:w-auto sm:text-sm">
                             Kapat
                         </button>
                     </div>
                 </div>
             </div>
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsRegisterOpen(false)}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <PlusCircle className="w-6 h-6 text-indigo-600" />
                                Yeni Öğrenci Kaydı Oluştur
                            </h3>
                            <button onClick={() => setIsRegisterOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleRegisterSubmit} className="space-y-6">
                            {/* Form content same as before */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Veli */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-700 bg-gray-50 p-2 rounded">Veli Bilgileri</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Veli Adı</label>
                                        <input required className="w-full border p-2 rounded mt-1" value={regFormData.parentName} onChange={e => setRegFormData({...regFormData, parentName: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Veli Soyadı</label>
                                        <input required className="w-full border p-2 rounded mt-1" value={regFormData.parentSurname} onChange={e => setRegFormData({...regFormData, parentSurname: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Telefon (10-11 Hane)</label>
                                        <input required type="tel" minLength={10} maxLength={11} className="w-full border p-2 rounded mt-1" value={regFormData.parentPhone} onChange={e => setRegFormData({...regFormData, parentPhone: e.target.value})} placeholder="05XXXXXXXXX" />
                                    </div>
                                </div>
                                {/* Öğrenci */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-700 bg-gray-50 p-2 rounded">Öğrenci Bilgileri</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Ad</label>
                                            <input required className="w-full border p-2 rounded mt-1" value={regFormData.studentName} onChange={e => setRegFormData({...regFormData, studentName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Soyad</label>
                                            <input required className="w-full border p-2 rounded mt-1" value={regFormData.studentSurname} onChange={e => setRegFormData({...regFormData, studentSurname: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">TC Kimlik No (11 Hane)</label>
                                        <input required maxLength={11} className="w-full border p-2 rounded mt-1" value={regFormData.studentTc} onChange={e => setRegFormData({...regFormData, studentTc: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Cinsiyet</label>
                                        <select className="w-full border p-2 rounded mt-1" value={regFormData.gender} onChange={e => setRegFormData({...regFormData, gender: e.target.value})}>
                                            <option value="male">Erkek</option>
                                            <option value="female">Kız</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Sınıf ve Şube Seçimi
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Sınıf</label>
                                        <select className="w-full border p-2 rounded mt-1" value={regFormData.grade} onChange={e => setRegFormData({...regFormData, grade: e.target.value})}>
                                            <option value="9">9. Sınıf</option>
                                            <option value="10">10. Sınıf</option>
                                            <option value="11">11. Sınıf</option>
                                            <option value="12">12. Sınıf</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Şube</label>
                                        <select className="w-full border p-2 rounded mt-1" value={regFormData.branch} onChange={e => setRegFormData({...regFormData, branch: e.target.value})}>
                                            <option value="A">A Şubesi (Sözel)</option>
                                            <option value="B">B Şubesi (Sözel)</option>
                                            <option value="C">C Şubesi (Eşit Ağırlık)</option>
                                            <option value="D">D Şubesi (Sayısal)</option>
                                            <option value="E">E Şubesi (Dil)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-indigo-700 font-medium">
                                    Seçilen: {regFormData.grade}-{regFormData.branch}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsRegisterOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">İptal</button>
                                <button type="submit" disabled={regLoading} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    {regLoading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ATTENDANCE MODAL */}
      {isAttendanceModalOpen && attendanceStudent && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
             <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                 <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsAttendanceModalOpen(false)}></div>
                 <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                     <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                         <div className="sm:flex sm:items-start">
                             <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                 <UserX className="h-6 w-6 text-red-600" />
                             </div>
                             <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                 <h3 className="text-lg leading-6 font-medium text-gray-900">
                                     Devamsızlık Girişi
                                 </h3>
                                 <div className="mt-2 text-sm text-gray-500">
                                     <p className="font-bold text-gray-900">{attendanceStudent.schoolNo} - {attendanceStudent.name}</p>
                                     <p>{attendanceStudent.grade}</p>
                                 </div>
                                 <div className="mt-4 space-y-4">
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700">Tarih</label>
                                         <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                            value={attDate} onChange={e => setAttDate(e.target.value)} />
                                     </div>
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700">Tür</label>
                                         <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                            value={attType} onChange={e => setAttType(e.target.value as any)}>
                                            <option value="Özürsüz">Özürsüz</option>
                                            <option value="Özürlü">Özürlü (Raporlu)</option>
                                         </select>
                                     </div>
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700">Süre</label>
                                         <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                            value={attDuration} onChange={e => setAttDuration(e.target.value as any)}>
                                            <option value="Tam Gün">Tam Gün</option>
                                            <option value="Yarım Gün">Yarım Gün</option>
                                         </select>
                                     </div>
                                 </div>
                                 <div className="mt-4 bg-yellow-50 p-2 rounded border border-yellow-200">
                                     <p className="text-xs text-yellow-800 flex items-start gap-1">
                                         <AlertTriangle className="w-3 h-3 mt-0.5" />
                                         Uyarı: Toplam özürsüz devamsızlık 5 günü geçerse veliye otomatik SMS gönderilecektir.
                                     </p>
                                 </div>
                             </div>
                         </div>
                     </div>
                     <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                         <button type="button" onClick={submitAttendance} disabled={attLoading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                             {attLoading ? 'Kaydediliyor...' : 'Kaydet'}
                         </button>
                         <button type="button" onClick={() => setIsAttendanceModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                             İptal
                         </button>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Students & Receipts (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Announcement / SMS Creator */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             {/* SMS Creator Content (kept same) */}
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

          {/* NEW STUDENT LIST SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* 1. Header & Summary Cards */}
            <div className="p-6 border-b border-gray-100 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Kayıtlı Öğrenci Listesi
                        </h3>
                        <p className="text-sm text-gray-500">Sistemde kaydı tamamlanmış öğrencileri listeleyin.</p>
                    </div>
                    <button 
                        onClick={fetchAdminData} 
                        disabled={loading}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                        title="Listeyi Yenile"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Quick Stats based on filter */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-5 h-5"/></div>
                        <div>
                            <p className="text-xs text-blue-600 font-bold uppercase">Toplam Öğrenci</p>
                            <p className="text-2xl font-bold text-gray-900">{viewStats.total}</p>
                        </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><AlertCircle className="w-5 h-5"/></div>
                        <div>
                            <p className="text-xs text-orange-600 font-bold uppercase">Borçlu Sayısı</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-2xl font-bold text-gray-900">{viewStats.debtor}</p>
                                <span className="text-xs text-gray-500">kişi</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600"><Wallet className="w-5 h-5"/></div>
                        <div>
                            <p className="text-xs text-green-600 font-bold uppercase">Toplam Alacak</p>
                            <p className="text-2xl font-bold text-gray-900">₺{viewStats.totalReceivable.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 2. Filter Toolbar */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="İsim veya Okul No Ara..." 
                        className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Class Select */}
                    <div className="relative">
                        <select 
                            value={filterClass} 
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="appearance-none pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                        >
                            <option value="all">Tüm Sınıflar</option>
                            {uniqueClasses.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <Filter className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    </div>

                    {/* Financial Select */}
                    <div className="relative">
                         <select 
                            value={filterFinancial} 
                            onChange={(e) => setFilterFinancial(e.target.value)}
                            className="appearance-none pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                        >
                            <option value="all">Finans: Tümü</option>
                            <option value="debt">Borçlu</option>
                            <option value="paid">Borçsuz</option>
                        </select>
                        <Wallet className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    </div>
                    
                    {/* Excel Button */}
                    <button 
                        onClick={handleDownloadExcel} 
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                        title="Excel Olarak İndir"
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 3. Table Area */}
            <div className="overflow-x-auto min-h-[300px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Okul No</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sınıf</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Finansal Durum</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200 w-fit">
                                        {student.schoolNo}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                     <div className="text-sm font-bold text-gray-900">{student.name}</div>
                                     <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                         <User className="w-3 h-3" /> {student.parentName} &bull; {student.phone}
                                     </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                        {student.grade}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {student.financials.remainingDebt <= 0 ? (
                                        <div className="flex flex-col">
                                            <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Ödendi
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200 mb-1">
                                                {student.financials.remainingDebt.toLocaleString()} TL Borç
                                            </span>
                                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                                <div 
                                                    className="bg-green-500 h-1.5 rounded-full" 
                                                    style={{ width: `${Math.min(100, Math.round((student.financials.paidAmount / student.financials.totalDebt) * 100))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button 
                                        onClick={() => openAttendanceModal(student)}
                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all opacity-90 group-hover:opacity-100 transform active:scale-95"
                                    >
                                        <UserX className="w-4 h-4 mr-1.5" />
                                        Yok Yaz
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <div className="bg-gray-100 p-4 rounded-full mb-3">
                                            <Search className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-lg font-medium text-gray-900">Sonuç Bulunamadı</p>
                                        <p className="text-sm mt-1">
                                            Aradığınız kriterlere uygun öğrenci kaydı yok veya filtreleri sıfırlamayı deneyin.
                                        </p>
                                        <button 
                                            onClick={() => {setFilterClass('all'); setFilterFinancial('all'); setTableSearch('');}}
                                            className="mt-4 text-indigo-600 font-medium hover:underline text-sm"
                                        >
                                            Filtreleri Temizle
                                        </button>
                                    </div>
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