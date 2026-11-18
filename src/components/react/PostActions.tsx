import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Shell} from './Shell';
import {Icon} from './Icon';
import {toggleLike, useEngagement} from './engagement';

type Props = {slug: string; likes: number; comments: number};

/** Like, jump-to-comments and share, in the article header. */
export default function PostActions({slug, likes, comments}: Props) {
  const e = useEngagement(slug, {likes, comments});
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Shell>
      <div className="post-actions">
        <Button
          variant="secondary"
          size="md"
          label={String(e.likes)}
          icon={<Icon name="thumbs-up" filled={e.liked} />}
          aria-label={e.liked ? `Unlike this post (${e.likes} likes)` : `Like this post (${e.likes} likes)`}
          aria-pressed={e.liked}
          className={e.liked ? 'is-liked' : undefined}
          onClick={toggleLike}
        />
        <Button
          variant="secondary"
          size="md"
          label={String(e.comments)}
          icon={<Icon name="message-square" />}
          aria-label={`Jump to comments (${e.comments})`}
          href="#comments-section"
        />
        <Button variant="secondary" size="md" label={copied ? 'Copied' : 'Share'} icon={<Icon name={copied ? 'check' : 'share-2'} />} onClick={share} />
      </div>
    </Shell>
  );
}
