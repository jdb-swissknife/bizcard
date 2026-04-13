import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function CardLanding() {
  const [params] = useSearchParams()

  const card = useMemo(() => ({
    name: params.get('n') || '',
    title: params.get('t') || '',
    company: params.get('c') || '',
    phone: params.get('p') || '',
    email: params.get('e') || '',
    website: params.get('w') || '',
  }), [params])

  const initials = card.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hasCard = card.name || card.company || card.phone || card.email

  if (!hasCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M8 10h8M8 14h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">No card found</h1>
          <p className="text-sm text-gray-500 mb-4">This QR code doesn't have card data attached.</p>
          <a href="/" className="text-sm text-brand-600 font-medium hover:underline">
            Create your own free digital business card
          </a>
        </div>
      </div>
    )
  }

  // Detect if this is a MindVault card (for custom CTA)
  const isMindVault = card.company?.toLowerCase().includes('mindvault')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Card */}
      <div className="px-4 pt-8 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-brand-500 to-blue-400" />

            <div className="p-6">
              {/* Avatar + Name */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-xl font-bold text-brand-600 shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900">{card.name}</h1>
                  {card.title && <div className="text-sm text-gray-600">{card.title}</div>}
                  {card.company && <div className="text-sm font-semibold text-brand-600">{card.company}</div>}
                </div>
              </div>

              {/* Contact buttons */}
              <div className="mt-6 space-y-2">
                {card.phone && (
                  <a
                    href={`tel:${card.phone}`}
                    className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call {card.name.split(' ')[0]}
                  </a>
                )}

                {card.email && (
                  <a
                    href={`mailto:${card.email}`}
                    className="flex items-center gap-3 w-full py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    Send Email
                  </a>
                )}

                {card.website && (
                  <a
                    href={card.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Visit Website
                  </a>
                )}
              </div>

              {/* Save contact */}
              <button
                onClick={() => {
                  const lines = [
                    'BEGIN:VCARD', 'VERSION:3.0',
                    `FN:${card.name}`,
                    `ORG:${card.company}`,
                    `TITLE:${card.title}`,
                  ]
                  if (card.phone) lines.push(`TEL;TYPE=CELL:${card.phone}`)
                  if (card.email) lines.push(`EMAIL:${card.email}`)
                  if (card.website) lines.push(`URL:${card.website}`)
                  lines.push('END:VCARD')
                  const blob = new Blob([lines.join('\n')], { type: 'text/vcard' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${card.name || 'contact'}.vcf`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 rounded-xl text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
                Save to Contacts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {isMindVault && (
        <div className="px-4 pb-8">
          <div className="max-w-sm mx-auto">
            <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-100 p-5 text-center">
              <h2 className="text-base font-bold text-gray-900">Want this for your business?</h2>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Every employee gets a digital card. QR scans become leads. Your agents follow up instantly. Free 30-day trial.
              </p>
              <a
                href="https://mindvaultstudio.net"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors"
              >
                Book Free Audit
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pb-6 text-center">
        <span className="text-[10px] text-gray-400">
          Powered by <a href="/" className="font-semibold text-gray-500 hover:underline">MindVault</a>
        </span>
      </div>
    </div>
  )
}
