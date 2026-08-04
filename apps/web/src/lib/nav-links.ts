/**
 * Primary navigation — shared by the desktop header links and the
 * mobile slide-in menu so both always list the same routes in the same
 * order.
 */
export const navLinks = [
  { href: "/", i18nKey: "site.home" },
  { href: "/archive", i18nKey: "site.archive" },
  { href: "/about", i18nKey: "site.about" },
]

/** A blog topic entry — passed into Header/MobileNav by the layout. */
export type NavCategory = { key: string; count: number }
