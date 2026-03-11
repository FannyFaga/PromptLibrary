/**
 * Shared category style maps.
 * Defined once here and imported by both PromptCard and PromptDetailModal
 * so the two components never drift out of sync.
 */

export const CATEGORY_BADGE = {
  Writing:      'bg-violet-100 text-violet-700 ring-violet-200',
  Coding:       'bg-blue-100   text-blue-700   ring-blue-200',
  Marketing:    'bg-orange-100 text-orange-700 ring-orange-200',
  Productivity: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Other:        'bg-slate-100  text-slate-600  ring-slate-200',
}

export const CATEGORY_ACCENT = {
  Writing:      'bg-violet-400',
  Coding:       'bg-blue-400',
  Marketing:    'bg-orange-400',
  Productivity: 'bg-emerald-400',
  Other:        'bg-slate-400',
}
