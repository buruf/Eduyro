const fs = require('fs');
const f = 'src/app/shop/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Add maxSkillsError state
c = c.replace(
  '  const [selectedSkills, setSelectedSkills] = useState<Set<Skill>>(new Set());',
  '  const [selectedSkills, setSelectedSkills] = useState<Set<Skill>>(new Set());\n  const [maxSkillsError, setMaxSkillsError] = useState(false);'
);

// Fix toggleSkill to enforce max 4 and show message
c = c.replace(
  `  const toggleSkill = (id: Skill) => {
    const next = new Set(selectedSkills);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSkills(next);
  };`,
  `  const MAX_SKILLS = 4;

  const toggleSkill = (id: Skill) => {
    const next = new Set(selectedSkills);
    if (next.has(id)) {
      next.delete(id);
      setMaxSkillsError(false);
    } else {
      if (next.size >= MAX_SKILLS) {
        setMaxSkillsError(true);
        return;
      }
      next.add(id);
      setMaxSkillsError(false);
    }
    setSelectedSkills(next);
  };`
);

// Add max skills error message after the skill grid — find the closing div of the grid section
c = c.replace(
  `        <div className="bg-white border border-border rounded-2xl p-6 max-w-2xl mx-auto">`,
  `        {maxSkillsError && (
          <div className="max-w-2xl mx-auto mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg viewBox="0 0 20 20" className="w-5 h-5 fill-amber-500 flex-shrink-0">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-8a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1z" />
            </svg>
            <p className="text-sm font-medium text-amber-800">
              Maximum 4 skill packs per order. Deselect one to choose a different skill.
            </p>
          </div>
        )}

        <div className="bg-white border border-border rounded-2xl p-6 max-w-2xl mx-auto">`
);

fs.writeFileSync(f, c);

// Verify
const written = fs.readFileSync(f, 'utf8');
console.log('MAX_SKILLS = 4:', written.includes('MAX_SKILLS = 4'));
console.log('maxSkillsError state:', written.includes('maxSkillsError'));
console.log('Error message:', written.includes('Maximum 4 skill packs'));
console.log('Cap enforced in toggleSkill:', written.includes('next.size >= MAX_SKILLS'));
