import { createAgentContext } from './schema.js'

export function createVideoAgent({ videoId, transcript, glossary = [], sources = [] }) {
  const context = createAgentContext({ videoId, transcript, glossary, sources })
  const index = buildAgentIndex(context)

  return {
    context,
    index,
    answer(question) {
      return answerQuestion(question, index)
    }
  }
}

export function buildAgentIndex({ videoId, transcript, glossary = [], sources = [] }) {
  const chunks = chunkTranscript(transcript).map((chunk, idx) => ({
    id: `${videoId || 'video'}-chunk-${idx}`,
    text: chunk.text,
    timestamp: chunk.timestamp,
    terms: vectorize(chunk.text)
  }))

  const glossaryVectors = glossary.map(entry => ({
    term: entry.term,
    definition: entry.definition,
    terms: vectorize(`${entry.term} ${entry.definition}`)
  }))

  const sourceVectors = sources.map(source => ({
    title: source.title,
    url: source.url,
    terms: vectorize(`${source.title} ${source.summary ?? ''}`),
    timestamp: source.timestamp
  }))

  return { videoId, chunks, glossary: glossaryVectors, sources: sourceVectors }
}

export function answerQuestion(question, index) {
  if (!question?.trim()) {
    return {
      answer: 'Ask a question about the video to get started.',
      citations: []
    }
  }

  const queryVector = vectorize(question)

  const scoredChunks = index.chunks
    .map(chunk => ({
      chunk,
      score: cosineSimilarity(queryVector, chunk.terms)
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)

  const topChunk = scoredChunks[0]?.chunk
  const glossaryMatches = matchGlossary(queryVector, index.glossary).slice(0, 3)
  const sourceMatches = matchSources(queryVector, index.sources).slice(0, 3)

  if (!topChunk) {
    return {
      answer: "I couldn't find that in the current video. Try rephrasing or jumping to a specific moment.",
      citations: []
    }
  }

  const answer = buildAnswer(question, topChunk, glossaryMatches, sourceMatches)
  const citations = [
    {
      type: 'transcript',
      timestamp: topChunk.timestamp,
      text: topChunk.text
    },
    ...glossaryMatches.map(match => ({ type: 'glossary', term: match.term })),
    ...sourceMatches.map(match => ({ type: 'source', url: match.url }))
  ]

  return { answer, citations }
}

function buildAnswer(question, chunk, glossaryMatches, sourceMatches) {
  const segments = [
    chunk.text,
    glossaryMatches.length > 0
      ? `Key terms: ${glossaryMatches.map(match => match.term).join(', ')}.`
      : null,
    sourceMatches.length > 0
      ? `Related sources: ${sourceMatches.map(match => match.title || match.url).join('; ')}.`
      : null,
    `Jump back to ${formatTimestamp(chunk.timestamp)} for the walkthrough.`
  ].filter(Boolean)

  return segments.join(' ')
}

function matchGlossary(queryVector, glossary) {
  return glossary
    .map(entry => ({
      ...entry,
      score: cosineSimilarity(queryVector, entry.terms)
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
}

function matchSources(queryVector, sources) {
  return sources
    .map(source => ({
      ...source,
      score: cosineSimilarity(queryVector, source.terms)
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
}

function chunkTranscript(transcript, sentencesPerChunk = 3) {
  if (!transcript) return []

  const sentences = transcript.split(/(?<=[.!?])\s+/).map(sentence => sentence.trim()).filter(Boolean)
  const chunks = []

  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    const group = sentences.slice(i, i + sentencesPerChunk)
    const text = group.join(' ')
    const timestamp = Math.max(0, Math.round((i / sentences.length) * estimateDuration(transcript)))
    chunks.push({ text, timestamp })
  }

  return chunks
}

function estimateDuration(transcript) {
  const words = transcript.split(/\s+/).filter(Boolean).length
  return Math.max(60, Math.round((words / 150) * 60))
}

function vectorize(text) {
  const terms = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const termCounts = new Map()
  terms.forEach(term => {
    if (stopWords.has(term)) return
    termCounts.set(term, (termCounts.get(term) || 0) + 1)
  })

  return termCounts
}

function cosineSimilarity(mapA, mapB) {
  const intersection = new Set([...mapA.keys()].filter(key => mapB.has(key)))
  if (intersection.size === 0) return 0

  let dot = 0
  intersection.forEach(key => {
    dot += (mapA.get(key) || 0) * (mapB.get(key) || 0)
  })

  const magnitudeA = Math.sqrt(sumSquares(mapA))
  const magnitudeB = Math.sqrt(sumSquares(mapB))
  if (magnitudeA === 0 || magnitudeB === 0) return 0

  return dot / (magnitudeA * magnitudeB)
}

function sumSquares(map) {
  let sum = 0
  map.forEach(value => {
    sum += value * value
  })
  return sum
}

const stopWords = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'if',
  'to',
  'of',
  'for',
  'in',
  'on',
  'at',
  'by',
  'with',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'this',
  'that',
  'it',
  'as',
  'from',
  'about',
  'into',
  'over',
  'after',
  'before',
  'between',
  'through',
  'during',
  'without',
  'within',
  'also',
  'can',
  'could',
  'should',
  'would',
  'may',
  'might',
  'will',
  'just',
  'like',
  'than',
  'too',
  'very',
  'more',
  'most'
])

function formatTimestamp(seconds = 0) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
