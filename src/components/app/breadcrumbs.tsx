import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
    <ol className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <li className="flex items-center gap-2" key={`${item.label}-${index}`}>
          {item.to ? <Link className="hover:underline" to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
          {index < items.length - 1 ? <span>/</span> : null}
        </li>
      ))}
    </ol>
  </nav>
);
