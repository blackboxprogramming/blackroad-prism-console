'use client';

import { Dialog, DialogContent, DialogOverlay } from '@radix-ui/react-dialog';
import { useState } from 'react';

export function SolutionDialog({ solution }: { solution: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        Reveal solution
      </button>
      <DialogOverlay className="fixed inset-0 bg-black/50" />
      <DialogContent className="fixed inset-0 m-auto flex h-fit max-w-lg flex-col gap-4 rounded bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Solution</h2>
        <p>{solution}</p>
        <button
          type="button"
          className="self-end rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-brand-300"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </DialogContent>
    </Dialog>
  );
}
