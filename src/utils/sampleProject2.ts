import { ManuscriptProject } from '../types/manuscript'
import { SAMPLE_COVER_IMAGE_2 } from './sampleCoverBase64'

export function createSampleProject2(): ManuscriptProject {
  const now = new Date().toISOString()

  return {
    id: 'proj-neon-horizon',
    version: '1.0.0',
    title: 'Neon Horizon: Protocol Zero',
    subtitle: 'A Cyberpunk Thriller',
    author: 'Marcus Cole',
    authorBio: 'Marcus Cole is a speculative fiction author writing about AI ethics and cybernetics.',
    publisher: 'Synthetica Media',
    language: 'en',
    isbn: '978-1-987654-32-1',
    genre: 'Cyberpunk / Tech Noir',
    description: 'In the towering biospheres of New Kyoto, a renegade subnet architect discovers an encrypted ghost protocol that threatens to wipe the memories of ten million plugged-in citizens.',
    targetWordCount: 75000,
    frontMatter: [
      {
        id: 'fm-title-2',
        type: 'title-page',
        title: 'Title Page',
        content: `<h1>Neon Horizon: Protocol Zero</h1><p style="text-align:center; font-style: italic;">A Cyberpunk Thriller</p><br/><br/><p style="text-align:center; font-weight:600;">MARCUS COLE</p>`,
        includedInExport: true,
      },
      {
        id: 'fm-copyright-2',
        type: 'copyright',
        title: 'Copyright',
        content: `<p>Copyright &copy; 2026 Marcus Cole</p><p>Published by Synthetica Media</p>`,
        includedInExport: true,
      },
    ],
    parts: [
      {
        id: 'part-2-1',
        title: 'Part I: Neural Drift',
        synopsis: 'Jax detects anomalies in the sensory feedback of the upper atmospheric deck.',
        chapters: [
          {
            id: 'chap-2-1',
            title: 'Chapter 1: The Glitch in the Sky',
            synopsis: 'A simulated rainfall begins to bleed real static.',
            scenes: [
              {
                id: 'scene-2-1-1',
                title: 'Static Over Sector 7',
                content: `<p>The rain over Sector 7 was supposed to smell of synthetic jasmine and damp asphalt. Instead, it smelled of burnt copper.</p><p>Jax Mercer stood on the observation balcony of Grid-9, watching the holographic sky flicker like a failing fluorescing tube. Down in the neon trenches below, crowds moved under umbrella drones, oblivious to the fact that the sky had lost twelve milliseconds of synchronization with the master clock.</p><p>"You seeing this, Zero?" Jax touched his neural jack behind his left ear.</p><p>"I see it," came the digitized voice. "And more importantly, the Corporation just scrubbed the incident from the public registry."</p>`,
                synopsis: 'Jax notices the sky simulation desyncing from the central quantum clock.',
                povCharacterId: 'char-2-1',
                status: 'draft',
                wordCount: 104,
                notes: 'Set the tone of neon rain and corporate cover-ups.',
                createdAt: now,
                updatedAt: now,
              },
            ],
          },
        ],
      },
    ],
    backMatter: [
      {
        id: 'bm-about-2',
        type: 'about-author',
        title: 'About the Author',
        content: `<p>Marcus Cole lives in Tokyo and writes high-octane sci-fi.</p>`,
        includedInExport: true,
      },
    ],
    characters: [
      {
        id: 'char-2-1',
        name: 'Jax Mercer',
        role: 'protagonist',
        archetype: 'The Renegade Hacker',
        traits: ['Hyper-focused', 'Cynical', 'Sharp-witted'],
        goal: 'Expose the neural memory harvesting project before the next system purge.',
        conflict: 'His own cybernetic implants are tied to the network he is attempting to bring down.',
        bio: 'Former senior architect for Kuroshio Robotics, now operating from the shadow alleys of Sector 7.',
        notes: 'Carries an overclocked optical deck.',
        color: '#06b6d4',
      },
      {
        id: 'char-2-2',
        name: 'Director Cynthia Vance',
        role: 'antagonist',
        archetype: 'The Corporate Sovereign',
        traits: ['Ruthless', 'Visionary', 'Poised'],
        goal: 'Achieve total cognitive sync across all tier-one subscribers.',
        conflict: 'Unpredictable neural glitches are eroding user obedience.',
        bio: 'Head of Cognitive Infrastructure at Aether Corp.',
        notes: 'Cold silver ocular implants.',
        color: '#ec4899',
      },
    ],
    worldBible: [
      {
        id: 'wb-2-1',
        name: 'Sector 7 (The Drip)',
        category: 'location',
        description: 'The lowermost habitable level of New Kyoto, constantly drenched in condensation from the luxury biospheres above.',
        notes: 'Haven for unchipped hackers and black-market cyber-surgeons.',
        tags: ['Cyberpunk', 'Slums', 'Subnet'],
      },
    ],
    exportSettings: {
      bookTheme: 'modern',
      trimSize: '5.5x8.5',
      dropCaps: false,
      firstParagraphIndent: false,
      includeSceneDividers: true,
      sceneDividerSymbol: '//  //  //',
      includeChapterNumbers: true,
      chapterTitleStyle: 'num-and-title',
      fontSize: 11,
      lineSpacing: 1.6,
      authorHeader: 'Marcus Cole',
      includeCoverPage: true,
      coverImage: SAMPLE_COVER_IMAGE_2,
    },
    createdAt: now,
    updatedAt: now,
  }
}
