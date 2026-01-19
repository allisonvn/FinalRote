import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface PaymentButtonProps extends ComponentProps<'a'> {
    variant?: 'primary' | 'secondary' | 'outline'
    fullWidth?: boolean
}

export function PaymentButton({
    className,
    variant = 'primary',
    fullWidth = false,
    children,
    ...props
}: PaymentButtonProps) {
    const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"

    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
        secondary: "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500",
        outline: "border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white focus:ring-gray-500"
    }

    return (
        <a
            className={cn(
                baseStyles,
                variants[variant],
                fullWidth && "w-full",
                className
            )}
            {...props}
        >
            {children}
        </a>
    )
}
