import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionItem {
  id: string; title: string; owner: string; date: string; overdue: boolean;
  balance?: number; currency?: string;
}
interface Category {
  key: string; label: string; path: string; total: number | null;
  items: ActionItem[]; error?: string;
}
const API_URL = (import.meta.env.VITE_API_URL || 'https://server.digitalness.co.in/api').replace(/\/$/, '');

export function TodayActions() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [updatedAt, setUpdatedAt] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`${API_URL}/dashboard/actions`, { headers: { Authorization: `Bearer ${getToken()}` }, signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 403 ? 'Your account does not have access to this action list. Ask your administrator to check your role and branch.' : 'Unable to load actions. Please retry.');
        const data = await response.json();
        if (!Array.isArray(data.categories)) throw new Error('Unable to load actions. Please retry.');
        if (!controller.signal.aborted) { setCategories(data.categories); setUpdatedAt(data.updatedAt); }
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  return <Card>
    <CardHeader className="flex flex-row items-center justify-between gap-3">
      <div><CardTitle>Today’s Actions</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Follow-ups due today and overdue items · India time</p>
        {updatedAt && !loading && !error && <p className="text-xs text-muted-foreground mt-1">Updated {new Date(updatedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>}
      </div>
      <Button variant="outline" disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh</Button>
    </CardHeader>
    <CardContent aria-live="polite">
      {loading ? <p role="status" className="text-sm text-muted-foreground">Loading actions…</p>
        : error ? <p role="alert" className="text-sm text-destructive">{error}</p>
          : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map(category => <section key={category.key} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-2 mb-3"><h3 className="font-semibold text-sm">{category.label}</h3><span className="font-bold">{category.total ?? 'Unavailable'}</span></div>
              {category.error ? <p role="alert" className="text-sm text-destructive">{category.error}</p>
                : category.items.length === 0 ? <p className="text-sm text-muted-foreground">Nothing needs attention here.</p>
                  : <ul className="space-y-3">{category.items.map(item => <li key={item.id} className="border-b pb-3 last:border-0">
                    <p className="text-sm font-medium break-words">{item.title}</p>
                    <p className="text-xs text-muted-foreground">Owner: {item.owner}</p>
                    <p className={`text-xs ${item.overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {item.overdue ? 'Overdue · ' : category.key === 'approvals' || category.key === 'workApprovals' ? 'Submitted · ' : 'Due · '}
                      {new Date(item.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                    {item.balance != null && <p className="text-xs">Balance: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: item.currency || 'INR' }).format(item.balance)}</p>}
                  </li>)}</ul>}
              <Button asChild variant="outline" size="sm" className="mt-3"><Link to={category.path}>Open {category.label.toLowerCase()}</Link></Button>
              {category.total != null && category.total > category.items.length && <p className="text-xs text-muted-foreground mt-2">Showing the oldest {category.items.length} of {category.total}. Open the list to review all.</p>}
            </section>)}
          </div>}
    </CardContent>
  </Card>;
}
