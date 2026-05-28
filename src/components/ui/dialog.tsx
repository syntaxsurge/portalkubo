'use client'

import * as React from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { buttonClasses } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

const ShadcnDialog = DialogPrimitive.Root
const ShadcnDialogTrigger = DialogPrimitive.Trigger
const ShadcnDialogPortal = DialogPrimitive.Portal
const ShadcnDialogClose = DialogPrimitive.Close

const ShadcnDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'data-[state=closed]:animate-out data-[state=open]:animate-in fixed inset-0 z-50 bg-black/55 backdrop-blur-sm',
      className
    )}
    {...props}
  />
))
ShadcnDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const ShadcnDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    overlayClassName?: string
  }
>(({ className, overlayClassName, children, ...props }, ref) => (
  <ShadcnDialogPortal>
    <ShadcnDialogOverlay className={overlayClassName} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'bg-card text-foreground border-border shadow-brand-blue/15 data-[state=closed]:animate-out data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 grid max-h-[min(760px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border p-6 shadow-2xl duration-200',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className='focus-visible:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none'
        aria-label='Close'
      >
        <X className='h-4 w-4' aria-hidden />
        <span className='sr-only'>Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </ShadcnDialogPortal>
))
ShadcnDialogContent.displayName = DialogPrimitive.Content.displayName

function ShadcnDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-left', className)}
      {...props}
    />
  )
}
ShadcnDialogHeader.displayName = 'ShadcnDialogHeader'

function ShadcnDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}
ShadcnDialogFooter.displayName = 'ShadcnDialogFooter'

const ShadcnDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-display text-2xl leading-none', className)}
    {...props}
  />
))
ShadcnDialogTitle.displayName = DialogPrimitive.Title.displayName

const ShadcnDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-muted-foreground text-sm leading-6', className)}
    {...props}
  />
))
ShadcnDialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  ShadcnDialog,
  ShadcnDialogClose,
  ShadcnDialogContent,
  ShadcnDialogDescription,
  ShadcnDialogFooter,
  ShadcnDialogHeader,
  ShadcnDialogOverlay,
  ShadcnDialogPortal,
  ShadcnDialogTitle,
  ShadcnDialogTrigger
}

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className
}: DialogProps) {
  React.useEffect(() => {
    if (!open) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onOpenChange, open])

  if (!open) {
    return null
  }

  return (
    <div
      className='fixed inset-0 z-50 grid place-items-center p-4'
      role='presentation'
    >
      <button
        type='button'
        className='absolute inset-0 bg-black/55 backdrop-blur-sm'
        aria-label='Close dialog'
        onClick={() => onOpenChange(false)}
      />
      <section
        role='dialog'
        aria-modal='true'
        aria-labelledby='dialog-title'
        aria-describedby={description ? 'dialog-description' : undefined}
        className={cn(
          'bg-card text-foreground border-border shadow-brand-blue/15 relative flex max-h-[min(760px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-3xl flex-col overflow-hidden rounded-lg border shadow-2xl',
          className
        )}
      >
        <div className='border-border flex items-start justify-between gap-4 border-b p-5'>
          <div className='min-w-0'>
            <h2 id='dialog-title' className='font-display text-2xl'>
              {title}
            </h2>
            {description ? (
              <p
                id='dialog-description'
                className='text-muted-foreground mt-2 text-sm leading-6'
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type='button'
            onClick={() => onOpenChange(false)}
            aria-label='Close dialog'
            className={buttonClasses({
              variant: 'ghost',
              size: 'sm',
              className: 'h-9 w-9 shrink-0 px-0'
            })}
          >
            <X className='h-4 w-4' aria-hidden />
          </button>
        </div>
        <div className='min-h-0 overflow-y-auto p-5'>{children}</div>
      </section>
    </div>
  )
}
