import { useStore } from '../store/useStore';
import { CreditCard, Zap, Check, ShieldCheck, ShoppingBag } from 'lucide-react';

const TOKEN_PACKS = [
  { id: 'p1', amount: 1, price: 1, popular: false },
  { id: 'p5', amount: 5, price: 5, popular: false },
  { id: 'p10', amount: 10, price: 10, popular: true },
  { id: 'p25', amount: 25, price: 25, popular: false },
  { id: 'p50', amount: 50, price: 50, popular: false },
  { id: 'p100', amount: 100, price: 100, popular: false },
];

export function Tokens() {
  const { user, tokens } = useStore();

  const handlePurchase = async (packId: string) => {
    if (!user) {
      alert("Lütfen önce giriş yapın.");
      return;
    }
    // Stripe Checkout API entegrasyonu buraya gelecek
    console.log(`${packId} satın alma işlemi başlatılıyor...`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 italic">Refill Your Creative Power</h1>
          <p className="text-zinc-500 text-sm max-w-2xl mx-auto leading-relaxed">
            Basit ve şeffaf: <span className="text-white font-bold">1 Jeton = 1 Dolar</span>. 
            Her üretim 1 jeton harcar. Tasarımlarınızı dijital olarak indirmek ücretsizdir. 
            Özel haklar (Private) için üretim sonrası ek ödeme yapabilirsiniz.
          </p>
        </header>

        {/* Mevcut Durum */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] mb-12 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Zap className="w-8 h-8 text-emerald-500 fill-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your Balance</p>
              <p className="text-3xl font-black">{tokens} <span className="text-sm font-normal text-zinc-600 uppercase">Tokens</span></p>
            </div>
          </div>
          <div className="hidden md:block h-12 w-px bg-zinc-800" />
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Status</p>
            <p className="text-xs font-bold text-emerald-500 uppercase">Verified Creator</p>
          </div>
        </div>

        {/* Paketler Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TOKEN_PACKS.map((pack) => (
            <div 
              key={pack.id} 
              className={`relative bg-zinc-900 border ${pack.popular ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-zinc-800'} p-6 rounded-[2rem] flex flex-col items-center group hover:bg-zinc-800/50 transition-all cursor-pointer`}
              onClick={() => handlePurchase(pack.id)}
            >
              <h3 className="text-3xl font-black mb-1">{pack.amount}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Tokens</p>
              <div className="text-2xl font-black mb-6 text-emerald-500">${pack.price}</div>
              
              <button className="w-full py-3 bg-zinc-100 hover:bg-white text-black text-[10px] font-black uppercase rounded-xl transition-all">
                Buy Now
              </button>
            </div>
          ))}
        </div>

        {/* Bilgi Kutuları */}
        <footer className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-900 pt-12">
          <div className="flex flex-col gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <h4 className="font-bold text-xs uppercase italic">100% Ownership</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">Ürettiğiniz her şeyi ticari amaçla kullanabilirsiniz. Private opsiyonu ile tasarımı sadece kendinize saklayın.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Check className="w-6 h-6 text-blue-500" />
            <h4 className="font-bold text-xs uppercase italic">Digital Downloads</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">Tüm boyutlar için (8x10'dan 24x36'ya) dijital baskı dosyalarını profilinizden anında indirin.</p>
          </div>
          <div className="flex flex-col gap-3">
            <ShoppingBag className="w-6 h-6 text-purple-500" />
            <h4 className="font-bold text-xs uppercase italic">Sell & Earn</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">Public bıraktığınız tasarımlar mağazamızda satıldıkça komisyon kazanın (Yakında).</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
