import { useContext } from 'react'
import { YouTubeContext } from '../context/youtubeContext'

export function useYouTube() {
  const ctx = useContext(YouTubeContext)
  if (!ctx) {
    throw new Error('useYouTube must be used within YouTubeProvider')
  }
  return ctx
}
