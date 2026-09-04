import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { MusicLibrarySection } from "@/components/landing/music-library-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { AmbientPlayer } from "@/components/audio/ambient-player";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      <Navigation />
      <HeroSection />
      <MusicLibrarySection />
      <CtaSection />
      <FooterSection />
      <AmbientPlayer />
    </main>
  );
}
