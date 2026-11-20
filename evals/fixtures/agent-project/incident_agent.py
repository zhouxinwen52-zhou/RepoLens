from planner import IncidentPlanner
from tools import IncidentTools


class IncidentAgent:
    def __init__(self, tools: IncidentTools):
        self.tools = tools
        self.planner = IncidentPlanner()

    def run(self, alert: str) -> dict[str, str]:
        action = self.planner.choose_action(alert)
        observation = self.tools.execute(action)
        return {"alert": alert, "action": action, "observation": observation}
