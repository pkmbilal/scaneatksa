import Navbar from './Navbar'
import PageTransition from './PageTransition'
import MobileTabBar from './MobileTabBar'
import InstallPrompt from './InstallPrompt'

export default function LayoutWithNavbar({ children }) {
  return (
    <>
      <Navbar />
      <PageTransition>{children}</PageTransition>
      <MobileTabBar />
      <InstallPrompt />
    </>
  )
}
