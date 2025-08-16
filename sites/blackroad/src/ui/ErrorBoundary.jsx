import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err) {
    console.error(err)
  }
  render() {
    if (this.state.hasError) return <div>Something went wrong.</div>
    return this.props.children
  }
}
