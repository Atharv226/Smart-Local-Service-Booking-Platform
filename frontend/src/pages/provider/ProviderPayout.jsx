import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function ProviderPayout() {
  const { api } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/providers/payout-summary');
        setSummary(data);
      } catch {
        // ignore for now
      }
    };
    load();
  }, [api]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-slate-900">Payout</h1>
        <p className="text-xs text-slate-500">
          View your earnings and withdraw to offline, online, or blockchain wallet methods.
        </p>
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Earnings
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ₹{summary?.totalEarnings || 0}
          </p>
          <p className="text-xs text-slate-500">
            {summary?.jobsCompleted || 0} completed jobs
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Withdraw Options
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>• Offline cash payout</li>
            <li>• Online UPI / card transfer</li>
            <li>• Blockchain wallet payout (Polygon, mocked)</li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Next steps
          </p>
          <p className="mt-2 text-xs text-slate-600">
            In a production app this section would trigger payout flows and record
            on-chain wallet transactions. For now, earnings are tracked in the backend
            and wallet payouts are mocked.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProviderPayout;


