import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useCms } from '@/lib/cms'
import { Chrome } from '@/components/layout/Chrome'
import { Footer } from '@/components/layout/Footer'
import { LocaleProvider } from '@/components/layout/LocaleProvider'
import { Sprite } from '@/components/layout/Sprite'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { SmoothScroll } from '@/components/motion/SmoothScroll'
import { RouteScroll } from '@/components/layout/RouteScroll'
import { Seo } from '@/components/layout/Seo'
import { StructuredData } from '@/components/layout/StructuredData'
import { About } from '@/pages/About'
import { Contact } from '@/pages/Contact'
import { Home } from '@/pages/Home'
import { News } from '@/pages/News'
import { NotFound } from '@/pages/NotFound'
import { Products } from '@/pages/Products'
import { Services } from '@/pages/Services'

export default function App() {
  const hydrate = useCms((s) => s.hydrate)

  // Fire and forget. The page renders its designed content immediately and
  // live values swap in only if the API answers — nothing below waits on it,
  // and a failure is silent by design.
  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <ThemeProvider>
      <LocaleProvider>
        <SmoothScroll />
        <RouteScroll />
        {/* Head metadata for the active route and locale, and the
            Organization block built from the CMS's contact record. */}
        <Seo />
        <StructuredData />
        {/* Rendered once; every `<use href="#id">` on the page resolves here. */}
        <Sprite />
        <Chrome />
        {/* The six pages the finished site publishes, in the same order
            as the header nav. Each reads its content from the live CMS
            through the translation overlay — see lib/overlay.ts. */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/news" element={<News />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </LocaleProvider>
    </ThemeProvider>
  )
}
