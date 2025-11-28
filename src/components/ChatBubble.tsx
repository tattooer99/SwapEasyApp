import './ChatBubble.css'

interface ChatBubbleProps {
  message: string
  isOwn: boolean
  timestamp?: string
}

export default function ChatBubble({ message, isOwn, timestamp }: ChatBubbleProps) {
  return (
    <div className={`chat-bubble ${isOwn ? 'chat-bubble--own' : ''}`}>
      <div className="chat-bubble__content">
        <p>{message}</p>
        {timestamp && <span className="chat-bubble__time">{timestamp}</span>}
      </div>
    </div>
  )
}

