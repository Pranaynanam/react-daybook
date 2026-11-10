import { useEffect, useRef, useState } from 'react'
import { setToastListener } from '../lib/toast'

export default function Toast() {
  const [message, setMessage] = useState('')
  const [show, setShow] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    setToastListener((msg) => {
      setMessage(msg)
      setShow(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setShow(false), 2600)
    })
    return () => setToastListener(null)
  }, [])

  return <div className={'toast' + (show ? ' show' : '')} id="toast" role="status">{message}</div>
}
