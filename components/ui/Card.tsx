import React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export default function Card({ className = '', children, ...props }: CardProps) {
  const base = 'bg-card text-card-foreground rounded-xl shadow-sm border border-border p-5 transition-colors'
  const cls = [base, className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  )
}
