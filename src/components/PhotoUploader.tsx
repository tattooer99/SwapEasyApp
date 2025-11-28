import { useState, useRef, useEffect } from 'react'
import './PhotoUploader.css'

interface PhotoUploaderProps {
  maxPhotos?: number
  onPhotosChange: (photos: string[]) => void
  initialPhotos?: string[]
}

export default function PhotoUploader({ maxPhotos = 3, onPhotosChange, initialPhotos = [] }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0 && photos.length === 0) {
      setPhotos(initialPhotos)
    }
  }, [initialPhotos])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: string[] = []
    const remainingSlots = maxPhotos - photos.length

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        newPhotos.push(result)
        
        if (newPhotos.length === Math.min(files.length, remainingSlots)) {
          const updatedPhotos = [...photos, ...newPhotos]
          setPhotos(updatedPhotos)
          onPhotosChange(updatedPhotos)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    setPhotos(updatedPhotos)
    onPhotosChange(updatedPhotos)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="photo-uploader">
      <div className="photo-uploader__grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-uploader__preview">
            <img src={photo} alt={`Photo ${index + 1}`} />
            <button
              className="photo-uploader__remove"
              onClick={() => removePhoto(index)}
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            className="photo-uploader__add"
            onClick={openFileDialog}
            type="button"
          >
            + Додати фото
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <p className="photo-uploader__hint">
        До {maxPhotos} фото
      </p>
    </div>
  )
}

