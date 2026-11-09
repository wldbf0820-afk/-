import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, User, BookOpen, Clock, AlertCircle, 
  CheckCircle2, Trash2, Filter, Sparkles, UserCheck, ShieldCheck, 
  RefreshCw, Settings, X, Lock, Unlock, Key, LogOut
} from 'lucide-react';

export default function App() {
  // 10명의 담당 선생님 목록
  const teachers = [
    '송정용', '김륜형', '장연주', '김수현', '조윤희', 
    '이완준', '임보미', '김민혁', '김광태', '빙선주'
  ];

  // 시간대 설정 (30분 단위)
  const timeSlots = ['2:30', '3:00', '3:30', '4:00', '4:30', '5:00'];

  // 기본 선생님별 타임당 정원 (기본값 3명)
  const defaultTeacherCapacities = {
    '송정용': 3, '김륜형': 3, '장연주': 4, '김수현': 3, '조윤희': 3,
    '이완준': 3, '임보미': 3, '김민혁': 3, '김광태': 3, '빙선주': 3
  };

  // 관리자 기능 관련 상태
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem('onedu_clinic_admin_pw') || '1234';
  });
  const [inputPw, setInputPw] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangePwOpen, setIsChangePwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');

  // 닫힌(차단된) 날짜 및 시간대 상태 관리
  // 구조: { '2026-10-02': { slots: ['2:30', '3:00'], isDateLocked: false } }
  const [closedSchedule, setClosedSchedule] = useState(() => {
    try {
      const savedClosed = localStorage.getItem('onedu_clinic_closed_schedule');
      if (savedClosed) return JSON.parse(savedClosed);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // 선생님별 정원 설정 상태
  const [teacherCapacities, setTeacherCapacities] = useState(() => {
    try {
      const savedCaps = localStorage.getItem('onedu_clinic_teacher_capacities');
      if (savedCaps) return JSON.parse(savedCaps);
    } catch (e) {
      console.error(e);
    }
    return defaultTeacherCapacities;
  });

  useEffect(() => {
    try {
      localStorage.setItem('onedu_clinic_teacher_capacities', JSON.stringify(teacherCapacities));
    } catch (e) {
      console.error(e);
    }
  }, [teacherCapacities]);

  useEffect(() => {
    try {
      localStorage.setItem('onedu_clinic_closed_schedule', JSON.stringify(closedSchedule));
    } catch (e) {
      console.error(e);
    }
  }, [closedSchedule]);

  // 오늘 날짜 구하기 (YYYY-MM-DD)
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeDate, setActiveDate] = useState(todayStr);
  const [filterTeacher, setFilterTeacher] = useState('전체');

  // 초기 더미 데이터
  const initialMockData = {
    [todayStr]: {
      '3:00': [
        { id: 101, name: '이신성', ban: 'A2T', teacher: '빙선주', reason: '지시문/어휘', createdAt: '14:02' },
        { id: 102, name: '이마리', ban: 'A2T', teacher: '송정용', reason: '9/28일자 클리 재시험', createdAt: '14:05' },
        { id: 103, name: '이민준', ban: 'A2T', teacher: '송정용', reason: '9/28일자 클리 재시험', createdAt: '14:10' },
        { id: 104, name: '이예림', ban: 'A3T', teacher: '장연주', reason: '9/21,28일자 클리재시험', createdAt: '14:12' },
        { id: 105, name: '이서연', ban: 'A3T', teacher: '장연주', reason: '9/21일자 클리재시험', createdAt: '14:15' }
      ],
      '3:30': [
        { id: 106, name: '주은채', ban: '4T', teacher: '장연주', reason: '클리 단어 시험', createdAt: '14:20' }
      ],
      '4:00': [
        { id: 107, name: '김제인', ban: '6T', teacher: '임보미', reason: '영시 단어 시험', createdAt: '14:25' },
        { id: 108, name: '박다솔', ban: '6T', teacher: '임보미', reason: '영시 단어재시험', createdAt: '14:28' }
      ],
      '4:30': [
        { id: 109, name: '곽리윤', ban: 'A2T', teacher: '빙선주', reason: '리딩어휘 및 문장', createdAt: '14:30' }
      ]
    }
  };

  // LocalStorage 저장 및 불러오기
  const [reservations, setReservations] = useState(() => {
    try {
      const savedData = localStorage.getItem('onedu_clinic_reservations_v4');
      if (savedData) return JSON.parse(savedData);
    } catch (e) {
      console.error('LocalStorage load error', e);
    }
    return initialMockData;
  });

  useEffect(() => {
    try {
      localStorage.setItem('onedu_clinic_reservations_v4', JSON.stringify(reservations));
    } catch (e) {
      console.error('LocalStorage save error', e);
    }
  }, [reservations]);

  // 입력 폼 상태
  const [formData, setFormData] = useState({
    time: '2:30',
    studentName: '',
    ban: '',
    teacher: teachers[0],
    reason: ''
  });

  // 토스트 알림 상태
  const [toastMessage, setToastMessage] = useState(null);

  const showNotification = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 관리자 로그인 처리
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (inputPw === adminPassword) {
      setIsAdminLoggedIn(true);
      setIsLoginModalOpen(false);
      setInputPw('');
      showNotification('관리자 모드로 로그인 되었습니다.', 'success');
    } else {
      showNotification('비밀번호가 올바르지 않습니다.', 'error');
    }
  };

  // 관리자 비밀번호 변경
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newPw.trim()) {
      showNotification('새 비밀번호를 입력해주세요.', 'error');
      return;
    }
    setAdminPassword(newPw);
    localStorage.setItem('onedu_clinic_admin_pw', newPw);
    setNewPw('');
    setIsChangePwOpen(false);
    showNotification('관리자 비밀번호가 변경되었습니다.', 'success');
  };

  // 관리자 로그아웃
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    showNotification('관리자 모드가 해제되었습니다.', 'info');
  };

  // 특정 날짜 전체 잠금/열기 토글 (관리자 기능)
  const toggleDateLock = (dateStr) => {
    if (!isAdminLoggedIn) return;
    setClosedSchedule(prev => {
      const current = prev[dateStr] || { slots: [], isDateLocked: false };
      return {
        ...prev,
        [dateStr]: {
          ...current,
          isDateLocked: !current.isDateLocked
        }
      };
    });
    const nowLocked = !(closedSchedule[dateStr]?.isDateLocked);
    showNotification(`${dateStr} 날짜 예약이 ${nowLocked ? '닫힘(마감)' : '열림(오픈)'} 처리되었습니다.`, nowLocked ? 'error' : 'success');
  };

  // 특정 시간대 잠금/열기 토글 (관리자 기능)
  const toggleSlotLock = (dateStr, slotTime) => {
    if (!isAdminLoggedIn) return;
    setClosedSchedule(prev => {
      const current = prev[dateStr] || { slots: [], isDateLocked: false };
      const exists = current.slots.includes(slotTime);
      const newSlots = exists 
        ? current.slots.filter(s => s !== slotTime)
        : [...current.slots, slotTime];

      return {
        ...prev,
        [dateStr]: {
          ...current,
          slots: newSlots
        }
      };
    });
  };

  // 날짜 조회
  const handleDateSearch = (e) => {
    e.preventDefault();
    setActiveDate(selectedDate);
    showNotification(`${selectedDate} 날짜 예약표 조회가 완료되었습니다.`, 'info');
  };

  // 폼 입력 관리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 선생님 정원 변경
  const handleCapacityChange = (tName, val) => {
    const num = parseInt(val, 10) || 1;
    setTeacherCapacities(prev => ({
      ...prev,
      [tName]: Math.max(1, Math.min(20, num))
    }));
  };

  // 특정 시간대나 날짜가 차단(닫힘)되어 있는지 확인
  const isDateLocked = closedSchedule[activeDate]?.isDateLocked;
  const isSlotLocked = (slot) => isDateLocked || (closedSchedule[activeDate]?.slots || []).includes(slot);

  // 학생 선착순 예약 신청
  const handleReserveSubmit = (e) => {
    e.preventDefault();

    // 닫힌 날짜나 시간대 체크
    if (isSlotLocked(formData.time)) {
      showNotification(`현재 선택하신 날짜/시간대는 예약이 닫혀(마감)있습니다. 선생님 문의 부탁드립니다.`, 'error');
      return;
    }

    if (!formData.studentName.trim()) {
      showNotification('학생 이름을 입력해 주세요.', 'error');
      return;
    }
    if (!formData.ban.trim()) {
      showNotification('반 정보(예: A2T, 6T)를 입력해 주세요.', 'error');
      return;
    }

    const currentDateSlotList = reservations[activeDate]?.[formData.time] || [];
    const teacherSlotReservations = currentDateSlotList.filter(item => item.teacher === formData.teacher);
    const teacherMaxCapacity = teacherCapacities[formData.teacher] || 3;

    // 선착순 정원 마감 검사
    if (teacherSlotReservations.length >= teacherMaxCapacity) {
      showNotification(`[선착순 마감] ${formData.teacher} 선생님의 ${formData.time} 시간대는 정원(${teacherMaxCapacity}명)이 마감되었습니다.`, 'error');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntry = {
      id: Date.now(),
      name: formData.studentName.trim(),
      ban: formData.ban.trim().toUpperCase(),
      teacher: formData.teacher,
      reason: formData.reason.trim() || '추가학습 진행',
      createdAt: timeStr
    };

    setReservations(prev => {
      const dateReservations = prev[activeDate] || {};
      const slotReservations = dateReservations[formData.time] || [];
      return {
        ...prev,
        [activeDate]: {
          ...dateReservations,
          [formData.time]: [...slotReservations, newEntry]
        }
      };
    });

    showNotification(`[예약 완료] ${formData.studentName} 학생 (${formData.teacher} 선생님 / ${formData.time})`, 'success');

    setFormData(prev => ({
      ...prev,
      studentName: '',
      ban: '',
      reason: ''
    }));
  };

  // 예약 취소
  const handleCancelReservation = (slotTime, id, name) => {
    setReservations(prev => {
      const dateReservations = prev[activeDate] || {};
      const slotReservations = dateReservations[slotTime] || [];
      const updatedSlot = slotReservations.filter(item => item.id !== id);

      return {
        ...prev,
        [activeDate]: {
          ...dateReservations,
          [slotTime]: updatedSlot
        }
      };
    });
    showNotification(`${name} 학생의 예약을 취소하였습니다.`, 'info');
  };

  // 초기화 기능 (관리자 전용)
  const handleResetData = () => {
    if (!isAdminLoggedIn) {
      showNotification('초기화는 관리자 모드에서만 가능합니다.', 'error');
      return;
    }
    if (window.confirm('전체 예약 및 정원 설정을 초기화하시겠습니까?')) {
      setReservations(initialMockData);
      setTeacherCapacities(defaultTeacherCapacities);
      setClosedSchedule({});
      localStorage.removeItem('onedu_clinic_reservations_v4');
      localStorage.removeItem('onedu_clinic_teacher_capacities');
      localStorage.removeItem('onedu_clinic_closed_schedule');
      showNotification('데이터가 초기화되었습니다.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#ecebe6] text-gray-800 p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* 토스트 알림 */}
        {toastMessage && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all transform animate-bounce ${
            toastMessage.type === 'error' ? 'bg-red-600 text-white' :
            toastMessage.type === 'success' ? 'bg-emerald-700 text-white' :
            'bg-gray-900 text-white'
          }`}>
            {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            {toastMessage.type === 'info' && <Sparkles className="w-5 h-5 flex-shrink-0 text-yellow-400" />}
            <span>{toastMessage.msg}</span>
          </div>
        )}

        {/* 관리자 로그인 모달 */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  관리자 비밀번호 인증
                </h3>
                <button onClick={() => setIsLoginModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">비밀번호 (초기: 1234)</label>
                  <input
                    type="password"
                    value={inputPw}
                    onChange={(e) => setInputPw(e.target.value)}
                    placeholder="비밀번호 입력"
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800 font-bold py-2.5 rounded-xl text-sm transition-all"
                >
                  인증 및 로그인
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 비밀번호 변경 모달 */}
        {isChangePwOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  관리자 비밀번호 변경
                </h3>
                <button onClick={() => setIsChangePwOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">새 비밀번호</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="새 비밀번호 입력"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
                >
                  비밀번호 저장
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 선생님별 정원 관리 모달 */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  선생님별 타임당 정원 설정 (관리자)
                </h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4 font-medium">
                각 선생님별로 한 타임(30분)에 수용 가능한 최대 정원을 지정할 수 있습니다.
              </p>
              <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {teachers.map(t => (
                  <div key={t} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <span className="text-sm font-bold text-gray-800">{t} 선생님</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={teacherCapacities[t] || 3}
                        onChange={(e) => handleCapacityChange(t, e.target.value)}
                        className="w-14 bg-white border border-gray-300 text-center font-extrabold text-sm py-1 rounded-lg focus:ring-2 focus:ring-black outline-none"
                      />
                      <span className="text-xs font-semibold text-gray-500">명</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="bg-black text-white hover:bg-gray-800 font-bold px-5 py-2 rounded-xl text-sm transition-all"
                >
                  확인 및 저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상단 헤더 */}
        <header className="border-b border-gray-300/80 pb-3 flex flex-wrap justify-between items-end gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
              <span>온에듀 클리닉 예약</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              30분 단위 · 온에듀 학원 클리닉 시간대별/선생님별 선착순 예약 시스템
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 관리자 접속 중
                </span>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-600" /> 정원 변경
                </button>
                <button
                  onClick={() => setIsChangePwOpen(true)}
                  className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Key className="w-3.5 h-3.5 text-yellow-600" /> 비번 변경
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> 로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-yellow-400" /> 관리자 로그인
              </button>
            )}

            {isAdminLoggedIn && (
              <button
                onClick={handleResetData}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 underline decoration-dotted ml-2"
              >
                <RefreshCw className="w-3 h-3" /> 전체 초기화
              </button>
            )}
          </div>
        </header>

        {/* 날짜 선택 / 관리자 날짜 차단 제어 바 */}
        <div className="bg-[#e2e0d9] p-3.5 sm:p-4 rounded-xl shadow-sm border border-gray-300/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <form onSubmit={handleDateSearch} className="flex items-center gap-2 flex-wrap">
              <label htmlFor="clinic-date-input" className="font-bold text-gray-800 text-sm whitespace-nowrap flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-700" />
                선택 날짜:
              </label>
              <input
                id="clinic-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-inner focus:ring-2 focus:ring-black outline-none"
              />
              <button
                type="submit"
                className="bg-black text-white hover:bg-gray-800 px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 shadow active:scale-95"
              >
                <Search className="w-3.5 h-3.5" />
                조회
              </button>
            </form>

            {/* 관리자 모드 전용: 날짜 전체 예약 열기/닫기 스위치 */}
            {isAdminLoggedIn && (
              <button
                onClick={() => toggleDateLock(activeDate)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border shadow-xs transition-all ${
                  isDateLocked
                    ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                    : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                }`}
              >
                {isDateLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> [관리자] {activeDate} 전체 닫힘 (클릭하여 예약 오픈)
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> [관리자] {activeDate} 예약 오픈 중 (클릭하여 닫기)
                  </>
                )}
              </button>
            )}
          </div>

          {/* 선생님 필터 Dropdown */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-gray-600">선생님 필터:</span>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs font-semibold text-gray-800 outline-none"
            >
              <option value="전체">전체 선생님</option>
              {teachers.map(t => (
                <option key={t} value={t}>{t} 선생님 (정원:{teacherCapacities[t]}명)</option>
              ))}
            </select>
          </div>
        </div>

        {/* 학생 예약 신청 바 */}
        <div className={`p-4 rounded-xl shadow-sm border transition-all ${
          isDateLocked 
            ? 'bg-red-50/70 border-red-200' 
            : 'bg-[#e2e0d9] border-gray-300/90'
        }`}>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-gray-800" />
              학생 예약 신청 (선착순 자동 마감)
            </h2>
            {isDateLocked && (
              <span className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3" /> 관리자에 의해 현재 날짜의 예약 신청이 닫혀있습니다.
              </span>
            )}
          </div>

          <form onSubmit={handleReserveSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2">
            
            {/* 시간대 선택 */}
            <div className="lg:col-span-2">
              <select
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                disabled={isDateLocked}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:text-gray-400"
              >
                {timeSlots.map(slot => {
                  const locked = isSlotLocked(slot);
                  return (
                    <option key={slot} value={slot}>
                      {slot} {locked ? '(마감/닫힘)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 학생 이름 */}
            <div className="lg:col-span-2">
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                disabled={isDateLocked}
                placeholder="학생 이름"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-black placeholder-gray-400 disabled:bg-gray-100"
              />
            </div>

            {/* 반 이름 */}
            <div className="lg:col-span-2">
              <input
                type="text"
                name="ban"
                value={formData.ban}
                onChange={handleInputChange}
                disabled={isDateLocked}
                placeholder="반 (예: A2T)"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-black placeholder-gray-400 disabled:bg-gray-100"
              />
            </div>

            {/* 담당 선생님 Dropdown */}
            <div className="lg:col-span-2">
              <select
                name="teacher"
                value={formData.teacher}
                onChange={handleInputChange}
                disabled={isDateLocked}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100"
              >
                {teachers.map(t => {
                  const currentCount = (reservations[activeDate]?.[formData.time] || []).filter(item => item.teacher === t).length;
                  const maxCap = teacherCapacities[t] || 3;
                  const isFull = currentCount >= maxCap;
                  return (
                    <option key={t} value={t} disabled={isFull}>
                      {t} 선생님 {isFull ? '(정원마감)' : `(${currentCount}/${maxCap}명)`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 학습 사유 */}
            <div className="lg:col-span-3">
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                disabled={isDateLocked}
                placeholder="학습 사유 예: 단어 재시험"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-black placeholder-gray-400 disabled:bg-gray-100"
              />
            </div>

            {/* 예약 제출 버튼 */}
            <div className="lg:col-span-1">
              <button
                type="submit"
                disabled={isDateLocked}
                className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-black py-2 px-3 rounded-lg text-sm transition-all shadow active:scale-95"
              >
                예약
              </button>
            </div>
          </form>
        </div>

        {/* 시간대별 현황 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timeSlots.map(slot => {
            const rawList = reservations[activeDate]?.[slot] || [];
            const filteredList = filterTeacher === '전체' 
              ? rawList 
              : rawList.filter(item => item.teacher === filterTeacher);

            const totalCount = rawList.length;
            const lockedSlot = isSlotLocked(slot);

            return (
              <div 
                key={slot} 
                className={`rounded-xl border p-4 flex flex-col justify-between shadow-sm transition-all ${
                  lockedSlot 
                    ? 'bg-gray-200/90 border-gray-400/80 opacity-90' 
                    : 'bg-[#e2e0d9] border-gray-300/90'
                }`}
              >
                <div>
                  {/* 카드 상단 시간 및 제어 버튼 */}
                  <div className="pb-2 border-b border-gray-300/80 mb-3">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black tracking-tight text-gray-900">{slot}</span>
                        {lockedSlot && (
                          <span className="text-[11px] font-bold bg-red-600 text-white px-2 py-0.5 rounded flex items-center gap-0.5">
                            <Lock className="w-3 h-3" /> 닫힘
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* 관리자 모드 개별 시간대 열기/닫기 버튼 */}
                        {isAdminLoggedIn && (
                          <button
                            onClick={() => toggleSlotLock(activeDate, slot)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                              lockedSlot 
                                ? 'bg-emerald-600 text-white border-emerald-700' 
                                : 'bg-gray-700 text-white border-gray-800'
                            }`}
                          >
                            {lockedSlot ? '열기' : '타임 닫기'}
                          </button>
                        )}
                        <span className="text-xs font-semibold text-gray-700 bg-gray-200/90 px-2 py-0.5 rounded-full border border-gray-300">
                          총 {totalCount}명
                        </span>
                      </div>
                    </div>

                    {/* 선생님별 정원 현황 요약 태그 */}
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold">
                      {teachers.map(t => {
                        const countForT = rawList.filter(i => i.teacher === t).length;
                        const maxCapForT = teacherCapacities[t] || 3;
                        const isTFull = countForT >= maxCapForT;
                        
                        if (filterTeacher !== '전체' && filterTeacher !== t) return null;
                        
                        return (
                          <span 
                            key={t}
                            className={`px-1.5 py-0.5 rounded border ${
                              isTFull 
                                ? 'bg-red-100 text-red-700 border-red-300 font-bold' 
                                : countForT > 0 
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                  : 'bg-white/60 text-gray-500 border-gray-200'
                            }`}
                          >
                            {t}: {countForT}/{maxCapForT}명 {isTFull && '(마감)'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* 예약 리스트 */}
                  {filteredList.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-gray-400 text-xs font-medium">
                      {lockedSlot ? '예약이 닫혀있는 시간대입니다.' : (filterTeacher !== '전체' ? `${filterTeacher} 선생님 예약 없음` : '예약 학생 없음')}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {filteredList.map(item => (
                        <div 
                          key={item.id} 
                          className="bg-[#e8e7e1] p-2.5 rounded-lg border border-gray-300/70 flex items-center justify-between text-xs hover:bg-white transition-colors"
                        >
                          <div className="space-y-1 flex-1 pr-2">
                            <div className="flex items-center gap-1.5 font-bold text-gray-900 flex-wrap">
                              <span className="text-sm font-extrabold">{item.name}</span>
                              <span className="text-[11px] font-semibold text-gray-600 bg-gray-200 px-1.5 py-0.2 rounded">
                                {item.ban}
                              </span>
                              <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-100/70 px-1.5 py-0.2 rounded border border-indigo-200">
                                {item.teacher}
                              </span>
                            </div>
                            <p className="text-gray-600 font-normal line-clamp-1">
                              {item.reason}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCancelReservation(slot, item.id, item.name)}
                            className="bg-gray-300/80 hover:bg-red-600 hover:text-white text-gray-700 px-2 py-1 rounded text-[11px] font-semibold transition-all flex-shrink-0"
                            title="예약 취소"
                          >
                            취소
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 푸터 안내 */}
        <footer className="bg-[#e2e0d9] p-3 rounded-xl border border-gray-300/80 text-xs text-gray-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-800">온에듀 클리닉 선생님 목록:</span>
            {teachers.map(t => (
              <span key={t} className="bg-white/80 px-2 py-0.5 rounded border border-gray-300 text-gray-700">
                {t} ({teacherCapacities[t]}명)
              </span>
            ))}
          </div>
          <div className="text-gray-500 text-[11px]">
            * 관리자는 우측 상단 로그인 후 온에듀 클리닉 타임별/선생님별 정원 및 예약 오픈/마감을 자유롭게 제어할 수 있습니다.
          </div>
        </footer>

      </div>
    </div>
  );
}