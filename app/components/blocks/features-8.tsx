"use client"

import { Brain, CreditCard, Download, Shield, Sparkles } from 'lucide-react'

const hsn = [
  { desc: 'Logo design',    code: '998312' },
  { desc: 'Software dev',   code: '998314' },
  { desc: 'UX consulting',  code: '998311' },
  { desc: 'Accounting svc', code: '998222' },
]

const parsedFields = [
  { label: 'Client',      value: 'Rahul' },
  { label: 'Amount',      value: '₹15,000' },
  { label: 'GST Type',    value: 'CGST + SGST' },
  { label: 'HSN/SAC',     value: '998312' },
  { label: 'Total',       value: '₹17,700' },
  { label: 'Invoice no.', value: 'INV-2025-26-001' },
]

const bars = [35, 58, 42, 71, 55, 88, 62, 45, 79, 53, 91, 68]

export function Features() {
  return (
    <section style={{
      background: 'var(--ink)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      padding: '96px 0',
    }}>

      {/* blink keyframe */}
      <style>{`
        @keyframes mi-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .mi-cursor { display:inline-block; width:7px; height:13px; background:var(--gold); margin-left:3px; vertical-align:middle; animation:mi-blink 1.1s step-end infinite; border-radius:1px; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Section header ── */}
        <div style={{ marginBottom: 52 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>Why Magic Invoice</p>
          <h2 style={{
            fontFamily: 'var(--font-playfair), serif',
            fontWeight: 600,
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            margin: 0,
          }}>
            Built for India.{' '}
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Powered by AI.</em>
          </h2>
        </div>

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">

          {/* ── Card 1: Speed stat ── */}
          <div
            className="col-span-1 sm:col-span-2 lg:col-span-2"
            style={{
              background: 'var(--ink-soft)',
              border: '1px solid var(--border-bright)',
              borderRadius: 2,
              padding: '40px 36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 32,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 260,
            }}
          >
            {/* ruled-line bg */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(transparent,transparent 39px,rgba(215,183,120,0.05) 39px,rgba(215,183,120,0.05) 40px)',
              pointerEvents: 'none',
            }} />

            <p className="section-label" style={{ fontSize: 9, position: 'relative', zIndex: 1 }}>
              avg. time to invoice
            </p>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, lineHeight: 1 }}>
                <span style={{
                  fontFamily: 'var(--font-playfair), serif',
                  fontSize: 88,
                  fontWeight: 700,
                  color: 'var(--gold)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}>18</span>
                <span style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: 20,
                  color: 'var(--text-muted)',
                  marginBottom: 12,
                }}>sec</span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-playfair), serif',
                fontWeight: 600,
                fontSize: 19,
                color: 'var(--text-primary)',
                marginTop: 18,
                lineHeight: 1.3,
              }}>
                Plain text to<br />
                <em style={{ color: 'var(--cream-soft)', fontStyle: 'italic' }}>GST-ready invoice.</em>
              </h3>
            </div>

            <p style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              position: 'relative', zIndex: 1,
            }}>              AI-Powered Stats</p>
          </div>

          {/* ── Card 2: GST Detection ── */}
          <div
            className="col-span-1 lg:col-span-2"
            style={{
              background: 'var(--ink-soft)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              padding: '32px',
              overflow: 'hidden',
            }}
          >
            <Shield size={20} style={{ color: 'var(--gold)' }} strokeWidth={1.5} />

            <h3 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: 600,
              fontSize: 18,
              color: 'var(--text-primary)',
              margin: '16px 0 8px',
              lineHeight: 1.3,
            }}>Zero missed GST</h3>

            <p style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              margin: '0 0 24px',
            }}>
              CGST/SGST vs IGST auto-detected from state codes. Every time, correctly.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div style={{
                background: 'var(--ink-raised)',
                border: '1px solid var(--border-bright)',
                borderRadius: 1,
                padding: '12px 14px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: 8, color: 'var(--gold)',
                  letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10,
                }}>Intrastate</p>
                <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--cream)', marginBottom: 3 }}>CGST 9%</p>
                <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--cream)' }}>SGST 9%</p>
              </div>
              <div style={{
                background: 'var(--ink-muted)',
                border: '1px solid var(--border)',
                borderRadius: 1,
                padding: '12px 14px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: 8, color: 'var(--text-muted)',
                  letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10,
                }}>Interstate</p>
                <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--text-secondary)' }}>IGST 18%</p>
              </div>
            </div>
          </div>

          {/* ── Card 3: HSN/SAC Lookup ── */}
          <div
            className="col-span-1 lg:col-span-2"
            style={{
              background: 'var(--ink-soft)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              padding: '32px',
              overflow: 'hidden',
            }}
          >
            <Brain size={20} style={{ color: 'var(--gold)' }} strokeWidth={1.5} />

            <h3 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: 600,
              fontSize: 18,
              color: 'var(--text-primary)',
              margin: '16px 0 8px',
              lineHeight: 1.3,
            }}>AI HSN / SAC lookup</h3>

            <p style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              margin: '0 0 20px',
            }}>
              Describe your work — AI maps it to the right GST code instantly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {hsn.map(({ desc, code }) => (
                <div key={code} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  background: 'var(--ink-muted)',
                  borderRadius: 1,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                    {desc}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.06em' }}>
                    {code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Card 4: Natural Language Parser ── */}
          <div
            className="col-span-1 sm:col-span-2 lg:col-span-3"
            style={{
              background: 'var(--ink-soft)',
              border: '1px solid var(--border-bright)',
              borderRadius: 2,
              padding: '36px',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Sparkles size={15} style={{ color: 'var(--gold)' }} strokeWidth={1.5} />
              <span className="section-label" style={{ fontSize: 9 }}>Natural language parsing</span>
            </div>

            {/* Prompt terminal */}
            <div style={{
              background: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              padding: '14px 16px',
              marginBottom: 18,
            }}>
              <p style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: 9, color: 'var(--text-muted)',
                letterSpacing: '0.14em', marginBottom: 8,
              }}>AI PROMPT</p>
              <p style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                margin: 0,
              }}>
                <span style={{ color: 'var(--gold)', marginRight: 6 }}>›</span>
                &ldquo;Bill Rahul ₹15k for logo design, 18% GST, due Mar 31. GSTIN 27AABCM1234R1Z5&rdquo;
                <span className="mi-cursor" />
              </p>
            </div>

            {/* Parsed output grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 28px',
              marginBottom: 24,
            }}>
              {parsedFields.map(({ label, value }) => (
                <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <p style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: 9, color: 'var(--text-muted)',
                    letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 4px',
                  }}>{label}</p>
                  <p style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: 13, color: 'var(--cream)', margin: 0,
                  }}>{value}</p>
                </div>
              ))}
            </div>

            <h3 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: 600,
              fontSize: 21,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              margin: 0,
            }}>
              One sentence.{' '}
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>A complete invoice.</em>
            </h3>
          </div>

          {/* ── Card 5: GSTR + Razorpay ── */}
          <div
            className="col-span-1 sm:col-span-2 lg:col-span-3"
            style={{
              background: 'var(--ink-soft)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              padding: '36px',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Download size={15} style={{ color: 'var(--gold)' }} strokeWidth={1.5} />
              <span className="section-label" style={{ fontSize: 9 }}>GSTR export + payments</span>
            </div>

            {/* Mini bar chart */}
            <div style={{
              display: 'flex',
              gap: 3,
              alignItems: 'flex-end',
              height: 52,
              marginBottom: 8,
            }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  flex: 1,
                  height: `${h}%`,
                  background: i === 11
                    ? 'var(--gold)'
                    : i >= 9
                    ? 'rgba(217,119,6,0.28)'
                    : 'var(--ink-raised)',
                  borderRadius: '1px 1px 0 0',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
            <p style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: 8, color: 'var(--text-muted)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              marginBottom: 18,
            }}>Invoice volume — last 12 months</p>

            {/* GSTR pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {['GSTR-1', 'GSTR-3B'].map(type => (
                <div key={type} style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--ink-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--cream)' }}>
                    {type}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: 8, letterSpacing: '0.1em',
                    color: '#064E3B', background: '#D1FAE5',
                    padding: '2px 7px', borderRadius: 1,
                  }}>READY</span>
                </div>
              ))}
            </div>

            {/* Razorpay row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              background: 'var(--ink-raised)',
              border: '1px solid var(--border)',
              borderRadius: 1,
              marginBottom: 24,
            }}>
              <CreditCard size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} strokeWidth={1.5} />
              <div>
                <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', margin: '0 0 2px' }}>
                  RAZORPAY INTEGRATION
                </p>
                <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
                  UPI · Cards · Netbanking
                </p>
              </div>
            </div>

            <h3 style={{
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: 600,
              fontSize: 21,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              margin: 0,
            }}>
              Export to GSTR.{' '}
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Collect via Razorpay.</em>
            </h3>
          </div>

        </div>
      </div>
    </section>
  )
}
