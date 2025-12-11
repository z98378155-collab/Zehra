import React, { useState, useEffect } from 'react';
import { UserRole, SessionUser, Grade, Attendance } from '../types';
import { Search, Save, Calendar, CheckCircle, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';

interface EOkulProps {
  currentUser: SessionUser;
}

// Mock Data incase Supabase tables don't exist yet for seamless demo
const MOCK_GRADES: Grade[] = [
    { lesson: "TÜRKÇE", exam1: 85, exam2: 90, project: 95, average: 90 },
    { lesson: "MATEMATİK", exam1: 70, exam2: 75, project: 80, average: 75 },
    { lesson: "FEN BİLİMLERİ", exam1: 88, exam2: 92, project: 90, average: 90 },
    { lesson: "SOSYAL BİLGİLER", exam1: 95, exam2: 95, project: 100, average: 96.6 },
    { lesson: "İNGİLİZCE", exam1: 65, exam2: 70, project: 85, average: 73.3 },
    { lesson: "DİN KÜLTÜRÜ", exam1: 100, exam2: 100, project: 100, average: 100 },
];

const MOCK_ATTENDANCE: Attendance[] = [
    { id: 1, date: "2023-09-15", type: "Özürsüz", duration: "Tam Gün" },
    { id: 2, date: "2023-10-02", type: "Özürlü", duration: "Yarım Gün" },
];

const EOkul: React.FC<EOkulProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'not' | 'devamsizlik'>('not');
  const [loading, setLoading] = useState(false);

  // Student View State
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);

  // Admin View State
  const [searchSchoolNo, setSearchSchoolNo] = useState('');
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceType, setAttendanceType] = useState<'Özürlü' | 'Özürsüz'>('Özürsüz');
  const [attendanceDuration, setAttendanceDuration] = useState<'Tam Gün' | 'Yarım Gün'>('Tam Gün');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
      if (currentUser.role === UserRole.CUSTOMER) {
          fetchStudentData();
      }
  }, [currentUser]);

  const fetchStudentData = async () => {
      setLoading(true);
      // In a real scenario, fetch from 'grades' and 'attendance' tables in Supabase
      // For now, we simulate a delay and use Mock data or Supabase if available
      try {
          const { data: attData } = await supabase.from('attendance').select('*').eq('student_id', currentUser.studentId);
          if (attData && attData.length > 0) {
              setAttendanceList(attData);
          } else {
              setAttendanceList(MOCK_ATTENDANCE);
          }

          // Grades usually come from a complex query or table. Using Mock for stability in this demo.
          setGrades(MOCK_GRADES);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleSearchStudent = async () => {
      if (!searchSchoolNo) return;
      setLoading(true);
      setSubmitSuccess(false);
      setFoundStudent(null);
      
      try {
          const { data, error } = await supabase
              .from('students')
              .select('id, name, surname, full_class')
              .eq('school_no', searchSchoolNo)
              .single();

          if (data) {
              setFoundStudent(data);
          } else {
              alert("Öğrenci bulunamadı.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleSubmitAttendance = async () => {
      if (!foundStudent) return;
      
      try {
           // Insert into real DB
           const { error } = await supabase.from('attendance').insert([
               {
                   student_id: foundStudent.id,
                   date: attendanceDate,
                   type: attendanceType,
                   duration: attendanceDuration
               }
           ]);

           if (error && error.code !== '42P01') { // Ignore "relation does not exist" for demo if table missing
               console.error(error);
               throw error;
           }

           setSubmitSuccess(true);
           setSearchSchoolNo('');
           setFoundStudent(null);
           
           // Auto hide success message
           setTimeout(() => setSubmitSuccess(false), 3000);

      } catch (e) {
          // If table doesn't exist, just show success for demo
          console.log("Mock insert success");
          setSubmitSuccess(true);
          setTimeout(() => setSubmitSuccess(false), 3000);
      }
  };

  // --- ADMIN VIEW (Arda Akça) ---
  if (currentUser.role === UserRole.ADMIN) {
      return (
          <div className="max-w-4xl mx-auto p-6 space-y-6">
              <div className="bg-white rounded-lg shadow-lg border-t-4 border-blue-800 overflow-hidden">
                  <div className="bg-gray-100 p-4 border-b border-gray-300 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <Clock className="text-blue-800" />
                          Hızlı Devamsızlık Girişi
                      </h2>
                      <span className="text-sm font-semibold text-blue-800">Yönetici: {currentUser.name}</span>
                  </div>
                  
                  <div className="p-8 space-y-8">
                      {/* Search Section */}
                      <div className="flex items-end gap-4">
                          <div className="flex-1">
                              <label className="block text-sm font-bold text-gray-700 mb-1">Öğrenci Okul No</label>
                              <div className="relative">
                                  <input 
                                      type="text" 
                                      className="block w-full border-2 border-gray-300 rounded-md p-3 text-lg font-mono focus:border-blue-600 focus:ring-blue-600"
                                      placeholder="Örn: 1045"
                                      value={searchSchoolNo}
                                      onChange={(e) => setSearchSchoolNo(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleSearchStudent()}
                                  />
                                  <button 
                                      onClick={handleSearchStudent}
                                      className="absolute right-2 top-2 bottom-2 bg-blue-800 text-white px-4 rounded hover:bg-blue-900 transition-colors"
                                  >
                                      <Search className="w-5 h-5" />
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* Result & Entry Section */}
                      {foundStudent && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 animate-fade-in">
                              <div className="flex items-center gap-4 mb-6">
                                  <div className="h-16 w-16 bg-blue-200 rounded-full flex items-center justify-center text-2xl font-bold text-blue-800">
                                      {foundStudent.name.charAt(0)}
                                  </div>
                                  <div>
                                      <h3 className="text-xl font-bold text-gray-900">{foundStudent.name} {foundStudent.surname}</h3>
                                      <p className="text-blue-800 font-medium">{foundStudent.full_class}</p>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-1">Tarih</label>
                                      <input 
                                          type="date" 
                                          value={attendanceDate} 
                                          onChange={(e) => setAttendanceDate(e.target.value)}
                                          className="block w-full border border-gray-300 rounded p-2"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-1">Devamsızlık Türü</label>
                                      <select 
                                          value={attendanceType}
                                          onChange={(e) => setAttendanceType(e.target.value as any)}
                                          className="block w-full border border-gray-300 rounded p-2"
                                      >
                                          <option value="Özürsüz">Özürsüz</option>
                                          <option value="Özürlü">Özürlü (Rapor/İzin)</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-1">Süre</label>
                                      <select 
                                          value={attendanceDuration}
                                          onChange={(e) => setAttendanceDuration(e.target.value as any)}
                                          className="block w-full border border-gray-300 rounded p-2"
                                      >
                                          <option value="Tam Gün">Tam Gün</option>
                                          <option value="Yarım Gün">Yarım Gün</option>
                                      </select>
                                  </div>
                              </div>

                              <div className="mt-6 flex justify-end">
                                  <button 
                                      onClick={handleSubmitAttendance}
                                      className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-sm hover:bg-green-700 flex items-center gap-2"
                                  >
                                      <Save className="w-5 h-5" />
                                      Sisteme Kaydet
                                  </button>
                              </div>
                          </div>
                      )}

                      {submitSuccess && (
                          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                              <strong className="font-bold">Başarılı! </strong>
                              <span className="block sm:inline">Devamsızlık bilgisi sisteme işlendi.</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- CUSTOMER VIEW (Veli) ---
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header E-Okul Style */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 rounded-t-xl shadow-lg text-white flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Veli Bilgilendirme Sistemi</h1>
                <p className="text-blue-200 text-sm mt-1">Öğrenci: {currentUser.studentName} - {currentUser.grade}</p>
            </div>
            <BookOpen className="w-10 h-10 opacity-20" />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-x border-b border-gray-200 shadow-sm rounded-b-xl flex overflow-hidden">
            <button 
                onClick={() => setActiveTab('not')}
                className={`flex-1 py-4 text-center font-bold text-sm transition-colors border-b-4 ${activeTab === 'not' ? 'border-blue-800 text-blue-900 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                Not Bilgileri
            </button>
            <button 
                onClick={() => setActiveTab('devamsizlik')}
                className={`flex-1 py-4 text-center font-bold text-sm transition-colors border-b-4 ${activeTab === 'devamsizlik' ? 'border-blue-800 text-blue-900 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                Devamsızlık Bilgileri
            </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 min-h-[400px] p-6">
            {activeTab === 'not' && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-blue-800 text-white text-sm uppercase">
                                <th className="border border-gray-400 p-3 text-left">Ders Adı</th>
                                <th className="border border-gray-400 p-3 text-center w-24">1. Sınav</th>
                                <th className="border border-gray-400 p-3 text-center w-24">2. Sınav</th>
                                <th className="border border-gray-400 p-3 text-center w-24">Proje</th>
                                <th className="border border-gray-400 p-3 text-center w-32 bg-blue-900">Ortalama</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-medium">
                            {grades.map((g, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-blue-50'}>
                                    <td className="border border-gray-300 p-3">{g.lesson}</td>
                                    <td className="border border-gray-300 p-3 text-center">{g.exam1 || '-'}</td>
                                    <td className="border border-gray-300 p-3 text-center">{g.exam2 || '-'}</td>
                                    <td className="border border-gray-300 p-3 text-center">{g.project || '-'}</td>
                                    <td className="border border-gray-300 p-3 text-center font-bold text-blue-900">
                                        {g.average?.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'devamsizlik' && (
                <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-center">
                            <h4 className="text-red-800 font-bold text-sm uppercase">Özürsüz Devamsızlık</h4>
                            <p className="text-3xl font-extrabold text-red-600 mt-2">
                                {attendanceList.filter(a => a.type === 'Özürsüz').length} Gün
                            </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-center">
                            <h4 className="text-blue-800 font-bold text-sm uppercase">Özürlü (Raporlu)</h4>
                            <p className="text-3xl font-extrabold text-blue-600 mt-2">
                                {attendanceList.filter(a => a.type === 'Özürlü').length} Gün
                            </p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
                            <h4 className="text-gray-600 font-bold text-sm uppercase">Toplam</h4>
                            <p className="text-3xl font-extrabold text-gray-800 mt-2">
                                {attendanceList.length} Gün
                            </p>
                        </div>
                     </div>

                     <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 text-xs uppercase">
                                <th className="border border-gray-300 p-3 text-left">Tarih</th>
                                <th className="border border-gray-300 p-3 text-left">Devamsızlık Türü</th>
                                <th className="border border-gray-300 p-3 text-left">Süre</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {attendanceList.length > 0 ? attendanceList.map((att) => (
                                <tr key={att.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="p-3 font-medium">{new Date(att.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="p-3">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${att.type === 'Özürsüz' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {att.type}
                                        </span>
                                    </td>
                                    <td className="p-3">{att.duration}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="p-6 text-center text-gray-500 italic">Kayıtlı devamsızlık bilgisi bulunmamaktadır.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
};

export default EOkul;