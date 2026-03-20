import { useStore } from '../store/useStore';
import { Download, EyeOff, ExternalLink, Trash2, ShieldCheck, ShoppingCart } from 'lucide-react';

export function Profile() {
  const { user, recommendations } = useStore();

  // Bu veriler normalde DB'den (Supabase vb.) gelecek, şimdilik store'daki recommendations'ı kullanıyoruz
  const myDesigns = recommendations.filter(p => p.isGenerated);

  const handleDownload = (imageUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-poster.png`;
    link.click();
  };

  const handleMakePrivate = (id: string) => {
    // Stripe $5 Private Checkout başlatılacak
    alert("Bu tasarımı mağazadan kaldırmak ve tamamen size özel kılmak için $5 ödeme sayfasına yönlendiriliyorsunuz.");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">My Studio</h1>
            <p className="text-zinc-500 text-xs mt-1">Manage your AI generated masterpieces</p>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800">
            <img src={user?.photoURL || ''} className="w-8 h-8 rounded-full border border-zinc-700" alt="Avatar" />
            <span className="text-xs font-bold uppercase tracking-widest">{user?.displayName || 'User'}</span>
          </div>
        </header>

        {myDesigns.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-zinc-900 rounded-[3rem]">
            <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">No designs yet. Go to Studio to create.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myDesigns.map((design) => (
              <div key={design.id} className="group bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col">
                {/* Poster Önizleme */}
                <div className="aspect-[2/3] relative overflow-hidden bg-black">
                  <img src={design.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={design.title} />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                    <button 
                      onClick={() => handleDownload(design.image, design.title)}
                      className="w-48 py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200"
                    >
                      <Download className="w-4 h-4" /> Download 4K
                    </button>
                    <button className="w-48 py-3 bg-zinc-800 text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700">
                      <ShoppingCart className="w-4 h-4" /> Order Physical
                    </button>
                  </div>
                </div>

                {/* Alt Bilgi & İşlemler */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-sm uppercase italic">{design.title}</h3>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-tighter">Created: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Private Butonu */}
                  <button 
                    onClick={() => handleMakePrivate(design.id)}
                    className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase border border-indigo-500/20 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <EyeOff className="w-3 h-3" /> Make Private ($5.00)
                  </button>
                  <p className="text-[9px] text-zinc-600 text-center mt-3 leading-tight">
                    By default, your art is public in our shop. Private designs belong exclusively to you.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
