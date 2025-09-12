import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">Página não encontrada</p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}