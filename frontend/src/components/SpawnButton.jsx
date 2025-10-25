import React from 'react'
import { Plus } from 'lucide-react'

export default function SpawnButton({ onClick, disabled, children }){
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold shadow transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Plus size={16} />
      <span>{children || 'Create Agent'}</span>
    </button>
  )
}
