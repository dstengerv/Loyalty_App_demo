import React, { useState } from 'react';
import {
  LogOut,
  QrCode,
  User,
  Check,
  Users,
  Camera,
  Clock,
  Search,
  Gift,
  Settings,
  Lock,
  AlertCircle,
  Plus,
  History,
} from 'lucide-react';
import { User as UserType, Transaction, RewardItem, QRVoucher } from '../types';

interface StaffDashboardProps {
  staffUser: UserType;
  registeredUsers: UserType[];
  transactions: Transaction[];
  vouchers: QRVoucher[];
  onOpenScanner: () => void;
  onAddPoints: (userQrCode: string, points: number, description: string) => void;
  onGenerateVoucher: (points: number, description: string) => void;
  onLogout: () => void;
  onResetClientStamps?: (userQrCode: string) => void;
  stampSymbol: string;
  brandBrown: string;
  brandGold: string;
  brandBg: string;
  settingsPin: string;
  logoUrl: string;
  logoHeight: number;
  cardBgUrl: string;
  onUpdateSettings: (stamp: string, brown: string, gold: string, bg: string, newPin: string, logoUrl: string, logoHeight: number, cardBgUrl: string) => void;
}

// "HACE X DÍAS" helper for last visit labels
function daysAgoLabel(dateStr?: string): string {
  if (!dateStr) return 'Sin visitas';
  const then = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
}

export default function StaffDashboard({
  staffUser,
  registeredUsers,
  transactions,
  vouchers,
  onOpenScanner,
  onAddPoints,
  onGenerateVoucher,
  onLogout,
  onResetClientStamps,
  stampSymbol,
  brandBrown,
  brandGold,
  brandBg,
  settingsPin,
  logoUrl,
  logoHeight,
  cardBgUrl,
  onUpdateSettings,
}: StaffDashboardProps) {
  // Tabs: 'control' (check-in / scan) and 'users' (CRM list)
  const [activeTab, setActiveTab] = useState<'control' | 'users'>('control');

  // Settings & Security PIN States
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tempStamp, setTempStamp] = useState<string>(stampSymbol);
  const [tempBrown, setTempBrown] = useState<string>(brandBrown);
  const [tempGold, setTempGold] = useState<string>(brandGold);
  const [tempBg, setTempBg] = useState<string>(brandBg);
  const [tempPin, setTempPin] = useState<string>(settingsPin);
  const [tempLogoUrl, setTempLogoUrl] = useState<string>(logoUrl);
  const [tempLogoHeight, setTempLogoHeight] = useState<number>(logoHeight);
  const [tempCardBgUrl, setTempCardBgUrl] = useState<string>(cardBgUrl);

  const THEME_PRESETS = [
    { name: 'Blanco Yoga (Negro & Salvia)', brown: '#0A0A0A', gold: '#5A8C7C', bg: '#FAFAF8' },
    { name: 'Original Buttery (Café & Oro)', brown: '#2D241E', gold: '#C5A059', bg: '#FAF7F2' },
    { name: 'Matcha Forest (Verde & Oliva)', brown: '#142E25', gold: '#7A8C40', bg: '#F2F6F3' },
    { name: 'Cereza Intensa (Burgundy & Oro Rosa)', brown: '#3E1929', gold: '#D0887A', bg: '#FAF2F4' },
    { name: 'Midnight Charcoal (Elegante)', brown: '#121212', gold: '#B08E5F', bg: '#F5F5F5' },
  ];

  const STAMP_PRESETS = [
    { char: '🧘', name: 'Yoga' },
    { char: '🪷', name: 'Loto' },
    { char: '⭐', name: 'Estrella' },
    { char: '✔️', name: 'Check' },
    { char: '☕', name: 'Café' },
    { char: '🌿', name: 'Hoja' },
    { char: '🕉️', name: 'Om' },
  ];

  const handlePinKeypadPress = (val: string) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + val;
    setEnteredPin(nextPin);
    setPinError(null);

    if (nextPin.length === 4) {
      if (nextPin === settingsPin) {
        setIsPinModalOpen(false);
        setEnteredPin('');
        setIsSettingsOpen(true);
        // Sync values to existing state on open
        setTempStamp(stampSymbol);
        setTempBrown(brandBrown);
        setTempGold(brandGold);
        setTempBg(brandBg);
        setTempPin(settingsPin);
        setTempLogoUrl(logoUrl);
        setTempLogoHeight(logoHeight);
        setTempCardBgUrl(cardBgUrl);
      } else {
        setTimeout(() => {
          setPinError('PIN Incorrecto. Reintente.');
          setEnteredPin('');
        }, 200);
      }
    }
  };

  const handlePinKeypadBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError(null);
  };

  // CRM tracking states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [crmFilter, setCrmFilter] = useState<'all' | 'near' | 'ready'>('all');
  const [selectedCustomerPageId, setSelectedCustomerPageId] = useState<string | null>(null);

  // Manual code entry (Escanear tab)
  const [manualCodeOpen, setManualCodeOpen] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    onAddPoints(code, 1, 'Sello de visita por código ingresado manualmente');
    setManualCode('');
    setManualCodeOpen(false);
  };

  // Recent activity feed (latest 6 transactions)
  const recentActivity = [...transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  // Filter out staff roles from customer directory
  const clientUsers = registeredUsers.filter((u) => u.role === 'client');
  const accumulatingCount = clientUsers.filter(u => u.points > 0 && u.points < 10).length;
  const readyCount = clientUsers.filter(u => u.points === 10).length;

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const activeClientPage = selectedCustomerPageId
    ? registeredUsers.find((u) => u.id === selectedCustomerPageId)
    : null;

  /* ══════════════════════════════════════════
     CLIENT DETAIL PAGE ("Expediente")
     ══════════════════════════════════════════ */
  if (activeClientPage) {
    const userTxs = transactions.filter(t => t.userId === activeClientPage.id);
    const stamps = Math.min(10, Math.max(0, activeClientPage.points));
    const isCompleted = stamps === 10;
    const init = activeClientPage.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const sortedTxs = [...userTxs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastVisitTx = sortedTxs.find(tx => tx.type === 'earn');
    const lastVisitDate = lastVisitTx
      ? new Date(lastVisitTx.timestamp).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Sin visitas registradas';
    const rewardsCashedCount = userTxs.filter(t => t.type === 'redeem').length;
    const registeredSince = activeClientPage.createdAt
      ? new Date(activeClientPage.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'No disponible';

    return (
      <div className="flex-1 flex flex-col h-full bg-[#FAFAF8] text-[#0A0A0A] font-sans pb-10">
        {/* Navigation & Header */}
        <div className="bg-[#FAFAF8]/95 backdrop-blur-md border-b border-[#0A0A0A]/8 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button
            id="detail-back-button"
            onClick={() => setSelectedCustomerPageId(null)}
            className="flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-[#0A0A0A] hover:text-[#0A0A0A]/60 cursor-pointer transition-all bg-white px-3.5 py-2 rounded-xl border border-[#0A0A0A]/10"
          >
            ← Volver a Socios
          </button>
          <div className="text-right">
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold">Expediente de Socio</p>
          </div>
        </div>

        <div className="px-6 mt-6 space-y-5 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Client header card */}
          <div className="p-6 bg-white rounded-2xl border border-[#0A0A0A]/10">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-sans text-sm font-bold shrink-0 ${
                isCompleted ? 'bg-[#5A8C7C] text-white' : 'bg-[#EFEFED] text-[#0A0A0A]'
              }`}>
                {init}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <h3 className="font-sans text-xl font-semibold tracking-tight text-[#0A0A0A] truncate">{activeClientPage.name}</h3>
                  {isCompleted && (
                    <span className="inline-flex self-center sm:self-start text-[8px] font-sans font-bold uppercase tracking-[0.15em] text-[#3D6456] bg-[#DBE8E1] px-2.5 py-1 rounded-full shrink-0 items-center gap-1">
                      <Gift className="w-2.5 h-2.5" /> Listo
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-[#0A0A0A]/45 block truncate">{activeClientPage.email}</p>
                <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#0A0A0A]/55 bg-[#EFEFED] px-2 py-1 rounded-md">
                    {activeClientPage.qrCode}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#0A0A0A]/55 bg-[#EFEFED] px-2 py-1 rounded-md">
                    Registro: {registeredSince}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: stamp sheet + actions */}
            <div className="space-y-5">
              {/* Stamp sheet */}
              <div className="bg-white p-5 rounded-2xl border border-[#0A0A0A]/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="block text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-[#0A0A0A]/45">
                    Planilla de visitas
                  </span>
                  <span className="font-sans font-semibold text-[#0A0A0A] text-sm">
                    {pad2(stamps)} / 10
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const isStamped = stamps >= idx + 1;
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                          isStamped
                            ? 'bg-[#0A0A0A]'
                            : 'bg-white border border-[#0A0A0A]/12'
                        }`}
                      >
                        {isStamped ? (
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        ) : (
                          <span className="w-1 h-1 rounded-full bg-[#0A0A0A]/20" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="w-full h-1 bg-[#EFEFED] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-[#5A8C7C]' : 'bg-[#0A0A0A]'}`}
                    style={{ width: `${stamps * 10}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white p-5 rounded-2xl border border-[#0A0A0A]/10 space-y-3">
                <span className="block text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-[#0A0A0A]/45">
                  Acciones
                </span>

                <button
                  id="add-stamp-detail-page-btn"
                  disabled={isCompleted}
                  onClick={() => {
                    onAddPoints(activeClientPage.qrCode, 1, 'Sello de visita registrado desde Expediente');
                  }}
                  className={`w-full py-3.5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isCompleted
                      ? 'bg-[#EFEFED] text-[#0A0A0A]/30 cursor-not-allowed'
                      : 'bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar visita (sello)</span>
                </button>

                {isCompleted && onResetClientStamps && (
                  <button
                    id="reset-detail-page-btn"
                    onClick={() => {
                      onResetClientStamps(activeClientPage.qrCode);
                    }}
                    className="w-full py-3.5 bg-[#5A8C7C] hover:bg-[#4A7A6A] text-white rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer flex items-center justify-center gap-2"
                    title="Entrega cortesía y reinicia su tarjeta a 0 visitas."
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Canjear cortesía y renovar planilla</span>
                  </button>
                )}
              </div>

              {/* Account summary */}
              <div className="bg-white p-5 rounded-2xl border border-[#0A0A0A]/10 space-y-3">
                <span className="block text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-[#0A0A0A]/45">
                  Resumen de cuenta
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#FAFAF8] rounded-xl">
                    <span className="block text-[8px] font-sans font-bold text-[#0A0A0A]/40 uppercase tracking-[0.15em] mb-1">Cortesías canjeadas</span>
                    <span className="font-sans font-semibold text-[#0A0A0A] text-sm">{rewardsCashedCount}</span>
                  </div>
                  <div className="p-3 bg-[#FAFAF8] rounded-xl">
                    <span className="block text-[8px] font-sans font-bold text-[#0A0A0A]/40 uppercase tracking-[0.15em] mb-1">Última visita</span>
                    <span className="font-sans font-medium text-[#0A0A0A]/70 text-[11px] block truncate">{lastVisitDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: transactions log */}
            <div className="bg-white p-5 rounded-2xl border border-[#0A0A0A]/10 space-y-4 self-start">
              <span className="block text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-[#0A0A0A]/45">
                Historial de operaciones
              </span>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {sortedTxs.length === 0 ? (
                  <p className="font-sans text-[#0A0A0A]/40 text-xs text-center py-8">
                    No hay transacciones registradas aún para este socio.
                  </p>
                ) : (
                  sortedTxs.map((tx) => (
                    <div key={tx.id} className="p-3 border-b border-[#0A0A0A]/6 flex justify-between items-center text-xs last:border-0">
                      <div className="space-y-0.5 pr-2 min-w-0 text-left">
                        <span className="font-sans font-medium text-[#0A0A0A] block truncate leading-snug">
                          {tx.description}
                        </span>
                        <span className="block text-[9px] text-[#0A0A0A]/40 font-mono">
                          {new Date(tx.timestamp).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {tx.staffName || 'Staff'}
                        </span>
                      </div>
                      <span className={`font-sans font-bold shrink-0 text-xs ${tx.type === 'earn' ? 'text-[#0A0A0A]' : 'text-[#0A0A0A]/35'}`}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.points} {tx.points === 1 ? 'sello' : 'sellos'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     MAIN STAFF CONSOLE
     ══════════════════════════════════════════ */
  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAF8] text-[#0A0A0A] font-sans pb-10">

      {/* ── Header ── */}
      <div className="px-6 md:px-10 lg:px-16 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0">
            <span className="font-sans font-semibold text-white text-base leading-none">{staffUser.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold leading-none">Consola Staff</p>
            <h2 className="font-sans font-semibold text-[#0A0A0A] text-lg mt-1 leading-none">
              {staffUser.name} <span className="text-[#0A0A0A]/40 font-normal">&middot; Recepción</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="staff-settings-btn"
            onClick={() => {
              setIsPinModalOpen(true);
              setEnteredPin('');
              setPinError(null);
            }}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#0A0A0A]/5 text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-all cursor-pointer"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            id="staff-logout-btn"
            onClick={onLogout}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#0A0A0A]/5 text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-all cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Hero + stats ── */}
      <div className="px-6 md:px-10 lg:px-16 pt-8">
        <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#0A0A0A]/45 font-bold">
          Blanco Yoga &middot; Condesa
        </p>
        <h1 className="font-sans font-semibold text-4xl md:text-5xl tracking-tight leading-[1.1] mt-3">
          <span className="text-[#0A0A0A]">Sellos y socios,</span><br />
          <span className="text-[#0A0A0A]/30">en un solo lugar.</span>
        </h1>

        <div className="flex gap-14 mt-8">
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold">Socios</p>
            <p className="font-sans font-semibold text-3xl tracking-tight text-[#0A0A0A] mt-1.5">{pad2(clientUsers.length)}</p>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold">Acumulando</p>
            <p className="font-sans font-semibold text-3xl tracking-tight text-[#0A0A0A] mt-1.5">{pad2(accumulatingCount)}</p>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold">Por premiar</p>
            <p className="font-sans font-semibold text-3xl tracking-tight text-[#7BA394] mt-1.5">{pad2(readyCount)}</p>
          </div>
        </div>

        <div className="h-px bg-[#0A0A0A]/8 mt-8" />
      </div>

      {/* ── Tab bar ── */}
      <div className="px-6 md:px-10 lg:px-16 mt-6">
        <div className="bg-[#EFEFED] p-1 rounded-xl inline-flex w-full md:w-auto">
          <button
            id="staff-tab-control-btn"
            onClick={() => setActiveTab('control')}
            className={`flex-1 md:flex-none md:px-14 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.18em] rounded-lg cursor-pointer transition-all ${
              activeTab === 'control'
                ? 'bg-white text-[#0A0A0A] shadow-sm'
                : 'text-[#0A0A0A]/45 hover:text-[#0A0A0A]/70'
            }`}
          >
            Escanear
          </button>
          <button
            id="staff-tab-users-btn"
            onClick={() => setActiveTab('users')}
            className={`flex-1 md:flex-none md:px-14 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.18em] rounded-lg cursor-pointer transition-all ${
              activeTab === 'users'
                ? 'bg-white text-[#0A0A0A] shadow-sm'
                : 'text-[#0A0A0A]/45 hover:text-[#0A0A0A]/70'
            }`}
          >
            Socios &middot; {clientUsers.length}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{ animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
          className={`fixed top-6 left-4 right-4 mx-auto max-w-sm z-50 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-2xl border ${
            feedbackMsg.isError
              ? 'bg-rose-600 border-rose-500/30 text-white'
              : 'bg-[#0A0A0A] border-white/10 text-white'
          }`}
        >
          {feedbackMsg.isError ? (
            <AlertCircle className="w-4 h-4 text-white/80 flex-shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-white/80 flex-shrink-0" />
          )}
          <span className="font-sans text-xs font-semibold tracking-wide">{feedbackMsg.text}</span>
        </div>
      )}

      {/* ── Tab panels ── */}
      <div className="px-6 md:px-10 lg:px-16 mt-6 flex-1 flex flex-col">

        {/* ═ ESCANEAR / CHECK-IN ═ */}
        {activeTab === 'control' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Left: Check-in card */}
            <div className="p-8 md:p-10 bg-white rounded-2xl border border-[#0A0A0A]/10 text-center space-y-5">
              <div className="relative w-fit mx-auto">
                <div className="w-24 h-24 bg-[#0A0A0A] text-white rounded-full flex items-center justify-center">
                  <QrCode className="w-9 h-9" />
                </div>
                <span className="absolute top-1 right-0 w-3 h-3 bg-[#7BA394] rounded-full border-2 border-white" />
              </div>

              <div className="space-y-2">
                <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#0A0A0A]/45 font-bold">Check-in</p>
                <h3 className="font-sans text-2xl font-semibold tracking-tight text-[#0A0A0A]">Escanear membresía</h3>
                <p className="font-sans text-xs text-[#0A0A0A]/50 leading-relaxed max-w-xs mx-auto">
                  Pide al socio abrir su tarjeta y apunta la cámara al QR. El sello se suma al instante.
                </p>
              </div>

              <button
                id="staff-open-scanner-btn"
                onClick={onOpenScanner}
                className="w-full max-w-xs mx-auto bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white font-sans text-xs font-bold uppercase tracking-[0.2em] py-4 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2.5"
              >
                <Camera className="w-4 h-4" />
                Abrir cámara
              </button>

              {!manualCodeOpen ? (
                <button
                  type="button"
                  id="manual-code-toggle-btn"
                  onClick={() => setManualCodeOpen(true)}
                  className="font-sans text-xs text-[#0A0A0A]/55 hover:text-[#0A0A0A] underline underline-offset-4 decoration-[#0A0A0A]/20 hover:decoration-[#0A0A0A] transition-colors cursor-pointer"
                >
                  Ingresar código manualmente
                </button>
              ) : (
                <form onSubmit={handleManualCodeSubmit} className="max-w-xs mx-auto flex gap-2">
                  <input
                    id="manual-code-input"
                    type="text"
                    autoFocus
                    placeholder="Código de membresía"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 bg-white border border-[#0A0A0A]/15 rounded-xl py-2.5 px-3.5 text-xs text-[#0A0A0A] placeholder:text-[#0A0A0A]/35 focus:outline-none focus:border-[#0A0A0A] transition-colors font-mono uppercase"
                  />
                  <button
                    type="submit"
                    id="manual-code-submit-btn"
                    className="bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white px-4 rounded-xl font-sans text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Sumar
                  </button>
                </form>
              )}
            </div>

            {/* Right: Recent activity */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-4">
                <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#0A0A0A]/45 font-bold">Actividad reciente</p>
                <Clock className="w-4 h-4 text-[#0A0A0A]/30" />
              </div>

              {recentActivity.length === 0 ? (
                <div className="py-12 text-center border-t border-[#0A0A0A]/8">
                  <p className="font-sans text-xs text-[#0A0A0A]/40">Aún no hay actividad registrada.</p>
                </div>
              ) : (
                <div>
                  {recentActivity.map((tx) => {
                    const txUser = registeredUsers.find(u => u.id === tx.userId);
                    const isReady = txUser?.points === 10;
                    return (
                      <div
                        key={tx.id}
                        className="py-4 border-t border-[#0A0A0A]/8 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="font-sans font-semibold text-sm text-[#0A0A0A] truncate">{tx.userName}</p>
                          <p className="font-sans text-xs text-[#0A0A0A]/50 truncate mt-0.5">
                            {isReady
                              ? '10 / 10 · Lista para canjear'
                              : `${tx.type === 'earn' ? '+' : '-'}${tx.points} ${tx.points === 1 ? 'sello' : 'sellos'}`}
                          </p>
                        </div>
                        {isReady ? (
                          <span className="flex items-center gap-1.5 text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#3D6456] bg-[#DBE8E1] px-3 py-1.5 rounded-full shrink-0">
                            <Gift className="w-3 h-3" /> Lista
                          </span>
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-[#0A0A0A] flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═ SOCIOS / CRM ═ */}
        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col space-y-5">

            <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#0A0A0A]/45 font-bold flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              CRM de Socios
            </p>

            {/* Search + filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/35 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o membresía..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#EFEFED] rounded-xl pl-11 pr-4 py-3 border-none text-sm text-[#0A0A0A] outline-none placeholder:text-[#0A0A0A]/40 focus:ring-1 focus:ring-[#0A0A0A]/20"
                />
              </div>

              <div className="flex bg-[#EFEFED] p-1 rounded-xl">
                {(['all', 'near', 'ready'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCrmFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-sans text-[9px] font-bold uppercase tracking-[0.15em] cursor-pointer transition-all ${
                      crmFilter === filter
                        ? 'bg-[#0A0A0A] text-white'
                        : 'text-[#0A0A0A]/45 hover:text-[#0A0A0A]/70'
                    }`}
                  >
                    {filter === 'all' ? 'Todos' : filter === 'near' ? 'Cerca' : 'Listos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Client list */}
            {(() => {
              const matchedClients = clientUsers.filter((client) => {
                const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                     client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                     client.qrCode.toLowerCase().includes(searchQuery.toLowerCase());

                if (!matchesSearch) return false;
                if (crmFilter === 'near') return client.points >= 7 && client.points < 10;
                if (crmFilter === 'ready') return client.points === 10;
                return true;
              });

              if (matchedClients.length === 0) {
                return (
                  <div className="p-10 text-center border-t border-[#0A0A0A]/8">
                    <p className="font-sans text-xs text-[#0A0A0A]/40">No se encontraron socios con los criterios de búsqueda.</p>
                  </div>
                );
              }

              return (
                <div className="border-t border-[#0A0A0A]/8">
                  {matchedClients.map((client) => {
                    const userTxs = transactions.filter(t => t.userId === client.id);
                    const stamps = Math.min(10, Math.max(0, client.points));
                    const isCompleted = stamps === 10;
                    const init = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const sortedTxs = [...userTxs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    const lastVisitTx = sortedTxs.find(tx => tx.type === 'earn');
                    const lastVisitLabel = daysAgoLabel(lastVisitTx?.timestamp);

                    return (
                      <div
                        key={client.id}
                        className="py-4 border-b border-[#0A0A0A]/8 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center"
                      >
                        {/* Avatar + name + email */}
                        <div className="md:col-span-4 flex items-center gap-3.5">
                          <button
                            id={`client-avatar-btn-${client.id}`}
                            onClick={() => setSelectedCustomerPageId(client.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-sans text-[11px] font-bold shrink-0 transition-all hover:scale-105 cursor-pointer ${
                              isCompleted ? 'bg-[#5A8C7C] text-white' : 'bg-[#EFEFED] text-[#0A0A0A]'
                            }`}
                            title="Ver expediente del socio"
                          >
                            {init}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <button
                                id={`client-name-btn-${client.id}`}
                                onClick={() => setSelectedCustomerPageId(client.id)}
                                className="font-sans text-sm font-semibold text-[#0A0A0A] hover:underline truncate text-left cursor-pointer"
                                title="Ver expediente del socio"
                              >
                                {client.name}
                              </button>
                              {isCompleted && (
                                <span className="flex items-center gap-1 text-[8px] font-sans font-bold uppercase tracking-[0.15em] text-[#3D6456] bg-[#DBE8E1] px-2 py-0.5 rounded-full shrink-0">
                                  <Gift className="w-2.5 h-2.5" /> Listo
                                </span>
                              )}
                            </div>
                            <span className="font-sans text-xs text-[#0A0A0A]/45 block truncate mt-0.5">{client.email}</span>
                          </div>
                        </div>

                        {/* Membership code */}
                        <div className="md:col-span-2 hidden md:block">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[#0A0A0A]/50 truncate">
                            {client.qrCode}
                          </span>
                        </div>

                        {/* Progress + last visit */}
                        <div className="md:col-span-4">
                          <div className="flex items-center justify-between gap-4">
                            <span className={`font-mono text-[10px] uppercase tracking-wider ${isCompleted ? 'text-[#3D6456] font-bold' : 'text-[#0A0A0A]/70'}`}>
                              {pad2(stamps)} / 10
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-[#0A0A0A]/40">
                              {lastVisitLabel}
                            </span>
                          </div>
                          <div className="w-full h-[3px] bg-[#EFEFED] rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-[#5A8C7C]' : 'bg-[#0A0A0A]'}`}
                              style={{ width: `${stamps * 10}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-2 flex items-center justify-start md:justify-end gap-2">
                          {isCompleted && onResetClientStamps ? (
                            <button
                              id={`quick-crm-reset-${client.id}`}
                              onClick={() => onResetClientStamps(client.qrCode)}
                              className="px-4 py-2 bg-[#5A8C7C] hover:bg-[#4A7A6A] text-white rounded-xl font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                              title="Entrega cortesía y reinicia su tarjeta a 0 visitas."
                            >
                              <Gift className="w-3 h-3" />
                              <span>Canjear</span>
                            </button>
                          ) : (
                            <button
                              id={`quick-crm-stamp-${client.id}`}
                              onClick={() => onAddPoints(client.qrCode, 1, 'Sello de visita registrado desde CRM')}
                              className="px-4 py-2 bg-white border border-[#0A0A0A]/15 hover:border-[#0A0A0A]/40 text-[#0A0A0A] rounded-xl font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Sello</span>
                            </button>
                          )}

                          <button
                            id={`details-toggle-${client.id}`}
                            onClick={() => setSelectedCustomerPageId(client.id)}
                            className="w-9 h-9 rounded-xl border border-[#0A0A0A]/15 text-[#0A0A0A]/40 hover:text-[#0A0A0A] hover:border-[#0A0A0A]/40 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                            title="Ver expediente completo del socio"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── SECURITY PIN PAD MODAL ── */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl text-center space-y-6 animate-scaleUp">
            <div>
              <div className="w-12 h-12 bg-[#EFEFED] text-[#0A0A0A] rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-sans text-base font-semibold tracking-tight text-[#0A0A0A] mt-3">Verificación de Personal</h3>
              <p className="font-sans text-[9px] text-[#0A0A0A]/45 mt-1 uppercase tracking-[0.2em] font-bold">Introducir PIN de seguridad</p>
            </div>

            {/* PIN Code indicators */}
            <div className="flex justify-center gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    enteredPin.length > idx ? 'bg-[#0A0A0A] scale-110' : 'bg-[#EFEFED]'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="font-sans text-[10px] text-rose-500 font-bold tracking-wide">{pinError}</p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[210px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  id={`pin-btn-${num}`}
                  onClick={() => handlePinKeypadPress(num)}
                  className="w-14 h-14 rounded-full bg-[#FAFAF8] border border-[#0A0A0A]/8 hover:bg-[#EFEFED] font-sans text-base font-semibold text-[#0A0A0A] transition-all cursor-pointer flex items-center justify-center active:scale-90"
                >
                  {num}
                </button>
              ))}
              <button
                id="pin-btn-cancel"
                onClick={() => {
                  setEnteredPin('');
                  setPinError(null);
                  setIsPinModalOpen(false);
                }}
                className="w-14 h-14 font-sans text-[9px] font-bold uppercase tracking-[0.15em] text-[#0A0A0A]/45 hover:text-[#0A0A0A] cursor-pointer flex items-center justify-center"
              >
                Cerrar
              </button>
              <button
                id="pin-btn-0"
                onClick={() => handlePinKeypadPress('0')}
                className="w-14 h-14 rounded-full bg-[#FAFAF8] border border-[#0A0A0A]/8 hover:bg-[#EFEFED] font-sans text-base font-semibold text-[#0A0A0A] transition-all cursor-pointer flex items-center justify-center active:scale-90"
              >
                0
              </button>
              <button
                id="pin-btn-delete"
                onClick={handlePinKeypadBackspace}
                className="w-14 h-14 font-sans text-[9px] font-bold uppercase tracking-[0.15em] text-[#0A0A0A]/45 hover:text-[#0A0A0A] cursor-pointer flex items-center justify-center"
              >
                Borrar
              </button>
            </div>
            <p className="font-sans text-[9px] text-[#0A0A0A]/35">PIN de demostración por defecto: 1234</p>
          </div>
        </div>
      )}

      {/* ── STAFF CONFIGURATION MODAL ── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl space-y-6 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto text-left">
            <div className="border-b border-[#0A0A0A]/8 pb-3">
              <h3 className="font-sans text-lg font-semibold tracking-tight text-[#0A0A0A]">Configuración de Marca</h3>
              <p className="font-sans text-[9px] text-[#0A0A0A]/45 mt-0.5 uppercase tracking-[0.2em] font-bold">Personalizable por el staff</p>
            </div>

            {/* 1. Stamp symbol */}
            <div className="space-y-2.5">
              <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/45">
                1. Símbolo del sello (planilla)
              </span>
              <div className="grid grid-cols-4 gap-2">
                {STAMP_PRESETS.map((p) => {
                  const isSelected = tempStamp === p.char;
                  return (
                    <button
                      key={p.char}
                      id={`preset-stamp-${p.name.toLowerCase()}`}
                      onClick={() => setTempStamp(p.char)}
                      className={`h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer text-lg ${
                        isSelected
                          ? 'bg-[#0A0A0A]/5 border-[#0A0A0A] scale-105'
                          : 'bg-[#FAFAF8] border-[#0A0A0A]/10 hover:border-[#0A0A0A]/30'
                      }`}
                      title={p.name}
                    >
                      <span>{p.char}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Image Stamp Uploader */}
              <div className="pt-2.5 border-t border-[#0A0A0A]/8 space-y-2">
                <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/45">
                  O sube una imagen de sello personalizada:
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FAFAF8] border border-[#0A0A0A]/10 flex items-center justify-center relative overflow-hidden shrink-0">
                    {tempStamp && (tempStamp.startsWith('data:image/') || tempStamp.startsWith('http')) ? (
                      <img src={tempStamp} alt="Sello cargado" className="w-9 h-9 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-xl text-[#0A0A0A]/20">🖼️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="custom-stamp-upload-input"
                      className="px-3 py-1.5 bg-[#EFEFED] hover:bg-[#E5E5E3] text-[#0A0A0A] rounded-lg font-sans text-[9px] font-bold uppercase tracking-wider cursor-pointer inline-block"
                    >
                      Seleccionar archivo
                    </label>
                    <input
                      id="custom-stamp-upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              const img = new Image();
                              img.onload = () => {
                                const maxDim = 120;
                                let width = img.width;
                                let height = img.height;
                                if (width > maxDim || height > maxDim) {
                                  if (width > height) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                  } else {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                  }
                                }
                                const canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const compressedBase64 = canvas.toDataURL('image/png');
                                  setTempStamp(compressedBase64);
                                } else {
                                  setTempStamp(event.target?.result as string);
                                }
                              };
                              img.src = event.target?.result as string;
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="font-sans text-[9px] text-[#0A0A0A]/40 mt-1">Recomendado: PNG fondo transparente</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Theme palette */}
            <div className="space-y-2.5">
              <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/45">
                2. Paleta de color del club
              </span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {THEME_PRESETS.map((p) => {
                  const isSelected = tempBrown === p.brown && tempGold === p.gold && tempBg === p.bg;
                  return (
                    <button
                      key={p.name}
                      id={`preset-theme-${p.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => {
                        setTempBrown(p.brown);
                        setTempGold(p.gold);
                        setTempBg(p.bg);
                      }}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0A0A0A]/5 border-[#0A0A0A]'
                          : 'bg-[#FAFAF8] border-[#0A0A0A]/10 hover:border-[#0A0A0A]/30'
                      }`}
                    >
                      <span className="font-sans text-xs font-medium text-[#0A0A0A]">{p.name}</span>
                      <div className="flex gap-1.5 shrink-0">
                        <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: p.brown }} title="Color de marca" />
                        <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: p.gold }} title="Color acento" />
                        <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: p.bg }} title="Color fondo" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom hex */}
              <div className="pt-2.5 border-t border-[#0A0A0A]/8 space-y-2">
                <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/45">
                  O ingresa tus propios códigos de color (HEX):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { label: 'Marca', value: tempBrown, set: setTempBrown, fallback: '#0A0A0A' },
                    { label: 'Acento', value: tempGold, set: setTempGold, fallback: '#5A8C7C' },
                    { label: 'Fondo', value: tempBg, set: setTempBg, fallback: '#FAFAF8' },
                  ] as const).map((c) => (
                    <div key={c.label} className="space-y-1">
                      <label className="block text-[9px] font-sans font-semibold text-[#0A0A0A]/50">{c.label}</label>
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-6 h-6 rounded-md border border-[#0A0A0A]/15 cursor-pointer shrink-0" style={{ backgroundColor: c.value }}>
                          <input
                            type="color"
                            value={c.value.startsWith('#') && c.value.length === 7 ? c.value : c.fallback}
                            onChange={(e) => c.set(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <input
                          type="text"
                          maxLength={7}
                          value={c.value}
                          onChange={(e) => c.set(e.target.value)}
                          className="w-full bg-[#FAFAF8] rounded-lg px-1.5 py-1 text-[9px] font-mono text-[#0A0A0A] border border-[#0A0A0A]/10 uppercase focus:border-[#0A0A0A] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Brand logo */}
            <div className="space-y-2.5">
              <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/45">
                3. Logo de la marca (pantalla de acceso)
              </span>
              <div className="bg-[#FAFAF8] border border-[#0A0A0A]/10 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white border border-[#0A0A0A]/10 flex items-center justify-center relative overflow-hidden shrink-0">
                    {tempLogoUrl ? (
                      <img src={tempLogoUrl} alt="Logo temporal" className="max-w-[56px] max-h-[56px] object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-2xl text-[#0A0A0A]/20">🏢</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label
                      htmlFor="custom-logo-upload-input"
                      className="px-3 py-1.5 bg-[#EFEFED] hover:bg-[#E5E5E3] text-[#0A0A0A] rounded-lg font-sans text-[9px] font-bold uppercase tracking-wider cursor-pointer inline-block"
                    >
                      Sube tu logo (PNG, JPG)
                    </label>
                    <input
                      id="custom-logo-upload-input"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              const img = new Image();
                              img.onload = () => {
                                const maxDim = 300;
                                let width = img.width;
                                let height = img.height;
                                if (width > maxDim || height > maxDim) {
                                  if (width > height) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                  } else {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                  }
                                }
                                const canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const compressedBase64 = canvas.toDataURL('image/png');
                                  setTempLogoUrl(compressedBase64);
                                } else {
                                  setTempLogoUrl(event.target?.result as string);
                                }
                              };
                              img.src = event.target?.result as string;
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {tempLogoUrl && (
                      <button
                        onClick={() => setTempLogoUrl('')}
                        className="block text-[9px] font-semibold text-red-600 hover:underline uppercase tracking-wider cursor-pointer"
                      >
                        Restablecer a logo original
                      </button>
                    )}
                  </div>
                </div>

                {tempLogoUrl && (
                  <div className="space-y-1.5 pt-2 border-t border-[#0A0A0A]/8">
                    <div className="flex justify-between items-center text-[9px] font-sans font-bold uppercase tracking-wider text-[#0A0A0A]/50">
                      <span>Altura del logo: {tempLogoHeight}px</span>
                      <span className="font-mono text-[#0A0A0A]/35">30px - 150px</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={150}
                      value={tempLogoHeight}
                      onChange={(e) => setTempLogoHeight(Number(e.target.value))}
                      className="w-full accent-[#0A0A0A] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 4. Card background image */}
            <div className="space-y-2.5">
              <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/45">
                4. Imagen de la tarjeta de lealtad
              </span>
              <div className="bg-[#FAFAF8] border border-[#0A0A0A]/10 rounded-xl p-3 space-y-3">
                <div className="w-full h-24 rounded-xl overflow-hidden border border-[#0A0A0A]/10 bg-[#EFEFED] relative">
                  <img
                    src={tempCardBgUrl || '/studio.jpg'}
                    alt="Vista previa de tarjeta"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-2 left-2 font-sans text-[8px] text-white font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full">
                    Vista previa
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-sans text-[9px] font-semibold text-[#0A0A0A]/50 uppercase tracking-wider">
                    URL de imagen (https://...)
                  </label>
                  <input
                    id="card-bg-url-input"
                    type="url"
                    value={tempCardBgUrl}
                    onChange={(e) => setTempCardBgUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full bg-white rounded-xl px-3 py-2 text-[10px] text-[#0A0A0A] outline-none border border-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/30 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 5. PIN */}
            <div className="space-y-2.5">
              <label htmlFor="settings-pin-input" className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/45">
                5. Código PIN de configuración (4 dígitos)
              </label>
              <input
                id="settings-pin-input"
                type="text"
                maxLength={4}
                value={tempPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 4) setTempPin(val);
                }}
                className="w-full bg-[#FAFAF8] rounded-xl px-4 py-2.5 text-xs text-[#0A0A0A] outline-none border border-[#0A0A0A]/10 focus:border-[#0A0A0A]"
                placeholder="Introduce 4 dígitos numéricos"
              />
            </div>

            {/* Modal actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-[#0A0A0A]/8">
              <button
                id="settings-btn-cancel"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-3 bg-[#EFEFED] hover:bg-[#E5E5E3] text-[#0A0A0A]/60 rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer text-center"
              >
                Descartar
              </button>
              <button
                id="settings-btn-save"
                disabled={tempPin.length !== 4}
                onClick={() => {
                  onUpdateSettings(tempStamp, tempBrown, tempGold, tempBg, tempPin, tempLogoUrl, tempLogoHeight, tempCardBgUrl);
                  setIsSettingsOpen(false);
                  setFeedbackMsg({ text: '¡Configuración de marca actualizada de manera segura!', isError: false });
                  setTimeout(() => setFeedbackMsg(null), 2500);
                }}
                className={`flex-1 py-3 rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer text-center ${
                  tempPin.length !== 4
                    ? 'bg-[#EFEFED] text-[#0A0A0A]/30 cursor-not-allowed'
                    : 'bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white'
                }`}
              >
                Guardar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}