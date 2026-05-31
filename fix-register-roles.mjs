import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/(auth)/register/page.tsx', 'utf8');

// Change type to only allow PARENT
c = c.replace('type Role = "STUDENT" | "PARENT";', 'type Role = "PARENT";');

// Default to PARENT
c = c.replace('const [role, setRole] = useState<Role>("STUDENT");', 'const [role, setRole] = useState<Role>("PARENT");');

// Remove the role selector UI entirely - replace the whole ROLES section and the grid
c = c.replace(
  `      <div className="mb-5">
        <div className="text-xs font-medium mb-2">I am a:</div>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={cn(
                "p-3 border-[1.5px] rounded-lg text-center transition-all",
                role === r.id
                  ? "border-brand-blue bg-brand-blue-light"
                  : "border-border bg-white hover:border-ink"
              )}
            >
              <div className="text-xl mb-1">{r.icon}</div>
              <div className="text-xs font-semibold">{r.label}</div>
              <div className="text-[10px] text-muted mt-0.5 leading-tight">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>`,
  ''
);

writeFileSync('src/app/(auth)/register/page.tsx', c, 'utf8');
console.log('Done');