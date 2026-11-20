from incident_agent import IncidentAgent
from tools import IncidentTools


def handle_alert(alert: str) -> dict[str, str]:
    return IncidentAgent(IncidentTools()).run(alert)


if __name__ == "__main__":
    print(handle_alert("database latency is high"))
