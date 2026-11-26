class CitationGenerator:
    def generate(
        self, question: str, passages: list[dict[str, str]]
    ) -> dict[str, object]:
        return {
            "question": question,
            "answer": " ".join(passage["text"] for passage in passages),
            "citations": [passage["id"] for passage in passages],
        }
