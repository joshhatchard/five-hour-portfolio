import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CaseStudies from "./components/CaseStudies";
import Creative from "./components/Creative";
import About from "./components/About";
import Quote from "./components/Quote";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CaseStudies />
        <Creative />
        <About />
        <Quote />
      </main>
      <Footer />
    </>
  );
}
