import { Route, Routes } from 'react-router-dom'
import { Chrome } from '@/components/layout/Chrome'
import { Footer } from '@/components/layout/Footer'
import { LocaleProvider } from '@/components/layout/LocaleProvider'
import { Sprite } from '@/components/layout/Sprite'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { SmoothScroll } from '@/components/motion/SmoothScroll'
import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <SmoothScroll />
        {/* Rendered once; every `<use href="#id">` on the page resolves here. */}
        <Sprite />
        <Chrome />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </LocaleProvider>
    </ThemeProvider>
  )
}
