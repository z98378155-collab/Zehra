import React, { useState } from 'react';
import { UserRole, SessionUser } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, User, Lock, CreditCard, BookOpen, UserCog, Phone, UserPlus, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (user: SessionUser) => void;
}

type LoginType = 'student' | 'admin';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loginType, setLoginType] = useState<LoginType>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Student Form State
  const [schoolNo, setSchoolNo] = useState('');
  const [studentTc, setStudentTc] = useState('');
  
  // Admin Form State
  const [adminTc, setAdminTc] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (loginType === 'admin') {
        // Mock Admin Login (Database for admins usually separate or specific logic)
        // For simplicity, we keep the hardcoded admin check or you could query an 'admins' table
        if (adminTc === '11111111111' && adminPassword) {
             const adminUser: SessionUser = {
                 role: UserRole.ADMIN,
                 name: "Okul Müdürü"
             };
             onLogin(adminUser);
             navigate('/admin');
        } else {
             throw new Error("Hatalı yönetici bilgileri.");
        }
      } else {
        // Supabase Student Login
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('school_no', schoolNo)
            .single();

        if (error || !data) {
            throw new Error("Öğrenci bulunamadı. Okul numarasını kontrol ediniz.");
        }

        // Optional: Verify TC No if needed security-wise
        // if (data.tc_no !== studentTc) throw new Error("TC Kimlik No uyuşmuyor.");

        const matchedUser: SessionUser = {
             role: UserRole.CUSTOMER,
             name: data.parent_name,
             studentId: data.id,
             studentName: `${data.name} ${data.surname}`,
             grade: data.full_class
        };
        
        onLogin(matchedUser);
        navigate('/');
      }
    } catch (err: any) {
        setError(err.message || "Giriş yapılamadı.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-900 rounded-xl flex items-center justify-center shadow-md">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Okul Yönetim Sistemi
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Lütfen giriş yapmak için uygun seçeneği belirtiniz.
          </p>
        </div>

        {/* Login Type Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => { setLoginType('student'); setError(null); }}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
              loginType === 'student'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            Veli / Öğrenci
          </button>
          <button
            onClick={() => { setLoginType('admin'); setError(null); }}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
              loginType === 'admin'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserCog className="w-4 h-4 mr-2" />
            Yönetici
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
          )}

          {loginType === 'student' ? (
            /* Student/Parent Login Form */
            <div className="space-y-4">
              <div>
                <label htmlFor="schoolNo" className="block text-xs font-medium text-gray-700 mb-1">Okul Numarası</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="schoolNo"
                    type="number"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="1234"
                    value={schoolNo}
                    onChange={(e) => setSchoolNo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="studentTc" className="block text-xs font-medium text-gray-700 mb-1">T.C. Kimlik Numarası</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="studentTc"
                    type="text"
                    maxLength={11}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Opsiyonel"
                    value={studentTc}
                    onChange={(e) => setStudentTc(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Admin Login Form */
            <div className="space-y-4">
               <div>
                <label htmlFor="adminTc" className="block text-xs font-medium text-gray-700 mb-1">Yönetici T.C. Kimlik No</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCog className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="adminTc"
                    type="text"
                    required
                    maxLength={11}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="11111111111"
                    value={adminTc}
                    onChange={(e) => setAdminTc(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">Şifre</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-900 hover:bg-indigo-800'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm`}
            >
              {loading ? 'Sisteme Bağlanılıyor...' : (loginType === 'student' ? 'Giriş Yap' : 'Yönetici Girişi Yap')}
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">veya</span>
            </div>
          </div>

          <div className="mt-4">
             <Link to="/register" className="w-full flex justify-center items-center py-2 px-4 border border-indigo-900 rounded-md shadow-sm text-sm font-medium text-indigo-900 bg-white hover:bg-gray-50 transition-colors">
                <UserPlus className="w-4 h-4 mr-2" />
                Yeni Öğrenci Kaydı Oluştur
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;