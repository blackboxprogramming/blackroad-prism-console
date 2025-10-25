import React, { useEffect } from 'react'

const STYLES = {
  success: 'bg-emerald-500/20 border border-emerald-400 text-emerald-200',
  error: 'bg-rose-500/20 border border-rose-400 text-rose-200',
  warning: 'bg-amber-500/20 border border-amber-400 text-amber-200',
}

export default function StatusToast({ type = 'success', message, onClose, duration = 4000 }){
  useEffect(() => {
    if(!message){
      return undefined
    }
    const id = setTimeout(() => {
      onClose?.()
    }, duration)
    return () => clearTimeout(id)
  }, [message, duration, onClose])

  if(!message){
    return null
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm shadow-xl backdrop-blur ${STYLES[type] || STYLES.success}`}>
      <div className="font-semibold">{type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Success'}</div>
      <div className="mt-1 text-xs opacity-80">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-1 right-1 rounded px-1 text-xs text-white/70 hover:text-white"
      >
        ×
      </button>
    </div>
  )
}
