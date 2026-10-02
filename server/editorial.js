/** Versioned editorial contract. Legacy documents are reported, never silently rewritten. */
export const EDITORIAL_VERSION = 1;
export const CHARACTER_FIELDS = ['approximate_age', 'desire', 'fear', 'goal', 'flaw', 'strength', 'relationships', 'voice', 'gestures'];
export const STORY_FIELDS = ['premise', 'theme', 'protagonist', 'goal', 'obstacle', 'inciting_incident', 'escalation', 'climax_choice', 'resolution', 'ending', 'world_rules'];
export const PAGE_FIELDS = ['emotion', 'new_information', 'image_added_value', 'storyboard', 'turn'];
export function editorialFindings(bp, art, vol = null) {
  const issues = [], strict = bp.editorial_contract?.version === EDITORIAL_VERSION;
  const issue = (kind, target, field) => issues.push({ kind, target, field, severity: strict ? 'required' : 'legacy-review' });
  for (const c of art.bible?.content?.characters || []) {
    for (const f of CHARACTER_FIELDS) if (c[f] == null || c[f] === '') issue('character', c.id, f);
    if (!Array.isArray(c.visual_landmarks) || !c.visual_landmarks.length) issue('character', c.id, 'visual_landmarks');
    for (const mark of c.visual_landmarks || []) if (!mark.id || !mark.side || !mark.body_region || !mark.anchor || !mark.shape || !mark.occlusion_rule) issue('character', c.id, 'landmark_definition');
  }
  const volumes = vol == null ? Array.from({ length: bp.structure.volumes }, (_, v) => v) : [vol];
  for (const v of volumes) {
    const story = art[`final_${v}`]?.content || art[`script_${v}`]?.content;
    if (!story) continue;
    for (const f of STORY_FIELDS) if (story.story_bible?.[f] == null || story.story_bible[f] === '') issue('story', `volume:${v + 1}`, f);
    for (const page of story.pages || []) {
      for (const f of PAGE_FIELDS) if (page[f] == null || page[f] === '') issue('page', `volume:${v + 1}:page:${page.n}`, f);
      const t = page.turn;
      if (t?.type && !['quiet', 'question', 'surprise', 'anticipation', 'unfinished_action', 'reveal'].includes(t.type)) issue('page', `page:${page.n}`, 'turn_type');
      if (t && t.type !== 'quiet' && t.type !== 'reveal' && (!t.hook || !Number.isInteger(t.payoff_page) || t.payoff_page <= page.n || t.payoff_page > bp.structure.pages || !t.payoff)) issue('page', `page:${page.n}`, 'hook_payoff');
      if (page.storyboard && (!page.storyboard.shot || !page.storyboard.focal_action || !page.storyboard.direction)) issue('page', `page:${page.n}`, 'storyboard_purpose');
    }
  }
  return { version: EDITORIAL_VERSION, strict, issues, complete: !issues.length, note: 'Reacția copilului și plăcerea lecturii necesită observare umană; scorurile AI nu le certifică.' };
}
export const EDITORIAL_POLICY = `EDITORIAL PRODUCTION CONTRACT v03:
Create a memorable, original illustrated book, with a satisfying standalone ending and a distinct role in the configured collection arc. Read the number of volumes, pages, ages, cast, identities and story rules from this project's blueprint and documents. Preserve the configured ages and the storybook/colouring pair. Motivation drives actions; attempts have consequences; escalation changes the situation; the protagonist's choice earns the resolution. Embed learning through action, not a final moral lecture. Dialogue is natural and read-aloud friendly, with distinct character voices. Follow the age profile without treating character-count guidance as an absolute quality rule.
Each important character's bible includes approximate_age, desire, fear, goal, flaw, strength, relationships, voice, gestures, and visual_landmarks. Landmarks are stable on the character's anatomical left/right: id, side, body_region, anchor relative to body landmarks, relative size, shape, colour, and occlusion_rule. Do not invent positions from an unobserved reference. If uncertain, state that review is needed. Hidden marks remain hidden; never mirror asymmetrical identity. Reference sheets show front/back/left/right/three-quarter proportions and expressions. Preserve approved designs.
Each volume script includes story_bible: premise, theme, protagonist, goal, obstacle, inciting_incident, escalation, climax_choice, resolution, ending, world_rules. Each page includes emotion, new_information, image_added_value (information not already told by text), storyboard {shot, angle, focal_action, direction, lighting, rationale}, turn {type, hook, payoff_page, payoff, spread}. A quiet page needs a purpose; an unanswered hook needs a later payoff. Do not reveal the payoff on a simultaneously visible spread. Check neighbouring scenes and object/character continuity. Varied framing serves the narrative; repeated compositions need a reason. Keep text out of generated illustrations and plan readable text zones.
Critics cite the actual page, words or visible evidence, return every required criterion once, and evaluate the result independently of the writer's claims. A correction preserves unaffected elements and receives a fresh check. Never claim human audience testing or bestseller certainty. Retain useful previous versions; after at most two automatic corrections for the same problem, show the remaining issue for human intervention.`;
