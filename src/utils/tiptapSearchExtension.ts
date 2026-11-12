import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'

export interface SearchMatch {
  from: number
  to: number
}

export interface SearchOptions {
  searchTerm: string
  replaceTerm: string
  caseSensitive: boolean
  wholeWord: boolean
  searchResultClass: string
  activeSearchResultClass: string
}

export interface SearchStorage {
  searchTerm: string
  replaceTerm: string
  caseSensitive: boolean
  wholeWord: boolean
  results: SearchMatch[]
  currentIndex: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    search: {
      setSearchTerm: (searchTerm: string) => ReturnType
      setReplaceTerm: (replaceTerm: string) => ReturnType
      setCaseSensitive: (caseSensitive: boolean) => ReturnType
      setWholeWord: (wholeWord: boolean) => ReturnType
      nextSearchResult: () => ReturnType
      previousSearchResult: () => ReturnType
      replaceCurrent: () => ReturnType
      replaceAllSearchResults: () => ReturnType
      clearSearch: () => ReturnType
    }
  }
}

export const searchPluginKey = new PluginKey('mriterSearch')

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function processMatches(
  doc: ProseMirrorNode,
  searchTerm: string,
  caseSensitive: boolean,
  wholeWord: boolean
): SearchMatch[] {
  if (!searchTerm || !searchTerm.trim()) {
    return []
  }

  const matches: SearchMatch[] = []
  let flags = 'g'
  if (!caseSensitive) {
    flags += 'i'
  }

  let escaped = escapeRegExp(searchTerm)
  if (wholeWord) {
    escaped = `\\b${escaped}\\b`
  }

  let regex: RegExp
  try {
    regex = new RegExp(escaped, flags)
  } catch {
    return []
  }

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text
      let match: RegExpExecArray | null
      regex.lastIndex = 0
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          from: pos + match.index,
          to: pos + match.index + match[0].length,
        })
      }
    }
  })

  return matches
}

export const SearchExtension = Extension.create<SearchOptions, SearchStorage>({
  name: 'search',

  addOptions() {
    return {
      searchTerm: '',
      replaceTerm: '',
      caseSensitive: false,
      wholeWord: false,
      searchResultClass: 'mriter-search-match',
      activeSearchResultClass: 'mriter-search-match-active',
    }
  },

  addStorage() {
    return {
      searchTerm: '',
      replaceTerm: '',
      caseSensitive: false,
      wholeWord: false,
      results: [],
      currentIndex: -1,
    }
  },

  addCommands() {
    return {
      setSearchTerm:
        (searchTerm: string) =>
        ({ editor, tr, dispatch }) => {
          this.storage.searchTerm = searchTerm
          const matches = processMatches(
            editor.state.doc,
            searchTerm,
            this.storage.caseSensitive,
            this.storage.wholeWord
          )
          this.storage.results = matches
          this.storage.currentIndex = matches.length > 0 ? 0 : -1

          if (dispatch) {
            tr.setMeta(searchPluginKey, { update: true })
          }
          return true
        },

      setReplaceTerm:
        (replaceTerm: string) =>
        () => {
          this.storage.replaceTerm = replaceTerm
          return true
        },

      setCaseSensitive:
        (caseSensitive: boolean) =>
        ({ editor, tr, dispatch }) => {
          this.storage.caseSensitive = caseSensitive
          const matches = processMatches(
            editor.state.doc,
            this.storage.searchTerm,
            caseSensitive,
            this.storage.wholeWord
          )
          this.storage.results = matches
          this.storage.currentIndex = matches.length > 0 ? 0 : -1

          if (dispatch) {
            tr.setMeta(searchPluginKey, { update: true })
          }
          return true
        },

      setWholeWord:
        (wholeWord: boolean) =>
        ({ editor, tr, dispatch }) => {
          this.storage.wholeWord = wholeWord
          const matches = processMatches(
            editor.state.doc,
            this.storage.searchTerm,
            this.storage.caseSensitive,
            wholeWord
          )
          this.storage.results = matches
          this.storage.currentIndex = matches.length > 0 ? 0 : -1

          if (dispatch) {
            tr.setMeta(searchPluginKey, { update: true })
          }
          return true
        },

      nextSearchResult:
        () =>
        ({ tr, dispatch }) => {
          const { results, currentIndex } = this.storage
          if (results.length === 0) return false

          const nextIndex = (currentIndex + 1) % results.length
          this.storage.currentIndex = nextIndex

          if (dispatch) {
            tr.setMeta(searchPluginKey, { update: true })
          }
          return true
        },

      previousSearchResult:
        () =>
        ({ tr, dispatch }) => {
          const { results, currentIndex } = this.storage
          if (results.length === 0) return false

          const prevIndex = currentIndex - 1 < 0 ? results.length - 1 : currentIndex - 1
          this.storage.currentIndex = prevIndex

          if (dispatch) {
            tr.setMeta(searchPluginKey, { update: true })
          }
          return true
        },

      replaceCurrent:
        () =>
        ({ editor, tr, dispatch }) => {
          const { results, currentIndex, replaceTerm, searchTerm, caseSensitive, wholeWord } = this.storage
          if (results.length === 0 || currentIndex < 0 || currentIndex >= results.length) {
            return false
          }

          const currentMatch = results[currentIndex]
          tr.insertText(replaceTerm, currentMatch.from, currentMatch.to)

          // Re-calculate matches
          const newDoc = tr.doc
          const newMatches = processMatches(newDoc, searchTerm, caseSensitive, wholeWord)
          this.storage.results = newMatches
          this.storage.currentIndex = newMatches.length > 0 ? Math.min(currentIndex, newMatches.length - 1) : -1

          if (dispatch) {
            tr.setMeta(searchPluginKey, { update: true })
          }
          return true
        },

      replaceAllSearchResults:
        () =>
        ({ editor, tr, dispatch }) => {
          const { results, replaceTerm } = this.storage
          if (results.length === 0) return false

          // Replace from back to front to preserve position indices
          const sorted = [...results].sort((a, b) => b.from - a.from)
          for (const match of sorted) {
            tr.insertText(replaceTerm, match.from, match.to)
          }

          this.storage.results = []
          this.storage.currentIndex = -1

          if (dispatch) {
            tr.setMeta(searchPluginKey, { update: true })
          }
          return true
        },

      clearSearch:
        () =>
        ({ tr, dispatch }) => {
          this.storage.searchTerm = ''
          this.storage.results = []
          this.storage.currentIndex = -1

          if (dispatch) {
            tr.setMeta(searchPluginKey, { update: true })
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldSet, oldState, newState) {
            const meta = tr.getMeta(searchPluginKey)
            if (tr.docChanged || meta?.update) {
              const { searchTerm, caseSensitive, wholeWord, results, currentIndex } = extension.storage

              // If document changed, refresh results
              let currentResults = results
              if (tr.docChanged && searchTerm) {
                currentResults = processMatches(newState.doc, searchTerm, caseSensitive, wholeWord)
                extension.storage.results = currentResults
                if (currentResults.length === 0) {
                  extension.storage.currentIndex = -1
                } else if (extension.storage.currentIndex >= currentResults.length) {
                  extension.storage.currentIndex = currentResults.length - 1
                }
              }

              if (currentResults.length === 0) {
                return DecorationSet.empty
              }

              const decorations = currentResults.map((match, index) => {
                const isActive = index === extension.storage.currentIndex
                return Decoration.inline(match.from, match.to, {
                  class: isActive
                    ? extension.options.activeSearchResultClass
                    : extension.options.searchResultClass,
                })
              })

              return DecorationSet.create(newState.doc, decorations)
            }

            return oldSet.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})
