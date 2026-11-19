import {useCallback, useEffect, useRef, useState, type FormEvent} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TextArea} from '@astryxdesign/core/TextArea';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Pagination} from '@astryxdesign/core/Pagination';
import {Shell} from './Shell';
import {Icon} from './Icon';
import {getClientId, previousNames, rememberName, resolveDisplayName, storage, timeAgo} from './client';
import {setCommentCount} from './engagement';

type Comment = {id: number; display_name?: string; content?: string; created_at: string; like_count?: number; user_liked?: boolean};
type Page = {page: number; total: number; totalPages: number};
type Summary = {summary: string; commentCount: number; updatedAt: string};
type Sort = 'recent' | 'oldest' | 'most_liked';

const PER_PAGE = 10;

export default function Comments({slug, initialCount}: {slug: string; initialCount: number}) {
  const base = `/api/posts/${encodeURIComponent(slug)}`;
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [page, setPage] = useState<Page>({page: 1, total: initialCount, totalPages: 0});
  const [sort, setSort] = useState<Sort>('recent');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alias, setAlias] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [listStatus, setListStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reactionError, setReactionError] = useState('');
  const requestId = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);

  const load = useCallback(
    async (p: number, s: Sort) => {
      const request = ++requestId.current;
      setListStatus('loading');
      try {
        const res = await fetch(`${base}/comments?page=${p}&limit=${PER_PAGE}&sort=${s}&clientId=${encodeURIComponent(getClientId())}&_t=${Date.now()}`);
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.comments)) throw new Error('Discussion unavailable');
        if (request !== requestId.current) return;
        setListStatus('ready');
        const total = data.pagination?.total || 0;
        setComments(data.comments || []);
        setPage({page: p, total, totalPages: data.pagination?.totalPages || 0});
        setCommentCount(total);
      } catch {
        if (request === requestId.current) setListStatus('error');
      }
    },
    [base],
  );

  const loadSummary = useCallback(async () => {
    try {
      const data = await (await fetch(`${base}/summary`)).json();
      setSummary(data.summary ? data : null);
    } catch {
      setSummary(null);
    }
  }, [base]);

  useEffect(() => {
    load(1, 'recent');
    loadSummary();
    resolveDisplayName().then(n => {
      setAlias(n);
      setName(n);
    });
  }, [load, loadSummary]);

  const changeSort = (value: string) => {
    setSort(value as Sort);
    load(1, value as Sort);
  };

  const changePage = (p: number) => {
    load(p, sort);
    sectionRef.current?.scrollIntoView();
  };

  const likeComment = async (c: Comment) => {
    setReactionError('');
    try {
      const res = await fetch(`/api/comments/${c.id}/likes`, {
        method: c.user_liked ? 'DELETE' : 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({clientId: getClientId()}),
      });
      if (!res.ok) throw new Error('Reaction failed');
      const data = await res.json();
      setComments(list => (list || []).map(x => (x.id === c.id ? {...x, like_count: data.count, user_liked: data.liked} : x)));
    } catch {
      setReactionError('Could not save your reaction. Please try again.');
    }
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!text.trim() || busy) return;
    const custom = name.trim();
    const finalName = custom || alias || 'Anonymous';
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${base}/comments`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: finalName, comment: text, clientId: getClientId()}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to post comment');
        return;
      }
      if (custom && custom !== alias) {
        // The reader renamed themselves: remember the old alias and rename their earlier comments.
        if (alias) rememberName(alias);
        storage.write('blog-display-name', custom);
        setAlias(custom);
        fetch('/api/update-display-name', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({clientId: getClientId(), newDisplayName: custom}),
        }).catch(() => {});
      }
      setText('');
      setSort('recent');
      await load(1, 'recent');
      loadSummary();
    } catch {
      setError('Failed to post comment');
    } finally {
      setBusy(false);
    }
  };

  const mine = previousNamesSafe();
  const shownName = (c: Comment) => (alias && c.display_name && mine.includes(c.display_name) ? alias : c.display_name || 'Anonymous');

  return (
    <Shell>
      <section className="comments" id="comments-section" ref={sectionRef} aria-labelledby="comments-title">
        <div className="comments-head">
          <h2 id="comments-title">
            Discussion <span className="comments-count">({page.total})</span>
          </h2>
          <SegmentedControl value={sort} onChange={changeSort} label="Sort comments" size="sm">
            <SegmentedControlItem value="recent" label="Recent" />
            <SegmentedControlItem value="oldest" label="Oldest" />
            <SegmentedControlItem value="most_liked" label="Most liked" />
          </SegmentedControl>
        </div>

        {summary && (
          <aside className="comment-summary" aria-label="AI summary of the discussion">
            <p className="comment-summary-label">
              <Icon name="sparkles" size={14} /> AI Reader Pulse (Local Gemma)
            </p>
            <p className="comment-summary-text">{summary.summary}</p>
            <p className="comment-summary-meta">
              Synthesized from {summary.commentCount} reader comments · Updated {new Date(summary.updatedAt).toLocaleDateString()}
            </p>
          </aside>
        )}

        <form className="comment-form" onSubmit={submit}>
          <TextInput
            label="Name"
            description={alias ? `Posting as ${alias}. Change it here if you like.` : undefined}
            placeholder="Your name"
            value={name}
            onChange={setName}
            htmlName="name"
            status={error ? {type: 'error', message: error} : undefined}
          />
          <TextArea label="Comment" isRequired rows={4} maxLength={2000} placeholder="Share a question, architectural critique, or feedback..." value={text} onChange={setText} htmlName="comment" />
          <div className="comment-form-actions">
            <Button type="submit" variant="primary" label="Post comment" isLoading={busy} isDisabled={!text.trim()} />
          </div>
        </form>

        <div className="comment-list" aria-live="polite">
          {reactionError && <p role="alert">{reactionError}</p>}
          {listStatus === 'loading' ? <p role="status">Loading discussion…</p> :
           listStatus === 'error' ? <p role="alert">Could not load the discussion. <button type="button" onClick={() => load(page.page, sort)}>Retry</button></p> :
           !comments?.length ? (
            <p className="comment-empty">No comments yet. Start the technical discussion above.</p>
          ) : (
            comments.map(c => {
              const author = shownName(c);
              return (
                <article className="comment" key={c.id}>
                  <header className="comment-meta">
                    <span className="comment-avatar" aria-hidden="true">
                      {author.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="comment-author">{author}</span>
                    <time className="comment-date" dateTime={c.created_at}>
                      {timeAgo(c.created_at)}
                    </time>
                    <span className="comment-like">
                      <Button
                        variant="ghost"
                        size="sm"
                        label={c.like_count ? String(c.like_count) : ''}
                        isIconOnly={!c.like_count}
                        icon={<Icon name="heart" filled={!!c.user_liked} size={14} />}
                        aria-label={c.user_liked ? 'Unlike comment' : 'Like comment'}
                        aria-pressed={!!c.user_liked}
                        className={c.user_liked ? 'is-liked' : undefined}
                        onClick={() => likeComment(c)}
                      />
                    </span>
                  </header>
                  <p className="comment-text">{c.content}</p>
                </article>
              );
            })
          )}
        </div>

        {page.totalPages > 1 && (
          <div className="comment-pages">
            <Pagination page={page.page} totalPages={page.totalPages} onChange={changePage} label="Comment pages" size="sm" />
          </div>
        )}
      </section>
    </Shell>
  );
}

function previousNamesSafe(): string[] {
  return typeof window === 'undefined' ? [] : previousNames();
}
