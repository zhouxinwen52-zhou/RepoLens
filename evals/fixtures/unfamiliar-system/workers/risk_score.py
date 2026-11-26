def score(payload: str) -> int:
    fields = dict(part.split("=", 1) for part in payload.split("&"))
    return 80 if int(fields.get("amount", "0")) >= 1000 else 10
