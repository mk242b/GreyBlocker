import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacements: [string, string][] = [
  ["bg-neutral-950", "bg-slate-50 dark:bg-neutral-950"],
  ["text-neutral-100", "text-slate-900 dark:text-neutral-100"],
  ["text-white", "text-slate-900 dark:text-white"],
  ["text-white/50", "text-slate-900/50 dark:text-white/50"],
  ["bg-white/5", "bg-black/5 dark:bg-white/5"],
  ["border-white/10", "border-black/10 dark:border-white/10"],
  ["border-white/5", "border-black/5 dark:border-white/5"],
  ["text-neutral-500", "text-slate-500 dark:text-neutral-500"],
  ["text-neutral-400", "text-slate-600 dark:text-neutral-400"],
  ["text-neutral-300", "text-slate-700 dark:text-neutral-300"],
  ["text-neutral-600", "text-slate-500 dark:text-neutral-600"],
  ["bg-neutral-900/50", "bg-slate-100/50 dark:bg-neutral-900/50"],
  ["bg-neutral-900", "bg-white dark:bg-neutral-900"],
  ["bg-black/50", "bg-black/5 dark:bg-black/50"],
  ["bg-black/30", "bg-slate-100 dark:bg-black/30"],
  ["bg-black/20", "bg-slate-50 dark:bg-black/20"],
  ["bg-black/60", "bg-slate-900/20 dark:bg-black/60"],
  ["bg-black/80", "bg-slate-900/30 dark:bg-black/80"],
  ["hover:bg-white/10", "hover:bg-black/10 dark:hover:bg-white/10"],
  ["hover:bg-white/5", "hover:bg-black/5 dark:hover:bg-white/5"],
  ["hover:border-white/10", "hover:border-black/10 dark:hover:border-white/10"],
  ["hover:text-white", "hover:text-slate-900 dark:hover:text-white"]
];

for (const [key, value] of replacements) {
    let re = new RegExp(`(^|[\\s"'\\\`])` + key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + `(?=[\\s"'\\\`]|$)`, 'g');
    code = code.replace(re, (match, prefix) => {
        return prefix + value;
    });
}

fs.writeFileSync('src/App.tsx', code);
