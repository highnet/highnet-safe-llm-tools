import Link from 'next/link';

import { type ProductKey, SITE, type SitePage } from '@/content/site';
import { cn } from '@/lib/utils';

import { HeaderBar } from './HeaderBar';
import { ThemeToggle } from './ThemeToggle';

const PRODUCTS: ProductKey[] = ['rag', 'scope'];

type ProductSwitcherProps = {
  current?: ProductKey;
};

// The two products as one ruled pair of links: the current one sits on the blue wash in blue
// pencil and weight, so it reads without colour too.
const ProductSwitcher = ({ current }: ProductSwitcherProps) => {
  return (
    <nav aria-label={SITE.productsLabel}>
      <ul
        data-slot="product-switcher"
        className="flex rounded-sm border border-input bg-card has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
      >
        {PRODUCTS.map((key) => (
          <li key={key} className="border-l border-input first:border-l-0">
            <a
              href={SITE.products[key].href}
              aria-current={key === current ? 'page' : undefined}
              className={cn(
                'voice-data inline-flex h-9 items-center px-3 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground',
                key === current && 'bg-accent font-semibold text-primary',
              )}
            >
              {SITE.products[key].name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

type SiteHeaderProps = {
  product?: ProductKey;
  current?: SitePage;
};

const SiteHeader = ({ product, current }: SiteHeaderProps) => {
  const pages = product ? SITE.pages[product] : [];
  return (
    <HeaderBar>
      {/* One row from md on every page. On phones the name and the theme switch share the first
          row; the product switcher and the product's pages wrap to the second. */}
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 md:flex-nowrap md:px-8 md:py-3">
        <Link
          href="/"
          className="voice-data order-1 -mx-1 inline-flex min-h-10 items-center rounded-sm px-1 text-base font-semibold hover:bg-accent"
        >
          {SITE.name}
        </Link>
        <div className="order-2 ml-auto md:order-4 md:ml-0">
          <ThemeToggle />
        </div>
        <span aria-hidden className="order-3 basis-full md:hidden" />
        <div className="order-4 md:order-2">
          <ProductSwitcher current={product} />
        </div>
        {product && (
          <nav
            aria-label={SITE.navLabel(SITE.products[product].name)}
            className="order-5 -mr-1.5 ml-auto md:order-3"
          >
            <ul className="flex items-center sm:gap-1">
              {pages.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    aria-current={link.key === current ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-10 items-center rounded-sm px-1.5 text-sm sm:px-2.5 text-muted-foreground underline-offset-4 hover:bg-accent hover:text-foreground',
                      link.key === current &&
                        'font-semibold text-foreground underline decoration-primary decoration-2',
                    )}
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </HeaderBar>
  );
};

export { SiteHeader };
