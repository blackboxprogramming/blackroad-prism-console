/**
 * RoadView interactive video data model helpers.
 * The helpers provide ergonomic constructors and utility transforms
 * for hotspots, quizzes, comments, and agent context payloads.
 */

export const HotspotType = Object.freeze({
  QUIZ: 'quiz',
  NOTE: 'note',
  LINK: 'link'
})

export function createVideo({ id, title, src, transcript = '', topics = [] }) {
  return {
    id,
    title,
    src,
    transcript,
    topics: [...new Set(topics.map(t => t.trim()).filter(Boolean))]
  }
}

export function createHotspot({
  videoId,
  start,
  end,
  type = HotspotType.NOTE,
  payload = {}
}) {
  return {
    videoId,
    start,
    end,
    type,
    payload
  }
}

export function createQuiz({ hotspotId, question, choices, correctIndex = 0, hint = '' }) {
  if (!Array.isArray(choices) || choices.length < 2) {
    throw new Error('Quiz choices must include at least two options.')
  }

  if (correctIndex < 0 || correctIndex >= choices.length) {
    throw new Error('correctIndex must point to a valid choice.')
  }

  return {
    hotspotId,
    question,
    choices: choices.map(choice => ({ id: randomId(), label: choice })),
    correctIndex,
    hint
  }
}

export function createComment({ videoId, timestamp, text, parentId = null, clusterId = null }) {
  return {
    id: randomId(),
    videoId,
    timestamp,
    text,
    parentId,
    clusterId
  }
}

export function createAgentContext({ videoId, transcript, glossary = [], sources = [] }) {
  return {
    videoId,
    transcript,
    glossary,
    sources
  }
}

export function draftHotspotsFromTranscript(transcript, { quizEvery = 120, noteEvery = 90 } = {}) {
  if (!transcript) return []

  const sentences = splitTranscript(transcript)
  const hotspots = []

  let elapsed = 0
  sentences.forEach((sentence, idx) => {
    const seconds = Math.max(8, Math.round(sentence.wordCount / 2))
    elapsed += seconds

    if (idx % Math.max(1, Math.round(quizEvery / seconds)) === 0) {
      hotspots.push(
        createHotspot({
          videoId: null,
          start: Math.max(0, elapsed - seconds),
          end: elapsed,
          type: HotspotType.QUIZ,
          payload: {
            draftQuestion: `What did the instructor cover in the segment around ${formatTimestamp(elapsed)}?`,
            draftChoices: buildDraftChoices(sentence.text)
          }
        })
      )
    } else if (idx % Math.max(1, Math.round(noteEvery / seconds)) === 0) {
      hotspots.push(
        createHotspot({
          videoId: null,
          start: Math.max(0, elapsed - seconds),
          end: elapsed,
          type: HotspotType.NOTE,
          payload: {
            summary: sentence.text,
            keyTerms: sentence.keyTerms
          }
        })
      )
    }
  })

  return hotspots
}

function splitTranscript(transcript) {
  return transcript
    .split(/(?<=[.!?])\s+/)
    .map(text => text.trim())
    .filter(Boolean)
    .map(text => ({
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      keyTerms: extractKeyTerms(text)
    }))
}

function extractKeyTerms(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)

  const termCounts = new Map()
  words.forEach(word => {
    if (stopWords.has(word)) return
    termCounts.set(word, (termCounts.get(word) || 0) + 1)
  })

  return Array.from(termCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([term]) => term)
}

function buildDraftChoices(text) {
  const keyTerms = extractKeyTerms(text)
  if (keyTerms.length >= 3) return keyTerms

  const filler = ['I am not sure', 'None of the above', 'This was not covered yet']
  return [...keyTerms, ...filler].slice(0, 4)
}

function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function randomId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `id_${Math.random().toString(16).slice(2)}`
}

const stopWords = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'to', 'of', 'for', 'in', 'on', 'at', 'by', 'with', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'this', 'that', 'it', 'as', 'from', 'about', 'into', 'over', 'after', 'before', 'between', 'through',
  'during', 'without', 'within', 'also', 'can', 'could', 'should', 'would', 'may', 'might', 'will', 'just', 'like', 'than',
  'too', 'very', 'more', 'most'
])
