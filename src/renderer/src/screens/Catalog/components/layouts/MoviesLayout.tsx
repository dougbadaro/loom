import { Midia } from '@renderer/types'
import { MovieCard } from '../cards/MovieCard'

interface MoviesLayoutProps {
  movies: Midia[]
  onItemClick: (movie: Midia) => void
}

export function MoviesLayout({ movies, onItemClick }: MoviesLayoutProps) {
  return (
    <div
      className="fade-in"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}
    >
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onClick={onItemClick} />
      ))}
    </div>
  )
}
