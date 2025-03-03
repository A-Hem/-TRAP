import os
import re
from pathlib import Path
from typing import Dict, List
import hashlib

class CodeOrganizer:
    def __init__(self, output_dir: str = "organized_code"):
        self.output_dir = Path(output_dir)
        self.file_registry: Dict[str, List[str]] = {}
        self.component_patterns = {
            'utils': r'\b(utils?|helpers?|common)\b',
            'models': r'\b(models?|schemas?|entities?)\b',
            'services': r'\b(service|api|client|adapter)\b',
            'tests': r'\b(test|spec)\b',
            'config': r'\b(config|settings?)\b'
        }

    def process_chat(self, chat_file: str):
        """Main entry point to process chat file"""
        code_blocks = self.extract_code_blocks(chat_file)
        self.organize_code(code_blocks)

    def extract_code_blocks(self, chat_file: str) -> List[Dict]:
        """Extract code blocks from chat with metadata"""
        code_blocks = []
        code_block_re = re.compile(r'```(?P<lang>\w+)?\n(?P<code>.*?)```', re.DOTALL)

        with open(chat_file, 'r') as f:
            content = f.read()

        for match in code_block_re.finditer(content):
            lang = match.group('lang') or 'txt'
            code = match.group('code').strip()
            code_blocks.append({
                'language': lang.lower(),
                'content': code,
                'hash': hashlib.md5(code.encode()).hexdigest(),
                'keywords': self.extract_keywords(code)
            })

        return code_blocks

    def organize_code(self, code_blocks: List[Dict]):
        """Organize code blocks into directory structure"""
        for block in code_blocks:
            # Determine appropriate directory
            directory = self.determine_category(block)
            dest_dir = self.output_dir / directory
            
            # Create directory if needed
            dest_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate filename
            filename = self.generate_filename(block, dest_dir)
            
            # Write file
            with open(dest_dir / filename, 'w') as f:
                f.write(block['content'])

    def determine_category(self, block: Dict) -> str:
        """Determine category based on code content and keywords"""
        # Check for explicit folder hints in code
        for line in block['content'].split('\n'):
            if any(f'#{folder}' in line.lower() for folder in self.component_patterns.keys()):
                return line.split('#')[1].strip()

        # Check for patterns in keywords
        for category, pattern in self.component_patterns.items():
            if re.search(pattern, ' '.join(block['keywords']), re.IGNORECASE):
                return category

        # Fallback to language-specific folder
        return f"uncategorized/{block['language']}"

    def extract_keywords(self, code: str) -> List[str]:
        """Extract important keywords from code"""
        keywords = re.findall(r'\b([A-Za-z_]{3,})\b', code)
        return list(set([kw.lower() for kw in keywords if not kw.isupper()]))

    def generate_filename(self, block: Dict, dest_dir: Path) -> str:
        """Generate unique filename based on content"""
        base_name = '_'.join(block['keywords'][:3]) or 'code'
        ext = self.get_extension(block['language'])
        filename = f"{base_name}{ext}"

        # Handle duplicates
        counter = 1
        while (dest_dir / filename).exists():
            filename = f"{base_name}_{counter}{ext}"
            counter += 1

        return filename

    def get_extension(self, lang: str) -> str:
        """Map languages to file extensions"""
        extensions = {
            'python': '.py',
            'javascript': '.js',
            'typescript': '.ts',
            'java': '.java',
            'csharp': '.cs',
            'txt': '.txt'
        }
        return extensions.get(lang, f".{lang}")

if __name__ == "__main__":
    organizer = CodeOrganizer()
    organizer.process_chat("chat_history.txt")
