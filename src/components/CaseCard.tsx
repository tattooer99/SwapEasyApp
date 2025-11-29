import { useState } from 'react'
import { Case, ITEM_TYPES } from '../types'
import './CaseCard.css'

interface CaseCardProps {
  case: Case
  onLike?: () => void
  onExchange?: () => void
  onViewUser?: () => void
  showActions?: boolean
}

export default function CaseCard({
  case: caseItem,
  onLike,
  onExchange,
  onViewUser,
  showActions = true,
}: CaseCardProps) {
  const itemTypeEmoji = ITEM_TYPES.find(t => t.value === caseItem.item_type)?.emoji || '📦'
  
  // Собираем все фото, включая null/undefined значения, затем фильтруем
  const allPhotos = [caseItem.photo1, caseItem.photo2, caseItem.photo3]
  const photos = allPhotos.filter((photo): photo is string => photo != null && photo !== '')
  
  // Логируем для отладки
  if (photos.length > 1) {
    console.log('CaseCard: multiple photos found for case', caseItem.id, 'photos:', photos.length, 'photo1:', caseItem.photo1 ? 'exists' : 'null', 'photo2:', caseItem.photo2 ? 'exists' : 'null', 'photo3:', caseItem.photo3 ? 'exists' : 'null')
  }
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  return (
    <div className="case-card">
      {photos.length > 0 && (
        <div className="case-card__image-container">
          <div className="case-card__image">
            <img src={photos[currentPhotoIndex]} alt={caseItem.title} />
          </div>
          {photos.length > 1 && (
            <>
              <button
                className="case-card__photo-nav case-card__photo-nav--prev"
                onClick={handlePrevPhoto}
                aria-label="Попереднє фото"
              >
                ‹
              </button>
              <button
                className="case-card__photo-nav case-card__photo-nav--next"
                onClick={handleNextPhoto}
                aria-label="Наступне фото"
              >
                ›
              </button>
              <div className="case-card__photo-indicator">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}
      <div className="case-card__content">
        <div className="case-card__header">
          <h3 className="case-card__title">
            {itemTypeEmoji} {caseItem.title}
          </h3>
          {caseItem.owner && (
            <div className="case-card__owner" onClick={onViewUser}>
              👤 {caseItem.owner.name}
              {caseItem.owner.region && ` • ${caseItem.owner.region}`}
            </div>
          )}
        </div>
        <p className="case-card__description">{caseItem.description}</p>
        <div className="case-card__meta">
          <span className="case-card__type">{caseItem.item_type}</span>
          <span className="case-card__price">💸 {caseItem.price_category}</span>
        </div>
        {showActions && (onLike || onExchange) && (
          <div className="case-card__actions">
            {onLike && (
              <button className="case-card__button case-card__button--like" onClick={onLike}>
                ❤️ Подобається
              </button>
            )}
            {onExchange && (
              <button className="case-card__button case-card__button--exchange" onClick={onExchange}>
                💬 Запропонувати обмін
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

