import ClientPage from './ClientPage'

export function generateStaticParams() {
  return [{ id: 'ignore' }]
}

export default function IssuePage() {
  return <ClientPage />
}
