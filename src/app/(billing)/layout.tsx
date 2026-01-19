import { ReactNode } from 'react'

export default function BillingLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl animate-fade-in">
                {children}
            </div>
        </div>
    )
}
