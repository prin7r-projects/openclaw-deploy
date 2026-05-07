import { Hero } from '@/components/Hero';
import { StatusBand } from '@/components/StatusBand';
import { FeatureTriad } from '@/components/FeatureTriad';
import { ManifestShowcase } from '@/components/ManifestShowcase';
import { Reconciler } from '@/components/Reconciler';
import { ProofPoints } from '@/components/ProofPoints';
import { Pricing } from '@/components/Pricing';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { TopNav } from '@/components/TopNav';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #7CFFA1 0%, transparent 100%)' }}
        aria-hidden
      />
      <div className="relative">
        <TopNav />
        <Hero />
        <StatusBand />
        <FeatureTriad />
        <ManifestShowcase />
        <Reconciler />
        <ProofPoints />
        <Pricing />
        <Faq />
        <Footer />
      </div>
    </main>
  );
}
