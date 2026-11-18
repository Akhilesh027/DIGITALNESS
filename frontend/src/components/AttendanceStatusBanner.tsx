import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3 } from 'lucide-react';
import { serviceRequest } from '@/lib/serviceAccess';

export default function AttendanceStatusBanner() {
  const [state, setState] = useState('Loading attendance…');
  useEffect(() => {
    let active = true;
    const load = () => serviceRequest('/attendance/clock').then(data => {
      if (active) setState(data.active?.clockState || (data.today?.mode === 'Manual' ? 'Checked out' : 'Not checked in'));
    }).catch(() => { if (active) setState('Attendance unavailable'); });
    load(); const timer = window.setInterval(load, 60000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-primary" /><div><p className="text-sm font-semibold">{state}</p><p className="mt-1 text-xs text-muted-foreground">Attendance uses explicit check-in and check-out.</p></div></div><Link to="/my-services?view=profile" className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">Open attendance →</Link></div>;
}
