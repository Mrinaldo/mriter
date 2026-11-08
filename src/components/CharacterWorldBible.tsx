import React, { useState } from 'react'
import {
  Users,
  Globe,
  Plus,
  Trash2,
  Edit2,
  Crosshair,
  Flame,
  Compass,
} from 'lucide-react'
import { useManuscript } from '../context/ManuscriptContext'
import { CharacterItem, WorldItem } from '../types/manuscript'

export const CharacterWorldBible: React.FC = () => {
  const {
    project,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addWorldItem,
    updateWorldItem,
    deleteWorldItem,
  } = useManuscript()

  const [activeTab, setActiveTab] = useState<'characters' | 'world'>('characters')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Character Modal State
  const [isCharModalOpen, setIsCharModalOpen] = useState(false)
  const [editingChar, setEditingChar] = useState<CharacterItem | null>(null)

  // World Modal State
  const [isWorldModalOpen, setIsWorldModalOpen] = useState(false)
  const [editingWorld, setEditingWorld] = useState<WorldItem | null>(null)

  // Form states for Character
  const [charName, setCharName] = useState('')
  const [charRole, setCharRole] = useState<'protagonist' | 'antagonist' | 'supporting' | 'minor'>('protagonist')
  const [charArchetype, setCharArchetype] = useState('')
  const [charGoal, setCharGoal] = useState('')
  const [charConflict, setCharConflict] = useState('')
  const [charTraits, setCharTraits] = useState('')
  const [charBio, setCharBio] = useState('')
  const [charColor, setCharColor] = useState('#768494')

  // Form states for World
  const [worldName, setWorldName] = useState('')
  const [worldCategory, setWorldCategory] = useState<
    'location' | 'lore' | 'culture' | 'technology' | 'magic' | 'item' | 'other'
  >('location')
  const [worldDescription, setWorldDescription] = useState('')
  const [worldTags, setWorldTags] = useState('')
  const [worldNotes, setWorldNotes] = useState('')

  const openNewCharacter = () => {
    setEditingChar(null)
    setCharName('')
    setCharRole('protagonist')
    setCharArchetype('')
    setCharGoal('')
    setCharConflict('')
    setCharTraits('')
    setCharBio('')
    setCharColor('#768494')
    setIsCharModalOpen(true)
  }

  const openEditCharacter = (char: CharacterItem) => {
    setEditingChar(char)
    setCharName(char.name)
    setCharRole(char.role)
    setCharArchetype(char.archetype || '')
    setCharGoal(char.goal)
    setCharConflict(char.conflict)
    setCharTraits(char.traits.join(', '))
    setCharBio(char.bio)
    setCharColor(char.color || '#768494')
    setIsCharModalOpen(true)
  }

  const saveCharacter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!charName.trim()) return

    const traitsArray = charTraits
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (editingChar) {
      updateCharacter(editingChar.id, {
        name: charName,
        role: charRole,
        archetype: charArchetype,
        goal: charGoal,
        conflict: charConflict,
        traits: traitsArray,
        bio: charBio,
        color: charColor,
      })
    } else {
      const newChar: CharacterItem = {
        id: 'char-' + Math.random().toString(36).substring(2, 8),
        name: charName,
        role: charRole,
        archetype: charArchetype,
        goal: charGoal,
        conflict: charConflict,
        traits: traitsArray,
        bio: charBio,
        notes: '',
        color: charColor,
      }
      addCharacter(newChar)
    }
    setIsCharModalOpen(false)
  }

  const openNewWorld = () => {
    setEditingWorld(null)
    setWorldName('')
    setWorldCategory('location')
    setWorldDescription('')
    setWorldTags('')
    setWorldNotes('')
    setIsWorldModalOpen(true)
  }

  const openEditWorld = (item: WorldItem) => {
    setEditingWorld(item)
    setWorldName(item.name)
    setWorldCategory(item.category)
    setWorldDescription(item.description)
    setWorldTags(item.tags.join(', '))
    setWorldNotes(item.notes)
    setIsWorldModalOpen(true)
  }

  const saveWorld = (e: React.FormEvent) => {
    e.preventDefault()
    if (!worldName.trim()) return

    const tagsArray = worldTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (editingWorld) {
      updateWorldItem(editingWorld.id, {
        name: worldName,
        category: worldCategory,
        description: worldDescription,
        tags: tagsArray,
        notes: worldNotes,
      })
    } else {
      const newItem: WorldItem = {
        id: 'wb-' + Math.random().toString(36).substring(2, 8),
        name: worldName,
        category: worldCategory,
        description: worldDescription,
        tags: tagsArray,
        notes: worldNotes,
      }
      addWorldItem(newItem)
    }
    setIsWorldModalOpen(false)
  }

  const filteredCharacters = project.characters.filter((c) =>
    selectedRole === 'all' ? true : c.role === selectedRole
  )

  const filteredWorld = project.worldBible.filter((w) =>
    selectedCategory === 'all' ? true : w.category === selectedCategory
  )

  // Calming, muted earth & mineral tones
  const colorOptions = ['#768494', '#6d826e', '#a6916f', '#8f7862', '#978278', '#857885', '#6c7c8c']

  return (
    <div className="flex-1 flex flex-col h-full bg-app text-main overflow-y-auto p-8 select-none transition-colors duration-150">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-main">Story Bible & Lore</h2>
          <p className="text-xs text-muted-theme mt-0.5">
            Cast profiles, character arcs, and world-building notes.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-surface p-0.5 rounded-lg border border-subtle">
            <button
              onClick={() => setActiveTab('characters')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'characters'
                  ? 'bg-app text-main shadow-xs border border-subtle'
                  : 'text-muted-theme hover:text-main'
              }`}
            >
              <Users className="w-3.5 h-3.5 opacity-70" />
              <span>Characters ({project.characters.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('world')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'world'
                  ? 'bg-app text-main shadow-xs border border-subtle'
                  : 'text-muted-theme hover:text-main'
              }`}
            >
              <Globe className="w-3.5 h-3.5 opacity-70" />
              <span>World Bible ({project.worldBible.length})</span>
            </button>
          </div>

          <button
            onClick={() => (activeTab === 'characters' ? openNewCharacter() : openNewWorld())}
            className="flex items-center space-x-1.5 bg-panel hover:bg-surface text-main border border-subtle px-3 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-muted-theme" />
            <span>{activeTab === 'characters' ? 'Add Character' : 'Add Lore'}</span>
          </button>
        </div>
      </div>

      {/* CHARACTERS VIEW */}
      {activeTab === 'characters' && (
        <div className="max-w-6xl w-full mx-auto space-y-5">
          {/* Role Filters */}
          <div className="flex items-center space-x-1.5 text-xs">
            {['all', 'protagonist', 'antagonist', 'supporting', 'minor'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`capitalize px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors ${
                  selectedRole === role
                    ? 'bg-surface text-main border border-subtle shadow-2xs'
                    : 'text-muted-theme hover:text-main'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Character Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map((char) => (
              <div
                key={char.id}
                className="bg-panel border border-subtle rounded-xl p-4 hover:border-muted-theme transition-colors flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs font-serif"
                        style={{ backgroundColor: char.color || '#768494' }}
                      >
                        {char.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-semibold text-main">{char.name}</h4>
                        <div className="flex items-center space-x-1.5 text-[10px] text-muted-theme capitalize">
                          <span>{char.role}</span>
                          {char.archetype && <span>· {char.archetype}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditCharacter(char)}
                        className="p-1 text-muted-theme hover:text-main rounded"
                        title="Edit Character"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete character "${char.name}"?`)) {
                            deleteCharacter(char.id)
                          }
                        }}
                        className="p-1 text-faint hover:text-red-500 rounded"
                        title="Delete Character"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Traits */}
                  {char.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {char.traits.map((trait, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-surface border border-subtle text-muted-theme"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Core Goal & Conflict */}
                  {(char.goal || char.conflict) && (
                    <div className="space-y-1.5 text-xs mb-2.5 bg-surface p-2.5 rounded-lg border border-subtle">
                      {char.goal && (
                        <div className="flex items-start space-x-1.5 text-main">
                          <Crosshair className="w-3 h-3 text-faint shrink-0 mt-0.5" />
                          <div className="text-[11px]">
                            <span className="text-[9px] uppercase font-semibold text-faint block">
                              Goal
                            </span>
                            <span className="italic text-muted-theme">{char.goal}</span>
                          </div>
                        </div>
                      )}
                      {char.conflict && (
                        <div className="flex items-start space-x-1.5 text-main">
                          <Flame className="w-3 h-3 text-faint shrink-0 mt-0.5" />
                          <div className="text-[11px]">
                            <span className="text-[9px] uppercase font-semibold text-faint block">
                              Conflict
                            </span>
                            <span className="text-muted-theme">{char.conflict}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bio */}
                  {char.bio && (
                    <p className="text-[11px] text-muted-theme line-clamp-3 leading-relaxed">{char.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WORLD BIBLE VIEW */}
      {activeTab === 'world' && (
        <div className="max-w-6xl w-full mx-auto space-y-5">
          {/* Category Filters */}
          <div className="flex items-center space-x-1.5 text-xs flex-wrap gap-1">
            {['all', 'location', 'technology', 'lore', 'culture', 'magic', 'item'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`capitalize px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-surface text-main border border-subtle shadow-2xs'
                    : 'text-muted-theme hover:text-main'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* World Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorld.map((item) => (
              <div
                key={item.id}
                className="bg-panel border border-subtle rounded-xl p-4 hover:border-muted-theme transition-colors flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <Compass className="w-3.5 h-3.5 text-accent" />
                      <h4 className="font-serif text-sm font-semibold text-main">{item.name}</h4>
                    </div>
                    <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditWorld(item)}
                        className="p-1 text-muted-theme hover:text-main rounded"
                        title="Edit Lore Item"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete item "${item.name}"?`)) {
                            deleteWorldItem(item.id)
                          }
                        }}
                        className="p-1 text-faint hover:text-red-500 rounded"
                        title="Delete Lore Item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <span className="inline-block text-[9px] uppercase font-semibold text-accent tracking-wider mb-1.5">
                    {item.category}
                  </span>

                  <p className="text-xs text-muted-theme leading-relaxed mb-2.5">{item.description}</p>

                  {item.notes && (
                    <div className="bg-surface p-2 rounded border border-subtle text-muted-theme text-[10px] mb-2.5">
                      <span className="font-medium text-faint block mb-0.5">Author Notes:</span>
                      <span>{item.notes}</span>
                    </div>
                  )}
                </div>

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-surface border border-subtle text-faint"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHARACTER MODAL */}
      {isCharModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-panel border border-subtle rounded-xl max-w-lg w-full p-5 shadow-xl space-y-3.5 text-main">
            <h3 className="font-serif text-base font-bold text-main">
              {editingChar ? 'Edit Character' : 'New Character'}
            </h3>

            <form onSubmit={saveCharacter} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-medium text-muted-theme block mb-1">Name</label>
                  <input
                    type="text"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    placeholder="e.g. Kaelen Gray"
                    required
                    className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-theme block mb-1">Role</label>
                  <select
                    value={charRole}
                    onChange={(e: any) => setCharRole(e.target.value)}
                    className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none capitalize"
                  >
                    <option value="protagonist">Protagonist</option>
                    <option value="antagonist">Antagonist</option>
                    <option value="supporting">Supporting</option>
                    <option value="minor">Minor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-medium text-muted-theme block mb-1">
                    Archetype / Title
                  </label>
                  <input
                    type="text"
                    value={charArchetype}
                    onChange={(e) => setCharArchetype(e.target.value)}
                    placeholder="e.g. The Reluctant Scholar"
                    className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-theme block mb-1">Color Badge</label>
                  <div className="flex items-center space-x-1.5 mt-1">
                    {colorOptions.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCharColor(c)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          charColor === c ? 'scale-110 border-main' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-theme block mb-1">
                  Traits (comma separated)
                </label>
                <input
                  type="text"
                  value={charTraits}
                  onChange={(e) => setCharTraits(e.target.value)}
                  placeholder="e.g. Observant, Cautious, Stubborn"
                  className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-theme block mb-1">Dramatic Goal</label>
                <input
                  type="text"
                  value={charGoal}
                  onChange={(e) => setCharGoal(e.target.value)}
                  placeholder="What does this character desire more than anything?"
                  className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-theme block mb-1">
                  Inner / Outer Conflict
                </label>
                <input
                  type="text"
                  value={charConflict}
                  onChange={(e) => setCharConflict(e.target.value)}
                  placeholder="What obstacle stands in their way?"
                  className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-theme block mb-1">
                  Backstory & Description
                </label>
                <textarea
                  value={charBio}
                  onChange={(e) => setCharBio(e.target.value)}
                  placeholder="History, appearance, voice..."
                  rows={2}
                  className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setIsCharModalOpen(false)}
                  className="px-2.5 py-1 rounded text-xs text-muted-theme hover:text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent-soft hover:bg-accent/20 text-accent font-medium px-3.5 py-1 rounded text-xs border border-subtle transition-colors"
                >
                  Save Character
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORLD ITEM MODAL */}
      {isWorldModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-panel border border-subtle rounded-xl max-w-lg w-full p-5 shadow-xl space-y-3.5 text-main">
            <h3 className="font-serif text-base font-bold text-main">
              {editingWorld ? 'Edit Lore Entry' : 'New Lore Entry'}
            </h3>

            <form onSubmit={saveWorld} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-medium text-muted-theme block mb-1">Name</label>
                  <input
                    type="text"
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                    placeholder="e.g. Sunken Reach"
                    required
                    className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-theme block mb-1">Category</label>
                  <select
                    value={worldCategory}
                    onChange={(e: any) => setWorldCategory(e.target.value)}
                    className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none capitalize"
                  >
                    <option value="location">Location</option>
                    <option value="technology">Technology</option>
                    <option value="lore">Lore / History</option>
                    <option value="culture">Culture / Faction</option>
                    <option value="magic">Magic</option>
                    <option value="item">Relic / Item</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-theme block mb-1">Description</label>
                <textarea
                  value={worldDescription}
                  onChange={(e) => setWorldDescription(e.target.value)}
                  placeholder="Atmosphere, significance, architecture..."
                  rows={2}
                  className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-theme block mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={worldTags}
                  onChange={(e) => setWorldTags(e.target.value)}
                  placeholder="e.g. Port, Canal, Ancient Ruins"
                  className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-theme block mb-1">Author Notes</label>
                <textarea
                  value={worldNotes}
                  onChange={(e) => setWorldNotes(e.target.value)}
                  placeholder="Plot relevance, secrets to reveal later..."
                  rows={2}
                  className="w-full bg-surface text-main text-xs p-1.5 rounded border border-subtle focus:border-muted-theme outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setIsWorldModalOpen(false)}
                  className="px-2.5 py-1 rounded text-xs text-muted-theme hover:text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent-soft hover:bg-accent/20 text-accent font-medium px-3.5 py-1 rounded text-xs border border-subtle transition-colors"
                >
                  Save Lore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
