from answer_service import AnswerService
from generator import CitationGenerator
from retriever import DocumentRetriever


def answer_question(question: str) -> dict[str, object]:
    service = AnswerService(DocumentRetriever(), CitationGenerator())
    return service.answer(question)


if __name__ == "__main__":
    print(answer_question("How are releases approved?"))
