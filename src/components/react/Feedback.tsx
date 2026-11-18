import {useState, type FormEvent} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TextArea} from '@astryxdesign/core/TextArea';
import {Shell} from './Shell';

/** "Send feedback" in the footer, with its dialog. */
export default function Feedback() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ok: boolean; text: string} | null>(null);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!message.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, message}),
      });
      setNote(res.ok ? {ok: true, text: 'Thanks for your feedback!'} : {ok: false, text: 'Error sending feedback'});
      if (res.ok) {
        setName('');
        setMessage('');
      }
    } catch {
      setNote({ok: false, text: 'Error sending feedback'});
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <button type="button" className="link-btn" onClick={() => setOpen(true)}>
        Send feedback
      </button>
      <Dialog isOpen={open} onOpenChange={setOpen} purpose="form" width={440}>
        <DialogHeader title="Send feedback" subtitle="Have a suggestion or found an issue? Let me know." onOpenChange={setOpen} />
        <form className="feedback-form" onSubmit={submit}>
          <TextInput label="Your name" isOptional value={name} onChange={setName} htmlName="name" />
          <TextArea label="Your feedback" isRequired rows={5} value={message} onChange={setMessage} htmlName="message" />
          <div className="feedback-actions">
            <p className={`form-note${note ? (note.ok ? ' is-ok' : ' is-error') : ''}`} role="status">
              {note?.text}
            </p>
            <Button type="submit" variant="primary" label="Send feedback" isLoading={busy} isDisabled={!message.trim()} />
          </div>
        </form>
      </Dialog>
    </Shell>
  );
}
