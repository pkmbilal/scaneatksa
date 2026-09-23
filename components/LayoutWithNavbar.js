import Navbar from './Navbar'
import PageTransition from './PageTransition'
import MobileTabBar from './MobileTabBar'

export default function LayoutWithNavbar({ children }) {
  return (
    <>
      <Navbar />
      <PageTransition>{children}</PageTransition>
      <MobileTabBar />
    </>
  )
}
