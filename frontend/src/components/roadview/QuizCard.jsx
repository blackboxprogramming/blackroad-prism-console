import { useMemo, useState } from 'react'

export default function QuizCard({ quiz, onComplete }) {
  const [selection, setSelection] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const normalized = useMemo(() => normalizeQuiz(quiz), [quiz])

  if (!normalized) {
    return (
      <div className="space-y-2">
        <p className="text-slate-300">No quiz content yet. Add a question to keep learners engaged.</p>
      </div>
    )
  }

  const { question, choices, correctIndex, hint } = normalized
  const isCorrect = submitted && selection === correctIndex

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (selection === correctIndex && typeof onComplete === 'function') {
      onComplete({ correct: true })
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-100">{question}</legend>
        <div className="space-y-2">
          {choices.map((choice, idx) => {
            const checked = selection === idx
            const choiceState = submitted
              ? idx === correctIndex
                ? 'correct'
                : checked
                  ? 'incorrect'
                  : 'neutral'
              : 'neutral'

            return (
              <label
                key={choice.id || idx}
                className={[
                  'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition',
                  choiceState === 'correct' && 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200',
                  choiceState === 'incorrect' && 'border-rose-500/70 bg-rose-500/10 text-rose-200',
                  choiceState === 'neutral' && 'border-slate-700/80 bg-slate-900/60 text-slate-200 hover:border-slate-500'
                ]
                  .filter(Boolean)
                  .join(' ')
              >
                <input
                  type="radio"
                  name="quiz-choice"
                  value={choice.id || idx}
                  checked={checked}
                  onChange={() => setSelection(idx)}
                  className="h-3 w-3"
                  aria-label={choice.label}
                />
                <span>{choice.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex items-center justify-between">
        {submitted && selection !== correctIndex && hint && (
          <p className="text-xs text-slate-300">Hint: {hint}</p>
        )}
        <button
          type="submit"
          className="ml-auto rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-sky-400"
          disabled={selection === null}
        >
          {submitted ? (isCorrect ? 'Nice work!' : 'Try again') : 'Check answer'}
        </button>
      </div>
    </form>
  )
}

function normalizeQuiz(quiz) {
  if (!quiz) return null

  const question = quiz.question || quiz.draftQuestion
  const rawChoices = quiz.choices || quiz.draftChoices
  if (!question || !Array.isArray(rawChoices) || rawChoices.length === 0) return null

  const choices = rawChoices.map((choice, idx) =>
    typeof choice === 'string' ? { id: `choice-${idx}`, label: choice } : choice
  )

  const correctIndex = typeof quiz.correctIndex === 'number' ? quiz.correctIndex : 0

  return {
    question,
    choices,
    correctIndex,
    hint: quiz.hint
  }
}
