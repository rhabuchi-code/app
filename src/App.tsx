import { ThemeProvider } from './context/ThemeProvider'
import { YouTubeProvider } from './context/YouTubeProvider'
import CalendarPage from './pages/CalendarPage'

export default function App() {
  return (
    <ThemeProvider>
      <YouTubeProvider>
        <CalendarPage />
      </YouTubeProvider>
    </ThemeProvider>
  )
}
