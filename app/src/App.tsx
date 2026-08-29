import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
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

/**
 * The admin is lazy-loaded, and that is the point: it is roughly a third of
 * the source and no public visitor can use a byte of it. Bundled eagerly it
 * pushed the single chunk past 500kB, which every reader of the marketing
 * site would have paid for. Each screen now arrives only once someone
 * actually navigates to it.
 */
const AdminCategories = lazy(() =>
  import('@/pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })),
)
const AdminLogin = lazy(() =>
  import('@/pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })),
)
const AdminNews = lazy(() => import('@/pages/admin/AdminNews').then((m) => ({ default: m.AdminNews })))
const AdminProducts = lazy(() =>
  import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })),
)
const AdminStats = lazy(() =>
  import('@/pages/admin/AdminStats').then((m) => ({ default: m.AdminStats })),
)
const AdminTimeline = lazy(() =>
  import('@/pages/admin/AdminTimeline').then((m) => ({ default: m.AdminTimeline })),
)
const AdminCertifications = lazy(() =>
  import('@/pages/admin/AdminCertifications').then((m) => ({ default: m.AdminCertifications })),
)
const AdminHeroes = lazy(() =>
  import('@/pages/admin/AdminHeroes').then((m) => ({ default: m.AdminHeroes })),
)
const AdminContent = lazy(() =>
  import('@/pages/admin/AdminContent').then((m) => ({ default: m.AdminContent })),
)
const AdminImages = lazy(() =>
  import('@/pages/admin/AdminImages').then((m) => ({ default: m.AdminImages })),
)

/**
 * The public site: header, footer, head metadata and smoothed scrolling.
 *
 * These sit in a layout route rather than around <Routes> so the admin
 * screens can opt out of all four. The marketing header over a data table
 * would be wrong on its own, but Seo and SmoothScroll are the ones that would
 * actually misbehave: Seo maps an unrouted path to the 404 title, and Lenis
 * keeps scrolling the page underneath an open dialog.
 */
function PublicLayout() {
  return (
    <>
      <SmoothScroll />
      {/* Head metadata for the active route and locale, and the
          Organization block built from the CMS's contact record. */}
      <Seo />
      <StructuredData />
      <Chrome />
      <Outlet />
      <Footer />
    </>
  )
}

/**
 * One boundary for every admin screen. The fallback is deliberately bare: the
 * chunk is small and local, so a spinner would flash rather than inform, and
 * each screen renders its own skeleton once it mounts.
 */
function AdminChunk() {
  return (
    <Suspense fallback={<div className="admin" />}>
      <Outlet />
    </Suspense>
  )
}

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
        <RouteScroll />
        {/* Rendered once; every `<use href="#id">` on the page resolves here. */}
        <Sprite />
        <Routes>
          {/* The six pages the finished site publishes, in the same order
              as the header nav. Each reads its content from the live CMS
              through the translation overlay — see lib/overlay.ts. */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/news" element={<News />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin. Authenticated and noindex by nature — a tool, not a page
              of the site, and code-split for the same reason. */}
          <Route element={<AdminChunk />}>
            <Route path="/admin" element={<Navigate to="/admin/categories" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/news" element={<AdminNews />} />
            <Route path="/admin/stats" element={<AdminStats />} />
            <Route path="/admin/timeline" element={<AdminTimeline />} />
            <Route path="/admin/certifications" element={<AdminCertifications />} />
            <Route path="/admin/heroes" element={<AdminHeroes />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/images" element={<AdminImages />} />
          </Route>
        </Routes>
      </LocaleProvider>
    </ThemeProvider>
  )
}
