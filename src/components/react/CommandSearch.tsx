import {useEffect, useMemo, useRef, useState, type KeyboardEvent} from 'react';
import {Dialog} from '@astryxdesign/core/Dialog';
import {Shell} from './Shell';

export interface SearchEntry {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: number;
  tags: string[];
}

const QUICK_LINKS = [
  {href: '/#latest', title: 'All writing', meta: 'Archive'},
  {href: '/category/engineering', title: 'Engineering deep dives', meta: 'Category'},
  {href: '/category/hackathons', title: 'Hackathon builds & demos', meta: 'Category'},
  {href: '/rss.xml', title: 'RSS feed', meta: 'Syndication'},
  {href: 'https://sudharsana.dev', title: 'Interactive portfolio', meta: 'sudharsana.dev'},
];

export default function CommandSearch({items}: {items: SearchEntry[]}) {
  const [open, setOpen] = useState<boolean | null>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (open === false) {
      setQuery('');
    }
  }, [open]);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) {
      return items.slice(0, 6).map(item => ({
        href: `/post/${item.slug}`,
        title: item.title,
        meta: `${item.category} · ${item.readTime} min`,
        sub: item.excerpt,
      }));
    }
    const postMatches = items
      .filter(item => {
        const haystack = [item.title, item.excerpt, item.category, ...item.tags].join(' ').toLowerCase();
        return terms.every(term => haystack.includes(term));
      })
      .map(item => ({
        href: `/post/${item.slug}`,
        title: item.title,
        meta: `${item.category} · ${item.readTime} min`,
        sub: item.excerpt,
      }));
    const linkMatches = QUICK_LINKS.filter(link => {
      const haystack = `${link.title} ${link.meta}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    }).map(link => ({href: link.href, title: link.title, meta: link.meta, sub: ''}));
    return [...postMatches, ...linkMatches];
  }, [items, query]);

  const boundedIndex = results.length ? Math.min(activeIndex, results.length - 1) : -1;

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length) setActiveIndex(i => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length) setActiveIndex(i => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter' && boundedIndex >= 0) {
      event.preventDefault();
      const chosen = results[boundedIndex];
      setOpen(false);
      if (chosen.href.startsWith('http')) {
        window.open(chosen.href, '_blank', 'noopener');
      } else {
        window.location.assign(chosen.href);
      }
    }
  };

  return (
    <Shell>
      <button
        type="button"
        className="cmd-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search articles (Command K)"
        title="Search articles (⌘K)"
      >
        <svg className="icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="cmd-trigger-label">Search</span>
        <kbd className="kbd-hint">⌘K</kbd>
      </button>

      {open !== null && (
        <Dialog isOpen={open} onOpenChange={setOpen} purpose="form" width={580}>
          <div className="cmd-palette">
            <div className="cmd-input-row">
              <svg className="icon cmd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                className="cmd-input"
                placeholder="Search engineering posts, architectures, topics…"
                aria-label="Search engineering posts"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
              />
              <kbd className="kbd-hint">Esc</kbd>
            </div>

            <div className="cmd-list" role="listbox" aria-label="Search results">
              {results.length === 0 ? (
                <p className="cmd-empty">No matching articles. Try terms like <code>k3s</code>, <code>sql</code>, <code>snowflake</code>, or <code>android</code>.</p>
              ) : (
                results.map((item, idx) => (
                  <a
                    key={item.href}
                    href={item.href}
                    role="option"
                    aria-selected={idx === boundedIndex}
                    className={`cmd-item${idx === boundedIndex ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => setOpen(false)}
                  >
                    <div className="cmd-item-head">
                      <span className="cmd-item-title">{item.title}</span>
                      <span className="cmd-item-meta">{item.meta}</span>
                    </div>
                    {item.sub && <p className="cmd-item-sub">{item.sub}</p>}
                  </a>
                ))
              )}
            </div>

            <div className="cmd-footer">
              <span><kbd className="kbd-hint">↑</kbd> <kbd className="kbd-hint">↓</kbd> navigate</span>
              <span><kbd className="kbd-hint">↵</kbd> open</span>
            </div>
          </div>
        </Dialog>
      )}
    </Shell>
  );
}
