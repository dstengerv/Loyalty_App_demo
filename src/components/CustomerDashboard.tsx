import { useState } from 'react';
import {
  LogOut,
  History,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Sparkles,
  ChevronRight,
  QrCode as QrCodeIcon,
  Check,
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
        color: { dark: '#0A0A0A', light: '#FFFFFF' }
      });
    }
  }, [activeTab, user.qrCode]);

  const userTransactions = transactions
    .filter((t) => t.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const stampCount = Math.min(10, Math.max(0, user.points));
  const remaining = 10 - stampCount;

  // Place your studio photo at /public/studio.jpg (or pass a custom cardBgUrl from settings)
  const DEFAULT_CARD_BG = '/studio.jpg';
  const bannerUrl = cardBgUrl || DEFAULT_CARD_BG;

  const isStampFilled = (idx: number) => stampCount >= idx + 1;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAF8] text-[#0A0A0A] overflow-hidden font-sans">

      {/* ── Header ── */}
      <div className="px-6 pt-7 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0">
            <span className="font-sans font-semibold text-white text-base leading-none">{user.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold leading-none">Miembro</p>
            <h2 className="font-sans font-semibold text-[#0A0A0A] text-lg mt-1 leading-none">{user.name}</h2>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={onLogout}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#0A0A0A]/5 text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-all cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* ── Progress hero ── */}
      <div className="px-6 pt-6 pb-5">
        <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#0A0A0A]/45 font-bold">
          Blanco Yoga &middot; Condesa
        </p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="font-sans font-semibold text-5xl tracking-tight text-[#0A0A0A]">
            {String(stampCount).padStart(2, '0')}
          </span>
          <span className="font-sans font-medium text-4xl tracking-tight text-[#0A0A0A]/25">
            /10
          </span>
        </div>
        <p className="font-sans text-sm text-[#0A0A0A]/60 mt-2 leading-snug">
          {stampCount === 10
            ? '¡Planilla completa! Reclama tu clase de cortesía.'
            : `${remaining} ${remaining === 1 ? 'visita más' : 'visitas más'} para tu clase de cortesía.`}
        </p>
      </div>

      <div className="mx-6 h-px bg-[#0A0A0A]/8" />

      {/* ── Tab bar ── */}
      <div className="px-6 pt-5 pb-1">
        <div className="bg-[#EFEFED] p-1 rounded-xl flex">
          {(['card', 'history', 'qr'] as const).map((tab) => {
            const labels = { card: 'Tarjeta', history: 'Historial', qr: 'Mi QR' };
            const ids = { card: 'tab-card-btn', history: 'tab-history-btn', qr: 'tab-qr-btn' };
            return (
              <button
                key={tab}
                id={ids[tab]}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.18em] rounded-lg cursor-pointer transition-all ${
                  activeTab === tab
                    ? 'bg-white text-[#0A0A0A] shadow-sm'
                    : 'text-[#0A0A0A]/45 hover:text-[#0A0A0A]/70'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Card Tab ── */}
      {activeTab === 'card' && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-28 space-y-7">

            {/* Stamps section header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold">Sellos</p>
                <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold">Sello por visita</p>
              </div>

              {/* Stamp grid */}
              <div className="grid grid-cols-5 gap-3.5">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const filled = isStampFilled(idx);
                  const isLast = idx === 9;
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-full overflow-hidden flex items-center justify-center transition-all ${
                        filled
                          ? 'bg-[#0A0A0A]'
                          : isLast
                            ? 'bg-white border-2 border-dashed border-[#7BA394]'
                            : 'bg-white border border-[#0A0A0A]/12'
                      }`}
                    >
                      {filled ? (
                        stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                          <img src={stampSymbol} alt="Sello" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
                        ) : (
                          <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        )
                      ) : isLast ? (
                        <Gift className="w-4 h-4 text-[#7BA394]" />
                      ) : (
                        <span className="w-1 h-1 rounded-full bg-[#0A0A0A]/20" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next reward card */}
            <button
              type="button"
              id="next-reward-card"
              onClick={() => setActiveTab('qr')}
              className="w-full bg-white border border-[#0A0A0A]/10 rounded-2xl p-4 flex items-center justify-between text-left hover:border-[#0A0A0A]/25 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#EDF2EF] flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4.5 h-4.5 w-[18px] h-[18px] text-[#5A8C7C]" />
                </div>
                <div>
                  <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold">Próxima recompensa</p>
                  <p className="font-sans font-semibold text-sm text-[#0A0A0A] mt-1">Clase de cortesía &middot; Condesa</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#0A0A0A]/30 flex-shrink-0" />
            </button>

            {/* Studio photo */}
            <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <img
                src={bannerUrl}
                alt="Estudio Blanco Yoga"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

          </div>

          {/* Fixed bottom CTA: Mostrar mi QR */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-8 bg-gradient-to-t from-[#FAFAF8] via-[#FAFAF8]/90 to-transparent">
            <button
              id="show-qr-btn"
              onClick={() => setActiveTab('qr')}
              className="w-full bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white py-4 rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-xs transition-colors flex items-center justify-between px-5 cursor-pointer shadow-lg"
            >
              <span className="flex items-center gap-3">
                <QrCodeIcon className="w-4 h-4" />
                Mostrar mi QR
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === 'history' && (
        <div className="flex-1 flex flex-col px-6 pt-6 space-y-4 overflow-y-auto pb-10">
          <h3 className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#0A0A0A]/45 font-bold flex items-center gap-2">
            <History className="w-3.5 h-3.5" />
            Historial de visitas
          </h3>

          {userTransactions.length > 0 ? (
            <div className="space-y-2.5">
              {userTransactions.map((tx) => (
                <div
                  key={tx.id}
                  id={`tx-card-${tx.id}`}
                  className="p-4 bg-white border border-[#0A0A0A]/10 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'earn'
                        ? 'bg-[#0A0A0A] text-white'
                        : 'bg-[#EFEFED] text-[#0A0A0A]/40'
                    }`}>
                      {tx.type === 'earn' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-sans font-medium text-xs text-[#0A0A0A] block line-clamp-1">{tx.description}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#0A0A0A]/40 font-medium mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(tx.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`font-sans font-bold text-xs flex-shrink-0 ml-3 ${
                    tx.type === 'earn' ? 'text-[#0A0A0A]' : 'text-[#0A0A0A]/35'
                  }`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.points} {tx.points === 1 ? 'sello' : 'sellos'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 px-6 bg-white border border-[#0A0A0A]/10 rounded-2xl flex flex-col items-center justify-center space-y-2.5">
              <YogaIcon className="w-10 h-10 text-[#0A0A0A]/15" />
              <p className="font-sans font-semibold text-sm text-[#0A0A0A]/60">{"Aún no hay movimientos"}</p>
              <p className="font-sans text-xs text-[#0A0A0A]/40 text-center">Tus primeras visitas y canjes se listarán aquí.</p>
            </div>
          )}
        </div>
      )}

      {/* ── QR Tab ── */}
      {activeTab === 'qr' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 gap-7">

          <p className="font-sans text-xs font-bold tracking-[0.35em] uppercase text-[#0A0A0A]">
            Blanco Yoga
          </p>

          <div className="bg-white rounded-3xl px-6 pt-6 pb-7 flex flex-col items-center gap-5 border border-[#0A0A0A]/10 shadow-sm w-full max-w-xs">
            <div className="bg-[#FAFAF8] rounded-2xl p-3 border border-[#0A0A0A]/8">
              <canvas ref={qrCanvasRef} />
            </div>

            <div className="text-center space-y-1.5">
              <p className="font-sans font-semibold text-[#0A0A0A] text-base leading-snug">{user.name}</p>
              <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/45">
                Código: {user.qrCode}
              </p>
            </div>
          </div>

          <p className="font-sans text-xs text-[#0A0A0A]/50 text-center leading-relaxed max-w-xs">
            Muestra este código al instructor al llegar. El staff sumará tu sello de visita al instante.
          </p>
        </div>
      )}

      {/* ── 10 Stamps Completion Modal ── */}
      {stampCount === 10 && (
        <div
          id="stamps-completed-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn"
        >
          <div
            className="w-full max-w-sm bg-white rounded-[2rem] p-8 text-center space-y-6 flex flex-col items-center shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#0A0A0A]" />

            <div className="relative my-2">
              <div className="w-24 h-24 bg-[#EDF2EF] rounded-full flex items-center justify-center relative">
                <YogaIcon className="w-12 h-12 text-[#5A8C7C]" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-sans text-[9px] tracking-[0.3em] font-bold text-[#0A0A0A]/45 uppercase block">
                Planilla Completada
              </span>
              <h3 className="font-sans text-2xl font-semibold tracking-tight text-[#0A0A0A] leading-tight">
                {`¡Felicidades, ${user.name}!`}
              </h3>
              <p className="font-sans text-xs text-[#0A0A0A]/55 leading-relaxed max-w-xs mt-2">
                Has reunido tus <strong className="text-[#0A0A0A]">10 sellos</strong> de visita. Muestra esta pantalla al staff de <strong className="text-[#0A0A0A]">Blanco Yoga</strong> para recibir tu clase de cortesía.
              </p>
            </div>

            <div className="w-full pt-2">
              <button
                id="claim-reward-btn"
                onClick={() => { if (onClaimCompletedCard) onClaimCompletedCard(); }}
                className="w-full py-4 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white rounded-2xl font-sans text-xs font-bold tracking-[0.2em] uppercase transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Registrar Canje con el Staff
              </button>

              <p className="font-sans text-[10px] text-[#0A0A0A]/40 mt-3 font-medium">
                Al presionar este botón, tu planilla se reiniciará a 0 sellos.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}