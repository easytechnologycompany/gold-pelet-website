import { mediaURL } from '@/lib/api'
import { useAdminT } from '@/lib/admin-i18n'

/**
 * A photo field: preview, file picker, and a clear button once something is
 * set. Shared by Products (two of them, raw and fried) and News.
 *
 * The upload itself belongs to the caller, not here — Products has to know
 * *which* of its two fields is busy so it can disable the other and block
 * save, and News only has one. So this takes `busy` and reports the picked
 * file, and the page owns the request. Same split the old pages had, where
 * crud.js's `image` field type and products.html's bespoke handler both
 * uploaded on change and held the URL until save.
 */
export function ImageField({
  id,
  label,
  url,
  busy,
  disabled,
  onPick,
  onClear,
}: {
  id: string
  label: string
  url: string
  busy: boolean
  disabled: boolean
  onPick: (file: File) => void
  onClear: () => void
}) {
  const t = useAdminT()

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="admin-upload">
        {url ? (
          <img className="admin-upload-preview" src={mediaURL(url)} alt="" />
        ) : (
          // A plate, never a broken-image glyph, for a record with no photo.
          <span className="admin-upload-preview admin-upload-empty" aria-hidden="true" />
        )}
        <div className="admin-upload-controls">
          <input
            id={id}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onPick(file)
              // Clear the input so picking the same file twice still fires
              // change — otherwise a failed upload cannot be retried.
              e.target.value = ''
            }}
          />
          {busy && <span className="admin-upload-status">{t('crud.loading')}</span>}
          {url && !busy && (
            <button type="button" className="admin-link-btn" onClick={onClear}>
              {t('crud.delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
