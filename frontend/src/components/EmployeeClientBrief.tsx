import { fileUrl } from '@/lib/employeeWorkspace';

export default function EmployeeClientBrief({ client }: { client: any }) {
  if (!client || typeof client !== 'object') return null;
  const brand = client.brandProfile || {};
  const business = client.businessProfile || {};
  const fields = [
    ['Business', business.businessSummary || brand.description], ['Requirements', client.requirements?.join(', ')],
    ['Brand guidelines', brand.brandGuidelines], ['Target audience', business.targetAudience?.join(', ')],
    ['Tone of voice', brand.toneOfVoice?.join(', ')], ['Fonts', brand.fonts?.join(', ')],
    ['Brand colors', brand.brandColors?.join(', ')], ['Content languages', brand.contentLanguages?.join(', ')],
    ['Restricted words', brand.restrictedWords?.join(', ')],
  ].filter(([, value]) => value);
  const assets = [brand.logoUrl && ['Brand logo', brand.logoUrl], brand.bannerUrl && ['Brand banner', brand.bannerUrl], ...(brand.referenceImages || []).map((url: string, index: number) => [`Reference ${index + 1}`, url])].filter(Boolean) as string[][];
  return <details className="rounded-xl border bg-card p-4"><summary className="cursor-pointer text-sm font-semibold">Client brief & brand assets · {client.name || client.companyName}</summary><div className="mt-4 space-y-3">{!fields.length && !assets.length && <p className="text-sm text-muted-foreground">No brand brief has been added yet. Ask your manager for the required references.</p>}{fields.map(([label, value]) => <div key={label}><h4 className="text-xs font-semibold text-muted-foreground">{label}</h4><p className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</p></div>)}{assets.map(([label, url], index) => <a key={index} href={fileUrl(url)} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary">{label} ↗</a>)}</div></details>;
}
