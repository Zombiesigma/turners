import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { StatsSection } from "@/components/stats-section";
import { WritingSection } from "@/components/writing-section";
import { PaintingsSection } from "@/components/paintings-section";
import { CertificatesSection } from "@/components/certificates-section";
import { DevelopmentSection } from "@/components/development-section";
import { SkillsSection } from "@/components/skills-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative z-10">
        <HeroSection />
        <StatsSection />
        <WritingSection />
        <PaintingsSection />
        <CertificatesSection />
        <DevelopmentSection />
        <SkillsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
