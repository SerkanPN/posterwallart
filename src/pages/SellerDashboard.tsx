import { useStore } from '../store/useStore';
import { BarChart3, PlusCircle, PackageSearch, DollarSign, Users, TrendingUp } from 'lucide-react';

export function SellerDashboard() {
  const { user } = useStore();

  if (!user?.isSeller) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="w-10 h-10 text-zinc-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tighter uppercase mb-4">Seller Portal</h2>
        <p className="text-zinc-500 mb-8 max-w-md">Join our marketplace to sell your AI-generated art to thousands of customers.</p>
        <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all">
          Apply to Sell
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter uppercase">Seller Dashboard</h1>
        <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          List New Art
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4 mb-4 text-zinc-400">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-semibold uppercase tracking-wider text-sm">Total Revenue</h3>
          </div>
          <p className="text-4xl font-mono font-bold">$4,250.00</p>
          <p className="text-emerald-500 text-sm mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +12.5% this month
          </p>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4 mb-4 text-zinc-400">
            <PackageSearch className="w-5 h-5" />
            <h3 className="font-semibold uppercase tracking-wider text-sm">Active Listings</h3>
          </div>
          <p className="text-4xl font-mono font-bold">24</p>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4 mb-4 text-zinc-400">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold uppercase tracking-wider text-sm">Total Customers</h3>
          </div>
          <p className="text-4xl font-mono font-bold">156</p>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4 mb-4 text-zinc-400">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-semibold uppercase tracking-wider text-sm">Conversion Rate</h3>
          </div>
          <p className="text-4xl font-mono font-bold">3.2%</p>
        </div>
      </div>

      {/* Recent Listings */}
      <div>
        <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">Recent Listings</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 text-sm uppercase tracking-wider font-mono">
              <tr>
                <th className="p-4">Artwork</th>
                <th className="p-4">Price</th>
                <th className="p-4">Sales</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4 flex items-center gap-4">
                    <div className="w-12 h-16 bg-zinc-800 rounded overflow-hidden">
                      <img src={`https://picsum.photos/seed/seller${i}/800/1200`} alt="Art" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold">Digital Masterpiece {i + 1}</p>
                      <p className="text-xs text-zinc-500">Digital Download</p>
                    </div>
                  </td>
                  <td className="p-4 font-mono">${(Math.random() * 50 + 10).toFixed(2)}</td>
                  <td className="p-4 font-mono">{Math.floor(Math.random() * 100)}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
