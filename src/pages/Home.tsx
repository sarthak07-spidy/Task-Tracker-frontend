import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ScrollVideo from '../components/ScrollVideo'
import ProblemSolution from '../components/ProblemSolution'
import AuthSection from '../components/AuthSection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ScrollVideo />
        <ProblemSolution />
        <AuthSection />
      </main>
      <Footer />
    </>
  )
}
