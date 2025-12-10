import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Save, AlertCircle, CheckCircle, Users } from 'lucide-react';

// Mock Capacity Data
// In a real app, this comes from the backend.
const CLASS_CAPACITIES: Record<string, number> = {
    '1-A': 35, // Full
    '1-B': 30,
    '1-C': 12,
    '1-D': 0,
    '1-E': 0,
    '5-A': 32,
    '5-B': 35, // Full
    '5-C': 20,
    '8-A': 34,
};

const MAX_CAPACITY = 35;
const EXISTING_IDS = [1234, 5678, 1001]; // Mock existing school numbers

const Register: React.FC = () => {
    const navigate = useNavigate();
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
    
    const [generatedSchoolNo, setGeneratedSchoolNo] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Calculate current selection key (e.g., "5-A")
    const currentClassKey = `${formData.grade}-${formData.branch}`;
    const currentCount = CLASS_CAPACITIES[currentClassKey] || 0;
    const isFull = currentCount >= MAX_CAPACITY;

    const generateUniqueSchoolNo = (): number => {
        let unique = false;
        let newId = 0;
        while (!unique) {
            // Generate random 6 digit number (between 100000 and 999999) 
            // Or simplified 4-6 digits as requested "max 6 digits"
            newId = Math.floor(1000 + Math.random() * 9000); // Sample range 1000-9999
            if (!EXISTING_IDS.includes(newId)) {
                unique = true;
            }
        }
        return newId;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isFull) {
            setError(`Seçilen sınıf (${currentClassKey}) kontenjanı doludur. Lütfen başka bir şube seçiniz.`);
            return;
        }

        if (formData.studentTc.length !== 11 || formData.parentPhone.length !== 11) {
             setError("TC Kimlik No veya Telefon numarası 11 hane olmalıdır.");
             return;
        }

        // Simulate Registration Process
        const newSchoolNo = generateUniqueSchoolNo();
        setGeneratedSchoolNo(newSchoolNo);
        setSuccess(true);
        
        // In a real app, we would POST this data to the backend here.
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
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    
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
                                <span className="text-sm text-gray-500">Kontenjan:</span>
                                <span className={`font-bold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                                    {currentCount} / {MAX_CAPACITY}
                                </span>
                                {isFull && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        DOLU
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4">
                        <button type="button" onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-900 font-medium">
                            İptal
                        </button>
                        <button 
                            type="submit" 
                            disabled={isFull}
                            className={`flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white shadow-sm transition-colors ${
                                isFull ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }`}
                        >
                            <Save className="w-5 h-5" />
                            Kaydı Tamamla
                        </button>
                    </div>
                </form>
             </div>
        </div>
    );
};

export default Register;