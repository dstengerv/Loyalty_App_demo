import { useState } from 'react';
import { 
  LogOut, 
  History, 
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';
import { User, Transaction, RewardItem, QRVoucher } from '../types';

// Inline yoga figure SVG — reusable across stamp grid and empty states
function YogaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="3.5" r="1.5" />
      <path d="M10 8.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v3l2.5 2.5-1.06 1.06L13 13.12V18l1.5 2.5h-1.75L12 18.8l-.75 1.7H9.5L11 18v-4.88l-2.44 2.44L7.5 14.5 10 12V8.5z" />
    </svg>
  );
}

interface CustomerDashboardProps {
  user: User;
  transactions: Transaction[];
  rewards: RewardItem[];
  vouchers: QRVoucher[];
  onScanPurchaseCode: () => void;
  onRedeemReward: (reward: RewardItem) => void;
  onLogout: () => void;
  onClaimCompletedCard?: () => void;
  stampSymbol?: string;
  cardBgUrl?: string;
}

export default function CustomerDashboard({
  user,
  transactions,
  rewards,
  vouchers,
  onScanPurchaseCode,
  onRedeemReward,
  onLogout,
  onClaimCompletedCard,
  stampSymbol,
  cardBgUrl,
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'history' | 'qr'>('card');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (activeTab === 'qr' && qrCanvasRef.current && user.qrCode) {
      QRCode.toCanvas(qrCanvasRef.current, user.qrCode, {
        width: 220,
        margin: 2,
        color: { dark: '#1C1C1C', light: '#FFFFFF' }
      });
    }
  }, [activeTab, user.qrCode]);

  const userTransactions = transactions
    .filter((t) => t.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const stampCount = Math.min(10, Math.max(0, user.points));

  const DEFAULT_CARD_BG = 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80';
  const bannerUrl = cardBgUrl || DEFAULT_CARD_BG;

  const isStampFilled = (idx: number) => stampCount >= idx + 1;

  return (
    <div
      className="flex-1 flex flex-col h-full text-white overflow-hidden"
      style={{ background: 'linear-gradient(175deg, #6BA898 0%, #5A8C7C 50%, #4A7A6A 100%)' }}
    >

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow">
            <span className="font-serif italic font-bold text-white text-sm leading-none">{user.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-white/60 font-bold leading-none">Tarjeta de Lealtad</p>
            <h2 className="font-serif italic font-semibold text-white text-base mt-0.5 leading-none">{user.name}</h2>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={onLogout}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="mx-5 mb-4">
        <div className="bg-white/10 p-1 rounded-full flex border border-white/10">
          {(['card', 'history', 'qr'] as const).map((tab) => {
            const labels = { card: 'Tarjeta', history: 'Historial', qr: 'Mi QR' };
            const ids = { card: 'tab-card-btn', history: 'tab-history-btn', qr: 'tab-qr-btn' };
            return (
              <button
                key={tab}
                id={ids[tab]}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 font-sans text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all ${
                  activeTab === tab
                    ? 'bg-white text-[#5A8C7C] shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Tab */}
      {activeTab === 'card' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="overflow-y-auto px-5 space-y-5 pb-2">

            {/* Banner */}
            <div className="relative w-full">
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/7' }}>
                <img
                  src={bannerUrl}
                  alt="Tarjeta de lealtad"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <span className="bg-white/20 backdrop-blur-sm text-white font-sans text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/30">
                    Sello por visita
                  </span>
                  <span className="bg-black/50 backdrop-blur-sm text-white font-sans text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Premio a los 10 sellos
                  </span>
                </div>
              </div>
            </div>

            {/* Reward label */}
            <div className="text-center">
              <p className="font-serif italic font-semibold text-white text-sm leading-snug">
                Recompensa: <span className="text-white/70">¡Tu recompensa espera!</span>
              </p>
            </div>

            {/* Stamp grid */}
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const filled = isStampFilled(idx);
                  const stampNum = idx + 1;
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-full overflow-hidden flex items-center justify-center border-2 transition-all ${
                        filled
                          ? 'border-white bg-white/20'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {filled ? (
                        stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                          <img src={stampSymbol} alt="Sello" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
                        ) : (
                          <YogaIcon className="w-5 h-5 text-white" />
                        )
                      ) : (
                        stampNum === 10 ? (
                          <Gift className="w-4 h-4 text-white/25" />
                        ) : (
                          <YogaIcon className="w-4 h-4 text-white/25" />
                        )
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-center font-sans text-[11px] text-white/60 font-medium">
                {stampCount} de 10 sellos acumulados
              </p>
            </div>

          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="flex-1 flex flex-col px-5 space-y-4 overflow-y-auto pb-32">
          <h3 className="font-serif text-base font-medium text-white flex items-center gap-2">
            <History className="w-4 h-4 text-white/60" />
            Historial de Visitas
          </h3>

          {userTransactions.length > 0 ? (
            <div className="space-y-2.5">
              {userTransactions.map((tx) => (
                <div
                  key={tx.id}
                  id={`tx-card-${tx.id}`}
                  className="p-3.5 bg-white/8 border border-white/10 rounded-xl flex items-center justify-between backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      tx.type === 'earn'
                        ? 'bg-white/15 text-white border-white/20'
                        : 'bg-white/8 text-white/40 border-white/10'
                    }`}>
                      {tx.type === 'earn' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-serif italic text-xs text-white block line-clamp-1">{tx.description}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-medium font-mono mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(tx.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`font-sans font-bold text-xs ${
                    tx.type === 'earn' ? 'text-white' : 'text-white/40'
                  }`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.points} {tx.points === 1 ? 'sello' : 'sellos'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-2">
              <YogaIcon className="w-10 h-10 text-white/20" />
              <p className="font-serif italic text-xs text-white/60">{"Aún no hay movimientos"}</p>
              <p className="font-sans text-[10px] text-white/40 text-center">Tus primeras visitas y canjes se listarán aquí.</p>
            </div>
          )}
        </div>
      )}

      {/* QR Tab */}
      {activeTab === 'qr' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 gap-6">
          <img
            src="/blanco-yoga-logo.png"
            alt="Blanco Yoga"
            className="h-10 w-auto object-contain select-none"
            style={{ filter: 'brightness(0) invert(1)' }}
            referrerPolicy="no-referrer"
          />

          <div className="bg-white rounded-3xl px-6 pt-5 pb-6 flex flex-col items-center gap-4 shadow-2xl w-full max-w-xs">
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 shadow-inner">
              <canvas ref={qrCanvasRef} />
            </div>

            <div className="text-center space-y-1">
              <p className="font-serif italic font-bold text-[#1C1C1C] text-base leading-snug">{user.name}</p>
              <p className="font-sans text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#5A8C7C]">
                Código: {user.qrCode}
              </p>
            </div>
          </div>

          <p className="font-sans text-[11px] text-white/60 text-center leading-relaxed max-w-xs">
            Muestra este código al instructor al llegar. El staff sumará tu sello de visita al instante.
          </p>
        </div>
      )}

      {/* 10 Stamps Completion Modal */}
      {stampCount === 10 && (
        <div
          id="stamps-completed-modal"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn"
        >
          <div
            className="w-full max-w-sm bg-[#4A7A6A] rounded-[2.5rem] p-8 text-center space-y-6 flex flex-col items-center shadow-2xl border border-white/20 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/40" />

            <div className="relative my-2">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-xl scale-150 animate-pulse" />
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center shadow-lg border border-white/30 relative">
                <YogaIcon className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-sans text-[9px] tracking-[0.25em] font-extrabold text-white/70 uppercase block">
                Planilla Completada
              </span>
              <h3 className="font-serif italic text-2xl font-semibold text-white leading-tight">
                {`¡Felicidades, ${user.name}!`}
              </h3>
              <p className="font-sans text-[11px] text-white/70 leading-relaxed max-w-xs mt-2">
                Has reunido tus <strong>10 sellos</strong> de visita. Muestra esta pantalla al staff de <strong>Blanco Yoga</strong> para recibir tu clase de cortesía.
              </p>
            </div>

            <div className="w-full pt-2">
              <button
                id="claim-reward-btn"
                onClick={() => { if (onClaimCompletedCard) onClaimCompletedCard(); }}
                className="w-full py-4 bg-white hover:bg-white/90 text-[#5A8C7C] rounded-2xl font-sans text-xs font-bold tracking-widest uppercase shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#5A8C7C] fill-[#5A8C7C]" />
                Registrar Canje con el Staff
              </button>

              <p className="font-sans text-[9px] text-white/40 mt-3 font-medium">
                Al presionar este botón, tu planilla se reiniciará a 0 sellos.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
