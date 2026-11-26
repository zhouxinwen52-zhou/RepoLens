DOCUMENTS = [
    {"id": "release-guide", "text": "A maintainer approves each release."},
    {"id": "testing-guide", "text": "The full test suite must pass first."},
]


class DocumentRetriever:
    def search(self, question: str) -> list[dict[str, str]]:
        terms = set(question.lower().split())
        ranked = sorted(
            DOCUMENTS,
            key=lambda item: len(terms.intersection(item["text"].lower().split())),
            reverse=True,
        )
        return ranked[:2]
