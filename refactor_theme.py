import re

def replace_classes(content):
    def replacer(match):
        cls_str = match.group(1)
        # Avoid double replacing
        if 'dark:' in cls_str:
            return f'className="{cls_str}"'
            
        cls_str = re.sub(r'\bbg-\[\#0a0a0f\]\b', r'bg-slate-50 dark:bg-[#0a0a0f]', cls_str)
        cls_str = re.sub(r'\bbg-\[\#12121a\]\b', r'bg-white dark:bg-[#12121a]', cls_str)
        cls_str = re.sub(r'\bbg-\[\#1a1a2e\]\b', r'bg-slate-100 dark:bg-[#1a1a2e]', cls_str)
        
        # We need to replace bg-white/X with bg-slate-200 dark:bg-white/X
        # but NOT text-white/X or border-white/X
        cls_str = re.sub(r'\bbg-white/([0-9]+)\b', r'bg-slate-200 dark:bg-white/\1', cls_str)
        cls_str = re.sub(r'\bbg-black/([0-9]+)\b', r'bg-white/90 dark:bg-black/\1', cls_str)
        
        cls_str = re.sub(r'\bborder-white/([0-9]+)\b', r'border-slate-200 dark:border-white/\1', cls_str)
        
        cls_str = re.sub(r'\btext-white/([0-9]+)\b', r'text-slate-500 dark:text-white/\1', cls_str)
        cls_str = re.sub(r'\btext-white\b(?!/[0-9])', r'text-slate-900 dark:text-white', cls_str)
        
        cls_str = re.sub(r'\bshadow-2xl\b', r'shadow-xl dark:shadow-2xl', cls_str)
        
        return f'className="{cls_str}"'

    return re.sub(r'className="([^"]+)"', replacer, content)

with open('src/pages/InterviewRoom.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

with open('src/pages/InterviewRoom.tsx', 'w', encoding='utf-8') as f:
    f.write(replace_classes(content))

print("Classes replaced successfully.")
