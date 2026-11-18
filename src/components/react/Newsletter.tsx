import {useState, type FormEvent} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Shell} from './Shell';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ok: boolean; text: string} | null>(null);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      });
      const data = await res.json();
      setNote({ok: res.ok, text: data.message || data.error || 'Subscribed!'});
      if (res.ok) setEmail('');
    } catch {
      setNote({ok: false, text: 'Something went wrong. Please try again.'});
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <form className="newsletter-form" onSubmit={submit} noValidate>
        <div className="newsletter-field">
          <TextInput type="email" label="Email address" isLabelHidden placeholder="you@example.com" value={email} onChange={setEmail} size="lg" autoComplete="email" htmlName="email" />
        </div>
        <Button type="submit" variant="primary" size="lg" label="Subscribe" isLoading={busy} />
      </form>
      <p className={`form-note${note ? (note.ok ? ' is-ok' : ' is-error') : ''}`} role="status">
        {note?.text}
      </p>
    </Shell>
  );
}
