import { useState, type FormEvent } from 'react'
import { PageHero } from '@/components/layout/PageHero'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { API_BASE } from '@/lib/api'
import { useCms } from '@/lib/cms'
import { useOverlay } from '@/lib/overlay'

/**
 * Contact / RFQ.
 *
 * The form posts the exact payload the finished site posts, to the same
 * `/public/enquiries` endpoint, so submissions land in the same admin inbox —
 * the field names below are the API contract and must not be renamed to suit
 * the component. Labels, options and status messages are `contact.*` keys;
 * the address, phone and email are `/public/content` records.
 */

const PRODUCTS = [
  { value: '', key: 'contact.form.option.selectProduct' },
  { value: 'wheat', key: 'contact.form.option.wheat' },
  { value: 'potato', key: 'contact.form.option.potato' },
  { value: 'corn', key: 'contact.form.option.corn' },
  { value: 'other', key: 'contact.form.option.other' },
] as const

const VOLUMES = [
  { value: '', key: 'contact.form.option.selectVolume' },
  { value: 'under-5t', key: 'contact.form.option.under5t' },
  { value: '5-20t', key: 'contact.form.option.5to20t' },
  { value: '20-50t', key: 'contact.form.option.20to50t' },
  { value: '50t-plus', key: 'contact.form.option.50tPlus' },
] as const

const PROCESS = ['day1', 'day2', 'day3'] as const

type SendState = 'idle' | 'sending' | 'ok' | 'fail' | 'unreachable'

export function Contact() {
  const { tk } = useOverlay()
  const content = useCms((s) => s.content)
  const [state, setState] = useState<SendState>('idle')

  const email = content['contact.email']
  const phone = content['contact.phone_primary']
  const address = content['contact.address']

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (state === 'sending') return

    const form = e.currentTarget
    setState('sending')

    const data = new FormData(form)
    const payload = {
      company_name: String(data.get('company') ?? '').trim(),
      contact_name: String(data.get('contact_name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      phone: String(data.get('phone') ?? '').trim(),
      country: String(data.get('country') ?? '').trim(),
      product_interest: String(data.get('product') ?? ''),
      estimated_volume: String(data.get('volume') ?? ''),
      message: String(data.get('message') ?? '').trim(),
    }

    try {
      const res = await fetch(`${API_BASE}/public/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setState('ok')
        form.reset()
      } else {
        setState('fail')
      }
    } catch {
      // Offline, blocked or CORS. The message points at the email address,
      // which is rendered right below.
      setState('unreachable')
    }
  }

  const statusText =
    state === 'ok' || state === 'fail' || state === 'unreachable'
      ? tk(`contact.form.status.${state}`)
      : ''

  return (
    <main id="top">
      <PageHero page="contact" />

      <section className="section bay" id="quote">
        <Reveal as="p" className="eyebrow">
          {tk('contact.form.eyebrow')}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {tk('contact.form.h2')}
        </Reveal>
        <Reveal as="p" className="lead" delay={110}>
          {tk('contact.form.required')}
        </Reveal>

        <Reveal as="form" className="form" delay={160} onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="company">{tk('contact.form.label.company')} *</label>
            <input id="company" name="company" type="text" required autoComplete="organization" />
          </div>
          <div className="field">
            <label htmlFor="contact_name">{tk('contact.form.label.contactName')} *</label>
            <input id="contact_name" name="contact_name" type="text" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">{tk('contact.form.label.email')} *</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="phone">{tk('contact.form.label.phone')}</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="country">{tk('contact.form.label.country')} *</label>
            <input id="country" name="country" type="text" required autoComplete="country-name" />
          </div>
          <div className="field">
            <label htmlFor="product">{tk('contact.form.label.product')} *</label>
            <select id="product" name="product" required defaultValue="">
              {PRODUCTS.map((o) => (
                <option key={o.key} value={o.value} disabled={o.value === ''}>
                  {tk(o.key)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="volume">{tk('contact.form.label.volume')}</label>
            <select id="volume" name="volume" defaultValue="">
              {VOLUMES.map((o) => (
                <option key={o.key} value={o.value} disabled={o.value === ''}>
                  {tk(o.key)}
                </option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="message">{tk('contact.form.label.message')} *</label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder={tk('contact.form.placeholder.message')}
            />
          </div>

          <div className="field full">
            <Button type="submit" variant="fill" disabled={state === 'sending'}>
              {tk('contact.form.submit')}
            </Button>
            {/* role=status so the outcome is announced, not just painted. */}
            <p className={`form-status ${state === 'ok' ? 'ok' : 'fail'}`} role="status">
              {statusText}
            </p>
            <p className="consent">{tk('contact.form.consent')}</p>
          </div>
        </Reveal>
      </section>

      <section className="section bay" id="reach">
        <div className="bento">
          {email && (
            <Reveal as="article" className="cell w2">
              <span className="cap">{tk('contact.info.sales')}</span>
              <h3>
                <a href={`mailto:${email}`}>{email}</a>
              </h3>
            </Reveal>
          )}
          {phone && (
            <Reveal as="article" className="cell w2" delay={55}>
              <span className="cap">{tk('contact.info.call')}</span>
              <h3>
                <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a>
              </h3>
            </Reveal>
          )}
          {address && (
            <Reveal as="article" className="cell w2" delay={110}>
              <span className="cap">{tk('contact.info.facility')}</span>
              <p>{address}</p>
            </Reveal>
          )}
        </div>
      </section>

      <section className="section bay" id="process">
        <Reveal as="p" className="eyebrow">
          {tk('contact.process.eyebrow')}
        </Reveal>
        <Reveal as="h2" delay={60}>
          {tk('contact.process.h2')}
        </Reveal>

        <ol className="flow">
          {PROCESS.map((d, i) => (
            <Reveal key={d} as="li" className="flow-item" delay={110 + i * 60}>
              <span className="flow-num">{tk(`contact.process.${d}.label`)}</span>
              <h3>{tk(`contact.process.${d}.title`)}</h3>
              <p>{tk(`contact.process.${d}.description`)}</p>
            </Reveal>
          ))}
        </ol>

        {email && (
          <Reveal className="prefer-email" delay={290}>
            <h3>{tk('contact.preferEmail.title')}</h3>
            <p>
              {tk('contact.preferEmail.text')} <a href={`mailto:${email}`}>{email}</a>
            </p>
          </Reveal>
        )}
      </section>
    </main>
  )
}
