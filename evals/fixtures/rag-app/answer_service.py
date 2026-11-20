from generator import CitationGenerator
from retriever import DocumentRetriever


class AnswerService:
    def __init__(self, retriever: DocumentRetriever, generator: CitationGenerator):
        self.retriever = retriever
        self.generator = generator

    def answer(self, question: str) -> dict[str, object]:
        passages = self.retriever.search(question)
        return self.generator.generate(question, passages)
