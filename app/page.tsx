import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import WorkShowcase from "./components/WorkShowcase";
import CaseStudies from "./components/CaseStudies";
import Creative from "./components/Creative";
import About from "./components/About";
import Quote from "./components/Quote";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WorkShowcase>
          <CaseStudies />
          <Creative />
          <About><Quote /></About>
        </WorkShowcase>
      </main>
    </>
  );
}
