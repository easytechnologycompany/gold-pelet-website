import { useT } from '@/lib/i18n'
import { copy } from '@/lib/content'

/**
 * The Easy Technology build credit. Used by the public footer, the admin
 * sidebar and the admin sign-in card.
 *
 * Both artworks are in the markup and CSS shows one; see `.et-logo` in
 * index.css for why the theme picks a file rather than filtering a single
 * image. That stylesheet loads for the admin too, so the swap behaves the
 * same on both sides of the login.
 *
 * The label is a prop because the two sides read different dictionaries: the
 * public site has four locales and follows the visitor, the admin has two and
 * follows the operator. A Turkish operator previewing the English site should
 * see this in Turkish, which only works if the caller supplies the word.
 *
 * The company name is not a prop. It is the same in every language, and it is
 * what the logo says.
 */
export function EasyTechCredit({ label, className }: { label: string; className?: string }) {
  const { t } = useT()
  const alt = t(copy.easytechAlt)

  return (
    <span className={className ? `et-credit ${className}` : 'et-credit'}>
      <span className="et-by">{label}</span>
      <img className="et-logo et-logo--onlight" src="/easytech-dark.png" alt={alt} />
      <img className="et-logo et-logo--ondark" src="/easytech-light.png" alt={alt} />
    </span>
  )
}
