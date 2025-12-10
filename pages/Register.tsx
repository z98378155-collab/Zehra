import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Save, AlertCircle, CheckCircle, Users, Lock, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../services/supabase';

const MAX_CAPACITY = 35;

const Register: React.FC = () => {
    const navigate = useNavigate();
    
    // Form Data State
    const [formData, setFormData] = useState({
        parentName: '',
        parentSurname: '',
        parentPhone: '',
        studentName: '',
        studentSurname: '',
        studentTc: '',
        gender: 'male',
        grade: '1',
        branch: 'A'
    });

    // Admin Auth State
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminCredentials, setAdminCredentials] = useState({
        tc: '',
        password: ''
    });
    
    // System State
    const [generatedSchoolNo, setGeneratedSchoolNo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Calculate current selection key (e.g., "5-A")
    const currentClassKey = `${formData.grade}-${formData.branch}`;

    const generateUniqueSchoolNo = async (): Promise<string> => {
        let unique = false;
        let newId = "";
        while (!unique) {
            // Generate random 4 digit number for simplicity
            const num = Math.floor(1000 + Math.random() * 9000); 
            newId = num.toString();
            
            const { data } = await supabase
                .from('students')
                .select('id')
                .eq('school_no', newId);
            
            if (!data || data.length === 0) {
                unique = true;
            }
        }
        return newId;
    };

    // 1. Initial Form Validation
    const handleInitialSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setAuthError(null);

        if (formData.studentTc.length !== 11 || formData.parentPhone.length !== 11) {
             setError("TC Kimlik No veya Telefon numarası 11 hane olmalıdır.");
             return;
        }

        // Open Admin Verification Modal
        setShowAdminModal(true);
    };

    // 2. Admin Verification and Registration Logic
    const verifyAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setLoading(true);

        // --- ADMIN SECURITY CHECK ---
        // In a real app, this would be a server-side check or a specific auth API call.
        // Replicating the logic from Login.tsx for consistency:
        if (adminCredentials.tc !== '11111111111' || !adminCredentials.password) {
            setAuthError("Yetkisiz işlem! Geçersiz yönetici bilgileri.");
            setLoading(false);
            return;
        }
        // -----------------------------

        try {
            // 1. Check Capacity
            const { count, error: countError } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('full_class', currentClassKey);

            if (countError) throw countError;

            if (count !== null && count >= MAX_CAPACITY) {
                setError(`Seçilen sınıf (${currentClassKey}) kontenjanı doludur (${count}/${MAX_CAPACITY}). Lütfen başka bir şube seçiniz.`);
                setShowAdminModal(false); // Close modal to let user change branch
                setLoading(false);
                return;
            }

            // 2. Generate School No
            const newSchoolNo = await generateUniqueSchoolNo();

            // 3. Insert Student
            const { data: studentData, error: insertError } = await supabase
                .from('students')
                .insert([
                    {
                        name: formData.studentName,
                        surname: formData.studentSurname,
                        parent_name: `${formData.parentName} ${formData.parentSurname}`,
                        phone: formData.parentPhone,
                        tc_no: formData.studentTc,
                        school_no: newSchoolNo,
                        gender: formData.gender,
                        grade_level: formData.grade,
                        branch: formData.branch,
                        full_class: currentClassKey
                    }
                ])
                .select()
                .single();

            if (insertError) throw insertError;

            // 4. Create Initial Financial Record (Default Fees)
            if (studentData) {
                await supabase.from('financial_records').insert([
                    {
                        student_id: studentData.id,
                        tuition_fee: 150000,
                        material_fee: 35000,
                        paid_amount: 0
                    }
                ]);
            }

            setGeneratedSchoolNo(newSchoolNo);
            setSuccess(true);
            setShowAdminModal(false);

        } catch (err: any) {
            console.error(err);
            setAuthError(err.message || "Kayıt sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    if (success && generatedSchoolNo) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Kayıt Başarılı!</h2>
                    <p className="text-gray-600 mb-6">Öğrenci sisteme başarıyla kaydedilmiştir.</p>
                    
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6">
                        <p className="text-sm text-indigo-800 font-medium uppercase tracking-wide">Atanan Okul Numarası</p>
                        <p className="text-4xl font-extrabold text-indigo-900 mt-2">{generatedSchoolNo}</p>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">
                        Lütfen bu numarayı not ediniz. Veli girişi için okul numarası kullanılacaktır.
                    </p>

                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full bg-indigo-900 text-white py-3 rounded-md hover:bg-indigo-800 transition-colors font-medium"
                    >
                        Giriş Ekranına Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
             <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-indigo-900 px-8 py-6">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <UserPlus className="w-8 h-8" />
                        Yeni Öğrenci Kayıt Formu
                    </h1>
                    <p className="text-indigo-200 mt-2 text-sm">
                        Lütfen öğrenci ve veli bilgilerini eksiksiz doldurunuz.
                    </p>
                </div>

                <form onSubmit={handleInitialSubmit} className="p-8 space-y-8">
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {/* Veli Bilgileri */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Veli Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Veli Adı</label>
                                <input required type="text" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" 
                                    value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} placeholder="Ahmet" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Veli Soyadı</label>
                                <input required type="text" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" 
                                    value={formData.parentSurname} onChange={e => setFormData({...formData, parentSurname: e.target.value})} placeholder="Yılmaz" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Veli Cep Telefonu</label>
                                <input required type="tel" maxLength={11} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" 
                                    value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} placeholder="05XXXXXXXXX" />
                            </div>
                        </div>
                    </div>

                    {/* Öğrenci Bilgileri */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Öğrenci Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Adı</label>
                                <input required type="text" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" 
                                    value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} placeholder="Can" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Soyadı</label>
                                <input required type="text" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" 
                                    value={formData.studentSurname} onChange={e => setFormData({...formData, studentSurname: e.target.value})} placeholder="Yılmaz" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">T.C. Kimlik No</label>
                                <input required type="text" maxLength={11} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2" 
                                    value={formData.studentTc} onChange={e => setFormData({...formData, studentTc: e.target.value})} placeholder="11111111111" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
                                <select className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2"
                                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                    <option value="male">Erkek</option>
                                    <option value="female">Kız</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sınıf Seçimi */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Sınıf ve Şube Seçimi
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf (Kademe)</label>
                                <select className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2"
                                    value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                                        <option key={g} value={g}>{g}. Sınıf</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Şube</label>
                                <select className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2"
                                    value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                                    {['A', 'B', 'C', 'D', 'E'].map(b => (
                                        <option key={b} value={b}>{b} Şubesi</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                            <div>
                                <span className="text-sm font-medium text-gray-600">Seçilen Sınıf: </span>
                                <span className="text-lg font-bold text-indigo-900 ml-1">{currentClassKey}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Kapasite:</span>
                                <span className="font-bold text-gray-700">
                                     Max {MAX_CAPACITY}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4">
                        <button type="button" onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-900 font-medium">
                            İptal
                        </button>
                        <button 
                            type="submit" 
                            className="flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Save className="w-5 h-5" />
                            Kaydı Tamamla
                        </button>
                    </div>
                </form>
             </div>

             {/* ADMIN VERIFICATION MODAL */}
             {showAdminModal && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                     <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                         <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
                             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                 <ShieldCheck className="w-5 h-5" />
                                 Yönetici Onayı Gerekiyor
                             </h3>
                             <button onClick={() => setShowAdminModal(false)} className="text-white/80 hover:text-white">
                                 <X className="w-5 h-5" />
                             </button>
                         </div>
                         
                         <form onSubmit={verifyAndRegister} className="p-6 space-y-4">
                             <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-800 mb-4">
                                 Güvenlik gereği yeni öğrenci kaydı oluşturmak için yönetici kimliğinizi doğrulamanız gerekmektedir.
                             </div>

                             {authError && (
                                <div className="text-sm text-red-600 font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {authError}
                                </div>
                             )}

                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Yönetici T.C. Kimlik No</label>
                                 <div className="relative">
                                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                         <Users className="h-4 w-4 text-gray-400" />
                                     </div>
                                     <input 
                                         type="text" 
                                         required 
                                         maxLength={11}
                                         className="w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 border p-2"
                                         value={adminCredentials.tc}
                                         onChange={e => setAdminCredentials({...adminCredentials, tc: e.target.value})}
                                         placeholder="11111111111"
                                     />
                                 </div>
                             </div>

                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Yönetici Şifresi</label>
                                 <div className="relative">
                                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                         <Lock className="h-4 w-4 text-gray-400" />
                                     </div>
                                     <input 
                                         type="password" 
                                         required 
                                         className="w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 border p-2"
                                         value={adminCredentials.password}
                                         onChange={e => setAdminCredentials({...adminCredentials, password: e.target.value})}
                                         placeholder="••••••"
                                     />
                                 </div>
                             </div>

                             <div className="pt-2 flex justify-end gap-3">
                                 <button 
                                     type="button" 
                                     onClick={() => setShowAdminModal(false)}
                                     className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                 >
                                     İptal
                                 </button>
                                 <button 
                                     type="submit" 
                                     disabled={loading}
                                     className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors disabled:bg-gray-400"
                                 >
                                     {loading ? 'Doğrulanıyor...' : 'Doğrula ve Kaydet'}
                                 </button>
                             </div>
                         </form>
                     </div>
                 </div>
             )}
        </div>
    );
};

export default Register;