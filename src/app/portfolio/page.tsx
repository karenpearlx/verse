import type { Metadata } from 'next';
import PortfolioEditor from '@/components/portfolio/PortfolioEditor';

export const metadata: Metadata = {
  title: 'Portfolio Builder — Your Public VA Page',
  description:
    'Turn your Verse profile, completed courses and work samples into a shareable public portfolio at vrsfd.com/p/your-name.',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

export default function PortfolioPage() {
  return <PortfolioEditor />;
}
