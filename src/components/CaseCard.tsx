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
  const mainPhoto = caseItem.photo1 || caseItem.photo2 || caseItem.photo3

  return (
    <div className="case-card">
      {mainPhoto && (
        <div className="case-card__image">
          <img src={mainPhoto} alt={caseItem.title} />
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

