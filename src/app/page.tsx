import { Menu } from "@/components/chrome/Menu";
import { Nav } from "@/components/chrome/Nav";
import { Overlays } from "@/components/chrome/Overlays";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Impact } from "@/components/sections/Impact";
import { Intro } from "@/components/sections/Intro";
import { Overview } from "@/components/sections/Overview";
import { MotionProvider } from "@/lib/motion/MotionProvider";
import s from "./page.module.css";

export default function Home() {
  return (
    <MotionProvider>
      <div className={s.root}>
        <Hero />
        <Intro />
        <Overview />
        <Impact />
        <Experience />
        <About />
        <Contact />
        <Menu />
        <Nav />
        <Overlays />
      </div>
    </MotionProvider>
  );
}
