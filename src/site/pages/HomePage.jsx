import PageTransition from '../components/PageTransition';
// Homepage hero options — swap the import to compare:
//   '../components/HeroStatement' → Option 2: clean centered statement hero (current)
//   '../components/HeroPipeline'  → two-column hero with live product demo
import Hero from '../components/HeroStatement';
import ProductBanner from '../components/ProductBanner';
import Results from '../components/Results';
import AboutTeaser from '../components/AboutTeaser';
import ServicesTeaser from '../components/ServicesTeaser';
import Technologies from '../components/Technologies';
import Testimonials from '../components/Testimonials';
import Founder from '../components/Founder';
import CTA from '../components/CTA';

export default function HomePage() {
  return (
    <PageTransition>
      <Hero />
      <ProductBanner />
      <Results />
      <AboutTeaser />
      <ServicesTeaser />
      <Technologies />
      <Testimonials />
      <Founder />
      <CTA />
    </PageTransition>
  );
}
