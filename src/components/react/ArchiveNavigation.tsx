import {Breadcrumbs, BreadcrumbItem} from '@astryxdesign/core/Breadcrumbs';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Link} from '@astryxdesign/core/Link';

export function ArchiveTrail({label, href}: {label: string; href?: string}) {
  return <Breadcrumbs label="Breadcrumb">
    <BreadcrumbItem href="/#latest">All writing</BreadcrumbItem>
    <BreadcrumbItem href={href} isCurrent={!href}>{label}</BreadcrumbItem>
  </Breadcrumbs>;
}

export function ArchiveEmpty({title, description, page = false}: {title: string; description: string; page?: boolean}) {
  return <EmptyState title={title} description={description} headingLevel={page ? 1 : 2}
    actions={<Link href="/#latest">Browse all writing</Link>} />;
}
