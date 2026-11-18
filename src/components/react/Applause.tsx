import {Button} from '@astryxdesign/core/Button';
import {Shell} from './Shell';
import {Icon} from './Icon';
import {toggleLike, useEngagement} from './engagement';

/** The larger like button in the author block at the end of a post. */
export default function Applause({slug, likes, comments}: {slug: string; likes: number; comments: number}) {
  const e = useEngagement(slug, {likes, comments});
  return (
    <Shell>
      <Button
        variant={e.liked ? 'primary' : 'secondary'}
        size="lg"
        label={`Applause · ${e.likes}`}
        icon={<Icon name="thumbs-up" filled={e.liked} />}
        aria-pressed={e.liked}
        onClick={toggleLike}
      />
    </Shell>
  );
}
