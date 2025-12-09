'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Modal, ModalType } from '@/components/Modal'

interface ModalOptions {
  title: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
}

interface ModalContextType {
  showAlert: (options: ModalOptions) => Promise<void>
  showConfirm: (options: ModalOptions) => Promise<boolean>
  showSuccess: (message: string, title?: string) => Promise<void>
  showError: (message: string, title?: string) => Promise<void>
  showWarning: (message: string, title?: string) => Promise<void>
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

type ModalState =
  | {
      isOpen: boolean
      options: ModalOptions
      type: 'alert'
      resolve?: () => void
    }
  | {
      isOpen: boolean
      options: ModalOptions
      type: 'confirm'
      resolve?: (value: boolean) => void
    }

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    options: { title: '', message: '' },
    type: 'alert',
  })

  const showAlert = useCallback((options: ModalOptions): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        type: 'alert',
        resolve: resolve as () => void,
      })
    })
  }, [])

  const showConfirm = useCallback((options: ModalOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        options,
        type: 'confirm',
        resolve: resolve as (value: boolean) => void,
      })
    })
  }, [])

  const showSuccess = useCallback(
    (message: string, title: string = 'Success') => {
      return showAlert({ title, message, type: 'success' })
    },
    [showAlert]
  )

  const showError = useCallback(
    (message: string, title: string = 'Error') => {
      return showAlert({ title, message, type: 'error' })
    },
    [showAlert]
  )

  const showWarning = useCallback(
    (message: string, title: string = 'Warning') => {
      return showAlert({ title, message, type: 'warning' })
    },
    [showAlert]
  )

  const handleClose = useCallback(() => {
    if (modalState.resolve) {
      if (modalState.type === 'confirm') {
        modalState.resolve(false)
      } else {
        modalState.resolve()
      }
    }
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }, [modalState])

  const handleConfirm = useCallback(() => {
    if (modalState.resolve) {
      if (modalState.type === 'confirm') {
        modalState.resolve(true)
      } else {
        modalState.resolve()
      }
    }
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }, [modalState])

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showSuccess, showError, showWarning }}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalState.options.title}
        message={modalState.options.message}
        type={modalState.options.type || (modalState.type === 'confirm' ? 'confirm' : 'alert')}
        confirmText={modalState.options.confirmText}
        cancelText={modalState.options.cancelText}
        showCancel={modalState.type === 'confirm'}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within ModalProvider')
  }
  return context
}

