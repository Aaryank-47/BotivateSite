import { useState, useEffect, lazy, Suspense } from "react"
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import { getCookie, deleteCookie } from "./utils/jwt"
import LoginModal from "./site/components/LoginModal"
import MarketingLayout from "./site/components/Layout"
import ScrollToTop from "./site/components/ScrollToTop"

const DashboardLayout = lazy(() => import("./components/Layout/Layout"))
const HomePage        = lazy(() => import("./site/pages/HomePage"))
const AboutPage       = lazy(() => import("./site/pages/AboutPage"))
const ServicesPage    = lazy(() => import("./site/pages/ServicesPage"))
const BotivateOSPage  = lazy(() => import("./site/pages/BotivateOSPage"))
const FrogPlannerPage = lazy(() => import("./site/pages/FrogPlannerPage"))
const MemoriesPage    = lazy(() => import("./site/pages/MemoriesPage"))
const CareersPage     = lazy(() => import("./site/pages/CareersPage"))

const FullScreenLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-gray-700 text-xl">Loading...</div>
  </div>
)

export default function AppRoutes() {
  const [user, setUser] = useState(null)
  const [userFilterData, setUserFilterData] = useState(null)
  const [companyData, setCompanyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Map a decoded session payload onto React state (admin always gets "all").
  const applySession = (session) => {
    const userId =
      session.filterData?.userId ??
      session.companyData?.userId ??
      session.userId ??
      null
    setUser({
      type: session.role,
      username: session.username,
      pagination: session.role === "superadmin" ? "all" : session.pagination,
      userId,
      id: userId,
    })
    setUserFilterData(session.filterData ?? null)
    setCompanyData(session.companyData ?? null)
    // Keep sessionStorage in sync so forms can resolve posted_by after refresh
    try {
      sessionStorage.setItem("userSession", JSON.stringify(session))
    } catch {
      /* ignore quota */
    }
  }

  // Restore session from the JWT cookie on first load (no navigation, so a
  // logged-in user can still browse the marketing site).
  useEffect(() => {
    try {
      const session = getCookie("userSession")
      if (session && session.role) {
        applySession(session)
      }
    } catch (e) {
      console.error("Error restoring session:", e)
      deleteCookie("userSession")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Called by LoginModal on a successful login. The cookie is already written
  // by the modal; here we update state and route into the dashboard.
  const handleLogin = (role, username, pagination, filterData, companyInfo = null) => {
    let paginationValue = pagination
    if (typeof pagination === "object") {
      try {
        paginationValue = pagination
      } catch (e) {
        console.warn("Could not parse pagination, using as is:", pagination)
      }
    }
    // Superadmin always full; admin & others use DB-driven pagination from LoginModal
    const finalPagination = role === "superadmin" ? "all" : paginationValue
    const userId = filterData?.userId ?? companyInfo?.userId ?? null

    const userData = {
      type: role,
      username,
      pagination: finalPagination,
      userId,
      id: userId,
    }
    setUser(userData)
    setUserFilterData(filterData ?? null)
    setCompanyData(companyInfo ?? null)
    setIsLoginOpen(false)

    // Keep legacy storage in sync for any dashboard code that reads it.
    const sessionData = {
      role,
      username,
      pagination: finalPagination,
      filterData,
      companyData: companyInfo,
      userId,
    }
    sessionStorage.setItem("userSession", JSON.stringify(sessionData))
    localStorage.setItem("userData", JSON.stringify(userData))

    navigate("/dashboard")
  }

  const handleLogout = () => {
    setUser(null)
    setUserFilterData(null)
    setCompanyData(null)

    deleteCookie("userSession")
    deleteCookie("currentPage")
    sessionStorage.clear()
    localStorage.removeItem("user")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userData")
    localStorage.removeItem("role")
    localStorage.removeItem("company_name")

    navigate("/", { replace: true })
  }

  // Browser Back / swipe inside the dashboard steps through dashboard pages (Layout handles the tab
  // change). A guard entry is pushed so Back from the first page stays on the dashboard instead of
  // logging out — use the Logout button to sign out.
  useEffect(() => {
    if (!user || pathname !== "/dashboard") return
    window.history.pushState({ dashboardGuard: true }, "", window.location.href)
    const onBack = (e) => {
      if (e.state?.dashboardGuard) return
      window.history.pushState({ dashboardGuard: true }, "", window.location.href)
    }
    window.addEventListener("popstate", onBack)
    return () => window.removeEventListener("popstate", onBack)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pathname])

  return (
    <>
      <ScrollToTop />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      <Suspense fallback={null}>
        <Routes>
          {/* Public marketing site */}
          <Route
            element={
              <MarketingLayout
                onLoginClick={() => setIsLoginOpen(true)}
                user={user}
              />
            }
          >
            <Route index element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/autorocket" element={<BotivateOSPage />} />
            <Route path="/frog-planner" element={<FrogPlannerPage />} />
            {/* <Route path="/memories" element={<MemoriesPage />} /> */}
            {/* <Route path="/careers" element={<CareersPage />} /> */}
          </Route>

          {/* Protected dashboard (the "inner section") */}
          <Route
            path="/dashboard"
            element={
              isLoading ? (
                <FullScreenLoader />
              ) : user ? (
                <Suspense fallback={<FullScreenLoader />}>
                  <DashboardLayout
                    user={user}
                    userFilterData={userFilterData}
                    companyData={companyData}
                    onLogout={handleLogout}
                  />
                </Suspense>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
