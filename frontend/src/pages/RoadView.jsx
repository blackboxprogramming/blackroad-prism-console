import React, { useState } from 'react'
import './RoadView.css'

const primaryNav = [
  { icon: '🏠', label: 'Home', active: true },
  { icon: '🔥', label: 'Trending' },
  { icon: '📺', label: 'Subscriptions' },
]

const libraryNav = [
  { icon: '📚', label: 'Library' },
  { icon: '🕒', label: 'History' },
  { icon: '▶️', label: 'Your videos' },
  { icon: '⏰', label: 'Watch later' },
  { icon: '👍', label: 'Liked videos' },
]

const subscriptions = [
  { initials: 'TC', name: 'Tech Channel' },
  { initials: 'MC', name: 'Music Creator' },
  { initials: 'GV', name: 'Gaming Vlog' },
  { initials: 'DE', name: 'Dev Education' },
]

const comments = [
  {
    initials: 'JD',
    author: '@johndeveloper',
    time: '2 days ago',
    text:
      "This is absolutely incredible! The gradient design is so clean and the concept behind BlackRoad is inspiring. Can't wait to see where this goes! 🚀",
    likes: '2.4K',
  },
  {
    initials: 'SK',
    author: '@sarahkodes',
    time: '1 day ago',
    text:
      'The philosophy behind "the road isn\'t made, it\'s remembered" really resonates with me. As a developer, I feel like we\'re always building on top of what came before.',
    likes: '1.8K',
  },
  {
    initials: 'MR',
    author: '@mikereacts',
    time: '18 hours ago',
    text: 'That color scheme though! 😍 Yellow to orange to pink to purple to blue... *chef\'s kiss*',
    likes: '942',
  },
  {
    initials: 'AL',
    author: '@alexlearns',
    time: '12 hours ago',
    text:
      'Just signed up for early access! This is exactly what the developer community needs. A platform built BY developers FOR developers.',
    likes: '756',
  },
]

const recommendedVideos = [
  {
    title: 'Getting Started with BlackRoad: Complete Tutorial',
    channel: 'BlackRoad Inc',
    stats: '890K views • 3 days ago',
    duration: '12:45',
  },
  {
    title: "Top 10 Features You Didn't Know About",
    channel: 'Tech Review Hub',
    stats: '1.2M views • 1 week ago',
    duration: '8:32',
  },
  {
    title: 'Building Your First Project on BlackRoad',
    channel: 'Code Masters',
    stats: '654K views • 5 days ago',
    duration: '15:20',
  },
  {
    title: 'The Future of Collaborative Development',
    channel: 'Dev Talks',
    stats: '2.1M views • 2 weeks ago',
    duration: '20:15',
  },
  {
    title: 'BlackRoad vs Traditional IDEs: Which is Better?',
    channel: 'Developer Daily',
    stats: '445K views • 4 days ago',
    duration: '10:05',
  },
  {
    title: 'Advanced Tips and Tricks for Power Users',
    channel: 'BlackRoad Inc',
    stats: '728K views • 1 week ago',
    duration: '25:42',
  },
]

export default function RoadView(){
  const [commentText, setCommentText] = useState('')
  const [showCommentActions, setShowCommentActions] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const handleCommentFocus = () => {
    setShowCommentActions(true)
  }

  const handleCancelComment = () => {
    setCommentText('')
    setShowCommentActions(false)
  }

  const toggleSubscribe = () => {
    setSubscribed((prev) => !prev)
  }

  return (
    <div className="roadview-page">
      <header className="header">
        <div className="header-left">
          <div className="menu-icon">☰</div>
          <div className="logo">
            <div className="logo-icon">K3</div>
            <div className="logo-text">BlackTube</div>
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search"
              aria-label="Search"
            />
            <button type="button" className="search-button" aria-label="Submit search">
              🔍
            </button>
          </div>
        </div>

        <div className="header-right">
          <button type="button" className="icon-button" aria-label="Create">
            📹
          </button>
          <button type="button" className="icon-button" aria-label="Notifications">
            🔔
          </button>
          <div className="user-avatar">U</div>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <div className="sidebar-section">
            {primaryNav.map((item) => (
              <div
                key={item.label}
                className={`sidebar-item${item.active ? ' active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            {libraryNav.map((item) => (
              <div key={item.label} className="sidebar-item">
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">SUBSCRIPTIONS</div>
            {subscriptions.map((subscription) => (
              <div key={subscription.name} className="subscription-item">
                <div className="subscription-avatar">{subscription.initials}</div>
                <span>{subscription.name}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="content">
          <div className="video-player">
            <div className="player-wrapper">
              <div className="player">
                <div className="play-button" role="button" aria-label="Play video">
                  <div className="play-icon">▶</div>
                </div>
              </div>
            </div>

            <div className="video-info">
              <h1 className="video-title">Building the Future: BlackRoad Development Journey</h1>

              <div className="video-meta">
                <div className="video-stats">
                  <span>1.2M views</span>
                  <span aria-hidden="true">•</span>
                  <span>2 days ago</span>
                </div>

                <div className="video-actions">
                  <button type="button" className="action-button liked">
                    <span role="img" aria-label="Like">
                      👍
                    </span>
                    <span>124K</span>
                  </button>
                  <button type="button" className="action-button" aria-label="Dislike">
                    <span role="img" aria-label="Dislike">
                      👎
                    </span>
                  </button>
                  <button type="button" className="action-button">
                    <span role="img" aria-label="Share">
                      ↗️
                    </span>
                    <span>Share</span>
                  </button>
                  <button type="button" className="action-button">
                    <span role="img" aria-label="Save">
                      💾
                    </span>
                    <span>Save</span>
                  </button>
                </div>
              </div>

              <div className="channel-info">
                <div className="channel-details">
                  <div className="channel-avatar">BR</div>
                  <div className="channel-text">
                    <h3>BlackRoad Inc</h3>
                    <p>2.5M subscribers</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`subscribe-button${subscribed ? ' subscribed' : ''}`}
                  onClick={toggleSubscribe}
                >
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              <div className="video-description">
                <p>The road isn&apos;t made. It&apos;s remembered. 🛣️✨</p>
                <p>
                  We&apos;ve seen the future—and it looks a lot like where we started. Welcome to
                  BlackRoad. Built for the ones who never stopped imagining.
                </p>
                <p>
                  In this video, we take you through our development journey, the challenges we
                  faced, and how we&apos;re building a platform that empowers creators and developers
                  worldwide.
                </p>
                <p>
                  🔥 Join our community: <a className="link" href="https://blackroad.io">https://blackroad.io</a>
                  <br />💬 Discord: <a className="link" href="https://discord.gg/blackroad">https://discord.gg/blackroad</a>
                  <br />🐦 Twitter: <a className="link" href="https://twitter.com/blackroadinc">@blackroadinc</a>
                </p>
              </div>

              <div className="comments-section">
                <div className="comments-header">
                  <span>Comments</span>
                  <span className="comment-count">8,432</span>
                </div>

                <div className="comment-input-wrapper">
                  <div className="comment-avatar">U</div>
                  <div className="comment-input-box">
                    <input
                      type="text"
                      className="comment-input"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      onFocus={handleCommentFocus}
                    />
                    <div className={`comment-actions${showCommentActions ? '' : ' hidden'}`}>
                      <button type="button" className="comment-button cancel" onClick={handleCancelComment}>
                        Cancel
                      </button>
                      <button type="button" className="comment-button post" disabled={!commentText.trim()}>
                        Comment
                      </button>
                    </div>
                  </div>
                </div>

                {comments.map((comment) => (
                  <div key={comment.author} className="comment">
                    <div className="comment-avatar">{comment.initials}</div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author}</span>
                        <span className="comment-time">{comment.time}</span>
                      </div>
                      <div className="comment-text">{comment.text}</div>
                      <div className="comment-actions-bar">
                        <div className="comment-action" role="button" tabIndex={0}>
                          <span role="img" aria-label="Like comment">
                            👍
                          </span>
                          <span>{comment.likes}</span>
                        </div>
                        <div className="comment-action" role="button" tabIndex={0}>
                          <span role="img" aria-label="Dislike comment">
                            👎
                          </span>
                        </div>
                        <div className="comment-action" role="button" tabIndex={0}>
                          <span>Reply</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="recommendations">
            {recommendedVideos.map((video) => (
              <div key={video.title} className="video-card">
                <div className="video-thumbnail">
                  <div className="video-duration">{video.duration}</div>
                </div>
                <div className="video-card-info">
                  <div className="video-card-title">{video.title}</div>
                  <div className="video-card-channel">{video.channel}</div>
                  <div className="video-card-stats">{video.stats}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
