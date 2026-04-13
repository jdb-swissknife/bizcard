import { useState, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { toPng } from 'html-to-image'
import { saveAs } from 'file-saver'

// ── Types ──────────────────────────────────────────────
interface CardData {
  name: string
  title: string
  company: string
  phone: string
  email: string
  website: string
  photoUrl: string
}

type Template = 'modern' | 'classic' | 'bold'

const TEMPLATES: { key: Template; label: string; desc: string }[] = [
  { key: 'modern', label: 'Modern', desc: 'Clean lines, brand accent' },
  { key: 'classic', label: 'Classic', desc: 'Traditional, professional' },
  { key: 'bold', label: 'Bold', desc: 'Dark, stands out' },
]

const EMPTY_CARD: CardData = {
  name: '', title: '', company: '', phone: '', email: '', website: '', photoUrl: '',
}

// ── vCard generator ────────────────────────────────────
function generateVCard(d: CardData): string {
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${d.name}`,
    `ORG:${d.company}`,
    `TITLE:${d.title}`,
  ]
  if (d.phone) lines.push(`TEL;TYPE=CELL:${d.phone}`)
  if (d.email) lines.push(`EMAIL:${d.email}`)
  if (d.website) lines.push(`URL:${d.website}`)
  if (d.photoUrl) lines.push(`PHOTO;VALUE=URI:${d.photoUrl}`)
  lines.push('END:VCARD')
  return lines.join('\n')
}

// ── Phone preview URL (what the QR scans to) ───────────
function cardLandingUrl(d: CardData): string {
  const params = new URLSearchParams()
  if (d.name) params.set('n', d.name)
  if (d.title) params.set('t', d.title)
  if (d.company) params.set('c', d.company)
  if (d.phone) params.set('p', d.phone)
  if (d.email) params.set('e', d.email)
  if (d.website) params.set('w', d.website)
  // In production this would be a real hosted landing page.
  // For now we'll encode it as a data URL or the vCard directly.
  return `https://bizcard.mindvault.io/card?${params.toString()}`
}

// ── Card Preview Components ────────────────────────────
function CardPreview({ data, template, cardRef }: {
  data: CardData; template: Template; cardRef: React.RefObject<HTMLDivElement | null>
}) {
  const hasContent = data.name || data.company || data.phone || data.email

  const base = "w-full max-w-[380px] rounded-2xl p-6 relative overflow-hidden"
  const styles: Record<Template, string> = {
    modern: `${base} bg-white border border-gray-200 shadow-lg`,
    classic: `${base} bg-white border-2 border-gray-800 shadow-lg`,
    bold: `${base} bg-gray-900 text-white shadow-2xl`,
  }

  if (!hasContent) {
    return (
      <div className={`${styles[template]} flex flex-col items-center justify-center min-h-[200px]`}>
        <div className="text-gray-400 text-sm">Fill in your details to see your card</div>
      </div>
    )
  }

  const accent = template === 'bold' ? 'text-blue-400' : 'text-brand-600'
  const muted = template === 'bold' ? 'text-gray-400' : 'text-gray-500'
  const sub = template === 'bold' ? 'text-gray-300' : 'text-gray-600'

  return (
    <div ref={cardRef} className={styles[template]}>
      {template === 'modern' && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 to-blue-400" />
      )}
      {template === 'classic' && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-800" />
      )}

      <div className="flex items-start gap-4">
        {data.photoUrl ? (
          <img src={data.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-gray-100" />
        ) : (
          <div className={`w-16 h-16 rounded-full shrink-0 flex items-center justify-center text-xl font-bold ${
            template === 'bold' ? 'bg-gray-800 text-gray-300' : 'bg-brand-50 text-brand-600'
          }`}>
            {data.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className={`text-xl font-bold truncate ${template === 'bold' ? 'text-white' : 'text-gray-900'}`}>
            {data.name}
          </h2>
          {data.title && <div className={`text-sm ${sub}`}>{data.title}</div>}
          {data.company && <div className={`text-sm font-semibold ${accent}`}>{data.company}</div>}
        </div>
      </div>

      {(data.phone || data.email || data.website) && (
        <div className={`mt-4 pt-4 space-y-1.5 ${template === 'bold' ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}>
          {data.phone && <div className={`text-sm flex items-center gap-2 ${sub}`}><span className={muted}>Tel</span> {data.phone}</div>}
          {data.email && <div className={`text-sm flex items-center gap-2 truncate ${sub}`}><span className={muted}>Email</span> {data.email}</div>}
          {data.website && <div className={`text-sm flex items-center gap-2 truncate ${sub}`}><span className={muted}>Web</span> {data.website}</div>}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-dashed border-gray-300/50 text-center">
        <span className={`text-[10px] ${template === 'bold' ? 'text-gray-500' : 'text-gray-400'}`}>
          Powered by MindVault
        </span>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────
export default function App() {
  const [card, setCard] = useState<CardData>(EMPTY_CARD)
  const [template, setTemplate] = useState<Template>('modern')
  const [step, setStep] = useState<'edit' | 'preview'>('edit')
  const cardRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const set = (field: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard(prev => ({ ...prev, [field]: e.target.value }))

  const hasContent = card.name || card.company || card.phone || card.email

  const downloadCardPng = useCallback(() => {
    if (!cardRef.current) return
    toPng(cardRef.current, { pixelRatio: 3 }).then(dataUrl => {
      saveAs(dataUrl, `${card.name || 'bizcard'}.png`)
    })
  }, [card.name])

  const downloadQrPng = useCallback(() => {
    if (!qrRef.current) return
    toPng(qrRef.current, { pixelRatio: 3 }).then(dataUrl => {
      saveAs(dataUrl, `${card.name || 'bizcard'}-qr.png`)
    })
  }, [card.name])

  const downloadVCard = useCallback(() => {
    const blob = new Blob([generateVCard(card)], { type: 'text/vcard' })
    saveAs(blob, `${card.name || 'contact'}.vcf`)
  }, [card])

  const qrValue = hasContent ? cardLandingUrl(card) : 'https://bizcard.mindvault.io'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M8 10h8M8 14h4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">BizCard</span>
            <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded-full ml-1">FREE</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            No signup required
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero -- only on edit step */}
        {step === 'edit' && (
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Your digital business card in <span className="text-brand-600">30 seconds</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-lg mx-auto">
              Create a professional digital card with QR code. Download instantly. No account needed.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Editor ── */}
          <div className={step === 'preview' ? 'hidden lg:block' : ''}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Your Details</h2>

              <div className="space-y-3">
                <Input label="Full Name" placeholder="John Smith" value={card.name} onChange={set('name')} />
                <Input label="Title / Role" placeholder="Sales Representative" value={card.title} onChange={set('title')} />
                <Input label="Company" placeholder="Smith Roofing Co." value={card.company} onChange={set('company')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Phone" placeholder="(612) 555-0123" value={card.phone} onChange={set('phone')} type="tel" />
                  <Input label="Email" placeholder="john@smithroofing.com" value={card.email} onChange={set('email')} type="email" />
                </div>
                <Input label="Website" placeholder="https://smithroofing.com" value={card.website} onChange={set('website')} type="url" />
                <Input label="Photo URL" placeholder="https://... (optional)" value={card.photoUrl} onChange={set('photoUrl')} type="url" />
              </div>

              {/* Template picker */}
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Style</h2>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTemplate(t.key)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        template === t.key
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-semibold">{t.label}</div>
                      <div className="text-[10px] text-gray-400">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={() => setStep('preview')}
                disabled={!hasContent}
                className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Generate My Card
              </button>
            </div>
          </div>

          {/* ── Preview + Downloads ── */}
          <div className={step === 'edit' ? 'hidden lg:block' : ''}>
            <div className="space-y-6">
              {/* Card */}
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Card</h2>
                <div className="flex justify-center">
                  <CardPreview data={card} template={template} cardRef={cardRef} />
                </div>
              </div>

              {/* QR Code */}
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">QR Code</h2>
                <div className="flex justify-center">
                  <div ref={qrRef} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm inline-block">
                    <QRCodeSVG
                      value={qrValue}
                      size={180}
                      level="M"
                      includeMargin={false}
                      fgColor={template === 'bold' ? '#1a1a2e' : '#111827'}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">Scan to view your digital card</p>
              </div>

              {/* Download buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={downloadCardPng}
                  disabled={!hasContent}
                  className="py-3 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  Card PNG
                </button>
                <button
                  onClick={downloadQrPng}
                  disabled={!hasContent}
                  className="py-3 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  QR Code PNG
                </button>
                <button
                  onClick={downloadVCard}
                  disabled={!hasContent}
                  className="py-3 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  Save Contact
                </button>
              </div>

              {/* Back to edit (mobile) */}
              {step === 'preview' && (
                <button
                  onClick={() => setStep('edit')}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors lg:hidden"
                >
                  Edit Details
                </button>
              )}

              {/* CTA funnel */}
              <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-100 p-5 text-center">
                <h3 className="text-sm font-bold text-gray-900">Want these QR scans automatically captured as leads?</h3>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  MindVault gives your whole team digital cards, auto-responds to every scan, and books appointments while you sleep.
                </p>
                <a
                  href="https://mindvaultstudio.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
                >
                  Learn About MindVault
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-100 py-8 text-center">
        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-gray-500">MindVault</span> — AI agents that work for your business
        </p>
      </footer>
    </div>
  )
}

// ── Input component ────────────────────────────────────
function Input({ label, ...props }: {
  label: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
      />
    </div>
  )
}
