import re


FILE_PATTERN = re.compile(
    r"FILE:\s*(?P<path>[^\n]+)\n"
    r"\s*BEGIN_FILE\n"
    r"(?P<content>.*?)"
    r"\nEND_FILE",
    re.DOTALL,
)


def parse_generated_files(response: str) -> dict[str, str]:
    files: dict[str, str] = {}

    for match in FILE_PATTERN.finditer(response):
        path = match.group("path").strip()
        content = match.group("content")

        if not path:
            continue

        files[path] = content

    return files